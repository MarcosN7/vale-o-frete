import { useEffect, useId, useRef, useState } from 'react';
import { searchAddresses } from './route-api';

export default function AddressField({ label, value, onChange, disabled }) {
  const id = useId();
  const [text, setText] = useState(value?.label || '');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(null);
  useEffect(() => () => active.current?.abort(), []);
  async function search() {
    active.current?.abort();
    const controller = new AbortController(); active.current = controller;
    setBusy(true); setMessage(''); setResults([]); onChange(null);
    try {
      const data = await searchAddresses(text.trim(), controller.signal);
      if (controller.signal.aborted) return;
      setResults(data.results);
      if (data.suggestedQuery) setText(data.suggestedQuery);
      setMessage(data.message || (data.results.length ? 'Selecione o endereço correto abaixo.' : 'Nenhum endereço encontrado. Inclua bairro e cidade.'));
    } catch (error) { if (!controller.signal.aborted) setMessage(error.message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <div className="route-address">
    <label htmlFor={id}>{label}</label>
    <div className="route-search-row">
      <input id={id} value={text} maxLength={200} disabled={disabled}
        placeholder="Endereço ou CEP (00000-000)" autoComplete="off" aria-describedby={`${id}-status`}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (!disabled && !busy && text.trim().length >= 3) search(); } }}
        onChange={event => {
          active.current?.abort(); setBusy(false); setText(event.target.value);
          setResults([]); setMessage(''); onChange(null);
        }} />
      <button type="button" className="btn-secondary" disabled={disabled || busy || text.trim().length < 3}
        onClick={search} aria-label={`Buscar ${label.toLowerCase()}`}>{busy ? 'Buscando…' : 'Buscar'}</button>
    </div>
    <p id={`${id}-status`} className="route-hint" role="status">{value ? (value.note || 'Endereço selecionado.') : message}</p>
    {results.length > 0 && <ul className="route-results" aria-label={`Resultados para ${label.toLowerCase()}`}>
      {results.map((point, index) => <li key={index}><button type="button" disabled={disabled} onClick={() => {
        onChange(point); setText(point.label); setResults([]); setMessage('');
      }}>{point.label}</button></li>)}
    </ul>}
  </div>;
}
