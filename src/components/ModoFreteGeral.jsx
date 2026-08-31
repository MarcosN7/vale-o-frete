import { useState, useEffect } from 'react';
import ResultDisplay from './ResultDisplay';
import {
  calculateFuelCost,
  calculateMaintenanceCost,
  calculateTireCost,
  calculateDepreciationCost,
  calculateOtherCostPerKm,
  calculateTotalCost,
  calculateProfit,
  calculateRevenuePerKm,
  calculateCostPerKm,
  calculateProfitPerKm,
  calculateMargin,
  evaluateFreight,
} from '../utils';

export default function ModoFreteGeral({ settings, onSaveHistory, initialData }) {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [valorFrete, setValorFrete] = useState('');
  const [distanciaIda, setDistanciaIda] = useState('');
  const [distanciaRetorno, setDistanciaRetorno] = useState('');
  const [isRetornoVazio, setIsRetornoVazio] = useState(false);
  const [pedagios, setPedagios] = useState('');
  
  // Modo de visualização de custos: rápido (padrão) ou completo
  const [calcLevel, setCalcLevel] = useState('rapido'); // rapido | completo

  // Custos adicionais da viagem (no modo completo)
  const [alimentacaoHospedagem, setAlimentacaoHospedagem] = useState('');
  const [outrosCustosViagem, setOutrosCustosViagem] = useState('');

  const [showResult, setShowResult] = useState(false);
  const [saved, setSaved] = useState(false);

  // Carregar dados iniciais caso venha de uma repetição no histórico
  useEffect(() => {
    if (initialData) {
      setOrigem(initialData.origem || '');
      setDestino(initialData.destino || '');
      setValorFrete(initialData.valor ? String(initialData.valor) : '');
      setDistanciaIda(initialData.distanciaIda ? String(initialData.distanciaIda) : (initialData.distancia ? String(initialData.distancia) : ''));
      setIsRetornoVazio(Boolean(initialData.isRetornoVazio));
      setDistanciaRetorno(initialData.distanciaRetorno ? String(initialData.distanciaRetorno) : '');
      setPedagios(initialData.pedagios ? String(initialData.pedagios) : '');
      setShowResult(false);
      setSaved(false);
    }
  }, [initialData]);

  // Se marcar retorno vazio e a volta estiver vazia, copia a distância de ida
  const handleToggleRetornoVazio = (checked) => {
    setIsRetornoVazio(checked);
    if (checked && !distanciaRetorno && distanciaIda) {
      setDistanciaRetorno(distanciaIda);
    }
    setShowResult(false);
    setSaved(false);
  };

  const freteNum = parseFloat(valorFrete) || 0;
  const idaNum = parseFloat(distanciaIda) || 0;
  const voltaNum = isRetornoVazio ? (parseFloat(distanciaRetorno) || idaNum) : 0;
  const distanciaTotal = idaNum + voltaNum;
  const pedagiosNum = parseFloat(pedagios) || 0;
  const extrasNum = (parseFloat(alimentacaoHospedagem) || 0) + (parseFloat(outrosCustosViagem) || 0);

  // Combustível
  const tipoComb = settings?.tipoCombustivel || 'diesel';
  const precoComb = tipoComb === 'diesel'
    ? (settings?.precoDiesel || 5.89)
    : tipoComb === 'etanol'
    ? (settings?.precoEtanol || 3.99)
    : (settings?.precoGasolina || 5.89);

  const consumo = parseFloat(settings?.consumoCombustivel) || parseFloat(settings?.consumoGasolina) || 2.8;

  const canCalc = freteNum > 0 && idaNum > 0 && consumo > 0;

  // Cálculo financeiro completo
  const fuelResult = calculateFuelCost(distanciaTotal, consumo, precoComb);
  const custoManutencao = calculateMaintenanceCost(distanciaTotal, settings?.manutencaoKm || 0);
  const custoPneus = calculateTireCost(distanciaTotal, settings?.pneusKm || 0);
  const custoDepreciacao = calculateDepreciationCost(distanciaTotal, settings?.depreciacaoKm || 0);
  const custoOutrosKm = calculateOtherCostPerKm(distanciaTotal, settings?.outrosKm || 0);

  const custoTotal = calculateTotalCost({
    custoCombustivel: fuelResult.custo,
    pedagios: pedagiosNum,
    custoManutencao,
    custoPneus,
    custoDepreciacao,
    custoOutrosKm,
    custosExtras: extrasNum,
  });

  const lucro = calculateProfit(freteNum, custoTotal);
  const receitaPorKm = calculateRevenuePerKm(freteNum, distanciaTotal);
  const custoPorKm = calculateCostPerKm(custoTotal, distanciaTotal);
  const lucroPorKm = calculateProfitPerKm(lucro, distanciaTotal);
  const margem = calculateMargin(lucro, freteNum);

  const verdict = evaluateFreight({
    valorFrete: freteNum,
    distanciaTotal,
    custoTotal,
    lucro,
    receitaPorKm,
    custoPorKm,
    lucroPorKm,
    margem,
    isRetornoVazio,
  }, {
    bad: settings?.thresholdBad,
    ok: settings?.thresholdOk,
    marginBad: settings?.marginBad,
    marginOk: settings?.marginOk,
  });

  const handleCalc = () => {
    if (!canCalc) return;
    setShowResult(true);
    setSaved(false);
  };

  const handleSaveToHistory = () => {
    if (onSaveHistory && canCalc) {
      onSaveHistory({
        id: Date.now(),
        mode: 'frete',
        origem: origem.trim(),
        destino: destino.trim(),
        valor: freteNum,
        distancia: distanciaTotal,
        distanciaIda: idaNum,
        distanciaRetorno: voltaNum,
        isRetornoVazio,
        pedagios: pedagiosNum,
        custoTotal,
        lucro,
        margem,
        receitaPorKm,
        custoPorKm,
        lucroPorKm,
        verdictTitle: verdict.title,
        verdictColor: verdict.color,
        timestamp: new Date().toISOString(),
      });
      setSaved(true);
    }
  };

  const handleReset = () => {
    setOrigem('');
    setDestino('');
    setValorFrete('');
    setDistanciaIda('');
    setDistanciaRetorno('');
    setIsRetornoVazio(false);
    setPedagios('');
    setAlimentacaoHospedagem('');
    setOutrosCustosViagem('');
    setShowResult(false);
    setSaved(false);
  };

  return (
    <div>
      {!settings?.consumoCombustivel && !settings?.consumoGasolina && (
        <div className="no-config-banner">
          ⚠️ Configure seu veículo para cálculos precisos (ícone ⚙️ no topo)
        </div>
      )}

      {/* Card Principal de Dados do Frete */}
      <div className="card">
        {/* Origem e Destino */}
        <div className="field-row">
          <div className="field">
            <label>📍 Origem <span className="hint">(opcional)</span></label>
            <input
              type="text"
              placeholder="Ex: Curitiba - PR"
              value={origem}
              onChange={e => { setOrigem(e.target.value); setShowResult(false); setSaved(false); }}
            />
          </div>
          <div className="field">
            <label>🏁 Destino <span className="hint">(opcional)</span></label>
            <input
              type="text"
              placeholder="Ex: Santos - SP"
              value={destino}
              onChange={e => { setDestino(e.target.value); setShowResult(false); setSaved(false); }}
            />
          </div>
        </div>

        {/* Valor do Frete */}
        <div className="field">
          <label>💰 Valor do Frete (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 2800.00"
            value={valorFrete}
            onChange={e => { setValorFrete(e.target.value); setShowResult(false); setSaved(false); }}
          />
        </div>

        {/* Distância de Ida */}
        <div className="field">
          <label>📏 Distância de Ida (km)</label>
          <input
            type="number"
            step="1"
            min="0"
            placeholder="Ex: 420"
            value={distanciaIda}
            onChange={e => {
              setDistanciaIda(e.target.value);
              if (isRetornoVazio && !distanciaRetorno) {
                setDistanciaRetorno(e.target.value);
              }
              setShowResult(false);
              setSaved(false);
            }}
          />
        </div>

        {/* Switch / Checkbox Retorno Vazio */}
        <div className="field" style={{ background: isRetornoVazio ? '#fef2f2' : 'var(--input-bg)', border: `1.5px solid ${isRetornoVazio ? '#fca5a5' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '12px', transition: 'all 0.2s' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
            <span style={{ fontWeight: 700, color: isRetornoVazio ? '#991b1b' : 'var(--text)' }}>
              🚚 Considerar Retorno Vazio?
            </span>
            <input
              type="checkbox"
              style={{ width: 22, height: 22, cursor: 'pointer', accentColor: 'var(--red)' }}
              checked={isRetornoVazio}
              onChange={e => handleToggleRetornoVazio(e.target.checked)}
            />
          </label>

          {isRetornoVazio && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #fca5a5' }}>
              <div className="field" style={{ marginBottom: 8 }}>
                <label style={{ color: '#991b1b' }}>Distância do Retorno (km):</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder={distanciaIda || 'Ex: 420'}
                  value={distanciaRetorno}
                  onChange={e => { setDistanciaRetorno(e.target.value); setShowResult(false); setSaved(false); }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#991b1b', margin: 0, fontWeight: 600 }}>
                ⚠️ O cálculo considerará a quilometragem da volta ({voltaNum} km) sem receita adicional.
              </p>
            </div>
          )}
        </div>

        {/* Resumo da Distância Total Considerada */}
        {distanciaTotal > 0 && (
          <div className="distance-summary" style={{ marginBottom: 16 }}>
            <span className="ds-label">🏁 Distância Total Calculada:</span>
            <span className="ds-value">
              {distanciaTotal.toFixed(0)} km
              {isRetornoVazio && (
                <span className="ds-detail"> ({idaNum.toFixed(0)} km ida + {voltaNum.toFixed(0)} km volta)</span>
              )}
            </span>
          </div>
        )}

        {/* Pedágios */}
        <div className="field">
          <label>🛣️ Pedágios Previstos (R$) <span className="hint">(opcional)</span></label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 145.00"
            value={pedagios}
            onChange={e => { setPedagios(e.target.value); setShowResult(false); setSaved(false); }}
          />
        </div>

        {/* Alternador Nível de Cálculo (Rápido vs Completo) */}
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              NÍVEL DE DETALHAMENTO
            </span>
            <button
              type="button"
              onClick={() => setCalcLevel(prev => prev === 'rapido' ? 'completo' : 'rapido')}
              style={{ padding: '4px 10px', fontSize: '0.78rem', background: calcLevel === 'completo' ? '#eff6ff' : 'var(--input-bg)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: 6 }}
            >
              {calcLevel === 'completo' ? '➖ Modo Rápido' : '➕ Detalhar Custos Extras'}
            </button>
          </div>

          {calcLevel === 'completo' && (
            <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
              <div className="field">
                <label>🍲 Alimentação / Hospedagem / Diárias (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 120.00"
                  value={alimentacaoHospedagem}
                  onChange={e => { setAlimentacaoHospedagem(e.target.value); setShowResult(false); setSaved(false); }}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>📦 Outros Custos desta Viagem (R$) <span className="hint">(ajudante, carga/descarga)</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 50.00"
                  value={outrosCustosViagem}
                  onChange={e => { setOutrosCustosViagem(e.target.value); setShowResult(false); setSaved(false); }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          className="calc-btn"
          style={{ flex: 1 }}
          disabled={!canCalc}
          onClick={handleCalc}
        >
          {showResult ? 'Recalcular Análise' : 'Analisar Frete'}
        </button>
        {showResult && (
          <button
            type="button"
            className="calc-btn"
            style={{ flex: '0 0 auto', background: 'var(--input-bg)', color: 'var(--text)', boxShadow: 'var(--shadow)', width: 56 }}
            onClick={handleReset}
            title="Novo cálculo"
          >
            🔄
          </button>
        )}
      </div>

      {/* Exibição dos Resultados */}
      {showResult && canCalc && (
        <>
          <ResultDisplay
            valor={freteNum}
            distancia={distanciaTotal}
            distanciaIda={idaNum}
            distanciaRetorno={voltaNum}
            isRetornoVazio={isRetornoVazio}
            origem={origem}
            destino={destino}
            custosExtras={extrasNum}
            pedagios={pedagiosNum}
            settings={settings}
            mode="frete"
            financials={{
              fuelCost: fuelResult.custo,
              fuelLitros: fuelResult.litros,
              custoManutencao,
              custoPneus,
              custoDepreciacao,
              custoOutrosKm,
              custoTotal,
              lucro,
              receitaPorKm,
              custoPorKm,
              lucroPorKm,
              margem,
              verdict,
            }}
          />
          <button
            type="button"
            className="save-history-btn"
            onClick={handleSaveToHistory}
            disabled={saved}
          >
            {saved ? '✅ Salvo no histórico' : '📋 Salvar no histórico de fretes'}
          </button>
        </>
      )}
    </div>
  );
}

