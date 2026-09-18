import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { unlink } from 'node:fs/promises';
import React, { useState } from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Exercise real React state wiring without a WebGL-capable browser or external APIs.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const outfile = new URL(`./.route-test-${process.pid}.mjs`, import.meta.url);
await build({ stdin: { contents: `export { default } from './src/components/DistanceInput.jsx';
    export { default as General } from './src/components/ModoFreteGeral.jsx';
    export { default as ML } from './src/components/ModoML.jsx';
    export { default as Lalamove } from './src/components/ModoLalamove.jsx';
    export { default as ResultDisplay } from './src/components/ResultDisplay.jsx';`, resolveDir: process.cwd(), loader: 'jsx' }, outfile: outfile.pathname,
  bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic',
  define: { 'import.meta.env.VITE_ROUTE_CALCULATOR_ENABLED': '"true"' },
  plugins: [{ name: 'external-services', setup(builder) {
    builder.onResolve({ filter: /\/RouteMap$/ }, () => ({ path: 'map', namespace: 'test' }));
    builder.onResolve({ filter: /\/route-api$/ }, () => ({ path: 'api', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: args.path === 'map'
      ? 'export default function Map() { return null; }'
      : `export const proxyConfigured = true;
         export const searchAddresses = (...args) => globalThis.routeTestApi.search(...args);
         export const calculateRoute = (...args) => globalThis.routeTestApi.calculate(...args);` }));
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'empty' }));
  } }],
});
after(async () => { await unlink(outfile); delete globalThis.routeTestApi; });
const { default: DistanceInput, General, ML, Lalamove, ResultDisplay } = await import(outfile.href);
function Harness({ totalOnly = false }) {
  const [delivery, setDelivery] = useState(0); const [approach, setApproach] = useState(0);
  return React.createElement(React.Fragment, null,
    React.createElement(DistanceInput, { totalOnly, distanciaRota: delivery, distanciaColeta: approach,
      onDistanciaRotaChange: setDelivery, onDistanciaColetaChange: setApproach }),
    React.createElement('output', { delivery, approach }));
}
const labels = { Saida: [-60.03, -3.1], Coleta: [-60.02, -3.11], Destino: [-60, -3.13] };
const result = count => ({ properties: { summary: { distance: count === 3 ? 12345 : 10000, duration: 1800 },
  segments: [{ distance: count === 3 ? 2345 : 10000, duration: 300 }, ...(count === 3 ? [{ distance: 10000, duration: 1500 }] : [])] } });
const waitRoute = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 500)); });
const button = (renderer, label) => renderer.root.findAllByType('button').find(node => node.props['aria-label'] === label || node.children.join('') === label);
async function select(renderer, fieldLabel, query) {
  const label = renderer.root.findAllByType('label').find(node => node.children.join('') === fieldLabel);
  const input = renderer.root.findAllByType('input').find(node => node.props.id === label.props.htmlFor);
  await act(async () => input.props.onChange({ target: { value: query } }));
  await act(async () => button(renderer, `Buscar ${fieldLabel.toLowerCase()}`).props.onClick());
  await act(async () => button(renderer, `${query} Manaus`).props.onClick());
}
const values = renderer => renderer.root.findByType('output').props;
function mockApi() {
  const calls = [];
  globalThis.routeTestApi = {
    search: async query => ({ results: [{ label: `${query} Manaus`, coordinates: labels[query] }] }),
    calculate: async points => { calls.push(points); return result(points.length); },
  };
  return calls;
}

test('two addresses automatically feed distance, with no kilometer fields; edits discard it', async () => {
  const calls = mockApi(); let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Harness, { totalOnly: true })); });
  try {
    await select(renderer, 'Endereço de saída', 'Saida');
    await select(renderer, 'Destino (coleta ou entrega)', 'Destino');
    await waitRoute();
    assert.equal(calls.length, 1); assert.equal(values(renderer).delivery, 10);
    assert.equal(renderer.root.findAllByType('input').filter(node => node.props.type === 'number').length, 0);
    const destination = renderer.root.findAllByType('input').find(node => node.props.value === 'Destino Manaus');
    await act(async () => destination.props.onChange({ target: { value: 'Outro endereço' } }));
    assert.equal(values(renderer).delivery, 0);
    await waitRoute(); assert.equal(calls.length, 1);
  } finally { await act(async () => renderer.unmount()); }
});

