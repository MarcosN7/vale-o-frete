import { calcFuelCost, getVerdict, formatBRL, DEFAULT_THRESHOLDS } from '../utils';

export default function ResultDisplay({ valor, distancia, distanciaColeta, distanciaRota, paradas, custosExtras, settings, mode }) {
  if (!valor || !distancia || !settings?.consumoGasolina || !settings?.precoGasolina) return null;

  const thresholds = {
    bad: settings.thresholdBad ?? DEFAULT_THRESHOLDS.bad,
    ok: settings.thresholdOk ?? DEFAULT_THRESHOLDS.ok,
  };

  const gasResult = calcFuelCost(distancia, settings.consumoGasolina, settings.precoGasolina);
  const isFlex = settings.consumoEtanol > 0 && settings.precoEtanol > 0;
  const etaResult = isFlex
    ? calcFuelCost(distancia, settings.consumoEtanol, settings.precoEtanol)
    : null;

  let bestFuel = 'gasolina';
  let fuelCost = gasResult.custo;
  let fuelLitros = gasResult.litros;

  if (isFlex && etaResult && etaResult.custo < gasResult.custo) {
    bestFuel = 'etanol';
    fuelCost = etaResult.custo;
    fuelLitros = etaResult.litros;
  }

  const extras = custosExtras || 0;
  const lucro = valor - fuelCost - extras;
  const reaisPorKm = distancia > 0 ? lucro / distancia : 0;
  const reaisPorParada = paradas > 0 ? lucro / paradas : null;
  const verdict = getVerdict(reaisPorKm, thresholds);

  const coletaNum = parseFloat(distanciaColeta) || 0;
  const rotaNum = parseFloat(distanciaRota) || (distancia - coletaNum);

  const handleShare = async () => {
    const modeLabel = mode === 'ml' ? 'Mercado Livre Flex' : 'Lalamove / inDrive Fretes';
    const distDet = coletaNum > 0
      ? `📏 ${distancia.toFixed(1)} km total (${coletaNum.toFixed(1)} km coleta + ${rotaNum.toFixed(1)} km rota)`
      : `📏 ${distancia.toFixed(1)} km`;

    const text =
      `🚚 Vale o Frete? — ${modeLabel}\n` +
      `${distDet}${paradas ? ` • ${paradas} paradas` : ''}\n` +
      `💰 Valor: ${formatBRL(valor)}\n` +
      `⛽ Combust.: ${formatBRL(fuelCost)}\n` +
      `📊 Lucro: ${formatBRL(lucro)}\n` +
      `🏁 ${verdict.emoji} ${verdict.text} (${formatBRL(reaisPorKm)}/km)`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vale o Frete?', text });
      } catch { /* usuário cancelou */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Resultado copiado para a área de transferência!');
    }
  };

  return (
    <div>
      {/* Verdict */}
      <div className={`verdict-card ${verdict.color}`}>
        <div className="verdict-emoji">{verdict.emoji}</div>
        <div className="verdict-text">{verdict.text}</div>
        <div className="verdict-detail">{verdict.detail}</div>
        {coletaNum > 0 && (
          <div style={{ fontSize: '0.85rem', opacity: 0.95, marginTop: 4 }}>
            Considerando {coletaNum.toFixed(1)} km de deslocamento até a coleta
          </div>
        )}
        <button className="share-btn" onClick={handleShare}>
          📤 Compartilhar
        </button>
      </div>

      {/* Fuel comparison */}
      {isFlex && (
        <div className="fuel-comparison">
          <h4>⛽ Comparação de Combustível</h4>
          <div className={`fuel-option ${bestFuel === 'gasolina' ? 'best' : ''}`}>
            <span className="fuel-name">
              Gasolina ({gasResult.litros.toFixed(1)}L)
              {bestFuel === 'gasolina' && <span className="badge">MELHOR</span>}
            </span>
            <span className="fuel-cost">{formatBRL(gasResult.custo)}</span>
          </div>
          <div className={`fuel-option ${bestFuel === 'etanol' ? 'best' : ''}`}>
            <span className="fuel-name">
              Etanol ({etaResult.litros.toFixed(1)}L)
              {bestFuel === 'etanol' && <span className="badge">MELHOR</span>}
            </span>
            <span className="fuel-cost">{formatBRL(etaResult.custo)}</span>
          </div>
        </div>
      )}

      {/* Result grid */}
      <div className="result-grid">
        <div className="result-item">
          <div className="label">💰 Valor Oferecido</div>
          <div className="value">{formatBRL(valor)}</div>
        </div>
        <div className="result-item">
          <div className="label">⛽ Custo Combust.</div>
          <div className="value negative">{formatBRL(fuelCost)}</div>
        </div>
        {extras > 0 && (
          <div className="result-item">
            <div className="label">🛣️ Custos Extras</div>
            <div className="value negative">{formatBRL(extras)}</div>
          </div>
        )}
        <div className="result-item">
          <div className="label">📊 Lucro Líquido</div>
          <div className={`value ${lucro >= 0 ? 'positive' : 'negative'}`}>
            {formatBRL(lucro)}
          </div>
        </div>
        <div className="result-item">
          <div className="label">📏 R$/km Líquido Real</div>
          <div className={`value ${reaisPorKm >= 0 ? 'positive' : 'negative'}`}>
            R$ {reaisPorKm.toFixed(2)}
          </div>
        </div>
        {reaisPorParada !== null && (
          <div className="result-item">
            <div className="label">📦 R$/Parada</div>
            <div className={`value ${reaisPorParada >= 0 ? 'positive' : 'negative'}`}>
              {formatBRL(reaisPorParada)}
            </div>
          </div>
        )}
        <div className="result-item">
          <div className="label">🔥 Litros Usados</div>
          <div className="value">{fuelLitros.toFixed(1)}L</div>
        </div>
        <div className="result-item">
          <div className="label">🏁 Km Total Rodado</div>
          <div className="value">{distancia.toFixed(1)} km</div>
          {coletaNum > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {coletaNum.toFixed(1)}km coleta + {rotaNum.toFixed(1)}km rota
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function getCalcData(valor, distancia, paradas, custosExtras, settings) {
  if (!valor || !distancia || !settings?.consumoGasolina || !settings?.precoGasolina) return null;
  const gasResult = calcFuelCost(distancia, settings.consumoGasolina, settings.precoGasolina);
  const isFlex = settings.consumoEtanol > 0 && settings.precoEtanol > 0;
  const etaResult = isFlex ? calcFuelCost(distancia, settings.consumoEtanol, settings.precoEtanol) : null;
  let fuelCost = gasResult.custo;
  if (isFlex && etaResult && etaResult.custo < gasResult.custo) fuelCost = etaResult.custo;
  const extras = custosExtras || 0;
  const lucro = valor - fuelCost - extras;
  return { lucro };
}
