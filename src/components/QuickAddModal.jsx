import { useState } from 'react'
import { useData } from '../store/DataContext'

const METRICS = [
  { key: 'sales_amount', label: '💰 Sales ($)', placeholder: 'Enter amount...' },
  { key: 'listings_added', label: '📦 Listings Added', placeholder: 'Number of listings...' },
  { key: 'add_to_cart', label: '🛒 Add to Cart', placeholder: 'Number added...' },
  { key: 'seo_visits', label: '📈 SEO Visits', placeholder: 'Number of visits...' },
]

export default function QuickAddModal({ onClose, preselectedMetric }) {
  const { selectedStore, selectedStoreId, addMetric, getStoreMetrics } = useData()
  const [selected, setSelected] = useState(preselectedMetric || 'sales_amount')
  const [value, setValue] = useState('')

  const todayMetrics = getStoreMetrics(selectedStoreId)
  const currentVal = todayMetrics[selected] || 0

  function handleSubmit(e) {
    e.preventDefault()
    if (!value || parseFloat(value) === 0) return
    addMetric(selectedStoreId, selected, parseFloat(value))
    setValue('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Quick Add</div>
        <div className="modal-subtitle">{selectedStore?.emoji} {selectedStore?.name} — Today</div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {METRICS.map(m => (
            <button
              key={m.key}
              className={`date-chip ${selected === m.key ? 'active' : ''}`}
              onClick={() => setSelected(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          Current: <strong style={{ color: 'var(--text-primary)' }}>{selected === 'sales_amount' ? '$' : ''}{currentVal.toLocaleString()}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="number"
            className="input-field large"
            placeholder={METRICS.find(m => m.key === selected)?.placeholder}
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            min="0"
            step={selected === 'sales_amount' ? '0.01' : '1'}
          />
          <div style={{ height: 16 }} />
          <button type="submit" className="btn btn-primary" disabled={!value}>
            ➕ Add {selected === 'sales_amount' && value ? `$${value}` : value || ''}
          </button>
          <div style={{ height: 8 }} />
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  )
}
