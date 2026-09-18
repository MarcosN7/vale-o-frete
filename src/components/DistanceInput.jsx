import { lazy, Suspense, useId, useState } from 'react';
const RouteCalculator = lazy(() => import('../features/route-calculator/RouteCalculator'));
const enabled = import.meta.env.VITE_ROUTE_CALCULATOR_ENABLED === 'true';

export default function DistanceInput({ distanciaRota, onDistanciaRotaChange,
  distanciaColeta = 0, onDistanciaColetaChange, distance, onDistanceChange,
  totalOnly = false, initialManual = false }) {
  const id = useId();
  const [mode, setMode] = useState(enabled && !initialManual ? 'addresses' : 'manual');
  const routeKm = Number(distanciaRota ?? distance) || 0;
  const approachKm = Number(distanciaColeta) || 0;
  const updateRoute = onDistanciaRotaChange || onDistanceChange;
  function update(result) {
    updateRoute?.(result ? (totalOnly ? result.totalKm : result.deliveryKm) : 0);
    onDistanciaColetaChange?.(result?.approachKm || 0);
  }
  return <div>
    {enabled && <div className="input-toggle">
      <button type="button" className={mode === 'addresses' ? 'active' : ''} aria-pressed={mode === 'addresses'} onClick={() => {
        if (mode !== 'addresses') { update(null); setMode('addresses'); }
      }}>Por endereços</button>
      <button type="button" className={mode === 'manual' ? 'active' : ''} aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>Informar quilômetros</button>
    </div>}
    {mode === 'addresses' ? <Suspense fallback={<p role="status">Carregando cálculo por endereços…</p>}>
      <RouteCalculator onDistanceChange={update} />
    </Suspense> : <>
      {!totalOnly && <div className="field">
        <label htmlFor={`${id}-approach`}>Deslocamento até a coleta (km, opcional)</label>
        <input id={`${id}-approach`} type="number" step="0.1" min="0" value={approachKm || ''}
          onChange={event => onDistanciaColetaChange?.(Number(event.target.value) || 0)} />
      </div>}
      <div className="field">
        <label htmlFor={`${id}-route`}>{totalOnly ? 'Distância de ida (km)' : 'Distância da corrida / entregas (km)'}</label>
        <input id={`${id}-route`} type="number" step="0.1" min="0" value={routeKm || ''}
          onChange={event => updateRoute?.(Number(event.target.value) || 0)} />
      </div>
    </>}
    {!totalOnly && routeKm + approachKm > 0 && <p className="distance-summary" role="status">
      Distância usada no cálculo: {(routeKm + approachKm).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km
    </p>}
  </div>;
}
