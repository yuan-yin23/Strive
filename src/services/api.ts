const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function getHealth(): Promise<{status:string}> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function submitStats(payload: any){
  const res = await fetch(`${API_BASE}/stats`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
  if (!res.ok) throw new Error('submit error')
  return res.json()
}

export async function registerUser(payload: any) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('register error')
  return res.json()
}

export async function loginUser(payload: any) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error('login error')
  return res.json()
}

// Calculate accumulated stats from sessions stored in localStorage
export function getAccumulatedStats() {
  const sessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]')
  
  const stats: Record<string, number> = {
    Chest: 0,
    Back: 0,
    Legs: 0,
    Shoulders: 0,
    Biceps: 0,
    Triceps: 0,
    Core: 0
  }

  sessions.forEach((session: any) => {
    session.exercises?.forEach((ex: any) => {
      const weight = (ex.weight || 0) * (ex.sets || 0) * (ex.reps || 0)
      if (stats.hasOwnProperty(ex.bodyPart)) {
        stats[ex.bodyPart] += weight
      }
    })
  })

  return stats
}
