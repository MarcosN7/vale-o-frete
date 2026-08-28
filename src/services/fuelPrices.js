/**
 * Preços médios de combustível por estado (UF) — fonte: ANP
 * Atualizado manualmente com base nos dados semanais da ANP.
 * Para atualizar: https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis
 */
export const ANP_PRICES = {
  AC: { gasolina: 6.49, etanol: 5.19, nome: 'Acre' },
  AL: { gasolina: 5.89, etanol: 4.09, nome: 'Alagoas' },
  AP: { gasolina: 6.19, etanol: 5.29, nome: 'Amapá' },
  AM: { gasolina: 6.29, etanol: 5.39, nome: 'Amazonas' },
  BA: { gasolina: 5.79, etanol: 4.19, nome: 'Bahia' },
  CE: { gasolina: 5.69, etanol: 4.29, nome: 'Ceará' },
  DF: { gasolina: 5.79, etanol: 4.39, nome: 'Distrito Federal' },
  ES: { gasolina: 5.89, etanol: 3.99, nome: 'Espírito Santo' },
  GO: { gasolina: 5.69, etanol: 3.89, nome: 'Goiás' },
  MA: { gasolina: 5.89, etanol: 4.29, nome: 'Maranhão' },
  MT: { gasolina: 5.89, etanol: 3.89, nome: 'Mato Grosso' },
  MS: { gasolina: 5.69, etanol: 3.89, nome: 'Mato Grosso do Sul' },
  MG: { gasolina: 5.79, etanol: 3.99, nome: 'Minas Gerais' },
  PA: { gasolina: 5.99, etanol: 4.59, nome: 'Pará' },
  PB: { gasolina: 5.79, etanol: 4.29, nome: 'Paraíba' },
  PR: { gasolina: 5.69, etanol: 3.99, nome: 'Paraná' },
  PE: { gasolina: 5.79, etanol: 4.19, nome: 'Pernambuco' },
  PI: { gasolina: 5.89, etanol: 4.39, nome: 'Piauí' },
  RJ: { gasolina: 6.09, etanol: 4.79, nome: 'Rio de Janeiro' },
  RN: { gasolina: 5.79, etanol: 4.29, nome: 'Rio Grande do Norte' },
  RS: { gasolina: 5.89, etanol: 4.49, nome: 'Rio Grande do Sul' },
  RO: { gasolina: 6.09, etanol: 4.79, nome: 'Rondônia' },
  RR: { gasolina: 6.29, etanol: 5.09, nome: 'Roraima' },
  SC: { gasolina: 5.69, etanol: 4.19, nome: 'Santa Catarina' },
  SP: { gasolina: 5.89, etanol: 3.89, nome: 'São Paulo' },
  SE: { gasolina: 5.89, etanol: 4.29, nome: 'Sergipe' },
  TO: { gasolina: 5.99, etanol: 4.59, nome: 'Tocantins' },
};

/**
 * Obtém a localização do usuário via browser Geolocation API.
 * Retorna { lat, lon } ou lança um erro com código GeolocationPositionError.
 */
export function getUserCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada pelo browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 10000, maximumAge: 300000 }
    );
  });
}

/**
 * Converte coordenadas em UF usando Nominatim (OpenStreetMap).
 * Nota: browsers não podem enviar o header User-Agent (é proibido),
 * então usamos o parâmetro ?email= para identificação conforme política da OSM.
 * Lança erro se a chamada falhar, retorna null se não encontrar o estado.
 */
export async function coordsToState(lat, lon) {
  // Nominatim public API — sem User-Agent (bloqueado pelo browser),
  // usando email no parâmetro para identificação conforme usage policy da OSM
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${lat}&lon=${lon}&format=json&accept-language=pt-BR&email=valeofreteapp@noreply.com`;

  const res = await fetch(url); // sem headers customizados — browser não permite User-Agent
  if (!res.ok) throw new Error(`Nominatim retornou status ${res.status}`);

  const data = await res.json();

  // Tentativa 1: campo ISO3166-2-lvl4 (ex: "BR-SP")
  const iso = data?.address?.['ISO3166-2-lvl4'] || '';
  const ufFromISO = iso.replace('BR-', '').toUpperCase();
  if (ANP_PRICES[ufFromISO]) return ufFromISO;

  // Tentativa 2: campo state_code direto (alguns resultados já retornam "SP")
  const stateCode = (data?.address?.state_code || '').toUpperCase();
  if (ANP_PRICES[stateCode]) return stateCode;

  // Tentativa 3: comparar pelo nome do estado
  const stateName = (data?.address?.state || '').toLowerCase();
  if (stateName) {
    const found = Object.entries(ANP_PRICES).find(([, v]) =>
      stateName.includes(v.nome.toLowerCase().split(' ')[0])
    );
    if (found) return found[0];
  }

  return null; // estado não identificado, mas sem erro de rede
}

/**
 * Pipeline completo: pega GPS → converte para UF → retorna preços ANP.
 * Lança erro descritivo em cada etapa para exibição clara na UI.
 */
export async function detectFuelPrices(onStep) {
  if (onStep) onStep('gps');
  const coords = await getUserCoords(); // pode lançar GeolocationPositionError

  if (onStep) onStep('nominatim');
  const uf = await coordsToState(coords.lat, coords.lon); // pode lançar NetworkError

  if (!uf) {
    // Geolocalização funcionou, mas o estado não foi identificado — retornar coords para fallback
    const err = new Error('Estado não identificado automaticamente.');
    err.coords = coords;
    throw err;
  }

  return { uf, ...ANP_PRICES[uf] };
}
