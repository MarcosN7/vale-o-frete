// Faixas de margem e R$/km para o veredito
export const DEFAULT_THRESHOLDS = {
  bad: 0.50,         // R$/km abaixo = alerta vermelho
  ok: 1.00,          // R$/km entre bad e ok = alerta amarelo
  marginBad: 10,     // Margem % abaixo = Não vale
  marginOk: 22,      // Margem % entre bad e ok = Atenção
};

// Padrões sugeridos de custo operacional por tipo de veículo
export const VEHICLE_PRESETS = {
  carreta: {
    label: 'Carreta / Bitrem',
    icon: '🚛',
    tipoCombustivel: 'diesel',
    consumoPadrao: 2.2,
    manutencaoKm: 0.45,
    pneusKm: 0.30,
    depreciacaoKm: 0.35,
    outrosKm: 0.10,
  },
  caminhao: {
    label: 'Caminhão Toco / Truck',
    icon: '🚚',
    tipoCombustivel: 'diesel',
    consumoPadrao: 2.8,
    manutencaoKm: 0.35,
    pneusKm: 0.20,
    depreciacaoKm: 0.25,
    outrosKm: 0.08,
  },
  van: {
    label: 'Van / VUC / Fiorino',
    icon: '🚐',
    tipoCombustivel: 'diesel',
    consumoPadrao: 8.5,
    manutencaoKm: 0.18,
    pneusKm: 0.08,
    depreciacaoKm: 0.12,
    outrosKm: 0.04,
  },
  carro: {
    label: 'Carro de Passeio / Utilitário',
    icon: '🚗',
    tipoCombustivel: 'gasolina',
    consumoPadrao: 10.5,
    manutencaoKm: 0.12,
    pneusKm: 0.05,
    depreciacaoKm: 0.08,
    outrosKm: 0.02,
  },
  moto: {
    label: 'Moto',
    icon: '🏍️',
    tipoCombustivel: 'gasolina',
    consumoPadrao: 30.0,
    manutencaoKm: 0.05,
    pneusKm: 0.02,
    depreciacaoKm: 0.03,
    outrosKm: 0.01,
  },
};

/**
 * Plataformas Padrão Configuráveis
 */
export const DEFAULT_PLATFORMS = [
  {
    id: 'direto',
    name: 'Frete Direto / Sem Plataforma',
    icon: '🤝',
    feeType: 'sem_taxa', // sem_taxa | percentage | fixed | percentage_and_fixed | period
    percentage: 0,
    fixedFee: 0,
    periodType: 'daily', // hourly | daily | weekly | monthly
    periodFee: 0,
    periodDistribution: 'proportional', // full | proportional | none
    estimatedTripsPerPeriod: 5,
    source: 'Sem intermediários',
    updatedAt: '2026-09-01',
    isDefault: true,
  },
  {
    id: 'indrive',
    name: 'inDrive Fretes',
    icon: '🚗',
    feeType: 'percentage',
    percentage: 9.99,
    fixedFee: 0,
    periodType: 'daily',
    periodFee: 0,
    periodDistribution: 'proportional',
    estimatedTripsPerPeriod: 5,
    source: 'Informada pelo usuário (configurável)',
    updatedAt: '2026-09-01',
    isDefault: true,
  },
  {
    id: 'lalamove',
    name: 'Lalamove',
    icon: '🚚',
    feeType: 'percentage',
    percentage: 9.99,
    fixedFee: 0,
    periodType: 'daily',
    periodFee: 0,
    periodDistribution: 'proportional',
    estimatedTripsPerPeriod: 5,
    source: 'Informada pelo usuário (configurável)',
    updatedAt: '2026-09-01',
    isDefault: true,
  },
  {
    id: 'uber',
    name: 'Uber Direct / Fretes',
    icon: '🚙',
    feeType: 'percentage',
    percentage: 15.00,
    fixedFee: 0,
    periodType: 'daily',
    periodFee: 0,
    periodDistribution: 'proportional',
    estimatedTripsPerPeriod: 5,
    source: 'Informada pelo usuário (configurável)',
    updatedAt: '2026-09-01',
    isDefault: true,
  },
  {
    id: '99',
    name: '99 Entrega / Fretes',
    icon: '🚕',
    feeType: 'percentage',
    percentage: 12.00,
    fixedFee: 0,
    periodType: 'daily',
    periodFee: 0,
    periodDistribution: 'proportional',
    estimatedTripsPerPeriod: 5,
    source: 'Informada pelo usuário (configurável)',
    updatedAt: '2026-09-01',
    isDefault: true,
  },
];

