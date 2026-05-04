import { Routes, Route, Navigate } from 'react-router-dom'
import { useData } from './store/DataContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Reports from './pages/Reports'
import Team from './pages/Team'

function ProtectedRoute({ children }) {
  const { user } = useData()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useData()

  return (
    <>
      <div className="app-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Layout><Team /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
