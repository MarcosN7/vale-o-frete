import { useState } from 'react';
import DistanceInput from './DistanceInput';
import ResultDisplay, { getCalcData } from './ResultDisplay';

export default function ModoML({ settings, onSaveHistory }) {
  const [valor, setValor] = useState('');
  const [paradas, setParadas] = useState('');
  const [distancia, setDistancia] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [saved, setSaved] = useState(false);

  const valorNum = parseFloat(valor) || 0;
  const paradasNum = parseInt(paradas) || 0;
  const canCalc = valorNum > 0 && distancia > 0 && paradasNum > 0 && settings?.consumoGasolina > 0;

  const handleCalc = () => {
    setShowResult(true);
    setSaved(false);
  };

  const handleSaveToHistory = () => {
    const data = getCalcData(valorNum, distancia, paradasNum, 0, settings);
    if (data && onSaveHistory) {
      onSaveHistory({
        id: Date.now(),
        mode: 'ml',
        valor: valorNum,
        distancia,
        paradas: paradasNum,
        lucro: data.lucro,
        timestamp: new Date().toISOString(),
      });
      setSaved(true);
    }
  };

  const handleReset = () => {
    setValor('');
    setParadas('');
    setDistancia(0);
    setShowResult(false);
    setSaved(false);
  };

  return (
    <div>
      {!settings?.consumoGasolina && (
        <div className="no-config-banner">
          ⚠️ Configure seu veículo primeiro (ícone ⚙️ no topo)
        </div>
      )}

      <div className="card">
        <div className="field-row">
          <div className="field">
            <label>💰 Valor da Rota (R$)</label>
            <input
              type="number" step="0.01" min="0" placeholder="Ex: 45.00"
              value={valor}
              onChange={e => { setValor(e.target.value); setShowResult(false); setSaved(false); }}
            />
          </div>
          <div className="field">
            <label>📦 Paradas/Entregas</label>
            <input
              type="number" step="1" min="1" placeholder="Ex: 8"
              value={paradas}
              onChange={e => { setParadas(e.target.value); setShowResult(false); setSaved(false); }}
            />
          </div>
        </div>
        <DistanceInput
          distance={distancia}
          onDistanceChange={d => { setDistancia(d); setShowResult(false); setSaved(false); }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="calc-btn" style={{ flex: 1 }} disabled={!canCalc} onClick={handleCalc}>
          Calcular
        </button>
        {showResult && (
          <button
            className="calc-btn"
            style={{ flex: '0 0 auto', background: 'var(--input-bg)', color: 'var(--text)', boxShadow: 'var(--shadow)', width: 56 }}
            onClick={handleReset} title="Nova corrida"
          >
            🔄
          </button>
        )}
      </div>

      {showResult && canCalc && (
        <>
          <ResultDisplay
            valor={valorNum}
            distancia={distancia}
            paradas={paradasNum}
            custosExtras={0}
            settings={settings}
            mode="ml"
          />
          <button
            className="save-history-btn"
            onClick={handleSaveToHistory}
            disabled={saved}
          >
            {saved ? '✅ Salvo no histórico' : '📋 Salvar no histórico do dia'}
          </button>
        </>
      )}
    </div>
  );
}
