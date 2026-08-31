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

  // Renderização para ModoFreteGeral (Viagens)
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

    // Proporções para a barra de custos
    const totalCostForBar = custoTotal > 0 ? custoTotal : 1;
    const pFuel = ((fuelCost / totalCostForBar) * 100).toFixed(1);
    const pTolls = (((pedagios || 0) / totalCostForBar) * 100).toFixed(1);
    const pMaint = ((custoManutencao / totalCostForBar) * 100).toFixed(1);
    const pTires = ((custoPneus / totalCostForBar) * 100).toFixed(1);
    const pDeprec = ((custoDepreciacao / totalCostForBar) * 100).toFixed(1);
    const pExtras = (((custosExtras || 0) + custoOutrosKm) / totalCostForBar * 100).toFixed(1);

    const handleShareFreight = async () => {
      const rotaStr = origem || destino ? `\n📍 ${origem || 'Origem'} ➔ ${destino || 'Destino'}` : '';
      const retornoStr = isRetornoVazio ? ' (com Retorno Vazio)' : '';
      const text =
        `🚚 Vale o Frete? — Análise de Viagem${rotaStr}\n` +
        `📏 Distância: ${formatKm(distancia)}${retornoStr}\n` +
        `💰 Frete: ${formatBRL(valor)}\n` +
        `📉 Custos Estimados: ${formatBRL(custoTotal)}\n` +
        `💵 Lucro Líquido: ${formatBRL(lucro)} (${formatPercent(margem)})\n` +
        `📊 Receita: ${formatBRL(receitaPorKm)}/km | Custo: ${formatBRL(custoPorKm)}/km\n` +
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
      <div className="result-card-container">
        {/* Card do Veredito Principal */}
        <div className={`verdict-hero-card ${verdict.status}`}>
          <div className="verdict-badge">
            <span>{verdict.emoji}</span>
            <span>{verdict.title}</span>
          </div>

          <div className="verdict-profit-label">Seu Lucro Estimado</div>
          <div className={`verdict-profit-value ${lucro >= 0 ? 'positive' : 'negative'}`}>
            {formatBRL(lucro)}
          </div>
          <div className="verdict-rate-sub">
            {formatBRL(lucroPorKm)} de lucro líquido por km rodado
          </div>

          <p className="verdict-explanation">
            {verdict.message}
          </p>

          {isRetornoVazio && (
            <div className="retorno-badge-alert" style={{ marginTop: 8 }}>
              ⚠️ Distância total de {formatKm(distancia)} computando ida + retorno vazio sem receita.
            </div>
          )}

          <button type="button" className="share-btn" onClick={handleShareFreight}>
            📤 Compartilhar Análise no WhatsApp
          </button>
        </div>

        {/* 4 Indicadores Chave em Grade 2x2 */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Lucro Estimado</span>
            <span className={`kpi-value ${lucro >= 0 ? 'positive' : 'negative'}`}>
              {formatBRL(lucro)}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Margem Líquida</span>
            <span className={`kpi-value ${margem >= 20 ? 'positive' : margem > 8 ? 'warning' : 'negative'}`}>
              {formatPercent(margem)}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Receita por Km</span>
            <span className="kpi-value">
              {formatBRL(receitaPorKm)}/km
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Custo por Km</span>
            <span className="kpi-value negative">
              {formatBRL(custoPorKm)}/km
            </span>
          </div>
        </div>

        {/* Distribuição Visual de Custos */}
        <div className="cost-breakdown-card">
          <div className="cost-breakdown-title">
            <span>Para onde vai o dinheiro</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatBRL(custoTotal)} total</span>
          </div>

          {/* Barra Proporcional */}
          <div className="cost-progress-bar">
            {pFuel > 0 && <div className="cost-progress-segment combustivel" style={{ width: `${pFuel}%` }} title={`Combustível: ${pFuel}%`} />}
            {pTolls > 0 && <div className="cost-progress-segment pedagio" style={{ width: `${pTolls}%` }} title={`Pedágio: ${pTolls}%`} />}
            {pMaint > 0 && <div className="cost-progress-segment manutencao" style={{ width: `${pMaint}%` }} title={`Manutenção: ${pMaint}%`} />}
            {pTires > 0 && <div className="cost-progress-segment pneus" style={{ width: `${pTires}%` }} title={`Pneus: ${pTires}%`} />}
            {pDeprec > 0 && <div className="cost-progress-segment depreciacao" style={{ width: `${pDeprec}%` }} title={`Depreciação: ${pDeprec}%`} />}
            {pExtras > 0 && <div className="cost-progress-segment extras" style={{ width: `${pExtras}%` }} title={`Extras: ${pExtras}%`} />}
          </div>

          {/* Lista de Composição dos Custos */}
          <div className="cost-list">
            <div className="cost-list-item">
              <div className="cost-list-left">
                <span className="cost-dot combustivel" />
                <span>Combustível ({fuelLitros.toFixed(1)}L)</span>
              </div>
              <span className="cost-list-value">{formatBRL(fuelCost)}</span>
            </div>

            {pedagios > 0 && (
              <div className="cost-list-item">
                <div className="cost-list-left">
                  <span className="cost-dot pedagio" />
                  <span>Pedágios</span>
                </div>
                <span className="cost-list-value">{formatBRL(pedagios)}</span>
              </div>
            )}

            {custoManutencao > 0 && (
              <div className="cost-list-item">
                <div className="cost-list-left">
                  <span className="cost-dot manutencao" />
                  <span>Manutenção ({formatKm(distancia)})</span>
                </div>
                <span className="cost-list-value">{formatBRL(custoManutencao)}</span>
              </div>
            )}

            {custoPneus > 0 && (
              <div className="cost-list-item">
                <div className="cost-list-left">
                  <span className="cost-dot pneus" />
                  <span>Desgaste de Pneus</span>
                </div>
                <span className="cost-list-value">{formatBRL(custoPneus)}</span>
              </div>
            )}

            {custoDepreciacao > 0 && (
              <div className="cost-list-item">
                <div className="cost-list-left">
                  <span className="cost-dot depreciacao" />
                  <span>Depreciação do Veículo</span>
                </div>
                <span className="cost-list-value">{formatBRL(custoDepreciacao)}</span>
              </div>
            )}

            {(custosExtras > 0 || custoOutrosKm > 0) && (
              <div className="cost-list-item">
                <div className="cost-list-left">
                  <span className="cost-dot extras" />
                  <span>Alimentação / Diárias / Outros</span>
                </div>
                <span className="cost-list-value">{formatBRL((custosExtras || 0) + custoOutrosKm)}</span>
              </div>
            )}
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
  const margem = valor > 0 ? (lucro / valor) * 100 : 0;
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
      `📊 Lucro: ${formatBRL(lucro)} (${formatPercent(margem)})\n` +
      `🏁 ${verdict.emoji} ${verdict.text} (${formatBRL(reaisPorKm)}/km)`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vale o Frete?', text });
      } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Resultado copiado para a área de transferência!');
    }
  };

  return (
    <div className="result-card-container">
      <div className={`verdict-hero-card ${verdict.color === 'green' ? 'good' : verdict.color === 'yellow' ? 'warning' : 'bad'}`}>
        <div className="verdict-badge">
          <span>{verdict.emoji}</span>
          <span>{verdict.text}</span>
        </div>
        <div className="verdict-profit-label">Lucro Líquido Estimado</div>
        <div className={`verdict-profit-value ${lucro >= 0 ? 'positive' : 'negative'}`}>
          {formatBRL(lucro)}
        </div>
        <div className="verdict-rate-sub">
          {formatBRL(reaisPorKm)} líquido por km
        </div>
        {coletaNum > 0 && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Considerando {coletaNum.toFixed(1)} km de deslocamento até a coleta
          </div>
        )}
        <button type="button" className="share-btn" onClick={handleShare}>
          📤 Compartilhar no WhatsApp
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Valor Oferecido</span>
          <span className="kpi-value">{formatBRL(valor)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Custo Combustível</span>
          <span className="kpi-value negative">{formatBRL(fuelCost)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">R$/km Líquido</span>
          <span className={`kpi-value ${reaisPorKm >= 0 ? 'positive' : 'negative'}`}>
            {formatBRL(reaisPorKm)}/km
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Distância Total</span>
          <span className="kpi-value">{formatKm(distancia)}</span>
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
