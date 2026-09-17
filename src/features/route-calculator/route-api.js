const baseUrl = (import.meta.env.VITE_ROUTE_PROXY_URL || '').replace(/\/$/, '');
export const proxyConfigured = Boolean(baseUrl);

async function request(path, body, signal) {
  if (!baseUrl) throw new Error('A busca de endereços e rotas ainda não está configurada.');
  const timeout = AbortSignal.timeout(25000);
  let response;
  try {
    response = await fetch(`${baseUrl}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      cache: 'no-store', credentials: 'omit',
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(error.name === 'TimeoutError' ? 'O serviço demorou a responder. Tente novamente.' : 'Não foi possível conectar. Confira sua internet.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Não foi possível consultar o serviço de rotas.');
  return data;
}
export const searchAddresses = (query, signal) => request('geocode', { query }, signal);
export const calculateRoute = (points, signal) => request('route', {
  coordinates: points.map(point => point.coordinates),
}, signal);