/**
 * ============================================================
 * MOTOR DE CÁLCULO FINANCEIRO MODULAR
 * ============================================================
 */

export function calculateFuelCost(distanciaKm, consumoKmL, precoLitro) {
  const dist = parseFloat(distanciaKm) || 0;
  const cons = parseFloat(consumoKmL) || 0;
  const preco = parseFloat(precoLitro) || 0;

  if (dist <= 0 || cons <= 0 || preco <= 0) {
    return { litros: 0, custo: 0 };
  }
  const litros = dist / cons;
  const custo = litros * preco;
  return { litros, custo };
}

export function calculateMaintenanceCost(distanciaKm, custoKm) {
  const dist = parseFloat(distanciaKm) || 0;
  const cKm = parseFloat(custoKm) || 0;
  return dist * cKm;
}

export function calculateTireCost(distanciaKm, custoKm) {
  const dist = parseFloat(distanciaKm) || 0;
  const cKm = parseFloat(custoKm) || 0;
  return dist * cKm;
}

export function calculateDepreciationCost(distanciaKm, custoKm) {
  const dist = parseFloat(distanciaKm) || 0;
  const cKm = parseFloat(custoKm) || 0;
  return dist * cKm;
}

export function calculateOtherCostPerKm(distanciaKm, custoKm) {
  const dist = parseFloat(distanciaKm) || 0;
  const cKm = parseFloat(custoKm) || 0;
  return dist * cKm;
}

export function calculateTotalCost({
  custoCombustivel = 0,
  pedagios = 0,
  custoManutencao = 0,
  custoPneus = 0,
  custoDepreciacao = 0,
  custoOutrosKm = 0,
  custosExtras = 0,
  alimentacaoHospedagem = 0,
}) {
  return (
    (parseFloat(custoCombustivel) || 0) +
    (parseFloat(pedagios) || 0) +
    (parseFloat(custoManutencao) || 0) +
    (parseFloat(custoPneus) || 0) +
    (parseFloat(custoDepreciacao) || 0) +
    (parseFloat(custoOutrosKm) || 0) +
    (parseFloat(custosExtras) || 0) +
    (parseFloat(alimentacaoHospedagem) || 0)
  );
}

export function calculateProfit(receitaLiquidaOuFrete, custoTotal) {
  return (parseFloat(receitaLiquidaOuFrete) || 0) - (parseFloat(custoTotal) || 0);
}

export function calculateRevenuePerKm(valorFrete, distanciaTotal) {
  const dist = parseFloat(distanciaTotal) || 0;
  const frete = parseFloat(valorFrete) || 0;
  return dist > 0 ? frete / dist : 0;
}

export function calculateCostPerKm(custoTotal, distanciaTotal) {
  const dist = parseFloat(distanciaTotal) || 0;
  const custo = parseFloat(custoTotal) || 0;
  return dist > 0 ? custo / dist : 0;
}

export function calculateProfitPerKm(lucro, distanciaTotal) {
  const dist = parseFloat(distanciaTotal) || 0;
  const luc = parseFloat(lucro) || 0;
  return dist > 0 ? luc / dist : 0;
}

