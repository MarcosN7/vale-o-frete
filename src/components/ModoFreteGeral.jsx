import { useState, useEffect } from 'react';
import ResultDisplay from './ResultDisplay';
import PlatformComparison from './PlatformComparison';
import {
  calculateFuelCost,
  calculateMaintenanceCost,
  calculateTireCost,
  calculateDepreciationCost,
  calculateOtherCostPerKm,
  calculateTotalCost,
  calculatePlatformFee,
  calculateProfit,
  calculateRevenuePerKm,
  calculateCostPerKm,
  calculateProfitPerKm,
  calculateMargin,
  evaluateFreight,
  formatPercent,
  formatBRL,
  DEFAULT_PLATFORMS,
} from '../utils';

export default function ModoFreteGeral({
  settings,
  platforms = DEFAULT_PLATFORMS,
  onSaveHistory,
  initialData,
  onCalculationChange,
  onOpenPlatformSettings,
}) {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [valorFrete, setValorFrete] = useState('');
  const [distanciaIda, setDistanciaIda] = useState('');
  const [distanciaRetorno, setDistanciaRetorno] = useState('');
  const [isRetornoVazio, setIsRetornoVazio] = useState(false);
  const [pedagios, setPedagios] = useState('');
  
  // Plataforma selecionada
  const [selectedPlatformId, setSelectedPlatformId] = useState('indrive');
  const [isOverridingFee, setIsOverridingFee] = useState(false);
  const [overridePercentage, setOverridePercentage] = useState('');
  const [overrideFixedFee, setOverrideFixedFee] = useState('');

  // Comparador de plataformas modal/toggle
  const [showComparison, setShowComparison] = useState(false);

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
      if (initialData.platformId) {
        setSelectedPlatformId(initialData.platformId);
      }
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

  // Obter configuração da plataforma ativa
  const basePlatform = platforms.find(p => p.id === selectedPlatformId) || platforms[0] || DEFAULT_PLATFORMS[0];
  const activePlatformConfig = {
    ...basePlatform,
    percentage: isOverridingFee && overridePercentage !== '' ? parseFloat(overridePercentage) : basePlatform.percentage,
    fixedFee: isOverridingFee && overrideFixedFee !== '' ? parseFloat(overrideFixedFee) : basePlatform.fixedFee,
  };

  // Combustível
  const tipoComb = settings?.tipoCombustivel || 'diesel';
  let precoComb = tipoComb === 'diesel'
    ? (settings?.precoDiesel || 5.89)
    : tipoComb === 'etanol'
    ? (settings?.precoEtanol || 3.99)
    : (settings?.precoGasolina || 5.89);

  let consumo = parseFloat(settings?.consumoCombustivel) || parseFloat(settings?.consumoGasolina) || 2.8;

  if (tipoComb === 'etanol') {
    if (settings?.consumoEtanol > 0) {
      consumo = parseFloat(settings.consumoEtanol);
    } else if (consumo > 0 && consumo !== 2.8) {
      consumo = consumo * 0.7;
    }
  } else if (tipoComb === 'flex') {
    const precoGas = settings?.precoGasolina || 5.89;
    const precoEta = settings?.precoEtanol || 3.99;
    const consGas = consumo;
    const consEta = parseFloat(settings?.consumoEtanol) || (consGas * 0.7);
    const custoKmGas = consGas > 0 ? precoGas / consGas : 0;
    const custoKmEta = consEta > 0 ? precoEta / consEta : 0;

    if (custoKmEta > 0 && custoKmEta < custoKmGas) {
      precoComb = precoEta;
      consumo = consEta;
    } else {
      precoComb = precoGas;
      consumo = consGas;
    }
  }

  const canCalc = freteNum > 0 && idaNum > 0 && consumo > 0;

  // 1. Taxa da Plataforma
  const platformFeeResult = calculatePlatformFee(freteNum, activePlatformConfig);
  const netRevenue = platformFeeResult.netRevenue;

  // 2. Custos da Viagem
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

  // 3. Lucro Real e Margem (Lucro Real = Receita Líquida - Custos da Viagem)
  const lucro = calculateProfit(netRevenue, custoTotal);
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
        platformId: activePlatformConfig.id,
        platformName: activePlatformConfig.name,
        platformFeePercentage: activePlatformConfig.percentage,
        platformFixedFee: activePlatformConfig.fixedFee,
        platformPeriodFee: activePlatformConfig.periodFee,
        totalPlatformFees: platformFeeResult.totalPlatformFee,
        netRevenue,
        effectiveRate: platformFeeResult.effectiveRate,
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
    setIsOverridingFee(false);
    setOverridePercentage('');
    setOverrideFixedFee('');
    setShowResult(false);
    setShowComparison(false);
    setSaved(false);
    if (onCalculationChange) onCalculationChange(false);
  };

  return (
    <div className={`dashboard-grid ${showResult && canCalc ? 'has-result' : ''}`}>
      {/* Coluna Esquerda: Formulário Estruturado em Passos */}
      <div className="dashboard-col-left">
        {!settings?.consumoCombustivel && !settings?.consumoGasolina && (
          <div className="stale-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
            ℹ️ Usando parâmetros médios do veículo. Ajuste em ⚙️ no topo para máxima precisão.
          </div>
        )}

        {/* Passo 01: O Frete & Plataforma */}
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
          <div className="field" id="tour-valor-frete">
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

          {/* Seleção da Plataforma */}
          <div className="field" id="tour-plataforma" style={{ background: 'var(--surface-hover)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0, fontWeight: 700, color: 'var(--brand-dark)' }}>
                🏢 Onde você conseguiu esse frete?
              </label>
              {onOpenPlatformSettings && (
                <button
                  type="button"
                  onClick={onOpenPlatformSettings}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Gerenciar plataformas
                </button>
              )}
            </div>

            <select
              value={selectedPlatformId}
              onChange={e => {
                setSelectedPlatformId(e.target.value);
                setIsOverridingFee(false);
                setShowResult(false);
                setSaved(false);
              }}
            >
              {platforms.map(p => (
                <option key={p.id} value={p.id}>
                  {p.icon || '📱'} {p.name} {p.feeType === 'sem_taxa' ? '(0%)' : p.feeType === 'percentage' ? `(${p.percentage}%)` : ''}
                </option>
              ))}
            </select>

            {/* Resumo da Taxa e Opção de Ajuste Local */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Taxa ativa: <strong style={{ color: 'var(--primary)' }}>
                  {activePlatformConfig.feeType === 'sem_taxa'
                    ? 'Sem taxa (0%)'
                    : activePlatformConfig.feeType === 'percentage'
                    ? `${formatPercent(activePlatformConfig.percentage)} comissão`
                    : activePlatformConfig.feeType === 'fixed'
                    ? `${formatBRL(activePlatformConfig.fixedFee)} fixa`
                    : 'Personalizada'}
                </strong>
              </span>

              {activePlatformConfig.feeType !== 'sem_taxa' && (
                <button
                  type="button"
                  onClick={() => setIsOverridingFee(!isOverridingFee)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isOverridingFee ? '✕ Cancelar edição' : '✏️ Editar taxa neste frete'}
                </button>
              )}
            </div>

            {/* Inputs de Ajuste Local da Taxa */}
            {isOverridingFee && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                <div className="field-row" style={{ marginBottom: 0 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Comissão neste frete (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder={String(basePlatform.percentage || 0)}
                      value={overridePercentage}
                      onChange={e => { setOverridePercentage(e.target.value); setShowResult(false); setSaved(false); }}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Taxa fixa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={String(basePlatform.fixedFee || 0)}
                      value={overrideFixedFee}
                      onChange={e => { setOverrideFixedFee(e.target.value); setShowResult(false); setSaved(false); }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Distância e Retorno Vazio */}
          <div id="tour-distancia-retorno">
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
        <div className="card" id="tour-despesas">
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
        <div style={{ display: 'flex', gap: 12 }} id="tour-calc-btn">
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

      {/* Coluna Direita: Resultado em Destaque & Comparação */}
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
            platformData={activePlatformConfig}
            onOpenComparison={() => setShowComparison(!showComparison)}
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
              platformFeeResult,
            }}
          />

          {showComparison && (
            <PlatformComparison
              valorFrete={freteNum}
              distanciaTotal={distanciaTotal}
              custoTotal={custoTotal}
              platforms={platforms}
              onSelectPlatform={(pId) => {
                setSelectedPlatformId(pId);
                setIsOverridingFee(false);
              }}
              onClose={() => setShowComparison(false)}
            />
          )}

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
