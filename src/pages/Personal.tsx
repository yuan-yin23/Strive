import { useState, useEffect, useMemo } from 'react'
import BodyGraph from '../components/BodyGraph'
import { getUserWorkouts } from '../services/api'

interface Exercise {
  id: string
  bodyPart: string
  exercise: string
  sets: number
  reps: number
  weight: number
}

interface WorkoutSession {
  sessionTime: number
  exercises: Exercise[]
  totalWeight: number
  timestamp: string
}

export default function Personal() {
  const [tab, setTab] = useState<'levels' | 'stats' | 'history'>('levels')
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load workout history when History tab is selected
    if (tab === 'history'|| tab === 'stats') {
      loadWorkoutHistory()
    }
  }, [tab])

  async function loadWorkoutHistory() {
    setLoading(true)
    try {
      // Get current user
      const currentUser = localStorage.getItem('currentUser')
      if (!currentUser) {
        // If not logged in, try localStorage
        const sessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]')
        const sortedSessions = sessions.sort((a: WorkoutSession, b: WorkoutSession) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setWorkoutHistory(sortedSessions)
        setLoading(false)
        return
      }

      const user = JSON.parse(currentUser)
      
      // Fetch from backend
      const response = await getUserWorkouts(user._id)
      setWorkoutHistory(response.workouts)
    } catch (err) {
      console.error('Failed to load workout history from backend, using localStorage:', err)
      // Fallback to localStorage
      const sessions = JSON.parse(localStorage.getItem('workoutSessions') || '[]')
      const sortedSessions = sessions.sort((a: WorkoutSession, b: WorkoutSession) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      setWorkoutHistory(sortedSessions)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    if (workoutHistory.length === 0) {
      return {
        totalTimeMinutes: 0,
        totalTimeHours: 0,
        totalTimeDisplay: '0 hrs',
        totalWeight: 0,
        maxBench: 0,
        maxSquat: 0,
        maxDeadlift: 0,
        thisMonthWorkouts: 0,
        thisMonthTime: 0,
        thisMonthTimeDisplay: '0 hrs',
        thisMonthWeight: 0
      }
    }

    // Total Time in Gym (sum of all sessionTime in minutes)
    const totalTimeMinutes = workoutHistory.reduce((sum, workout) => {
      return sum + (workout.sessionTime || 0)
    }, 0)

    // Total Weight Lifted (sum of all totalWeight from each session)
    const totalWeight = workoutHistory.reduce((sum, workout) => {
      return sum + (workout.totalWeight || 0)
    }, 0)

    // Format time display: show hours and minutes if there are minutes, otherwise just hours
    const hours = Math.floor(totalTimeMinutes / 60)
    const minutes = totalTimeMinutes % 60
    let totalTimeDisplay = ''
    if (hours > 0 && minutes > 0) {
      totalTimeDisplay = `${hours} hrs ${minutes} min`
    } else if (hours > 0) {
      totalTimeDisplay = `${hours} hrs`
    } else if (minutes > 0) {
      totalTimeDisplay = `${minutes} min`
    } else {
      totalTimeDisplay = '0 hrs'
    }

    // Calculate max lifts (find maximum weight for each exercise type)
    let maxBench = 0
    let maxSquat = 0
    let maxDeadlift = 0

    workoutHistory.forEach(workout => {
      workout.exercises?.forEach(ex => {
        const exerciseName = ex.exercise.toLowerCase()
        const weight = ex.weight || 0
        
        if (exerciseName.includes('bench press') && weight > maxBench) {
          maxBench = weight
        }
        if (exerciseName.includes('squat') && weight > maxSquat) {
          maxSquat = weight
        }
        if (exerciseName.includes('deadlift') && weight > maxDeadlift) {
          maxDeadlift = weight
        }
      })
    })

    // Calculate "This Month" stats
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonthWorkouts = workoutHistory.filter(workout => {
      const workoutDate = new Date(workout.timestamp)
      return workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear
    })

    const thisMonthTime = thisMonthWorkouts.reduce((sum, workout) => {
      return sum + (workout.sessionTime || 0)
    }, 0)

    const thisMonthWeight = thisMonthWorkouts.reduce((sum, workout) => {
      return sum + (workout.totalWeight || 0)
    }, 0)

    // Format this month time display
    const thisMonthHours = Math.floor(thisMonthTime / 60)
    const thisMonthMinutes = thisMonthTime % 60
    let thisMonthTimeDisplay = ''
    if (thisMonthHours > 0 && thisMonthMinutes > 0) {
      thisMonthTimeDisplay = `${thisMonthHours} hrs ${thisMonthMinutes} min`
    } else if (thisMonthHours > 0) {
      thisMonthTimeDisplay = `${thisMonthHours} hrs`
    } else if (thisMonthMinutes > 0) {
      thisMonthTimeDisplay = `${thisMonthMinutes} min`
    } else {
      thisMonthTimeDisplay = '0 hrs'
    }

    return {
      totalTimeMinutes,
      totalTimeHours: hours,
      totalTimeDisplay,
      totalWeight,
      maxBench,
      maxSquat,
      maxDeadlift,
      thisMonthWorkouts: thisMonthWorkouts.length,
      thisMonthTime,
      thisMonthTimeDisplay,
      thisMonthWeight
    }
  }, [workoutHistory])
  
  return (
    <section>
      <h1>My Stats</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => setTab('levels')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 6,
            border: tab === 'levels' ? '2px solid var(--accent-red)' : '1px solid var(--border-color)',
            background: tab === 'levels' ? 'var(--accent-red)' : 'var(--secondary-bg)',
            color: tab === 'levels' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Body Levels
        </button>
        <button
          type="button"
          onClick={() => setTab('stats')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 6,
            border: tab === 'stats' ? '2px solid var(--accent-red)' : '1px solid var(--border-color)',
            background: tab === 'stats' ? 'var(--accent-red)' : 'var(--secondary-bg)',
            color: tab === 'stats' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Personal Statistics
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 6,
            border: tab === 'history' ? '2px solid var(--accent-red)' : '1px solid var(--border-color)',
            background: tab === 'history' ? 'var(--accent-red)' : 'var(--secondary-bg)',
            color: tab === 'history' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Workout History
        </button>
      </div>

      {/* Body Levels Tab */}
      {tab === 'levels' && (
        <div>
          <div className="card">
            <h2>Body Levels</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Your strength distribution based on exercises logged in your sessions
            </p>
            <BodyGraph imageUrl="/strive-drawing.jpg" />
          </div>
        </div>
      )}

      {/* Personal Statistics Tab */}
      {tab === 'stats' && (
        <div className="grid-2">
          <div className="card">
            <h2>Totals</h2>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                Loading statistics...
              </p>
            ) : (
              <ul style={{ listStyle: 'none', marginLeft: 0, padding: 0 }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Total Time in Gym</span>
                  <strong style={{ color: 'var(--accent-red)' }}>{stats.totalTimeDisplay}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>Total Weight Lifted</span>
                  <strong style={{ color: 'var(--accent-red)' }}>{stats.totalWeight.toLocaleString()} lbs</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                  <span>Total Workouts</span>
                  <strong style={{ color: 'var(--accent-red)' }}>{workoutHistory.length}</strong>
                </li>
              </ul>
            )}
          </div>

          <div className="card">
            <h2>Max Lifts</h2>
            <ul style={{ listStyle: 'none', marginLeft: 0, padding: 0 }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Bench Press</span>
                <strong style={{ color: 'var(--accent-red)' }}>
                  {stats.maxBench > 0 ? `${stats.maxBench} lbs` : 'N/A'}
                </strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Squat</span>
                <strong style={{ color: 'var(--accent-red)' }}>
                  {stats.maxSquat > 0 ? `${stats.maxSquat} lbs` : 'N/A'}
                </strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                <span>Deadlift</span>
                <strong style={{ color: 'var(--accent-red)' }}>
                  {stats.maxDeadlift > 0 ? `${stats.maxDeadlift} lbs` : 'N/A'}
                </strong>
              </li>
            </ul>
          </div>

          <div className="card">
            <h2>This Month</h2>
            <ul style={{ listStyle: 'none', marginLeft: 0, padding: 0 }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Workouts Completed</span>
                <strong style={{ color: 'var(--accent-red)' }}>{stats.thisMonthWorkouts}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Hours Trained</span>
                <strong style={{ color: 'var(--accent-red)' }}>{stats.thisMonthTimeDisplay}</strong>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                <span>Weight Lifted</span>
                <strong style={{ color: 'var(--accent-red)' }}>{stats.thisMonthWeight.toLocaleString()} lbs</strong>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Workout History Tab */}
      {tab === 'history' && (
        <div>
          <div className="card">
            <h2>Recent Workouts</h2>
            {loading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                Loading workouts...
              </p>
            ) : workoutHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                No workouts logged yet. Start tracking your progress!
              </p>
            ) : (
              <div style={{ marginTop: '1.5rem' }}>
                {workoutHistory.map((workout, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      backgroundColor: 'var(--tertiary-bg)',
                      borderRadius: '8px',
                      borderLeft: '4px solid var(--accent-red)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.1rem' }}>
                        {new Date(workout.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {workout.sessionTime} min
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                      <span>{workout.exercises.length} exercises</span>
                      <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                        {workout.totalWeight.toLocaleString()} lbs total
                      </span>
                    </div>
                    
                    {/* Exercise breakdown */}
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ 
                        cursor: 'pointer', 
                        color: 'var(--accent-red)', 
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        padding: '0.25rem 0'
                      }}>
                        View exercises
                      </summary>
                      <div style={{ 
                        marginTop: '0.5rem', 
                        paddingTop: '0.5rem', 
                        borderTop: '1px solid var(--border-color)' 
                      }}>
                        {workout.exercises.map((ex, exIdx) => (
                          <div 
                            key={exIdx} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              padding: '0.4rem 0',
                              fontSize: '0.9rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <span>{ex.bodyPart} - {ex.exercise}</span>
                            <span style={{ color: 'var(--text-primary)' }}>
                              {ex.sets} × {ex.reps} @ {ex.weight} lbs
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}