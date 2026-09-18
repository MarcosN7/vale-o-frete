import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/route-proxy/src/index.js';
import { orderedPoints, routeSummary } from '../src/features/route-calculator/route-model.js';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const point = (label, coordinates) => ({ label, coordinates });
const current = point('Atual', [-60.03, -3.1]);
const pickup = point('Coleta', [-60.02, -3.11]);
const stop = point('Parada', [-60.01, -3.12]);
const destination = point('Destino', [-60, -3.13]);
const env = () => ({ ORS_API_KEY: 'test-secret', ALLOWED_ORIGINS: 'http://localhost:5173', ROUTE_RATE_LIMITER: { limit: async () => ({ success: true }) } });
const request = (path, body, options = {}) => new Request(`https://proxy.example/${path}`, {
  method: 'POST', headers: { Origin: 'http://localhost:5173', 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...options,
});
const feature = { type: 'Feature', geometry: { type: 'LineString', coordinates: [pickup.coordinates, destination.coordinates] }, properties: {
  summary: { distance: 3000, duration: 600 }, segments: [{ distance: 1000, duration: 200 }, { distance: 2000, duration: 400 }],
} };

test('keeps current → pickup → stops → destination, without implicit return', () => {
  assert.deepEqual(orderedPoints(current, pickup, [stop], destination), [current, pickup, stop, destination]);
  assert.deepEqual(orderedPoints(null, pickup, [], destination), [pickup, destination]);
  assert.throws(() => orderedPoints(null, pickup, [null], destination));
  assert.throws(() => orderedPoints(null, pickup, Array(9).fill(stop), destination));
  assert.throws(() => orderedPoints(null, pickup, [], point('invalid', [181, 0])));
});
test('separates approach and delivery without rounding stored meters', () => {
  assert.deepEqual(routeSummary(feature, true), { total: { distance: 3000, duration: 600 }, approach: { distance: 1000, duration: 200 }, delivery: { distance: 2000, duration: 400 } });
  assert.equal(routeSummary(feature, false).delivery.distance, 3000);
});
test('rejects disallowed and missing origins before making an upstream call', async () => {
  globalThis.fetch = () => { assert.fail('upstream should not be called'); };
  for (const headers of [{ Origin: 'https://evil.example' }, {}]) {
    assert.equal((await worker.fetch(request('route', {}, { headers }), env())).status, 403);
  }
});
test('supports preflight only for approved paths and methods', async () => {
  const response = await worker.fetch(new Request('https://proxy.example/route', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } }), env());
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
  assert.equal((await worker.fetch(request('arbitrary', {}), env())).status, 404);
  assert.equal((await worker.fetch(new Request('https://proxy.example/route', { headers: { Origin: 'http://localhost:5173' } }), env())).status, 405);
});
test('requires secret and limiter; handles request limits', async () => {
  const missing = env(); delete missing.ORS_API_KEY;
  assert.equal((await worker.fetch(request('route', {}), missing)).status, 503);
  const limited = env(); limited.ROUTE_RATE_LIMITER.limit = async () => ({ success: false });
  const response = await worker.fetch(request('route', {}), limited);
  assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '60');
});
test('validates coordinates and bounded JSON bodies before upstream', async () => {
  globalThis.fetch = () => { assert.fail('upstream should not be called'); };
  for (const coordinates of [[], [[0, 91], [0, 0]], [['1', 0], [1, 2]], Array(12).fill([0, 0])]) {
    assert.equal((await worker.fetch(request('route', { coordinates }), env())).status, 400);
  }
  assert.equal((await worker.fetch(request('route', {}, { body: '{broken' }), env())).status, 400);
  assert.equal((await worker.fetch(request('geocode', { query: 'a'.repeat(5000) }), env())).status, 413);
  assert.equal((await worker.fetch(request('geocode', { query: 'ab' }), env())).status, 400);
});
test('geocodes in Brazil through ORS and only returns labels and coordinates', async () => {
  globalThis.fetch = async url => {
    assert.equal(url.hostname, 'api.openrouteservice.org');
    assert.equal(url.searchParams.get('boundary.country'), 'BRA');
    assert.equal(url.searchParams.get('api_key'), 'test-secret');
    return Response.json({ features: [{ geometry: { coordinates: pickup.coordinates }, properties: { label: 'Manaus', secret: 'test-secret' } }], metadata: { api_key: 'test-secret' } });
  };
  const response = await worker.fetch(request('geocode', { query: 'Manaus' }), env());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { results: [{ label: 'Manaus', coordinates: pickup.coordinates }] });
});
test('preserves waypoint order, authenticates server-side and strips metadata', async () => {
  const coordinates = [current.coordinates, pickup.coordinates, destination.coordinates];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openrouteservice.org/v2/directions/driving-car/geojson');
    assert.equal(options.headers.Authorization, 'test-secret');
    assert.deepEqual(JSON.parse(options.body), { coordinates, instructions: true });
    return Response.json({ features: [feature], metadata: { api_key: 'test-secret' } });
  };
  const response = await worker.fetch(request('route', { coordinates, url: 'https://evil.example' }), env());
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const text = await response.text(); assert.equal(text.includes('test-secret'), false);
  assert.deepEqual(JSON.parse(text), feature);
});
test('sanitizes provider errors and rejects malformed successful responses', async () => {
  for (const [status, expected] of [[401, 502], [403, 502], [429, 429], [404, 422], [500, 502]]) {
    globalThis.fetch = async () => new Response('test-secret', { status });
    const response = await worker.fetch(request('route', { coordinates: [pickup.coordinates, destination.coordinates] }), env());
    assert.equal(response.status, expected); assert.equal((await response.text()).includes('test-secret'), false);
  }
  globalThis.fetch = async () => Response.json({ features: [] });
  assert.equal((await worker.fetch(request('route', { coordinates: [pickup.coordinates, destination.coordinates] }), env())).status, 502);
  globalThis.fetch = async () => { throw new Error('network'); };
  assert.equal((await worker.fetch(request('route', { coordinates: [pickup.coordinates, destination.coordinates] }), env())).status, 504);
});

