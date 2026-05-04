import { useState, useMemo } from 'react'
import { useData } from '../store/DataContext'
import SalesChart from '../components/SalesChart'

const METRIC_OPTIONS = [
  { key: 'sales_amount', label: 'Sales ($)', color: '#667eea' },
  { key: 'listings_added', label: 'Listings', color: '#00c6fb' },
  { key: 'add_to_cart', label: 'Add to Cart', color: '#f093fb' },
  { key: 'seo_visits', label: 'SEO Visits', color: '#43e97b' },
]

const PERIOD_OPTIONS = [
  { key: 7, label: '7 Days' },
  { key: 14, label: '14 Days' },
  { key: 30, label: '30 Days' },
]

export default function Reports() {
  const { stores, getStoreTrend, metrics } = useData()
  const [tab, setTab] = useState('trends')
  const [metric, setMetric] = useState('sales_amount')
  const [period, setPeriod] = useState(7)
  const [comparisonMetric, setComparisonMetric] = useState('sales_amount')

  const currentMetricConfig = METRIC_OPTIONS.find(m => m.key === metric)
  const trendData = stores.map(store => ({
    store,
    data: getStoreTrend(store.id, metric, period),
  }))

  // Store comparison data
  const comparisonData = useMemo(() => {
    return stores.map(store => {
      const storeMetrics = metrics[store.id] || {}
      let total = 0
      Object.values(storeMetrics).forEach(day => {
        total += day[comparisonMetric] || 0
      })
      return { store, total }
    }).sort((a, b) => b.total - a.total)
  }, [stores, metrics, comparisonMetric])

  const maxTotal = Math.max(...comparisonData.map(d => d.total), 1)

  return (
    <>
      <div className="page-title">📊 Reports</div>

      <div className="report-tabs">
        <button className={`report-tab ${tab === 'trends' ? 'active' : ''}`} onClick={() => setTab('trends')}>
          📈 Trends
        </button>
        <button className={`report-tab ${tab === 'comparison' ? 'active' : ''}`} onClick={() => setTab('comparison')}>
          🏪 Store Compare
        </button>
      </div>

      {tab === 'trends' && (
        <>
          <div className="date-filter">
            {METRIC_OPTIONS.map(m => (
              <button key={m.key} className={`date-chip ${metric === m.key ? 'active' : ''}`} onClick={() => setMetric(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="date-filter">
            {PERIOD_OPTIONS.map(p => (
              <button key={p.key} className={`date-chip ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>
                {p.label}
              </button>
            ))}
          </div>

          {trendData.map(({ store, data }) => (
            <div className="chart-section" key={store.id} style={{ marginBottom: 16 }}>
              <div className="section-header">
                <div className="section-title">{store.emoji} {store.name}</div>
                <span className="section-badge">{currentMetricConfig?.label}</span>
              </div>
              <SalesChart data={data} label={currentMetricConfig?.label} color={currentMetricConfig?.color} />
            </div>
          ))}
        </>
      )}

      {tab === 'comparison' && (
        <>
          <div className="date-filter" style={{ marginBottom: 16 }}>
            {METRIC_OPTIONS.map(m => (
              <button key={m.key} className={`date-chip ${comparisonMetric === m.key ? 'active' : ''}`} onClick={() => setComparisonMetric(m.key)}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="comparison-grid">
            {comparisonData.map(({ store, total }) => (
              <div className="comparison-row" key={store.id}>
                <div>
                  <span style={{ fontSize: 18, marginRight: 6 }}>{store.emoji}</span>
                  <span className="store-name">{store.name}</span>
                </div>
                <div className="bar-container">
                  <div className="bar-fill" style={{ width: `${Math.max((total / maxTotal) * 100, 5)}%` }}>
                    {comparisonMetric === 'sales_amount' ? `$${total.toLocaleString()}` : total.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
