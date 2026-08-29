const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OSRM_URL = 'https://router.project-osrm.org';

/**
 * Geocodifica um endereço em texto para { lat, lon }.
 * Usa Nominatim (OpenStreetMap) — sem chave de API.
 */
export async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: 1,
    countrycodes: 'br',
    'accept-language': 'pt-BR',
  });
  const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
    headers: { 'User-Agent': 'ValeOFrete/1.0 (app pessoal)' }
  });
  if (!res.ok) throw new Error('Falha ao geocodificar endereço');
  const data = await res.json();
  if (!data || data.length === 0) throw new Error(`Endereço não encontrado: "${address}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

/**
 * Calcula a distância real de rota entre uma lista de pontos usando OSRM.
 * points: array de { lat, lon }
 * Retorna a distância total em km.
 */
export async function calcRouteDistance(points) {
  if (points.length < 2) throw new Error('São necessários pelo menos 2 pontos.');
  // OSRM espera coordenadas no formato lon,lat
  const coords = points.map(p => `${p.lon},${p.lat}`).join(';');
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao calcular rota (OSRM)');
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error('Rota não encontrada pelo OSRM');
  }
  // OSRM retorna distância em metros
  const meters = data.routes[0].distance;
  return parseFloat((meters / 1000).toFixed(1));
}

/**
 * Pipeline completo: geocodifica lista de endereços e calcula rota.
 * addresses: array de strings
 * onProgress: callback(step, total) para feedback de progresso
 * Retorna { distanciaKm, pontos }
 */
export async function addressesToDistance(addresses, onProgress) {
  const valid = addresses.filter(a => a.trim().length > 3);
  if (valid.length < 2) throw new Error('Informe pelo menos 2 endereços válidos.');

  const pontos = [];
  for (let i = 0; i < valid.length; i++) {
    if (onProgress) onProgress(i + 1, valid.length);
    const coords = await geocodeAddress(valid[i]);
    pontos.push(coords);
    // Respeitar o rate limit do Nominatim: 1 req/seg
    if (i < valid.length - 1) await new Promise(r => setTimeout(r, 1100));
  }

  const distanciaKm = await calcRouteDistance(pontos);
  return { distanciaKm, pontos };
}
