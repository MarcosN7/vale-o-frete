import { useEffect, useMemo, useRef, useState } from 'react';
import AddressField from './AddressField';
import RouteMap from './RouteMap';
import { calculateRoute, proxyConfigured } from './route-api';
import { MAX_STOPS, orderedPoints, routeSummary } from './route-model';
import './route-calculator.css';

const km = meters => `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
const time = seconds => {
  const minutes = Math.ceil(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};
export default function RouteCalculator() {
  const [current, setCurrent] = useState(null); const [locating, setLocating] = useState(false);
  const [pickup, setPickup] = useState(null); const [destination, setDestination] = useState(null);
  const [stops, setStops] = useState([]); const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const active = useRef(null); const geoVersion = useRef(0); const nextId = useRef(0);
  useEffect(() => () => { active.current?.abort(); geoVersion.current++; }, []);
  const points = useMemo(() => [...(current ? [current] : []), pickup, ...stops.map(stop => stop.point), destination], [current, pickup, stops, destination]);
  const summary = route ? routeSummary(route, Boolean(current)) : null;
  const ready = proxyConfigured && pickup && destination && stops.every(stop => stop.point);
  function invalidate() { active.current?.abort(); setBusy(false); setRoute(null); setError(''); }
  function locate() {
    invalidate();
    if (!navigator.geolocation) { setError('Seu navegador não oferece localização. Comece pela coleta.'); return; }
    const version = ++geoVersion.current; setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (geoVersion.current !== version) return;
      invalidate(); setCurrent({ label: 'Localização atual', coordinates: [position.coords.longitude, position.coords.latitude], accuracy: position.coords.accuracy });
      setLocating(false);
    }, err => {
      if (geoVersion.current !== version) return;
      setLocating(false); setError(err.code === 1 ? 'Permissão de localização negada. Você pode começar pela coleta.' : 'Não foi possível obter sua localização. Tente novamente ou comece pela coleta.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }
  async function calculate() {
    invalidate(); const controller = new AbortController(); active.current = controller;
    setBusy(true);
    try {
      const ordered = orderedPoints(current, pickup, stops.map(stop => stop.point), destination);
      const result = await calculateRoute(ordered, controller.signal);
      if (!controller.signal.aborted) setRoute(result);
    } catch (err) { if (!controller.signal.aborted) setError(err.message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function move(index, direction) {
    invalidate(); setStops(previous => {
      const next = [...previous]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next;
    });
  }
  return <section className="route-calculator" aria-labelledby="route-title">
    <header><p className="hero-eyebrow">Planeje o percurso</p><h2 id="route-title">Calcular pela rota</h2>
      <p>Da coleta à entrega, com todas as suas paradas.</p></header>
    {!proxyConfigured && <p role="status" className="route-notice">O mapa está disponível. A busca de endereços e rotas ainda não está configurada neste ambiente.</p>}
    <div className="route-layout"><div className="route-form">
      <div className="route-location"><h3>Ponto de partida</h3>
        <p className="route-hint">Inclua sua localização para medir também o deslocamento até a coleta.</p>
        <div className="route-actions"><button type="button" className="btn-secondary" disabled={locating} onClick={locate}>{locating ? 'Localizando…' : current ? 'Atualizar localização' : 'Usar localização atual'}</button>
        {current && <button type="button" className="text-button" onClick={() => { geoVersion.current++; setLocating(false); invalidate(); setCurrent(null); }}>Remover localização</button>}</div>
        {current && <p className="route-hint">Localização incluída • precisão aproximada de {Math.round(current.accuracy)} m.</p>}
      </div>
      <AddressField label="Coleta" value={pickup} disabled={!proxyConfigured} onChange={value => { invalidate(); setPickup(value); }} />
      {stops.map((stop, index) => <div key={stop.id} className="route-stop">
        <AddressField label={`Parada ${index + 1}`} value={stop.point} disabled={!proxyConfigured} onChange={point => { invalidate(); setStops(previous => previous.map(item => item.id === stop.id ? { ...item, point } : item)); }} />
        <div className="route-actions">
          <button type="button" className="text-button" disabled={index === 0} aria-label={`Mover parada ${index + 1} para cima`} onClick={() => move(index, -1)}>Subir</button>
          <button type="button" className="text-button" disabled={index === stops.length - 1} aria-label={`Mover parada ${index + 1} para baixo`} onClick={() => move(index, 1)}>Descer</button>
          <button type="button" className="text-button" aria-label={`Remover parada ${index + 1}`} onClick={() => { invalidate(); setStops(previous => previous.filter(item => item.id !== stop.id)); }}>Remover</button>
        </div></div>)}
      <button type="button" className="text-button" disabled={stops.length >= MAX_STOPS} onClick={() => { invalidate(); setStops(previous => [...previous, { id: ++nextId.current, point: null }]); }}>+ Adicionar parada ({stops.length}/{MAX_STOPS})</button>
      <AddressField label="Destino" value={destination} disabled={!proxyConfigured} onChange={value => { invalidate(); setDestination(value); }} />
      <p className="route-hint">As paradas seguem a ordem acima. Informe bairro e cidade e confirme cada endereço na busca.</p>
      <button type="button" className="btn-primary" disabled={!ready || busy || locating} onClick={calculate}>{busy ? 'Calculando rota…' : 'Calcular rota'}</button>
      {error && <p role="alert" className="route-error">{error}</p>}
    </div><div className="route-visual"><RouteMap points={points} route={route} />
      {summary && <div className="route-summary" role="status"><h3>{km(summary.total.distance)} <span>• {time(summary.total.duration)}</span></h3>
        {current && <p>Até a coleta: {km(summary.approach.distance)} • {time(summary.approach.duration)}</p>}
        <p>Coleta → paradas → destino: {km(summary.delivery.distance)} • {time(summary.delivery.duration)}</p>
      </div>}
      <p className="route-hint">Estimativa para carro, sem trânsito em tempo real e sem tempo de carga, descarga ou espera. Não considera restrições específicas para caminhões.</p>
      <p className="route-hint">Esta prévia mostra apenas o percurso. Os valores da calculadora financeira não são preenchidos automaticamente.</p>
      <p className="route-hint">Ao buscar ou calcular, os endereços e pontos são enviados ao serviço de rotas. Eles não são salvos no histórico do aplicativo.</p>
      <p className="route-hint">Rotas e busca: <a href="https://openrouteservice.org/" target="_blank" rel="noreferrer">© openrouteservice / HeiGIT</a> • Dados <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p>
    </div></div>
  </section>;
}
