import { useState, useEffect } from 'react'
import { getLeaderboard } from '../services/api'

export default function Leaderboards() {
  const [tab, setTab] = useState<'overview' | 'max'>('overview')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const result = await getLeaderboard()
        setData(result)
      } catch (err) {
        console.error("Failed to load leaderboard", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const active = data
    ? tab === 'overview'
      ? data.overview
      : data.max
    : []

  if (loading) return <section><h1>Leaderboards</h1><p>Loading...</p></section>
  if (!data) return <section><h1>Leaderboards</h1><p>Failed to load leaderboard.</p></section>

  return (
    <section>
      <h1>Leaderboards</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
        Compete with your friends across different metrics
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setTab('overview')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 6,
            border: tab === 'overview' ? '2px solid var(--accent-red)' : '1px solid var(--border-color)',
            background: tab === 'overview' ? 'var(--accent-red)' : 'var(--secondary-bg)',
            color: tab === 'overview' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab('max')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 6,
            border: tab === 'max' ? '2px solid var(--accent-red)' : '1px solid var(--border-color)',
            background: tab === 'max' ? 'var(--accent-red)' : 'var(--secondary-bg)',
            color: tab === 'max' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Max Lifts
        </button>
      </div>

      <div className="grid">
        {active.map((lb: any) => (
          <div key={lb.title} className="card">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>{lb.title}</h2>
            <ol style={{ listStyle: 'none', marginLeft: 0, padding: 0 }}>
              {lb.data.map((entry: any) => (
                <li
                  key={`${lb.title}-${entry.rank}-${entry.name}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'var(--tertiary-bg)',
                    borderRadius: '4px',
                    borderLeft: `3px solid ${entry.rank === 1 ? '#fbbf24' : entry.rank === 2 ? '#d1d5db' : '#a78bfa'}`
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    #{entry.rank} {entry.name}
                  </span>
                  <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>
                    {entry.value}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
