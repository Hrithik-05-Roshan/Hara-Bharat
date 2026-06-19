import { useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Challenges({ userId }) {
  const [challenges, setChallenges] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [xpEarned, setXpEarned] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [chalRes, badgeRes] = await Promise.all([
        fetch(`${API}/api/challenges/${userId}/today`),
        fetch(`${API}/api/badges/${userId}`)
      ])

      if (!chalRes.ok || !badgeRes.ok) {
        throw new Error('API request failed')
      }

      const chalData = await chalRes.json()
      const badgeData = await badgeRes.json()

      setChallenges(chalData)
      setBadges(badgeData)
    } catch (err) {
      setErrorMsg('Challenges load nahi ho paye. Server running hai? 🤔')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId, fetchData])

  const handleComplete = async (challengeId) => {
    try {
      const res = await fetch(`${API}/api/challenges/${userId}/complete/${challengeId}`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setXpEarned(prev => prev + (data.xp_earned || 0))
        
        // Update local challenge status
        setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, is_completed: true } : c))

        // Trigger streak / badges updates in other components
        window.dispatchEvent(new Event('streakUpdated'))
        
        // Re-fetch badges since completing a challenge might unlock a badge!
        const badgeRes = await fetch(`${API}/api/badges/${userId}`)
        if (badgeRes.ok) {
          setBadges(await badgeRes.json())
        }
      }
    } catch (err) {
      // Quietly fail
    }
  }

  const completedCount = challenges.filter(c => c.is_completed).length
  const progressPercent = (completedCount / 3) * 100

  if (loading) {
    return (
      <div className="challenges-page-container" aria-busy="true" aria-label="Loading challenges and badges">
        <div className="clay-card challenges-progress-card no-hover">
          <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '12px' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '12px' }}></div>
        </div>
        <div className="challenges-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="clay-card challenge-item-card no-hover" style={{ height: '80px' }}>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
              <div className="skeleton" style={{ width: '60%', height: '20px' }}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="challenges-page-container text-center" style={{ padding: '60px 24px' }}>
        <div className="clay-card cc-red no-hover" style={{ display: 'inline-block', padding: '40px', maxWidth: '500px' }}>
          <span style={{ fontSize: '50px' }} aria-hidden="true">⚠️</span>
          <h2 style={{ fontWeight: 900, margin: '16px 0 8px' }}>Problems loading challenges</h2>
          <p style={{ fontWeight: 600, color: '#7A0000', marginBottom: '24px' }}>{errorMsg}</p>
          <button onClick={fetchData} className="clay-btn btn-yellow">🔄 Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="challenges-page-container anim-fade-up">
      {/* PAGE HEADER */}
      <header style={{ marginBottom: '28px' }}>
        <h1 className="track-title">🎯 Daily Eco Challenges</h1>
        <p className="track-subtitle">Daily eco tasks poore karo aur badges unlock karo! 🎯</p>
      </header>

      {/* CHALLENGES SECTION */}
      <section className="clay-card no-hover challenges-progress-card" aria-labelledby="challenges-progress-label">
        <div className="challenges-progress-header">
          <span id="challenges-progress-label" className="challenges-progress-title">
            Aaj Ka Progress: {completedCount}/3 Completed
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {completedCount === 3 && (
              <span className="clay-pill pill-yellow">🏆 +50 Bonus XP Earned! 🎉</span>
            )}
            {xpEarned > 0 && (
              <span className="clay-pill pill-green">+{xpEarned} XP!</span>
            )}
          </div>
        </div>

        <div className="clay-progress-track" style={{ height: '14px' }}>
          <div className="clay-progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </section>

      {/* CHALLENGE CARDS LIST */}
      <section className="challenges-list" aria-label="List of daily eco challenges">
        {challenges.length === 0 ? (
          <div className="clay-card no-hover text-center" style={{ padding: '40px' }}>
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }} aria-hidden="true">🌱</span>
            <p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>
              Aaj ke challenges abhi generate nahi hue. Thodi der baad aao!
            </p>
          </div>
        ) : (
          challenges.map((c) => (
            <div
              key={c.id}
              className={`clay-card challenge-item-card no-hover ${c.is_completed ? 'completed' : ''}`}
            >
              {/* Checkbox circle */}
              <button
                type="button"
                className={`challenge-checkbox-custom ${c.is_completed ? 'completed' : ''}`}
                onClick={() => !c.is_completed && handleComplete(c.id)}
                disabled={c.is_completed}
                aria-label={c.is_completed ? `Challenge completed: ${c.challenge_text}` : `Mark challenge as complete: ${c.challenge_text}`}
              >
                ✓
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span className="clay-pill pill-white" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                    {c.category}
                  </span>
                  <span className="clay-pill pill-mint" style={{ fontSize: '11px' }}>
                    💚 ~{c.co2_saving_kg.toFixed(1)} kg CO₂ Saved
                  </span>
                </div>
                <p className="challenge-desc-text">{c.challenge_text}</p>
              </div>

              {c.is_completed && (
                <span className="clay-pill pill-green" style={{ position: 'absolute', right: '16px', bottom: '16px', fontSize: '10px' }}>
                  +50 XP Earned!
                </span>
              )}
            </div>
          ))
        )}
      </section>

      {/* BADGES SECTION */}
      <section className="badges-section-container" aria-labelledby="badges-heading">
        <h2 id="badges-heading" className="badges-section-title">🏅 Aapke Badges</h2>

        <div className="badges-grid-container">
          {badges.map((badge) => {
            const unlocked = badge.is_unlocked
            const earnedDate = badge.earned_at
              ? new Date(badge.earned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : null

            return (
              <article
                key={badge.badge_key}
                className={`clay-card badge-item-card no-hover ${unlocked ? 'earned' : 'locked'}`}
                aria-label={unlocked ? `Badge earned: ${badge.badge_name}` : `Badge locked: ${badge.badge_name}`}
              >
                {!unlocked && (
                  <div className="badge-lock-overlay" aria-hidden="true">
                    🔒
                  </div>
                )}
                
                <span className="badge-item-emoji" role="img" aria-label={badge.badge_name}>
                  {badge.badge_emoji}
                </span>
                
                <h3 className="badge-item-name">{badge.badge_name}</h3>
                
                <p className="badge-item-desc">
                  {badge.badge_description}
                </p>

                {unlocked && earnedDate && (
                  <span className="badge-item-date">
                    Earned: {earnedDate}
                  </span>
                )}
              </article>
            )
          })}
        </div>
      </section>

    </div>
  )
}

export default Challenges
