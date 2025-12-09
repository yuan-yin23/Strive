import { useState } from 'react'
import { registerUser } from '../services/api'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (!email || !name || !username) {
      setMsg('✗ All fields are required')
      return
    }

    setLoading(true)
    try {
      const payload = { name, email, username }
      const response = await registerUser(payload)

      setMsg('✓ Registered successfully!')
      setName('')
      setEmail('')
      setUsername('')
    } catch (err) {
      setMsg('✗ Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h1>Create Account</h1>
      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        Register to save workouts and track your lifting progress.
      </p>

      <form onSubmit={onSubmit}>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>User Details</h2>

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

          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Registering...' : 'Register'}
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