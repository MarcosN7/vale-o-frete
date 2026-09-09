import { formatBRL, formatPercent, comparePlatforms } from '../utils';

export default function PlatformComparison({
  valorFrete,
  distanciaTotal,
  custoTotal,
  platforms,
  onSelectPlatform,
  onClose,
}) {
  const { bestPlatform, comparisons } = comparePlatforms({
    valorFrete,
    distanciaTotal,
    custoTotal,
    platforms,
  });

  if (!comparisons || comparisons.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 20, border: '2px solid var(--primary-border)', background: '#fafcff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📊</span>
            <span>Comparador de Plataformas</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Descubra onde sobra mais dinheiro para o mesmo frete de {formatBRL(valorFrete)}
          </p>
        </div>
        {onClose && (
          <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={onClose}>
            ✕ Fechar
          </button>
        )}
      </div>

      {/* Destaque do Melhor Resultado */}
      {bestPlatform && (
        <div style={{ background: 'var(--success-bg)', border: '1.5px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--success-text)' }}>
              Melhor opção: {bestPlatform.platformName}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--success-text)', margin: 0 }}>
            Lucro real de <strong>{formatBRL(bestPlatform.lucro)}</strong> ({formatPercent(bestPlatform.margem)} de margem).
          </p>
        </div>
      )}

      {/* Lista / Cards de Comparação */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {comparisons.map((item, index) => {
          const isWinner = item.isBest;

          return (
            <div
              key={item.platformId}
              className="card"
              style={{
                padding: 14,
                marginBottom: 0,
                border: isWinner ? '2px solid var(--success)' : '1px solid var(--border)',
                background: isWinner ? '#ffffff' : 'var(--surface)',
                boxShadow: isWinner ? 'var(--shadow-md)' : 'var(--shadow-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.3rem' }}>{item.platformIcon}</span>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-dark)' }}>
                      {item.platformName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Taxas: <strong>{formatBRL(item.totalFees)}</strong> ({formatPercent(item.effectiveRate)} efetivo)
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: item.lucro >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {formatBRL(item.lucro)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {formatBRL(item.lucroPorKm)}/km
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>Receita líquida: <strong>{formatBRL(item.netRevenue)}</strong></span>
                {isWinner ? (
                  <span style={{ color: 'var(--success-text)', fontWeight: 800 }}>
                    🥇 Maior rentabilidade
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    -{formatBRL(item.diffFromBest)} em relação ao líder
                  </span>
                )}
              </div>

              {onSelectPlatform && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', marginTop: 8, padding: '6px', fontSize: '0.78rem', fontWeight: 700 }}
                  onClick={() => onSelectPlatform(item.platformId)}
                >
                  Usar {item.platformName} no cálculo
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

