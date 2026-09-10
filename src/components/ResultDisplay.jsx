import {
  calcFuelCost,
  getVerdict,
  formatBRL,
  formatKm,
  formatPercent,
  DEFAULT_THRESHOLDS,
} from '../utils';

export function ResultPlaceholder() {
  return (
    <section className="result-card-container result-placeholder" aria-labelledby="pending-result-title">
      <div className="result-heading"><h2 id="pending-result-title">Resultado da corrida</h2><p>Veja quanto realmente sobra no seu bolso.</p></div>
      <div className="verdict-hero-card profit-positive">
        <div className="verdict-profit-label">Lucro real</div>
        <div className="verdict-profit-value positive">R$ —</div>
        <p className="verdict-explanation">Preencha a corrida e calcule para ver seu lucro.</p>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card"><span className="kpi-label">Custo total da viagem</span><strong className="kpi-value">R$ —</strong></div>
        <div className="kpi-card"><span className="kpi-label">Lucro por km</span><strong className="kpi-value">R$ —</strong></div>
      </div>
      <div className="cost-breakdown-card"><h3 className="cost-breakdown-title">Detalhamento dos custos</h3><div className="cost-list">
        {['Combustível', 'Taxa da plataforma', 'Pedágios', 'Outros custos'].map(label => <div className="cost-list-item" key={label}><span>{label}</span><span>—</span></div>)}
      </div></div>
      <p className="result-footnote">O resultado considera os dados informados e as configurações do seu veículo.</p>
    </section>
  );
}

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
  platformData,
  onOpenComparison,
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
      platformFeeResult,
    } = financials;

    const totalPlatformFee = platformFeeResult?.totalPlatformFee || 0;
    const netRevenue = platformFeeResult?.netRevenue ?? (valor - totalPlatformFee);
    const effectiveRate = platformFeeResult?.effectiveRate ?? (valor > 0 ? (totalPlatformFee / valor) * 100 : 0);

    // Proporções para a barra de custos
    const totalCostForBar = custoTotal > 0 ? custoTotal : 1;
    const pFuel = ((fuelCost / totalCostForBar) * 100).toFixed(1);
    const pTolls = (((pedagios || 0) / totalCostForBar) * 100).toFixed(1);
    const pMaint = ((custoManutencao / totalCostForBar) * 100).toFixed(1);
    const pTires = ((custoPneus / totalCostForBar) * 100).toFixed(1);
    const pDeprec = ((custoDepreciacao / totalCostForBar) * 100).toFixed(1);
    const pExtras = (((custosExtras || 0) + custoOutrosKm) / totalCostForBar * 100).toFixed(1);

    const handleShareFreight = async () => {
      const rotaStr = origem || destino ? `\n ${origem || 'Origem'} ➔ ${destino || 'Destino'}` : '';
      const retornoStr = isRetornoVazio ? ' (com Retorno Vazio)' : '';
      const platStr = platformData?.name ? `\n Plataforma: ${platformData.name} (-${formatBRL(totalPlatformFee)} / ${formatPercent(effectiveRate)})` : '';
      const text =
        ` Vale o Frete? — Análise de Viagem${rotaStr}${platStr}\n` +
        ` Distância: ${formatKm(distancia)}${retornoStr}\n` +
        ` Frete Bruto: ${formatBRL(valor)}\n` +
        ` Receita Líquida: ${formatBRL(netRevenue)}\n` +
        ` Custos da Viagem: ${formatBRL(custoTotal)}\n` +
        ` Lucro Real: ${formatBRL(lucro)} (${formatPercent(margem)})\n` +
        ` Lucro/km: ${formatBRL(lucroPorKm)}/km | Custo: ${formatBRL(custoPorKm)}/km\n` +
        ` ${verdict.emoji} ${verdict.title} — ${verdict.message}`;

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
      <div className="result-card-container" aria-live="polite">
        <div className="result-heading"><h2>Resultado da corrida</h2><p>Veja quanto realmente sobra no seu bolso.</p></div>
        {/* Card do Veredito Principal */}
        <div className={`verdict-hero-card ${verdict.status} ${lucro >= 0 ? 'profit-positive' : 'profit-negative'}`}>
          <div className="verdict-badge">

            <span>{verdict.title}</span>
          </div>

          <div className="verdict-profit-label">Lucro real estimado</div>
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
               Distância total de {formatKm(distancia)} computando ida + retorno vazio sem receita.
            </div>
          )}

          <div className="result-actions">
            <button type="button" className="share-btn" style={{ flex: 1, marginTop: 0 }} onClick={handleShareFreight}>
               Compartilhar no WhatsApp
            </button>
            {onOpenComparison && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '10px 14px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', borderColor: 'var(--primary-border)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={onOpenComparison}
                title="Comparar resultado em todas as plataformas"
              >

                <span>Comparar Plataformas</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Indicadores Chave em Grade 2x2 */}
        <div className="kpi-grid financial-kpis">
          <div className="kpi-card">
            <span className="kpi-label">Lucro por km</span>
            <span className={`kpi-value ${lucro >= 0 ? 'positive' : 'negative'}`}>
              {formatBRL(lucroPorKm)}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Margem Líquida</span>
            <span className={`kpi-value ${margem >= 20 ? 'positive' : margem > 8 ? 'warning' : 'negative'}`}>
              {formatPercent(margem)}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Receita Líquida</span>
            <span className="kpi-value">
              {formatBRL(netRevenue)}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Custo total da viagem</span>
            <span className="kpi-value negative">
              {formatBRL(custoTotal)}
            </span>
          </div>
        </div>

        {/* Resumo Financeiro: Frete Bruto -> Plataforma -> Custos -> Lucro Real */}
        <details className="financial-details">
          <summary>
            <span>Fluxo Financeiro do Frete</span>
          </summary>

          <div className="cost-list">
            <div className="cost-list-item">
              <span style={{ color: 'var(--text-secondary)' }}> Frete Bruto</span>
              <strong style={{ color: 'var(--brand-dark)' }}>{formatBRL(valor)}</strong>
            </div>

            {totalPlatformFee > 0 && (
              <div className="cost-list-item">
                <span style={{ color: 'var(--danger-text)' }}>
                   Taxas da Plataforma ({platformData?.name || 'Intermediação'})
                </span>
                <strong style={{ color: 'var(--danger-text)' }}>- {formatBRL(totalPlatformFee)}</strong>
              </div>
            )}

            <div className="cost-list-item" style={{ borderTop: '1px dashed var(--border)', paddingTop: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}> Receita Após Plataforma</span>
              <strong style={{ color: 'var(--primary)' }}>{formatBRL(netRevenue)}</strong>
            </div>

            <div className="cost-list-item">
              <span style={{ color: 'var(--text-secondary)' }}> Custos Operacionais da Viagem</span>
              <strong style={{ color: 'var(--danger-text)' }}>- {formatBRL(custoTotal)}</strong>
            </div>

            <div className="cost-list-item" style={{ borderTop: '1.5px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--brand-dark)' }}> LUCRO REAL LÍQUIDO</span>
              <strong style={{ fontSize: '1.1rem', color: lucro >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatBRL(lucro)}
              </strong>
            </div>
          </div>
        </details>

        {/* Detalhamento das Taxas da Plataforma */}
        {platformData && platformData.feeType !== 'sem_taxa' && (
          <details className="financial-details">
            <summary>
              <span> Detalhamento da Plataforma: {platformData.name}</span>
            </summary>

            <div className="cost-list" style={{ fontSize: '0.85rem' }}>
              {platformFeeResult?.commissionFee > 0 && (
                <div className="cost-list-item">
                  <span style={{ color: 'var(--text-secondary)' }}>Comissão ({platformData.percentage}%)</span>
                  <span className="cost-list-value">{formatBRL(platformFeeResult.commissionFee)}</span>
                </div>
              )}
              {platformFeeResult?.fixedFee > 0 && (
                <div className="cost-list-item">
                  <span style={{ color: 'var(--text-secondary)' }}>Taxa Fixa por Frete</span>
                  <span className="cost-list-value">{formatBRL(platformFeeResult.fixedFee)}</span>
                </div>
              )}
              {platformFeeResult?.periodFee > 0 && (
                <div className="cost-list-item">
                  <span style={{ color: 'var(--text-secondary)' }}>Taxa de Acesso / Período</span>
                  <span className="cost-list-value">{formatBRL(platformFeeResult.periodFee)}</span>
                </div>
              )}
              <div className="cost-list-item" style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--brand-dark)' }}>Custo Efetivo da Plataforma</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                  {formatPercent(effectiveRate)} da receita bruta
                </span>
              </div>
            </div>
          </details>
        )}

        {/* Distribuição Visual de Custos da Viagem */}
        <div className="cost-breakdown-card">
          <div className="cost-breakdown-title">
            <span>Para onde vai o dinheiro da viagem</span>
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

  let fuelCost = gasResult.custo;
  let fuelLitros = gasResult.litros;

  if (isFlex && etaResult && etaResult.custo < gasResult.custo) {
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
      ? ` ${distancia.toFixed(1)} km total (${coletaNum.toFixed(1)} km coleta + ${rotaNum.toFixed(1)} km rota)`
      : ` ${distancia.toFixed(1)} km`;

    const text =
      ` Vale o Frete? — ${modeLabel}\n` +
      `${distDet}${paradas ? ` • ${paradas} paradas` : ''}\n` +
      ` Valor: ${formatBRL(valor)}\n` +
      ` Combust.: ${formatBRL(fuelCost)}\n` +
      ` Lucro: ${formatBRL(lucro)} (${formatPercent(margem)})\n` +
      ` ${verdict.emoji} ${verdict.text} (${formatBRL(reaisPorKm)}/km)`;

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
    <div className="result-card-container" aria-live="polite">
      <div className="result-heading"><h2>Resultado da corrida</h2><p>Veja quanto realmente sobra no seu bolso.</p></div>
      <div className={`verdict-hero-card ${verdict.color === 'green' ? 'good' : verdict.color === 'yellow' ? 'warning' : 'bad'} ${lucro >= 0 ? 'profit-positive' : 'profit-negative'}`}>
        <div className="verdict-badge">

          <span>{verdict.text}</span>
        </div>
        <div className="verdict-profit-label">Lucro real estimado</div>
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
           Compartilhar no WhatsApp
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
      <div className="cost-breakdown-card">
        <h3 className="cost-breakdown-title">Detalhamento dos custos</h3>
        <div className="cost-list">
          <div className="cost-list-item"><span>Combustível ({fuelLitros.toFixed(1)} L)</span><strong>{formatBRL(fuelCost)}</strong></div>
          <div className="cost-list-item"><span>Pedágios e outros custos</span><strong>{formatBRL(extras)}</strong></div>
          <div className="cost-list-item"><strong>Custo total</strong><strong>{formatBRL(fuelCost + extras)}</strong></div>
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
