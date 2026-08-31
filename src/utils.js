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

export function calculateProfit(valorFrete, custoTotal) {
  return (parseFloat(valorFrete) || 0) - (parseFloat(custoTotal) || 0);
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
        : 'Custo total igual ou superior ao valor do frete.',
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
        ? 'O retorno vazio consumiu quase todo o lucro da viagem.'
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

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      const history = JSON.parse(raw);
      // Retorna ordenado pelo mais recente
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
  const header = 'Modo,Origem,Destino,Valor (R$),Distância Total (km),Custo Total (R$),Lucro (R$),Margem (%),Resultado,Horário';
  const rows = history.map(h => {
    const modo = h.mode === 'ml' ? 'Mercado Livre' : h.mode === 'lalamove' ? 'Lalamove / inDrive' : 'Análise de Frete';
    const origem = (h.origem || '').replace(/,/g, ' ');
    const destino = (h.destino || '').replace(/,/g, ' ');
    const hora = new Date(h.timestamp).toLocaleString('pt-BR');
    const valor = (h.valor || 0).toFixed(2);
    const distTotal = (h.distancia || 0).toFixed(1);
    const custo = (h.custoTotal || (h.valor - (h.lucro || 0)) || 0).toFixed(2);
    const lucro = (h.lucro || 0).toFixed(2);
    const margem = (h.margem || 0).toFixed(1);
    const resultado = h.verdictTitle || (h.lucro > 0 ? 'Vale a pena' : 'Não vale');
    return `"${modo}","${origem}","${destino}",${valor},${distTotal},${custo},${lucro},${margem}%,"${resultado}","${hora}"`;
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
