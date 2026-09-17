import { validCoordinate, MAX_STOPS } from '../../../src/features/route-calculator/route-model.js';

const upstream = 'https://api.openrouteservice.org';
const numeric = value => Number.isFinite(value) && value >= 0;
const validSummary = value => numeric(value?.distance) && numeric(value?.duration);
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new HttpError(415, 'Envie JSON.');
  }
  // Bound actual streamed bytes, even when Content-Length is missing or incorrect.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Corpo obrigatório.');
  const chunks = []; let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 4096) { await reader.cancel(); throw new HttpError(413, 'Solicitação muito grande.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new HttpError(400, 'JSON inválido.'); }
}

async function ors(url, options) {
  let response;
  try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) }); }
  catch { throw new HttpError(504, 'Serviço de rotas indisponível. Tente novamente.'); }
  if (!response.ok) {
    if (response.status === 429) throw new HttpError(429, 'Limite de consultas atingido. Tente novamente mais tarde.');
    if ([400, 404, 422].includes(response.status)) throw new HttpError(422, 'Não foi possível encontrar uma rota para esses pontos. Revise os endereços.');
    throw new HttpError(502, 'Serviço de rotas indisponível. Tente novamente mais tarde.');
  }
  try { return await response.json(); }
  catch { throw new HttpError(502, 'Resposta inválida do serviço de rotas.'); }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(item => item.trim()).filter(Boolean);
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin' };
    const reply = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status, headers });
    if (!origin || !allowed.includes(origin)) return reply({ error: 'Origem não permitida.' }, 403);
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    const path = new URL(request.url).pathname;
    if (!['/geocode', '/route'].includes(path)) return reply({ error: 'Recurso não encontrado.' }, 404);
    if (request.method === 'OPTIONS') return reply(null, 204);
    if (request.method !== 'POST') return reply({ error: 'Método não permitido.' }, 405);
    try {
      if (!env.ORS_API_KEY || !env.ROUTE_RATE_LIMITER) throw new HttpError(503, 'Serviço de rotas ainda não configurado.');
      // Anonymous MVP: IP limit may group users behind the same mobile carrier NAT.
      const key = request.headers.get('CF-Connecting-IP') || 'local';
      const { success } = await env.ROUTE_RATE_LIMITER.limit({ key });
      if (!success) { headers['Retry-After'] = '60'; throw new HttpError(429, 'Muitas consultas. Aguarde um minuto.'); }
      const body = await readBody(request);
      if (path === '/geocode') {
        const query = typeof body?.query === 'string' ? body.query.trim() : '';
        if (query.length < 3 || query.length > 200) throw new HttpError(400, 'Informe um endereço entre 3 e 200 caracteres.');
        const url = new URL(`${upstream}/geocode/search`);
        url.search = new URLSearchParams({ api_key: env.ORS_API_KEY, text: query, size: '5', 'boundary.country': 'BRA', lang: 'pt' });
        const data = await ors(url, {});
        if (!Array.isArray(data.features)) throw new HttpError(502, 'Resposta inválida da busca.');
        return reply({ results: data.features.filter(item => validCoordinate(item.geometry?.coordinates)).map(item => ({
          label: String(item.properties?.label || query), coordinates: item.geometry.coordinates,
        })) });
      }
      const coordinates = body?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > MAX_STOPS + 3 || !coordinates.every(validCoordinate)) {
        throw new HttpError(400, 'Informe de 2 a 11 pontos válidos no formato longitude, latitude.');
      }
      const data = await ors(`${upstream}/v2/directions/driving-car/geojson`, {
        method: 'POST', headers: { Authorization: env.ORS_API_KEY, 'Content-Type': 'application/json' },
        // ORS resets route segments when instructions=false; strip steps below.
        body: JSON.stringify({ coordinates, instructions: true }),
      });
      const feature = data.features?.[0];
      const properties = feature?.properties;
      if (feature?.geometry?.type !== 'LineString' || !Array.isArray(feature.geometry.coordinates) ||
          feature.geometry.coordinates.length < 2 || !feature.geometry.coordinates.every(validCoordinate) ||
          !validSummary(properties?.summary) || !Array.isArray(properties?.segments) ||
          properties.segments.length !== coordinates.length - 1 || !properties.segments.every(validSummary)) {
        throw new HttpError(502, 'Resposta inválida do serviço de rotas.');
      }
      // Only forward needed fields; ORS metadata may include request details.
      return reply({ type: 'Feature', geometry: feature.geometry, properties: {
        summary: { distance: properties.summary.distance, duration: properties.summary.duration },
        segments: properties.segments.map(({ distance, duration }) => ({ distance, duration })),
      } });
    } catch (error) {
      return reply({ error: error instanceof HttpError ? error.message : 'Falha no serviço de rotas.' }, error instanceof HttpError ? error.status : 500);
    }
  },
};
