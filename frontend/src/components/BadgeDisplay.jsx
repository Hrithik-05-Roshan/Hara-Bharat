import { useState, useEffect, memo } from 'react'
import { API_BASE_URL, ALL_BADGES } from '../utils/constants'

/**
 * BadgeDisplay - Renders the user's gamification badges showing unlocked and locked status.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function BadgeDisplay({ userId }) {
  const [badges, setBadges] = useState(ALL_BADGES.map(b => ({ ...b, is_unlocked: false, earned_at: null })))

  useEffect(() => {
    let cancelled = false
    async function fetchBadges() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/badges/${userId}`)
        if (!cancelled && res.ok) setBadges(await res.json())
      } catch { /* use defaults */ }
    }
    fetchBadges()
    return () => { cancelled = true }
  }, [userId])

  return (
    <div className="card">
      <h2 className="card__title">🏅 Aapke Badges</h2>
      <div className="badges-grid">
        {badges.map(badge => (
          <div
            key={badge.badge_key}
            className={`badge-card ${badge.is_unlocked ? 'badge-card--unlocked' : 'badge-card--locked'}`}
            role="img"
            aria-label={badge.is_unlocked
              ? `Badge unlocked: ${badge.badge_name} — ${badge.badge_description}`
              : `Badge locked: ${badge.badge_name} — ${badge.badge_description}`
            }
          >
            <div className="badge-card__emoji">{badge.badge_emoji}</div>
            <div className="badge-card__name">{badge.badge_name}</div>
            <div className="badge-card__desc">
              {badge.is_unlocked ? `✅ ${badge.badge_description}` : `🔒 ${badge.badge_description}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(BadgeDisplay)