export function calculateMargin(lucro, valorFrete) {
  const frete = parseFloat(valorFrete) || 0;
  const luc = parseFloat(lucro) || 0;
  return frete > 0 ? (luc / frete) * 100 : 0;
}

/**
 * ============================================================
 * MOTOR DE TAXAS DE PLATAFORMAS
 * ============================================================
 */

export function calculatePlatformFee(valorFrete, platformConfig = {}) {
  const frete = parseFloat(valorFrete) || 0;
  if (frete <= 0) {
    return {
      commissionFee: 0,
      fixedFee: 0,
      periodFee: 0,
      totalPlatformFee: 0,
      netRevenue: 0,
      effectiveRate: 0,
    };
  }

  const feeType = platformConfig.feeType || 'percentage';
  let commissionFee = 0;
  let fixedFee = 0;
  let periodFee = 0;

  if (feeType === 'sem_taxa') {
    return {
      commissionFee: 0,
      fixedFee: 0,
      periodFee: 0,
      totalPlatformFee: 0,
      netRevenue: frete,
      effectiveRate: 0,
    };
  }

  // Comissão %
  if (feeType === 'percentage' || feeType === 'percentage_and_fixed' || feeType === 'custom_combo') {
    const pct = parseFloat(platformConfig.percentage) || 0;
    commissionFee = (frete * pct) / 100;
  }

  // Taxa fixa por frete
  if (feeType === 'fixed' || feeType === 'percentage_and_fixed' || feeType === 'custom_combo') {
    fixedFee = parseFloat(platformConfig.fixedFee) || 0;
  }

  // Taxa por período (acesso / assinatura)
  if (feeType === 'period' || feeType === 'custom_combo') {
    const rawPeriodFee = parseFloat(platformConfig.periodFee) || 0;
    const distribution = platformConfig.periodDistribution || 'proportional';
    if (distribution === 'full') {
      periodFee = rawPeriodFee;
    } else if (distribution === 'proportional') {
      const trips = parseInt(platformConfig.estimatedTripsPerPeriod, 10) || 1;
      periodFee = trips > 0 ? rawPeriodFee / trips : rawPeriodFee;
    } else {
      periodFee = 0;
    }
  }

  const totalPlatformFee = commissionFee + fixedFee + periodFee;
  const netRevenue = Math.max(0, frete - totalPlatformFee);
  const effectiveRate = frete > 0 ? (totalPlatformFee / frete) * 100 : 0;

  return {
    commissionFee: Math.round(commissionFee * 100) / 100,
    fixedFee: Math.round(fixedFee * 100) / 100,
    periodFee: Math.round(periodFee * 100) / 100,
    totalPlatformFee: Math.round(totalPlatformFee * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
  };
}

export function calculateNetRevenue(valorFrete, totalPlatformFee) {
  const frete = parseFloat(valorFrete) || 0;
  const fees = parseFloat(totalPlatformFee) || 0;
  return Math.max(0, frete - fees);
}

/**
 * Comparador de rentabilidade entre múltiplas plataformas
 */
export function comparePlatforms({
  valorFrete,
  distanciaTotal,
  custoTotal,
  platforms = DEFAULT_PLATFORMS,
}) {
  const frete = parseFloat(valorFrete) || 0;
  const dist = parseFloat(distanciaTotal) || 0;
  const custos = parseFloat(custoTotal) || 0;

  const results = platforms.map(plat => {
    const feeResult = calculatePlatformFee(frete, plat);
    const netRevenue = feeResult.netRevenue;
    const lucro = netRevenue - custos;
    const margem = frete > 0 ? (lucro / frete) * 100 : 0;
    const lucroPorKm = dist > 0 ? lucro / dist : 0;
    const receitaPorKm = dist > 0 ? frete / dist : 0;

    return {
      platformId: plat.id,
      platformName: plat.name,
      platformIcon: plat.icon || '📱',
      feeType: plat.feeType,
      feeResult,
      grossFreight: frete,
      totalFees: feeResult.totalPlatformFee,
      netRevenue,
      tripCosts: custos,
      lucro: Math.round(lucro * 100) / 100,
      margem: Math.round(margem * 10) / 10,
      lucroPorKm: Math.round(lucroPorKm * 100) / 100,
      receitaPorKm: Math.round(receitaPorKm * 100) / 100,
      effectiveRate: feeResult.effectiveRate,
    };
  });

  // Ordena por maior lucro real
  results.sort((a, b) => b.lucro - a.lucro);

  const best = results[0];
  const resultsWithDiff = results.map((res, index) => ({
    ...res,
    isBest: index === 0,
    diffFromBest: best ? Math.round((best.lucro - res.lucro) * 100) / 100 : 0,
  }));

  return {
    bestPlatform: best,
    comparisons: resultsWithDiff,
  };
}

/**
 * Avaliação da viagem (Veredito) com 3 estados:
 * 🟢 VALE A PENA / 🟡 VALE COM ATENÇÃO / 🔴 NÃO VALE A PENA
 */
export function evaluateFreight(metrics, thresholds = DEFAULT_THRESHOLDS) {
  const { lucro = 0, margem = 0, lucroPorKm = 0, valorFrete = 0, isRetornoVazio = false } = metrics;
  const marginBad = thresholds.marginBad ?? DEFAULT_THRESHOLDS.marginBad;
  const marginOk = thresholds.marginOk ?? DEFAULT_THRESHOLDS.marginOk;
  const badThreshold = thresholds.bad ?? DEFAULT_THRESHOLDS.bad;
  const okThreshold = thresholds.ok ?? DEFAULT_THRESHOLDS.ok;

  // Prejuízo absoluto
  if (lucro <= 0 || valorFrete <= 0) {
    return {
      status: 'bad',
      color: 'red',
      emoji: '🔴',
      title: 'NÃO VALE A PENA',
      message: lucro < 0
        ? `Essa viagem dá prejuízo estimado de ${formatBRL(Math.abs(lucro))}.`
        : 'Custo total igual ou superior à receita líquida.',
      detail: `${margem.toFixed(1)}% de margem (${formatBRL(lucroPorKm)}/km)`,
    };
  }

  // Margem muito baixa ou R$/km abaixo do piso
  if (margem < marginBad || lucroPorKm < badThreshold) {
    return {
      status: 'bad',
      color: 'red',
      emoji: '🔴',
      title: 'NÃO VALE A PENA',
      message: isRetornoVazio
        ? 'O retorno vazio e as taxas consumiram quase todo o lucro da viagem.'
        : 'O retorno financeiro estimado é muito baixo para a distância percorrida.',
      detail: `${margem.toFixed(1)}% de margem (${formatBRL(lucroPorKm)}/km)`,
    };
  }

  // Margem intermediária / apertada
  if (margem < marginOk || lucroPorKm < okThreshold) {
    return {
      status: 'warning',
      color: 'yellow',
      emoji: '🟡',
      title: 'VALE COM ATENÇÃO',
      message: 'Margem apertada. Qualquer atraso, pedágio extra ou desvio pode eliminar seu lucro.',
      detail: `${margem.toFixed(1)}% de margem (${formatBRL(lucroPorKm)}/km)`,
    };
  }

  // Viagem saudável
  return {
    status: 'good',
    color: 'green',
    emoji: '🟢',
    title: 'VALE A PENA!',
    message: 'Ótima margem de lucro e excelente retorno por quilômetro rodado.',
    detail: `${margem.toFixed(1)}% de margem (${formatBRL(lucroPorKm)}/km)`,
  };
}

/**
 * Função de retrocompatibilidade para os modos legados
 */
export function getVerdict(reaisPorKm, thresholds = DEFAULT_THRESHOLDS) {
  if (reaisPorKm < (thresholds.bad ?? DEFAULT_THRESHOLDS.bad)) {
    return { color: 'red', emoji: '🚫', text: 'Não vale a pena', detail: `R$ ${reaisPorKm.toFixed(2)}/km` };
  }
  if (reaisPorKm < (thresholds.ok ?? DEFAULT_THRESHOLDS.ok)) {
    return { color: 'yellow', emoji: '⚠️', text: 'No limite', detail: `R$ ${reaisPorKm.toFixed(2)}/km` };
  }
  return { color: 'green', emoji: '✅', text: 'Vale a pena!', detail: `R$ ${reaisPorKm.toFixed(2)}/km` };
}

export function calcFuelCost(distanciaKm, consumoKmL, precoLitro) {
  return calculateFuelCost(distanciaKm, consumoKmL, precoLitro);
}

/**
 * ============================================================
 * FORMATAÇÃO BRASILEIRA
 * ============================================================
 */

export function formatBRL(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatKm(value) {
  const num = parseFloat(value) || 0;
  return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatPercent(value) {
  const num = parseFloat(value) || 0;
  return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/**
 * ============================================================
 * PERSISTÊNCIA LOCALSTORAGE
 * ============================================================
 */

const SETTINGS_KEY = 'vof_settings';
const HISTORY_KEY = 'vof_history';
const PLATFORMS_KEY = 'vof_platforms';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadPlatforms() {
  try {
    const raw = localStorage.getItem(PLATFORMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignore */ }
  return DEFAULT_PLATFORMS;
}

export function savePlatforms(platforms) {
  localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const history = JSON.parse(raw);
      return history;
    }
  } catch (e) { /* ignore */ }
  return [];
}

export function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Exporta o histórico como CSV e dispara o download no browser.
 */
export function exportHistoryCSV(history) {
  const header = 'Modo,Plataforma,Origem,Destino,Frete Bruto (R$),Taxas Plataforma (R$),Receita Líquida (R$),Distância Total (km),Custos Viagem (R$),Lucro Real (R$),Margem (%),Resultado,Horário';
  const rows = history.map(h => {
    const modo = h.mode === 'ml' ? 'Mercado Livre' : h.mode === 'lalamove' ? 'Lalamove / inDrive' : 'Análise de Frete';
    const plat = (h.platformName || (h.mode === 'ml' ? 'Mercado Livre' : h.mode === 'lalamove' ? 'Lalamove' : 'Direto')).replace(/,/g, ' ');
    const origem = (h.origem || '').replace(/,/g, ' ');
    const destino = (h.destino || '').replace(/,/g, ' ');
    const hora = new Date(h.timestamp).toLocaleString('pt-BR');
    const valorBruto = (h.valor || 0).toFixed(2);
    const taxasPlat = (h.totalPlatformFees || 0).toFixed(2);
    const receitaLiq = (h.netRevenue || (h.valor - (h.totalPlatformFees || 0)) || 0).toFixed(2);
    const distTotal = (h.distancia || 0).toFixed(1);
    const custo = (h.custoTotal || 0).toFixed(2);
    const lucro = (h.lucro || 0).toFixed(2);
    const margem = (h.margem || 0).toFixed(1);
    const resultado = h.verdictTitle || (h.lucro > 0 ? 'Vale a pena' : 'Não vale');
    return `"${modo}","${plat}","${origem}","${destino}",${valorBruto},${taxasPlat},${receitaLiq},${distTotal},${custo},${lucro},${margem}%,"${resultado}","${hora}"`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  a.download = `fretes-historico-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getPriceAge(settings) {
  if (!settings?.precoAtualizadoEm) return null;
  const diff = Date.now() - new Date(settings.precoAtualizadoEm).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const ONBOARDING_KEY = 'vof_onboarding_completed';

export function isOnboardingCompleted() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

export function setOnboardingCompleted(completed = true) {
  try {
    localStorage.setItem(ONBOARDING_KEY, completed ? 'true' : 'false');
  } catch (e) { /* ignore */ }
}

