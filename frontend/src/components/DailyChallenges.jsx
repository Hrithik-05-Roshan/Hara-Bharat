import { useState, useEffect, useCallback, memo } from 'react'
import { API_BASE_URL } from '../utils/constants'

/**
 * DailyChallenges - Component to display and manage the user's daily eco challenges.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function DailyChallenges({ userId }) {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [xpEarned, setXpEarned] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchChallenges() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/challenges/${userId}/today`)
        if (!cancelled && res.ok) setChallenges(await res.json())
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false) }
    }
    fetchChallenges()
    return () => { cancelled = true }
  }, [userId])

  const handleComplete = useCallback(async (challengeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/challenges/${userId}/complete/${challengeId}`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setXpEarned(prev => prev + (data.xp_earned || 0))
        setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, is_completed: true } : c))
        const liveRegion = document.getElementById('aria-live-region')
        if (liveRegion) liveRegion.textContent = data.message || 'Challenge complete!'
      }
    } catch { /* silent */ }
  }, [userId])

  const completedCount = challenges.filter(c => c.is_completed).length

  if (loading) return <p className="text-center" role="status">Challenges load ho rahe hain...</p>

  return (
    <div>
      <div className="mb-16">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Aaj ka progress</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>{completedCount}/3 ✅</span>
        </div>
        <div className="xp-bar" role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={3} aria-label="Challenge progress">
          <div className="xp-bar__fill" style={{ width: `${(completedCount / 3) * 100}%` }}></div>
        </div>
        {xpEarned > 0 && <p style={{ textAlign: 'center', color: 'var(--light-green)', fontWeight: 600, fontSize: '0.85rem' }}>+{xpEarned} XP earned! 🎉</p>}
      </div>

      {challenges.length === 0 ? (
        <p className="text-center" style={{ color: 'var(--text-muted)' }}>Aaj ke challenges abhi generate nahi hue. Thodi der baad aao!</p>
      ) : (
        challenges.map(c => (
          <div key={c.id} className={`challenge-card ${c.is_completed ? 'challenge-card--done' : ''}`}>
            <input
              type="checkbox"
              className="challenge-checkbox"
              checked={c.is_completed}
              onChange={() => !c.is_completed && handleComplete(c.id)}
              disabled={c.is_completed}
              aria-label={c.is_completed ? `Challenge complete: ${c.challenge_text}` : `Challenge complete karo: ${c.challenge_text}`}
            />
            <div>
              <p className="challenge-text">{c.challenge_text}</p>
              <p className="challenge-saving">💚 ~{c.co2_saving_kg} kg CO₂ bachega</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default memo(DailyChallenges)
