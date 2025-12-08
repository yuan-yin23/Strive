import { useState, useEffect } from 'react'
import type { BodyPartName, BodyGraphData } from '../types/body'
import { computeLevel, LEVEL_COLORS } from '../types/body'
import { getAccumulatedStats } from '../services/api'

interface BodyGraphProps {
  imageUrl: string
}

// Label positions based on where the lines point in the diagram (front and back)
// Adjusted to match the actual label line endpoints on the body diagram
const LABEL_POSITIONS: Record<BodyPartName, { x: number; y: number }> = {
  Shoulders: { x: 11, y: 14 },    // Top left corner
  Chest: { x: 45, y: 14 },        // Top center area
  Back: { x: 83, y: 11 },         // Top right corner (back view)
  Biceps: { x: 9, y: 33 },        // Left side middle
  Core: { x: 49, y: 31 },         // Center body area
  Triceps: { x: 91, y: 21 },      // Right side (back view)
  Legs: { x: 87, y: 59 }          // Lower right area
}

const BODY_PARTS: BodyPartName[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core']

export default function BodyGraph({ imageUrl }: BodyGraphProps) {
  const [stats, setStats] = useState<BodyGraphData>({})

  useEffect(() => {
    // Load accumulated stats from localStorage sessions
    const accumulatedStats = getAccumulatedStats()
    setStats(accumulatedStats)

    // Listen for storage changes (when SubmitStats saves a session)
    const handleStorageChange = () => {
      const updated = getAccumulatedStats()
      setStats(updated)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <div style={{ width: '100%', padding: '2rem 0' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: 'var(--secondary-bg)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Body Diagram Image */}
        <div style={{ position: 'relative', width: '100%' }}>
          <img
            src={imageUrl}
            alt="Body Diagram"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto'
            }}
          />

          {/* Level Badges Overlay - Positioned at label endpoints */}
          {BODY_PARTS.map((part) => {
            const weight = (stats[part] as number) ?? 0
            const level = computeLevel(weight)
            const color = LEVEL_COLORS[level]
            const pos = LABEL_POSITIONS[part]

            return (
              <div
                key={part}
                style={{
                  position: 'absolute',
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: color,
                  color: level === 'Gold' || level === 'Diamond' || level === 'Silver' ? '#000' : '#fff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: '2px solid var(--accent-red)',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
                  minWidth: '55px',
                  whiteSpace: 'nowrap'
                }}
                title={`${part}: ${weight.toLocaleString()} kg`}
              >
                {level}
              </div>
            )
          })}
        </div>
      </div>

      {/* Body Part Stats Grid */}
      <div
        style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          maxWidth: '600px',
          margin: '2rem auto 0'
        }}
      >
        {BODY_PARTS.map((part) => {
          const weight = (stats[part] as number) ?? 0
          const level = computeLevel(weight)
          const color = LEVEL_COLORS[level]

          return (
            <div
              key={part}
              style={{
                padding: '1rem',
                backgroundColor: 'var(--tertiary-bg)',
                borderRadius: '6px',
                borderLeft: `4px solid ${color}`,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {part}
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: color,
                  marginBottom: '0.5rem'
                }}
              >
                {level}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}
              >
                {weight.toLocaleString()} kg
              </div>
            </div>
          )
        })}
      </div>

      {/* Total Summary */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'var(--secondary-bg)',
          borderRadius: '6px',
          maxWidth: '600px',
          margin: '2rem auto 0',
          textAlign: 'center'
        }}
      >
        <h3 style={{ marginBottom: '1rem' }}>Total Weight Lifted (All Time)</h3>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-red)' }}>
          {Object.values(stats).reduce((sum, w) => sum + (w ?? 0), 0).toLocaleString()} kg
        </div>
      </div>
    </div>
  )
}
