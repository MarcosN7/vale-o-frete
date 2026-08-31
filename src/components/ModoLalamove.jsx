import { useState } from 'react';
import DistanceInput from './DistanceInput';
import ResultDisplay, { getCalcData } from './ResultDisplay';

export default function ModoLalamove({ settings, onSaveHistory }) {
  const [valor, setValor] = useState('');
  const [distanciaRota, setDistanciaRota] = useState('');
  const [distanciaColeta, setDistanciaColeta] = useState('');
  const [extras, setExtras] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [saved, setSaved] = useState(false);

  const valorNum = parseFloat(valor) || 0;
  const extrasNum = parseFloat(extras) || 0;
  const rotaNum = parseFloat(distanciaRota) || 0;
  const coletaNum = parseFloat(distanciaColeta) || 0;
  const distanciaTotal = rotaNum + coletaNum;

  const canCalc = valorNum > 0 && distanciaTotal > 0 && (settings?.consumoGasolina > 0 || settings?.consumoCombustivel > 0);

  const handleCalc = () => {
    setShowResult(true);
    setSaved(false);
  };

  const handleSaveToHistory = () => {
    const data = getCalcData(valorNum, distanciaTotal, 0, extrasNum, settings);
    if (data && onSaveHistory) {
      onSaveHistory({
        id: Date.now(),
        mode: 'lalamove',
        valor: valorNum,
        distancia: distanciaTotal,
        distanciaColeta: coletaNum,
        distanciaRota: rotaNum,
        lucro: data.lucro,
        timestamp: new Date().toISOString(),
      });
      setSaved(true);
    }
  };

  const handleReset = () => {
    setValor('');
    setDistanciaRota('');
    setDistanciaColeta('');
    setExtras('');
    setShowResult(false);
    setSaved(false);
  };

  return (
    <div className={`dashboard-grid ${showResult && canCalc ? 'has-result' : ''}`}>
      <div className="dashboard-col-left">
        {!settings?.consumoGasolina && !settings?.consumoCombustivel && (
          <div className="stale-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
            ℹ️ Configure seu veículo no ícone ⚙️ no topo para cálculos exatos.
          </div>
        )}

        <div className="card">
          <div className="card-header-step">
            <span className="step-num">01</span>
            <h3 className="step-title">Corrida LalaMove / inDrive</h3>
          </div>

          <div className="field">
            <label>💰 Valor da Corrida (R$)</label>
            <input
              type="number" step="0.01" min="0" placeholder="Ex: 25.00"
              value={valor}
              onChange={e => { setValor(e.target.value); setShowResult(false); setSaved(false); }}
            />
          </div>

          <DistanceInput
            distanciaRota={distanciaRota}
            onDistanciaRotaChange={d => { setDistanciaRota(d); setShowResult(false); setSaved(false); }}
            distanciaColeta={distanciaColeta}
            onDistanciaColetaChange={d => { setDistanciaColeta(d); setShowResult(false); setSaved(false); }}
          />

          <div className="field">
            <label>🛣️ Pedágio / Custos Extras (R$) <span className="hint">(opcional)</span></label>
            <input
              type="number" step="0.01" min="0" placeholder="Ex: 5.00"
              value={extras}
              onChange={e => { setExtras(e.target.value); setShowResult(false); setSaved(false); }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="calc-btn" style={{ flex: 1 }} disabled={!canCalc} onClick={handleCalc}>
            Calcular Corrida
          </button>
          {showResult && (
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', padding: 0 }}
              onClick={handleReset}
              title="Nova corrida"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {showResult && canCalc && (
        <div className="dashboard-col-right">
          <ResultDisplay
            valor={valorNum}
            distancia={distanciaTotal}
            distanciaColeta={coletaNum}
            distanciaRota={rotaNum}
            paradas={0}
            custosExtras={extrasNum}
            settings={settings}
            mode="lalamove"
          />
          <button
            type="button"
            className="save-history-btn"
            onClick={handleSaveToHistory}
            disabled={saved}
          >
            {saved ? '✓ Salvo no histórico' : '📋 Salvar no Histórico'}
          </button>
        </div>
      )}
    </div>
  );
}
