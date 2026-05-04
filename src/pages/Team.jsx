import { useState } from 'react'
import { useData } from '../store/DataContext'

const ROLE_COLORS = { admin: '#667eea', manager: '#f093fb', viewer: '#888' }
const AVATAR_COLORS = ['#667eea', '#00c6fb', '#f093fb', '#43e97b', '#ffd54f', '#e040fb', '#ff6f00', '#40c4ff']

export default function Team() {
  const { teamMembers, addTeamMember, removeTeamMember, user } = useData()
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')

  function handleAdd(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    const ok = addTeamMember(name.trim(), email.trim().toLowerCase(), role)
    if (ok) {
      setName(''); setEmail(''); setRole('viewer'); setShowAdd(false)
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>👥 Team</div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            + Invite
          </button>
        )}
      </div>

      <div className="team-list">
        {teamMembers.map((member, i) => (
          <div className="team-card" key={member.id}>
            <div className="team-avatar" style={{
              background: `${AVATAR_COLORS[i % AVATAR_COLORS.length]}22`,
              color: AVATAR_COLORS[i % AVATAR_COLORS.length],
            }}>
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="team-info">
              <div className="team-name">
                {member.name}
                {member.id === user?.id && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(you)</span>}
              </div>
              <div className="team-email">{member.email}</div>
            </div>
            <span className={`team-role ${member.role}`}>{member.role}</span>
            {isAdmin && member.id !== user?.id && (
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 }}
                onClick={() => removeTeamMember(member.id)}
                title="Remove"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Invite Team Member</div>
            <div className="modal-subtitle">They'll be able to log in and update metrics</div>

            <form onSubmit={handleAdd}>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" className="input-field" placeholder="Team member name" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" className="input-field" placeholder="their@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Role</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['admin', 'manager', 'viewer'].map(r => (
                    <button
                      type="button" key={r}
                      className={`date-chip ${role === r ? 'active' : ''}`}
                      style={role === r ? { borderColor: ROLE_COLORS[r], color: ROLE_COLORS[r], background: `${ROLE_COLORS[r]}20` } : {}}
                      onClick={() => setRole(r)}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary">🚀 Send Invite</button>
              <div style={{ height: 8 }} />
              <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
