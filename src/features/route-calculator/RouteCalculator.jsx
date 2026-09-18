import { useEffect, useMemo, useRef, useState } from 'react';
import AddressField from './AddressField';
import RouteMap from './RouteMap';
import { calculateRoute, proxyConfigured } from './route-api';
import { MAX_STOPS, itineraryPoints, distanceInputs, routeSummary } from './route-model';
import './route-calculator.css';

const km = meters => `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
const time = seconds => {
  const minutes = Math.ceil(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};
export default function RouteCalculator({ onDistanceChange }) {
  const notify = useRef(onDistanceChange); notify.current = onDistanceChange;
  const [startMode, setStartMode] = useState('address');
  const [startAddress, setStartAddress] = useState(null);
  const [includePickup, setIncludePickup] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [retry, setRetry] = useState(0);
  const [current, setCurrent] = useState(null); const [locating, setLocating] = useState(false);
  const [pickup, setPickup] = useState(null); const [destination, setDestination] = useState(null);
  const [stops, setStops] = useState([]); const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const active = useRef(null); const geoVersion = useRef(0); const nextId = useRef(0);
  useEffect(() => () => { active.current?.abort(); geoVersion.current++; }, []);
  const start = startMode === 'gps' ? current : startAddress;
  const points = useMemo(() => [start, ...(includePickup ? [pickup] : []), ...stops.map(stop => stop.point), destination], [start, includePickup, pickup, stops, destination]);
  const ordered = useMemo(() => itineraryPoints(start, pickup, stops.map(stop => stop.point), destination, includePickup), [start, pickup, stops, destination, includePickup]);
  const summary = route ? routeSummary(route, includePickup) : null;
  function invalidate() {
    active.current?.abort(); setBusy(false); setRoute(null); setError('');
    notify.current?.(null);
  }
  useEffect(() => {
    const controller = new AbortController(); active.current = controller;
    setRoute(null); setError(''); notify.current?.(null);
    if (!ordered || !proxyConfigured || locating) { setBusy(false); return () => controller.abort(); }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const result = await calculateRoute(ordered, controller.signal);
        if (!controller.signal.aborted) {
          setRoute(result); notify.current?.(distanceInputs(result, includePickup));
        }
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [ordered, includePickup, locating, retry]);
  function locate() {
    invalidate(); setCurrent(null); setLocationError('');
    if (!navigator.geolocation) { setLocationError('Seu navegador não oferece localização. Digite o endereço de saída.'); return; }
    const version = ++geoVersion.current; setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (geoVersion.current !== version) return;
      invalidate(); setCurrent({ label: 'Localização atual', coordinates: [position.coords.longitude, position.coords.latitude], accuracy: position.coords.accuracy });
      setLocating(false);
    }, err => {
      if (geoVersion.current !== version) return;
      setLocating(false); setLocationError(err.code === 1 ? 'Permissão de localização negada. Você pode digitar o endereço de saída.' : 'Não foi possível obter sua localização. Tente novamente ou digite o endereço de saída.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  function move(index, direction) {
    invalidate(); setStops(previous => {
      const next = [...previous]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next;
    });
  }
  return <section className="route-calculator" aria-labelledby="route-title">
    <header><p className="hero-eyebrow">Planeje o percurso</p><h2 id="route-title">Calcular pela rota</h2>
      <p>Informe a saída e o destino. A distância será calculada automaticamente, sem digitar quilômetros.</p></header>
    {!proxyConfigured && <p role="status" className="route-notice">O mapa está disponível. A busca de endereços e rotas ainda não está configurada neste ambiente.</p>}
    <div className="route-layout"><div className="route-form">
      <div className="route-location"><h3>Saída</h3>
        <div className="route-actions">
          <button type="button" className="btn-secondary" aria-pressed={startMode === 'address'} disabled={startMode === 'address'} onClick={() => {
            geoVersion.current++; setLocating(false); setLocationError(''); invalidate(); setStartMode('address');
          }}>Digitar endereço de saída</button>
          <button type="button" className="btn-secondary" disabled={locating} aria-pressed={startMode === 'gps'} onClick={() => {
            setStartMode('gps'); locate();
          }}>{locating ? 'Localizando…' : 'Usar localização atual'}</button>
        </div>
        {startMode === 'address' && <AddressField label="Endereço de saída" value={startAddress} disabled={!proxyConfigured} onChange={value => { invalidate(); setStartAddress(value); }} />}
        {startMode === 'gps' && current && <p className="route-hint">Localização incluída • precisão aproximada de {Math.round(current.accuracy)} m.</p>}
      </div>
      <label className="route-pickup-toggle"><input type="checkbox" checked={includePickup} onChange={event => { invalidate(); setIncludePickup(event.target.checked); }} /> Incluir coleta antes da entrega</label>
      {includePickup && <AddressField label="Endereço de coleta" value={pickup} disabled={!proxyConfigured} onChange={value => { invalidate(); setPickup(value); }} />}
      {stops.map((stop, index) => <div key={stop.id} className="route-stop">
        <AddressField label={`Parada ${index + 1}`} value={stop.point} disabled={!proxyConfigured} onChange={point => { invalidate(); setStops(previous => previous.map(item => item.id === stop.id ? { ...item, point } : item)); }} />
        <div className="route-actions">
          <button type="button" className="text-button" disabled={index === 0} aria-label={`Mover parada ${index + 1} para cima`} onClick={() => move(index, -1)}>Subir</button>
          <button type="button" className="text-button" disabled={index === stops.length - 1} aria-label={`Mover parada ${index + 1} para baixo`} onClick={() => move(index, 1)}>Descer</button>
          <button type="button" className="text-button" aria-label={`Remover parada ${index + 1}`} onClick={() => { invalidate(); setStops(previous => previous.filter(item => item.id !== stop.id)); }}>Remover</button>
        </div></div>)}
      <button type="button" className="text-button" disabled={stops.length >= MAX_STOPS} onClick={() => { invalidate(); setStops(previous => [...previous, { id: ++nextId.current, point: null }]); }}>+ Adicionar parada ({stops.length}/{MAX_STOPS})</button>
      <AddressField label={includePickup ? "Endereço de entrega" : "Destino (coleta ou entrega)"} value={destination} disabled={!proxyConfigured} onChange={value => { invalidate(); setDestination(value); }} />
      <p className="route-hint">As paradas seguem a ordem acima. Busque por endereço ou CEP e confirme cada local na lista.</p>
      {busy && <p role="status">Calculando distância automaticamente…</p>}
      {!ordered && <p className="route-hint">Busque e selecione cada endereço para calcular o percurso.</p>}
      {error && ordered && <button type="button" className="btn-primary" disabled={busy || locating} onClick={() => setRetry(value => value + 1)}>Tentar calcular novamente</button>}
      {locationError && <p role="alert" className="route-error">{locationError}</p>}
      {error && <p role="alert" className="route-error">{error}</p>}
    </div><div className="route-visual"><RouteMap points={points} route={route} />
      {summary && <div className="route-summary" role="status"><h3>{km(summary.total.distance)} <span>• {time(summary.total.duration)}</span></h3>
        {includePickup && <p>Até a coleta: {km(summary.approach.distance)} • {time(summary.approach.duration)}</p>}
        <p>{includePickup ? 'Coleta → paradas → entrega' : 'Saída → destino'}: {km(summary.delivery.distance)} • {time(summary.delivery.duration)}</p>
      </div>}
      <p className="route-hint">Estimativa para carro, sem trânsito em tempo real e sem tempo de carga, descarga ou espera. Não considera restrições específicas para caminhões.</p>
      <p className="route-hint">A distância calculada é usada automaticamente no cálculo do frete. Se você alterar um endereço, o app calcula o novo percurso.</p>
      <p className="route-hint">Ao buscar ou calcular, os endereços e pontos são enviados ao serviço de rotas. Consultas por CEP também são enviadas ao ViaCEP. Eles não são salvos no histórico do aplicativo.</p>
      <p className="route-hint">Rotas e busca: <a href="https://openrouteservice.org/" target="_blank" rel="noreferrer">© openrouteservice / HeiGIT</a> • Dados <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p>
    </div></div>
  </section>;
}
