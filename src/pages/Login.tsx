import { useState } from 'react'
import { loginUser } from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !name) {
        setMsg('✗ Please provide both your name and email')
        return
    }

    setLoading(true)
    setMsg(null)

    try {
        const payload = { email, name }
        const response = await loginUser(payload)

        if (response.user) {
            localStorage.setItem("currentUser", JSON.stringify(response.user))
            setMsg('✓ Logged in successfully!')
            window.location.href = '/';
        } else {
            setMsg('✗ Invalid name or email')
    }
    } catch (err) {
        setMsg('✗ Unable to log in')
    } finally {
        setLoading(false)
    }
}

  return (
    <section>
      <h1>Login</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        Log in to access your dashboard and saved workout stats.
      </p>

      <form onSubmit={onSubmit}>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Your Info</h2>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {msg && (
          <div style={{
            marginTop: '1rem',
            padding: '0.8rem',
            borderRadius: '6px',
            backgroundColor: msg.includes('✓') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: msg.includes('✓') ? '#22c55e' : '#ef4444',
            border: `1px solid ${msg.includes('✓') ? '#22c55e' : '#ef4444'}`,
            textAlign: 'center'
          }}>
            {msg}
          </div>
        )}
      </form>
    </section>
  )
}
