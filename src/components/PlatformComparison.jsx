import { formatBRL, formatPercent, comparePlatforms, DEFAULT_PLATFORMS } from '../utils';

export default function PlatformComparison({ valorFrete, distanciaTotal, custoTotal, platforms = DEFAULT_PLATFORMS, onSelectPlatform, onClose, onOpenPlatformSettings, pending = false }) {
  const { bestPlatform, comparisons } = comparePlatforms({ valorFrete, distanciaTotal, custoTotal, platforms });
  if (!comparisons?.length) return null;
  return (
    <section className="comparison-section" aria-labelledby="comparison-title">
      <div className="section-heading">
        <div><h2 id="comparison-title">Compare entre as principais plataformas</h2><p>{pending ? "Calcule uma corrida para comparar o lucro em cada plataforma." : `Mesmo frete de ${formatBRL(valorFrete)}, mesmas despesas. Veja o efeito das taxas.`}</p></div>
        <div className="comparison-actions">
          {onOpenPlatformSettings && <button className="text-button" type="button" onClick={onOpenPlatformSettings}>Ver detalhes das taxas <span aria-hidden="true">→</span></button>}
          {onClose && <button className="text-button comparison-close" type="button" onClick={onClose}>Fechar comparação</button>}
        </div>
      </div>
      {!pending && bestPlatform && <p className="comparison-summary">Maior resultado: <strong>{bestPlatform.platformName}</strong> · <strong className={bestPlatform.lucro >= 0 ? 'positive' : 'negative'}>{formatBRL(bestPlatform.lucro)}</strong> de lucro real ({formatPercent(bestPlatform.margem)} de margem).</p>}
      <p className="table-hint" id="table-hint">Deslize a tabela para ver todos os indicadores.</p>
      <div className="table-scroll" role="region" aria-label="Resultados por plataforma" aria-describedby="table-hint" tabIndex={0}>
        <table className="comparison-table">
          <caption className="sr-only">Comparação das taxas e do lucro para o mesmo frete</caption>
          <thead><tr><th scope="col">Plataforma</th><th scope="col">Taxas</th><th scope="col">Receita líquida</th><th scope="col">Lucro real</th><th scope="col">Lucro / km</th><th scope="col">Diferença para o maior</th>{onSelectPlatform && <th scope="col"><span className="sr-only">Selecionar plataforma</span></th>}</tr></thead>
          <tbody>{comparisons.map(item => {
            const platform = platforms.find(platform => platform.id === item.platformId);
            const configuredFee = platform.feeType === 'sem_taxa' ? 'Sem taxa'
              : platform.feeType === 'percentage' ? formatPercent(platform.percentage)
              : platform.feeType === 'fixed' ? `${formatBRL(platform.fixedFee)} / frete`
              : 'Personalizada';
            return (
            <tr key={item.platformId} className={!pending && item.isBest ? 'best-row' : ''}>
              <th scope="row">{item.platformName}{!pending && item.isBest && <small>Maior resultado</small>}</th>
              <td>{pending ? configuredFee : formatBRL(item.totalFees)}{!pending && <small>{formatPercent(item.effectiveRate)} efetivo</small>}</td>
              <td>{pending ? '—' : formatBRL(item.netRevenue)}</td>
              <td className={pending ? '' : item.lucro >= 0 ? 'positive' : 'negative'}><strong>{pending ? '—' : formatBRL(item.lucro)}</strong></td>
              <td className={pending ? '' : item.lucroPorKm >= 0 ? 'positive' : 'negative'}>{pending ? '—' : formatBRL(item.lucroPorKm)}</td>
              <td>{pending || item.isBest ? '—' : `− ${formatBRL(item.diffFromBest)}`}</td>
              {onSelectPlatform && <td><button type="button" className="table-select" aria-label={`Usar ${item.platformName} no cálculo`} onClick={() => onSelectPlatform(item.platformId)}>Usar</button></td>}
            </tr>
          ); })}</tbody>
        </table>
      </div>
    </section>
  );
}
