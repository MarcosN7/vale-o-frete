import { formatBRL, exportHistoryCSV } from '../utils';

export default function History({ history, onClear }) {
  const totalKm = history.reduce((sum, h) => sum + (h.distancia || 0), 0);
  const totalLucro = history.reduce((sum, h) => sum + (h.lucro || 0), 0);

  return (
    <div className="history-section">
      <h3>
        <span>📋 Corridas de Hoje</span>
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ padding: '6px 10px', fontSize: '0.75rem', background: 'var(--input-bg)', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: 6 }}
              onClick={() => exportHistoryCSV(history)}
              title="Exportar CSV"
            >
              📥 CSV
            </button>
            <button
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
          Nenhuma corrida registrada hoje
        </p>
      ) : (
        <>
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="hi-left">
                <span className="hi-mode">
                  {item.mode === 'ml' ? '📦 Mercado Livre' : '🏍️ Lalamove'}
                </span>
                <span className="hi-info">
                  {formatBRL(item.valor)} • {item.distancia.toFixed(1)} km
                  {item.paradas ? ` • ${item.paradas} entregas` : ''}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className={`hi-profit ${item.lucro >= 0 ? 'positive' : 'negative'}`}>
                {formatBRL(item.lucro)}
              </span>
            </div>
          ))}

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
              <div className="hf-label">Corridas</div>
              <div className="hf-value">{history.length}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
