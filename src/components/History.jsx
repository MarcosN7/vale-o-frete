import { formatBRL, formatKm, formatPercent, exportHistoryCSV } from '../utils';

export default function History({ history, onClear, onSelectEntry, onDeleteItem, onStartFirstCalc }) {
  const totalKm = history.reduce((sum, h) => sum + (h.distancia || 0), 0);
  const totalLucro = history.reduce((sum, h) => sum + (h.lucro || 0), 0);
  const totalFretes = history.reduce((sum, h) => sum + (h.valor || 0), 0);

  return (
    <div className="history-section" id="historico">
      <div className="history-header">
        <h3>
          <span>Meus Fretes</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ({history.length} {history.length === 1 ? 'registro' : 'registros'})
          </span>
        </h3>
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={() => exportHistoryCSV(history)}
              title="Exportar dados para planilha CSV"
            >
              <span>📥</span>
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              className="btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={onClear}
            >
              Limpar
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">🚛</div>
          <h4>Você ainda não analisou nenhum frete</h4>
          <p>
            Calcule seu primeiro frete acima para começar a acompanhar sua rentabilidade e custos por km.
          </p>
          {onStartFirstCalc && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              onClick={onStartFirstCalc}
            >
              ⚡ Começar primeiro cálculo
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="history-list">
            {history.map((item) => {
              const isFrete = item.mode === 'frete';
              const modoLabel = item.mode === 'ml'
                ? '📦 Mercado Livre'
                : item.mode === 'lalamove'
                ? '🏍️ LalaMove / inDrive'
                : '🚛 Viagem de Carga';

              return (
                <div key={item.id} className="history-card-item">
                  <div className="hi-top-row">
                    <div>
                      <span className="hi-mode-badge">{modoLabel}</span>
                      <h4 className="hi-route-title">
                        {isFrete && (item.origem || item.destino)
                          ? `${item.origem || 'Origem'} ➔ ${item.destino || 'Destino'}`
                          : `Frete de ${formatBRL(item.valor)}`
                        }
                      </h4>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className={`hi-profit-badge ${item.lucro >= 0 ? 'positive' : 'negative'}`}>
                        {formatBRL(item.lucro)}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.margem !== undefined ? `Margem ${formatPercent(item.margem)}` : 'lucro estimado'}
                      </span>
                    </div>
                  </div>

                  <div className="hi-details-row">
                    <span>
                      Bruto: <strong>{formatBRL(item.valor)}</strong> • {formatKm(item.distancia)}
                      {item.isRetornoVazio ? ' (retorno vazio)' : ''}
                    </span>

                    <div className="hi-actions">
                      {onSelectEntry && (
                        <button
                          type="button"
                          className="hi-btn-repeat"
                          onClick={() => onSelectEntry(item)}
                          title="Recarregar dados no formulário"
                        >
                          🔄 Repetir
                        </button>
                      )}
                      {onDeleteItem && (
                        <button
                          type="button"
                          className="hi-btn-delete"
                          onClick={() => onDeleteItem(item.id)}
                          title="Excluir registro"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rodapé com Totais Consolidados */}
          <div className="history-footer">
            <div className="hf-item">
              <div className="hf-label">Faturamento</div>
              <div className="hf-value" style={{ color: 'var(--brand-dark)' }}>{formatBRL(totalFretes)}</div>
            </div>
            <div className="hf-item">
              <div className="hf-label">Total Km Rodado</div>
              <div className="hf-value">{totalKm.toFixed(0)} km</div>
            </div>
            <div className="hf-item">
              <div className="hf-label">Lucro Líquido Acumulado</div>
              <div className="hf-value" style={{ color: totalLucro >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatBRL(totalLucro)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
