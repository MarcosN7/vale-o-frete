import { formatBRL, formatKm, formatPercent, exportHistoryCSV } from '../utils';

export default function History({ history, onClear, onSelectEntry, onDeleteItem }) {
  const totalKm = history.reduce((sum, h) => sum + (h.distancia || 0), 0);
  const totalLucro = history.reduce((sum, h) => sum + (h.lucro || 0), 0);

  return (
    <div className="history-section">
      <h3>
        <span>📋 Histórico de Cálculos</span>
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--input-bg)', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 6 }}
              onClick={() => exportHistoryCSV(history)}
              title="Exportar CSV"
            >
              📥 CSV
            </button>
            <button
              type="button"
              className="btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={onClear}
            >
              Limpar
            </button>
          </div>
        )}
      </h3>

      {history.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '0.9rem' }}>
          Nenhum cálculo registrado ainda
        </p>
      ) : (
        <>
          {history.map((item) => {
            const isFrete = item.mode === 'frete';
            const modoLabel = item.mode === 'ml'
              ? '📦 Mercado Livre'
              : item.mode === 'lalamove'
              ? '🏍️ LalaMove / inDrive'
              : '🚛 Análise de Frete';

            return (
              <div key={item.id} className="history-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="hi-left">
                    <span className="hi-mode">
                      {modoLabel} {item.verdictTitle ? `• ${item.verdictTitle}` : ''}
                    </span>
                    {isFrete && (item.origem || item.destino) && (
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {item.origem || 'Origem'} ➔ {item.destino || 'Destino'}
                      </span>
                    )}
                    <span className="hi-info">
                      {formatBRL(item.valor)} • {formatKm(item.distancia)}
                      {item.isRetornoVazio ? ' (com retorno vazio)' : ''}
                      {item.margem !== undefined ? ` • Margem: ${formatPercent(item.margem)}` : ''}
                      {item.paradas ? ` • ${item.paradas} entregas` : ''}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {new Date(item.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`hi-profit ${item.lucro >= 0 ? 'positive' : 'negative'}`}>
                      {formatBRL(item.lucro)}
                    </span>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {onSelectEntry && (
                        <button
                          type="button"
                          onClick={() => onSelectEntry(item)}
                          style={{ padding: '3px 8px', fontSize: '0.72rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--primary)' }}
                          title="Recarregar dados no formulário"
                        >
                          🔄 Repetir
                        </button>
                      )}
                      {onDeleteItem && (
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          style={{ padding: '3px 6px', fontSize: '0.72rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 4, color: '#dc2626' }}
                          title="Excluir este cálculo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="history-footer">
            <div className="hf-item">
              <div className="hf-label">Total Km</div>
              <div className="hf-value">{totalKm.toFixed(1)}</div>
            </div>
            <div className="hf-item">
              <div className="hf-label">Lucro Total</div>
              <div className="hf-value" style={{ color: totalLucro >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {formatBRL(totalLucro)}
              </div>
            </div>
            <div className="hf-item">
              <div className="hf-label">Cálculos</div>
              <div className="hf-value">{history.length}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