test('pickup and delivery are split for ML/Lalamove and summed exactly once', async () => {
  const calls = mockApi(); let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Harness)); });
  try {
    await select(renderer, 'Endereço de saída', 'Saida');
    await act(async () => renderer.root.findByProps({ type: 'checkbox' }).props.onChange({ target: { checked: true } }));
    await select(renderer, 'Endereço de coleta', 'Coleta');
    await select(renderer, 'Endereço de entrega', 'Destino');
    await waitRoute();
    assert.deepEqual(calls[0].map(point => point.coordinates), [labels.Saida, labels.Coleta, labels.Destino]);
    assert.equal(values(renderer).approach, 2.345); assert.equal(values(renderer).delivery, 10);
    await act(async () => button(renderer, 'Informar quilômetros').props.onClick());
    assert.equal(values(renderer).delivery + values(renderer).approach, 12.345);
    await act(async () => button(renderer, 'Por endereços').props.onClick());
    assert.equal(values(renderer).delivery + values(renderer).approach, 0);
  } finally { await act(async () => renderer.unmount()); }
});

test('failed route keeps zero distance and supports retry without requesting kilometers', async () => {
  mockApi(); globalThis.routeTestApi.calculate = async () => { throw new Error('Serviço indisponível'); };
  let renderer; await act(async () => { renderer = TestRenderer.create(React.createElement(Harness, { totalOnly: true })); });
  try {
    await select(renderer, 'Endereço de saída', 'Saida'); await select(renderer, 'Destino (coleta ou entrega)', 'Destino');
    await waitRoute(); assert.equal(values(renderer).delivery, 0);
    assert.equal(renderer.root.findByProps({ role: 'alert' }).children.join(''), 'Serviço indisponível');
    globalThis.routeTestApi.calculate = async () => result(2);
    await act(async () => button(renderer, 'Tentar calcular novamente').props.onClick());
    await waitRoute(); assert.equal(values(renderer).delivery, 10);
  } finally { await act(async () => renderer.unmount()); }
});

test('a late route response cannot restore an outdated financial distance', async () => {
  mockApi(); let resolve; let signal;
  globalThis.routeTestApi.calculate = (_points, requestSignal) => { signal = requestSignal; return new Promise(done => { resolve = done; }); };
  let renderer; await act(async () => { renderer = TestRenderer.create(React.createElement(Harness)); });
  try {
    await select(renderer, 'Endereço de saída', 'Saida'); await select(renderer, 'Destino (coleta ou entrega)', 'Destino');
    await waitRoute();
    await act(async () => renderer.root.findAllByType('input').find(node => node.props.value === 'Destino Manaus').props.onChange({ target: { value: 'Mudou' } }));
    assert.equal(signal.aborted, true);
    await act(async () => resolve(result(2)));
    assert.equal(values(renderer).delivery, 0);
  } finally { await act(async () => renderer.unmount()); }
});

for (const [name, Component, valueId, countId] of [
  ['frete geral', General, 'modofretegeral-field-3', null],
  ['Mercado Livre', ML, 'modoml-field-1', 'modoml-field-2'],
  ['Lalamove', Lalamove, 'modolalamove-field-1', null],
]) {
  test(`real ${name} calculator consumes route distance without manual km`, async () => {
    mockApi(); let renderer;
    await act(async () => { renderer = TestRenderer.create(React.createElement(Component, {
      settings: { consumoGasolina: 10, consumoCombustivel: 10, precoGasolina: 6, precoCombustivel: 6 },
    })); });
    try {
      await act(async () => renderer.root.findByProps({ id: valueId }).props.onChange({ target: { value: '100' } }));
      if (countId) await act(async () => renderer.root.findByProps({ id: countId }).props.onChange({ target: { value: '2' } }));
      await select(renderer, 'Endereço de saída', 'Saida');
      await act(async () => renderer.root.findAllByProps({ type: 'checkbox' }).find(node => node.parent.props.className === 'route-pickup-toggle').props.onChange({ target: { checked: true } }));
      await select(renderer, 'Endereço de coleta', 'Coleta');
      await select(renderer, 'Endereço de entrega', 'Destino');
      await waitRoute();
      const calc = renderer.root.findAllByType('button').find(node => node.props.className === 'calc-btn');
      assert.equal(calc.props.disabled, false);
      await act(async () => calc.props.onClick());
      assert.equal(renderer.root.findByType(ResultDisplay).props.distancia, 12.345);
      const destination = renderer.root.findAllByType('input').find(node => node.props.value === 'Destino Manaus');
      await act(async () => destination.props.onChange({ target: { value: 'Nova entrega' } }));
      assert.equal(renderer.root.findAllByType(ResultDisplay).length, 0);
      assert.equal(renderer.root.findAllByType('button').find(node => node.props.className === 'calc-btn').props.disabled, true);
    } finally { await act(async () => renderer.unmount()); }
  });
}
