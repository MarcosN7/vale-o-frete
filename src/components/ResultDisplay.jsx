import {
  calcFuelCost,
  getVerdict,
  formatBRL,
  formatKm,
  formatPercent,
  DEFAULT_THRESHOLDS,
} from '../utils';

export default function ResultDisplay({
  valor,
  distancia,
  distanciaColeta,
  distanciaRota,
  distanciaIda,
  distanciaRetorno,
  isRetornoVazio,
  origem,
  destino,
  paradas,
  custosExtras,
  pedagios,
  settings,
  mode,
  financials,
}) {
  if (!valor || !distancia) return null;

  // Se financials foi fornecido diretamente pelo ModoFreteGeral
  if (financials) {
    const {
      fuelCost,
      fuelLitros,
      custoManutencao = 0,
      custoPneus = 0,
      custoDepreciacao = 0,
      custoOutrosKm = 0,
      custoTotal,
      lucro,
      receitaPorKm,
      custoPorKm,
      lucroPorKm,
      margem,
      verdict,
    } = financials;

    const handleShareFreight = async () => {
      const rotaStr = origem || destino ? `\n📍 ${origem || 'Origem'} ➔ ${destino || 'Destino'}` : '';
      const retornoStr = isRetornoVazio ? ' (Ida + Retorno Vazio)' : '';
      const text =
        `🚚 Vale o Frete? — Análise de Viagem${rotaStr}\n` +
        `📏 Distância: ${formatKm(distancia)}${retornoStr}\n` +
        `💰 Frete Bruto: ${formatBRL(valor)}\n` +
        `📉 Custos Totais: ${formatBRL(custoTotal)}\n` +
        `💵 Lucro Estimado: ${formatBRL(lucro)} (${formatPercent(margem)})\n` +
        `📊 Receita/km: ${formatBRL(receitaPorKm)}/km | Custo/km: ${formatBRL(custoPorKm)}/km\n` +
        `🏁 ${verdict.emoji} ${verdict.title} — ${verdict.message}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'Vale o Frete? — Análise', text });
        } catch { /* cancelado */ }
      } else {
        await navigator.clipboard.writeText(text);
        alert('Resumo da análise copiado para a área de transferência!');
      }
    };

    return (
      <div>
        {/* Card do Veredito Principal */}
        <div className={`verdict-card ${verdict.color}`}>
          <div className="verdict-emoji">{verdict.emoji}</div>
          <div className="verdict-text">{verdict.title}</div>
          <div className="verdict-detail" style={{ fontSize: '1rem', marginTop: 4, opacity: 0.95 }}>
            {verdict.message}
          </div>
          {isRetornoVazio && (
            <div style={{ fontSize: '0.82rem', marginTop: 6, background: 'rgba(0,0,0,0.15)', padding: '4px 10px', borderRadius: 6, display: 'inline-block' }}>
              ⚠️ Cálculo considerando o retorno vazio ({formatKm(distanciaRetorno || distanciaIda)}) sem receita
            </div>
          )}
          <button type="button" className="share-btn" onClick={handleShareFreight}>
            📤 Compartilhar Análise
          </button>
        </div>

        {/* 4 Métricas de Alto Destaque */}
        <div className="result-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          <div className="result-item" style={{ borderLeft: `4px solid ${lucro >= 0 ? 'var(--green)' : 'var(--red)'}` }}>
            <div className="label">💵 Lucro Estimado</div>
            <div className={`value ${lucro >= 0 ? 'positive' : 'negative'}`}>
              {formatBRL(lucro)}
            </div>
          </div>
          <div className="result-item" style={{ borderLeft: `4px solid ${margem >= 15 ? 'var(--green)' : margem > 0 ? 'var(--yellow)' : 'var(--red)'}` }}>
            <div className="label">📈 Margem Líquida</div>
            <div className={`value ${margem >= 15 ? 'positive' : margem > 0 ? 'warning' : 'negative'}`}>
              {formatPercent(margem)}
            </div>
          </div>
          <div className="result-item">
            <div className="label">📏 Receita por Km</div>
            <div className="value">
              {formatBRL(receitaPorKm)}/km
            </div>
          </div>
          <div className="result-item">
            <div className="label">⛽ Custo por Km</div>
            <div className="value negative">
              {formatBRL(custoPorKm)}/km
            </div>
          </div>
        </div>

        {/* Detalhamento de Custos da Viagem */}
        <div className="card" style={{ marginTop: 12 }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
            📋 Composição de Custos e Receitas
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
              <span>💰 Valor Bruto do Frete</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatBRL(valor)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b' }}>
              <span>⛽ Combustível ({fuelLitros.toFixed(1)}L)</span>
              <span style={{ fontWeight: 600 }}>- {formatBRL(fuelCost)}</span>
            </div>
            {pedagios > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b' }}>
                <span>🛣️ Pedágios</span>
                <span style={{ fontWeight: 600 }}>- {formatBRL(pedagios)}</span>
              </div>
            )}
            {custoManutencao > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b' }}>
                <span>🔧 Manutenção / Revisão</span>
                <span style={{ fontWeight: 600 }}>- {formatBRL(custoManutencao)}</span>
              </div>
            )}
            {custoPneus > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b' }}>
                <span>🛞 Desgaste de Pneus</span>
                <span style={{ fontWeight: 600 }}>- {formatBRL(custoPneus)}</span>
              </div>
            )}
            {custoDepreciacao > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b' }}>
                <span>📉 Depreciação do Veículo</span>
                <span style={{ fontWeight: 600 }}>- {formatBRL(custoDepreciacao)}</span>
              </div>
            )}
            {custoOutrosKm > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b' }}>
                <span>🛢️ Outros Custos por Km</span>
                <span style={{ fontWeight: 600 }}>- {formatBRL(custoOutrosKm)}</span>
              </div>
            )}
            {custosExtras > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#991b1b' }}>
                <span>🍲 Alimentação / Hospedagem / Extras</span>
                <span style={{ fontWeight: 600 }}>- {formatBRL(custosExtras)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTop: '2px solid var(--border)', fontWeight: 800 }}>
              <span>📉 Total de Custos Estimados</span>
              <span style={{ color: 'var(--red)' }}>- {formatBRL(custoTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontWeight: 800, fontSize: '1.05rem' }}>
              <span>💵 Lucro Líquido Real</span>
              <span style={{ color: lucro >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatBRL(lucro)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback para os modos legados (ML Flex e LalaMove)
  const thresholds = {
    bad: settings?.thresholdBad ?? DEFAULT_THRESHOLDS.bad,
    ok: settings?.thresholdOk ?? DEFAULT_THRESHOLDS.ok,
  };

  const gasResult = calcFuelCost(distancia, settings?.consumoGasolina || settings?.consumoCombustivel || 10, settings?.precoGasolina || 5.89);
  const isFlex = settings?.consumoEtanol > 0 && settings?.precoEtanol > 0;
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
        <button type="button" className="share-btn" onClick={handleShare}>
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
            {formatBRL(reaisPorKm)}/km
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
