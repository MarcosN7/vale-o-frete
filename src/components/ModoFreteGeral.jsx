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

export default function ModoFreteGeral({ settings, onSaveHistory, initialData, onCalculationChange }) {
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
      setShowResult(true);
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
    if (onCalculationChange) onCalculationChange(false);
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
    if (onCalculationChange) onCalculationChange(true);
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
    if (onCalculationChange) onCalculationChange(false);
  };

  return (
    <div className={`dashboard-grid ${showResult && canCalc ? 'has-result' : ''}`}>
      {/* Coluna Esquerda: Formulário Estruturado em Passos */}
      <div className="dashboard-col-left">
        {!settings?.consumoCombustivel && !settings?.consumoGasolina && (
          <div className="stale-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
            ℹ️ Usando parâmetros médios. Ajuste seu veículo no ícone ⚙️ no topo para máxima precisão.
          </div>
        )}

        {/* Passo 01: O Frete */}
        <div className="card">
          <div className="card-header-step">
            <span className="step-num">01</span>
            <h3 className="step-title">Informações do Frete</h3>
          </div>

          {/* Origem e Destino */}
          <div className="field-row">
            <div className="field">
              <label>Origem <span className="hint">(opcional)</span></label>
              <input
                type="text"
                placeholder="Ex: São Paulo - SP"
                value={origem}
                onChange={e => { setOrigem(e.target.value); setShowResult(false); setSaved(false); }}
              />
            </div>
            <div className="field">
              <label>Destino <span className="hint">(opcional)</span></label>
              <input
                type="text"
                placeholder="Ex: Curitiba - PR"
                value={destino}
                onChange={e => { setDestino(e.target.value); setShowResult(false); setSaved(false); }}
              />
            </div>
          </div>

          {/* Valor do Frete */}
          <div className="field">
            <label>💰 Valor Bruto do Frete (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="R$ 0,00 (Ex: 3500.00)"
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
              placeholder="0 km (Ex: 400)"
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

          {/* Card Retorno Vazio */}
          <div className={`retorno-vazio-card ${isRetornoVazio ? 'active' : ''}`}>
            <label className="retorno-header">
              <span className="retorno-title">
                <span>🔄</span>
                <span>Considerar Retorno Vazio?</span>
              </span>
              <input
                type="checkbox"
                style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--danger)' }}
                checked={isRetornoVazio}
                onChange={e => handleToggleRetornoVazio(e.target.checked)}
              />
            </label>

            {isRetornoVazio && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--danger-border)' }}>
                <div className="field" style={{ marginBottom: 6 }}>
                  <label style={{ color: 'var(--danger-text)', fontSize: '0.8rem' }}>
                    Distância do Retorno (km):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder={distanciaIda || 'Ex: 400'}
                    value={distanciaRetorno}
                    onChange={e => { setDistanciaRetorno(e.target.value); setShowResult(false); setSaved(false); }}
                  />
                </div>
                <p className="retorno-badge-alert" style={{ margin: 0 }}>
                  ⚠️ O cálculo considerará {voltaNum} km de volta sem receita, impactando seu custo por km real.
                </p>
              </div>
            )}
          </div>

          {/* Resumo da Distância Total Considerada */}
          {distanciaTotal > 0 && (
            <div className="distance-summary">
              <span className="ds-label">🏁 Distância Total a Rodar:</span>
              <span className="ds-value">
                {distanciaTotal.toFixed(0)} km
                {isRetornoVazio && (
                  <span className="ds-detail"> ({idaNum.toFixed(0)} km ida + {voltaNum.toFixed(0)} km volta)</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Passo 02: Despesas e Custos */}
        <div className="card">
          <div className="card-header-step">
            <span className="step-num">02</span>
            <h3 className="step-title">Despesas da Viagem</h3>
          </div>

          {/* Pedágios */}
          <div className="field">
            <label>🛣️ Pedágios Previstos (R$) <span className="hint">(opcional)</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="R$ 0,00 (Ex: 120.00)"
              value={pedagios}
              onChange={e => { setPedagios(e.target.value); setShowResult(false); setSaved(false); }}
            />
          </div>

          {/* Modo Detalhado / Custos Extras */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                OUTRAS DESPESAS ESPECÍFICAS
              </span>
              <button
                type="button"
                onClick={() => setCalcLevel(prev => prev === 'rapido' ? 'completo' : 'rapido')}
                style={{ padding: '5px 12px', fontSize: '0.78rem', background: calcLevel === 'completo' ? 'var(--primary-light)' : 'var(--surface-hover)', color: 'var(--primary)', border: '1px solid var(--primary-border)', borderRadius: 6, fontWeight: 700 }}
              >
                {calcLevel === 'completo' ? '➖ Ocultar Extras' : '➕ Adicionar Diárias / Alimentação'}
              </button>
            </div>

            {calcLevel === 'completo' && (
              <div style={{ background: 'var(--surface-hover)', padding: '14px', borderRadius: 'var(--radius-sm)', marginTop: 12 }}>
                <div className="field">
                  <label>🍲 Alimentação & Hospedagem (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="R$ 0,00 (Ex: 150.00)"
                    value={alimentacaoHospedagem}
                    onChange={e => { setAlimentacaoHospedagem(e.target.value); setShowResult(false); setSaved(false); }}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>📦 Outros Gastos <span className="hint">(ajudante, carga/descarga)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="R$ 0,00 (Ex: 80.00)"
                    value={outrosCustosViagem}
                    onChange={e => { setOutrosCustosViagem(e.target.value); setShowResult(false); setSaved(false); }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Principal */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="calc-btn"
            style={{ flex: 1 }}
            disabled={!canCalc}
            onClick={handleCalc}
          >
            <span>⚡</span>
            <span>{showResult ? 'RECALCULAR FRETE' : 'CALCULAR SE VALE A PENA'}</span>
          </button>
          {showResult && (
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', padding: 0 }}
              onClick={handleReset}
              title="Limpar formulário"
            >
              🔄
            </button>
          )}
        </div>
      </div>

      {/* Coluna Direita: Resultado em Destaque */}
      {showResult && canCalc && (
        <div className="dashboard-col-right">
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
            {saved ? '✓ Salvo nos Meus Fretes' : '📋 Salvar no Histórico'}
          </button>
        </div>
      )}
    </div>
  );
}
