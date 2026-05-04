import { useData } from '../store/DataContext'

export default function HistoryModal({ storeId, metricType, config, onClose }) {
  const { getStoreHistory, stores } = useData()
  const history = getStoreHistory(storeId, metricType)
  const storeName = stores.find(s => s.id === storeId)?.name || ''

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">{config.icon} {config.label} History</div>
        <div className="modal-subtitle">{storeName} — Date-wise additions</div>

        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No history yet. Tap + to add data.</div>
            </div>
          ) : (
            history.map(h => (
              <div className="history-item" key={h.id}>
                <div>
                  <div className="history-date">
                    {new Date(h.addedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="history-meta">
                    by {h.addedBy} at {new Date(h.addedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="history-value positive">
                  +{config.prefix}{h.addedValue.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ height: 16 }} />
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
