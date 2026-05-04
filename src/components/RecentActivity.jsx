import { useData } from '../store/DataContext'

const COLORS = ['#667eea', '#00c6fb', '#f093fb', '#43e97b', '#ffd54f', '#e040fb', '#ff6f00', '#40c4ff']

export default function RecentActivity() {
  const { activity } = useData()
  const items = activity.slice(0, 8)

  if (items.length === 0) return null

  return (
    <div className="activity-section">
      <div className="section-title">Recent Activity</div>
      {items.map((item, i) => (
        <div className="activity-item" key={item.id}>
          <div
            className="activity-avatar"
            style={{ background: `${item.color || COLORS[i % COLORS.length]}22`, color: item.color || COLORS[i % COLORS.length] }}
          >
            {item.user.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="activity-text">
              <strong>{item.user}</strong> {item.action}
            </div>
            <div className="activity-time">
              {formatTimeAgo(item.time)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTimeAgo(timeStr) {
  const diff = Date.now() - new Date(timeStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
