import { useState } from 'react'
import { useData } from '../store/DataContext'
import HistoryModal from './HistoryModal'

const CONFIG = {
  sales_amount: { icon: '💰', label: 'Total Sales', className: 'sales', prefix: '$', format: v => `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
  listings_added: { icon: '📦', label: 'Listings', className: 'listings', prefix: '', format: v => v.toLocaleString() },
  add_to_cart: { icon: '🛒', label: 'Add to Cart', className: 'cart', prefix: '', format: v => v.toLocaleString() },
  seo_visits: { icon: '📈', label: 'SEO Visits', className: 'seo', prefix: '', format: v => v.toLocaleString() },
}

export default function MetricCard({ metricType, value, todayChange, lastUpdatedBy, onAdd }) {
  const [showHistory, setShowHistory] = useState(false)
  const { selectedStoreId } = useData()
  const config = CONFIG[metricType]
  if (!config) return null

  return (
    <>
      <div className={`metric-card ${config.className}`} onClick={() => setShowHistory(true)}>
        <div className="card-shimmer" />
        <div className="card-header">
          <span className="card-icon">{config.icon}</span>
          <div className="card-actions">
            <button className="action-btn" title="Add" onClick={(e) => { e.stopPropagation(); onAdd(); }}>+</button>
            <button className="action-btn" title="History" onClick={(e) => { e.stopPropagation(); setShowHistory(true); }}>📋</button>
          </div>
        </div>
        <div className="card-label">{config.label}</div>
        <div className="card-value">{config.format(value)}</div>
        {todayChange > 0 && (
          <div className="card-change">↑ {config.prefix}{todayChange.toLocaleString()} today</div>
        )}
        {lastUpdatedBy && <div className="card-updated">by {lastUpdatedBy}</div>}
      </div>
      {showHistory && (
        <HistoryModal
          storeId={selectedStoreId}
          metricType={metricType}
          config={config}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  )
}
