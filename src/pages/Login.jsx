import { useState } from 'react'
import { useData } from '../store/DataContext'

export default function Login() {
  const { login, register } = useData()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (isRegister) {
      if (!name.trim()) { setError('Name is required'); return }
      if (!email.trim()) { setError('Email is required'); return }
      if (password.length < 4) { setError('Password must be at least 4 characters'); return }
      const ok = await register(name.trim(), email.trim().toLowerCase(), password)
      if (!ok) setError('Email already exists or registration failed')
    } else {
      if (!email.trim() || !password) { setError('Please fill in all fields'); return }
      const ok = await login(email.trim().toLowerCase(), password)
      if (!ok) setError('Invalid email or password')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon-lg">E</div>
          <h1><span>Empire</span></h1>
          <p>Etsy Store Management</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,82,82,0.12)', border: '1px solid rgba(255,82,82,0.25)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#ff5252', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text" className="input-field" placeholder="Your name"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input
              type="email" className="input-field" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password" className="input-field" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {isRegister ? '🚀 Create Account' : '🔐 Sign In'}
          </button>
        </form>

        <div className="login-footer">
          {isRegister ? (
            <>Already have an account? <a onClick={() => { setIsRegister(false); setError('') }}>Sign In</a></>
          ) : (
            <>New here? <a onClick={() => { setIsRegister(true); setError('') }}>Create Account</a></>
          )}
        </div>

        {!isRegister && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            Demo: admin@empire.com / admin123
          </div>
        )}
      </div>
    </div>
  )
}
