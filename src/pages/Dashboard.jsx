import { useState } from 'react'
import { useData } from '../store/DataContext'
import StoreSelector from '../components/StoreSelector'
import MetricCard from '../components/MetricCard'
import QuickAddModal from '../components/QuickAddModal'
import SalesChart from '../components/SalesChart'
import RecentActivity from '../components/RecentActivity'

export default function Dashboard() {
  const { selectedStoreId, getStoreMetrics, getStoreTrend, metricHistory, user } = useData()
  const [quickAddMetric, setQuickAddMetric] = useState(null)

  const today = getStoreMetrics(selectedStoreId)
  const salesTrend = getStoreTrend(selectedStoreId, 'sales_amount', 7)

  // Get today's additions from history
  const todayStr = new Date().toISOString().split('T')[0]
  const todayHistory = metricHistory.filter(h => h.storeId === selectedStoreId && h.date === todayStr)

  function getTodayChange(metric) {
    return todayHistory.filter(h => h.metric === metric).reduce((sum, h) => sum + h.addedValue, 0)
  }

  function getLastUpdatedBy(metric) {
    const last = todayHistory.find(h => h.metric === metric)
    return last?.addedBy || null
  }

  return (
    <>
      <StoreSelector />

      <div className="metrics-grid">
        <MetricCard
          metricType="sales_amount"
          value={today.sales_amount}
          todayChange={getTodayChange('sales_amount')}
          lastUpdatedBy={getLastUpdatedBy('sales_amount')}
          onAdd={() => setQuickAddMetric('sales_amount')}
        />
        <MetricCard
          metricType="listings_added"
          value={today.listings_added}
          todayChange={getTodayChange('listings_added')}
          lastUpdatedBy={getLastUpdatedBy('listings_added')}
          onAdd={() => setQuickAddMetric('listings_added')}
        />
        <MetricCard
          metricType="add_to_cart"
          value={today.add_to_cart}
          todayChange={getTodayChange('add_to_cart')}
          lastUpdatedBy={getLastUpdatedBy('add_to_cart')}
          onAdd={() => setQuickAddMetric('add_to_cart')}
        />
        <MetricCard
          metricType="seo_visits"
          value={today.seo_visits}
          todayChange={getTodayChange('seo_visits')}
          lastUpdatedBy={getLastUpdatedBy('seo_visits')}
          onAdd={() => setQuickAddMetric('seo_visits')}
        />
      </div>

      <div className="chart-section">
        <div className="section-header">
          <div className="section-title">📈 Sales Trend</div>
          <span className="section-badge">7 Days</span>
        </div>
        <SalesChart data={salesTrend} label="Sales ($)" color="#667eea" />
      </div>

      <RecentActivity />

      {quickAddMetric && (
        <QuickAddModal
          preselectedMetric={quickAddMetric}
          onClose={() => setQuickAddMetric(null)}
        />
      )}
    </>
  )
}