test('direct and pickup itineraries require every selected endpoint', async () => {
  const { itineraryPoints, distanceInputs } = await import('../src/features/route-calculator/route-model.js');
  assert.deepEqual(itineraryPoints(current, null, [], destination, false), [current, destination]);
  assert.deepEqual(itineraryPoints(current, pickup, [stop], destination, true), [current, pickup, stop, destination]);
  assert.equal(itineraryPoints(current, null, [], destination, true), null);
  assert.equal(itineraryPoints(null, pickup, [], destination, true), null);
  assert.equal(itineraryPoints(current, pickup, [null], destination, true), null);
  assert.deepEqual(distanceInputs(feature, true), { totalKm: 3, approachKm: 1, deliveryKm: 2 });
  assert.deepEqual(distanceInputs(feature, false), { totalKm: 3, approachKm: 0, deliveryKm: 3 });
});

test('CEP parser accepts both formats and preserves street names with digits', async () => {
  const { parsePostalQuery } = await import('../src/features/route-calculator/postal-code.js');
  for (const query of ['01001000', '01001-000', ' 01001-000 ']) assert.deepEqual(parsePostalQuery(query), { kind: 'cep', cep: '01001000' });
  for (const query of ['1234567', '123456789', '123-45678']) assert.equal(parsePostalQuery(query).kind, 'invalid');
  for (const query of ['Rua 24 de Maio, 100, Manaus', 'DB Ponta Negra Manaus']) assert.equal(parsePostalQuery(query).kind, 'address');
});

const cepData = { cep: '01001-000', logradouro: 'Praça da Sé', bairro: 'Sé', localidade: 'São Paulo', uf: 'SP' };
test('CEP lookup expands through ViaCEP then ORS without forwarding the ORS key to ViaCEP', async () => {
  for (const query of ['01001000', '01001-000']) {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push(String(url));
      if (String(url).includes('viacep.com.br')) {
        assert.equal(String(url), 'https://viacep.com.br/ws/01001000/json/');
        assert.equal(options.headers?.Authorization, undefined);
        return Response.json(cepData);
      }
      assert.equal(url.searchParams.get('text'), 'Praça da Sé, Sé, São Paulo, SP, Brasil');
      assert.equal(url.searchParams.get('api_key'), 'test-secret');
      return Response.json({ features: [
        { geometry: { coordinates: [-46.63, -23.55] }, properties: { label: 'Praça da Sé, São Paulo', layer: 'street' } },
        { geometry: { coordinates: [-46.63, -23.55] }, properties: { label: 'São Paulo', layer: 'locality' } },
      ] });
    };
    const response = await worker.fetch(request('geocode', { query }), env());
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(calls.length, 2); assert.equal(data.results.length, 1);
    assert.match(data.results[0].note, /aproximada/);
    assert.match(data.suggestedQuery, /Praça da Sé/);
    assert.equal(JSON.stringify(data).includes('test-secret'), false);
  }
});

test('invalid, nonexistent, and general CEPs do not route to a guessed city center', async () => {
  globalThis.fetch = () => { assert.fail('invalid CEP must not make an external request'); };
  assert.equal((await worker.fetch(request('geocode', { query: '1234567' }), env())).status, 400);
  globalThis.fetch = async () => Response.json({ erro: true });
  assert.equal((await worker.fetch(request('geocode', { query: '99999999' }), env())).status, 404);
  globalThis.fetch = async url => {
    assert.match(String(url), /viacep/);
    return Response.json({ ...cepData, logradouro: '' });
  };
  const response = await worker.fetch(request('geocode', { query: '01001000' }), env());
  const data = await response.json();
  assert.deepEqual(data.results, []); assert.match(data.message, /não identifica uma rua/);
});

test('CEP provider failures are handled without leaking details', async () => {
  for (const reply of [() => new Response('secret', { status: 500 }), () => Response.json({}), () => new Response('{invalid')]) {
    globalThis.fetch = async () => reply();
    const response = await worker.fetch(request('geocode', { query: '01001000' }), env());
    assert.equal(response.status, 502); assert.equal((await response.text()).includes('secret'), false);
  }
  globalThis.fetch = async () => { throw new Error('timeout'); };
  assert.equal((await worker.fetch(request('geocode', { query: '01001000' }), env())).status, 504);
});
