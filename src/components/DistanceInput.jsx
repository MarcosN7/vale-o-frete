import { useState } from 'react';
import { addressesToDistance } from '../services/osrm';

export default function DistanceInput({ distance, onDistanceChange }) {
  const [mode, setMode] = useState('manual');
  const [addresses, setAddresses] = useState(['', '']);
  const [calcState, setCalcState] = useState('idle'); // idle | loading | success | error
  const [calcMsg, setCalcMsg] = useState('');

  const addAddress = () => setAddresses(prev => [...prev, '']);

  const removeAddress = (index) => {
    if (addresses.length <= 2) return;
    setAddresses(prev => prev.filter((_, i) => i !== index));
    setCalcState('idle');
    setCalcMsg('');
  };

  const updateAddress = (index, value) => {
    setAddresses(prev => prev.map((a, i) => i === index ? value : a));
    setCalcState('idle');
    setCalcMsg('');
  };

  const handleCalcRoute = async () => {
    const valid = addresses.filter(a => a.trim().length > 3);
    if (valid.length < 2) {
      setCalcState('error');
      setCalcMsg('Preencha pelo menos 2 endereços.');
      return;
    }
    setCalcState('loading');
    setCalcMsg(`Geocodificando endereços... (0/${valid.length})`);
    try {
      const { distanciaKm } = await addressesToDistance(valid, (step, total) => {
        setCalcMsg(`Geocodificando endereços... (${step}/${total})`);
      });
      onDistanceChange(distanciaKm);
      setCalcState('success');
      setCalcMsg(`✅ Rota calculada: ${distanciaKm} km (dados OpenStreetMap)`);
    } catch (err) {
      setCalcState('error');
      setCalcMsg(`❌ ${err.message}`);
    }
  };

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <div>
      <div className="input-toggle">
        <button
          className={mode === 'manual' ? 'active' : ''}
          onClick={() => setMode('manual')}
        >
          📏 Km Manual
        </button>
        <button
          className={mode === 'addresses' ? 'active' : ''}
          onClick={() => setMode('addresses')}
        >
          📍 Por Endereços
        </button>
      </div>

      {mode === 'manual' ? (
        <div className="field">
          <label>Distância total (km)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="Ex: 25.0"
            value={distance || ''}
            onChange={e => onDistanceChange(parseFloat(e.target.value) || 0)}
          />
        </div>
      ) : (
        <>
          <div className="address-list">
            {addresses.map((addr, i) => (
              <div key={i} className="address-item">
                <span className="address-label">{letters[i] || '?'}</span>
                <input
                  type="text"
                  placeholder={
                    i === 0 ? 'Endereço de origem (ex: Rua X, 123, São Paulo)' :
                    i === addresses.length - 1 ? 'Destino final' :
                    `Parada ${letters[i]} (endereço)`
                  }
                  value={addr}
                  onChange={e => updateAddress(i, e.target.value)}
                />
                {addresses.length > 2 && i >= 2 && (
                  <button className="remove-btn" onClick={() => removeAddress(i)}>✕</button>
                )}
              </div>
            ))}
          </div>

          <button className="add-address-btn" onClick={addAddress}>
            + Adicionar parada
          </button>

          <button
            className="calc-route-btn"
            onClick={handleCalcRoute}
            disabled={calcState === 'loading'}
            style={{ marginTop: 10 }}
          >
            {calcState === 'loading' ? '⏳ Calculando rota...' : '🗺️ Calcular distância real'}
          </button>

          {calcMsg && (
            <p className={`detect-msg ${calcState}`} style={{ marginTop: 8 }}>
              {calcMsg}
            </p>
          )}

          {/* Fallback manual sempre disponível */}
          <div className="field" style={{ marginTop: 12 }}>
            <label>
              Ou informe a distância manualmente (km)
              <span className="hint" style={{ display: 'block' }}>
                Use se os endereços não foram encontrados
              </span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="Ex: 25.0"
              value={distance || ''}
              onChange={e => { onDistanceChange(parseFloat(e.target.value) || 0); setCalcState('idle'); setCalcMsg(''); }}
            />
          </div>
        </>
      )}
    </div>
  );
}
