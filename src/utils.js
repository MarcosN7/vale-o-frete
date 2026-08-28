// Faixas de R$/km líquido para o veredito
// Agora também são salvas nas configurações do usuário
export const DEFAULT_THRESHOLDS = {
  bad: 0.50,   // abaixo = vermelho (não vale)
  ok: 1.00,    // entre bad e ok = amarelo (no limite)
};

export function getVerdict(reaisPorKm, thresholds = DEFAULT_THRESHOLDS) {
  if (reaisPorKm < thresholds.bad) {
    return { color: 'red', emoji: '🚫', text: 'Não vale a pena', detail: `R$ ${reaisPorKm.toFixed(2)}/km` };
  }
  if (reaisPorKm < thresholds.ok) {
    return { color: 'yellow', emoji: '⚠️', text: 'No limite', detail: `R$ ${reaisPorKm.toFixed(2)}/km` };
  }
  return { color: 'green', emoji: '✅', text: 'Vale a pena!', detail: `R$ ${reaisPorKm.toFixed(2)}/km` };
}

export function calcFuelCost(distanciaKm, consumoKmL, precoLitro) {
  if (!consumoKmL || !precoLitro || !distanciaKm) return null;
  const litros = distanciaKm / consumoKmL;
  const custo = litros * precoLitro;
  return { litros, custo };
}

export function formatBRL(value) {
  return `R$ ${value.toFixed(2)}`;
}

// localStorage helpers
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
      // Only return today's entries
      const today = new Date().toDateString();
      return history.filter(h => new Date(h.timestamp).toDateString() === today);
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
  const header = 'Modo,Valor (R$),Distância (km),Lucro (R$),Horário';
  const rows = history.map(h => {
    const modo = h.mode === 'ml' ? 'Mercado Livre' : 'Lalamove';
    const hora = new Date(h.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${modo},${h.valor.toFixed(2)},${h.distancia.toFixed(1)},${h.lucro.toFixed(2)},${hora}`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  a.download = `corridas-${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Retorna há quantos dias os preços foram configurados.
 * Retorna null se não houver timestamp.
 */
export function getPriceAge(settings) {
  if (!settings?.precoAtualizadoEm) return null;
  const diff = Date.now() - new Date(settings.precoAtualizadoEm).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
