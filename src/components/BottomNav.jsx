import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import QuickAddModal from './QuickAddModal'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const path = location.pathname

  const items = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '📊', label: 'Reports', path: '/reports' },
    { icon: '➕', label: 'Add', action: () => setShowQuickAdd(true), center: true },
    { icon: '👥', label: 'Team', path: '/team' },
    { icon: '⚙️', label: 'More', path: '/settings' },
  ]

  return (
    <>
      <nav className="bottom-nav">
        {items.map((item, i) => (
          <button
            key={i}
            className={`nav-item ${item.center ? 'center-action' : ''} ${path === item.path ? 'active' : ''}`}
            onClick={() => item.action ? item.action() : navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {!item.center && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} />}
    </>
  )
}
