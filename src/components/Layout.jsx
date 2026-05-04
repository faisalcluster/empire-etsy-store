import { useData } from '../store/DataContext'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  const { user, logout, toast } = useData()

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">E</div>
          <div className="logo-text"><span>Empire</span></div>
        </div>
        <button className="user-btn" onClick={logout} title={`Logged in as ${user?.name}\nClick to logout`}>
          {user?.name?.charAt(0)?.toUpperCase() || '👤'}
        </button>
      </header>
      <main className="page-content">
        {children}
      </main>
      <BottomNav />
      {toast && <div className="toast success">{toast}</div>}
    </div>
  )
}
