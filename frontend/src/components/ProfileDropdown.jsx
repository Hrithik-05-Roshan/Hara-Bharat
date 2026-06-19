import { useState, useEffect, useRef, memo } from 'react'
import { API_BASE_URL } from '../utils/constants'

function ProfileDropdown({ userId, userName, streak, onLogout, onClose }) {
  const [profileData, setProfileData] = useState(null)
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Local display states (visual only, no persistence)
  const [displayName, setDisplayName] = useState(userName)
  const [displayCity, setDisplayCity] = useState('City Not Set')

  // Edit inline states
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(userName)

  const [isEditingCity, setIsEditingCity] = useState(false)
  const [draftCity, setDraftCity] = useState('')

  const dropdownRef = useRef(null)

  // Outside click and ESC close
  useEffect(() => {
    function handleClickOutside(event) {
      const chip = document.getElementById('user-profile-chip')
      if (chip && chip.contains(event.target)) {
        return
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Fetch profile and summary
  useEffect(() => {
    let active = true
    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile/${userId}`)
        if (res.ok && active) {
          const data = await res.json()
          setProfileData(data)
          if (data.name) {
            setDisplayName(data.name)
            setDraftName(data.name)
          }
          if (data.city) {
            setDisplayCity(data.city)
            setDraftCity(data.city)
          }
        }
      } catch (err) {
        // Quiet fail
      }
    }

    async function loadSummary() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/activities/dashboard/${userId}/summary`)
        if (res.ok && active) {
          const data = await res.json()
          setSummaryData(data)
        }
      } catch (err) {
        // Quiet fail
      }
    }

    setLoading(true)
    Promise.all([loadProfile(), loadSummary()]).then(() => {
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [userId])

  const showStreak = summaryData ? (summaryData.streak_days ?? streak) : streak
  const badgesVal = summaryData ? `${summaryData.badges_count} / 6` : 'N/A'
  const xpVal = summaryData ? (summaryData.total_xp ?? 'N/A') : (profileData ? (profileData.xp ?? 'N/A') : 'N/A')
  const avgCo2Val = summaryData ? `${summaryData.week_avg} kg` : 'N/A'

  return (
    <>
      <style>{`
        .profile-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 320px;
          background: var(--clay-white);
          border-radius: 20px;
          box-shadow: var(--s-card);
          border: 2px solid rgba(109, 191, 116, 0.3);
          padding: 20px;
          z-index: 1000;
          animation: dropdownFadeIn 200ms var(--ease) forwards;
          transform-origin: top right;
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: var(--text-dark);
          text-align: left;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .profile-dropdown-divider {
          height: 2px;
          background: rgba(109, 191, 116, 0.15);
          border: none;
          margin: 0;
        }

        .profile-dropdown-section-title {
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .profile-dropdown-stat-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .profile-dropdown-stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.5);
          padding: 8px 12px;
          border-radius: var(--r-sm);
          border: 1px solid rgba(109, 191, 116, 0.1);
        }

        .profile-dropdown-stat-label {
          font-weight: 700;
          font-size: 13px;
          color: var(--text-mid);
        }

        .profile-dropdown-stat-value {
          font-weight: 800;
          font-size: 13px;
          color: var(--text-dark);
        }

        .profile-dropdown-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .profile-dropdown-inline-edit {
          display: flex;
          gap: 6px;
          align-items: center;
          width: 100%;
        }

        .profile-dropdown-inline-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid var(--clay-green);
          border-radius: 8px;
          padding: 4px 8px;
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
          outline: none;
        }

        .profile-dropdown-edit-btn {
          padding: 4px 8px;
          font-size: 12px;
          min-width: 32px;
        }
      `}</style>

      <div className="profile-dropdown" ref={dropdownRef} role="menu" aria-label="Profile menu">
        {/* Section 1: Identity & Streak */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {isEditingName ? (
            <div className="profile-dropdown-inline-edit">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="profile-dropdown-inline-input"
                autoFocus
                placeholder="Name"
              />
              <button
                onClick={() => {
                  if (draftName.trim()) {
                    setDisplayName(draftName.trim())
                  }
                  setIsEditingName(false)
                }}
                className="clay-btn btn-sm profile-dropdown-edit-btn"
                aria-label="Save name visual changes"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setDraftName(displayName)
                  setIsEditingName(false)
                }}
                className="clay-btn btn-sm btn-ghost profile-dropdown-edit-btn"
                aria-label="Cancel editing name"
              >
                ✗
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-dark)' }}>
              👤 {displayName}
            </div>
          )}

          {isEditingCity ? (
            <div className="profile-dropdown-inline-edit" style={{ marginTop: '6px' }}>
              <input
                type="text"
                value={draftCity}
                onChange={(e) => setDraftCity(e.target.value)}
                className="profile-dropdown-inline-input"
                autoFocus
                placeholder="City"
              />
              <button
                onClick={() => {
                  setDisplayCity(draftCity.trim() || 'City Not Set')
                  setIsEditingCity(false)
                }}
                className="clay-btn btn-sm profile-dropdown-edit-btn"
                aria-label="Save city visual changes"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setDraftCity(displayCity === 'City Not Set' ? '' : displayCity)
                  setIsEditingCity(false)
                }}
                className="clay-btn btn-sm btn-ghost profile-dropdown-edit-btn"
                aria-label="Cancel editing city"
              >
                ✗
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
              📍 {displayCity}
            </div>
          )}

          <div style={{ marginTop: '8px' }}>
            <span className="clay-pill pill-yellow" style={{ fontSize: '11px', padding: '3px 8px' }}>
              🔥 {showStreak} din streak
            </span>
          </div>
        </div>

        <hr className="profile-dropdown-divider" />

        {/* Section 2: Quick Stats */}
        <div>
          <div className="profile-dropdown-section-title">Quick Stats</div>
          <div className="profile-dropdown-stat-grid">
            <div className="profile-dropdown-stat-item">
              <span className="profile-dropdown-stat-label">🏆 Badges</span>
              <span className="profile-dropdown-stat-value">{badgesVal}</span>
            </div>
            <div className="profile-dropdown-stat-item">
              <span className="profile-dropdown-stat-label">⭐ XP</span>
              <span className="profile-dropdown-stat-value">{xpVal}</span>
            </div>
            <div className="profile-dropdown-stat-item">
              <span className="profile-dropdown-stat-label">🌱 Avg CO₂</span>
              <span className="profile-dropdown-stat-value">{avgCo2Val}</span>
            </div>
          </div>
        </div>

        <hr className="profile-dropdown-divider" />

        {/* Section 3: Actions */}
        <div className="profile-dropdown-actions">
          <div className="profile-dropdown-section-title">Actions</div>
          <button
            onClick={() => {
              setIsEditingName(true)
              setDraftName(displayName)
              setIsEditingCity(false)
            }}
            className="clay-btn btn-sm btn-ghost btn-full"
            style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '13px' }}
            role="menuitem"
          >
            ✏️ Edit Name
          </button>
          <button
            onClick={() => {
              setIsEditingCity(true)
              setDraftCity(displayCity === 'City Not Set' ? '' : displayCity)
              setIsEditingName(false)
            }}
            className="clay-btn btn-sm btn-ghost btn-full"
            style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '13px' }}
            role="menuitem"
          >
            🏙️ Change City
          </button>
        </div>

        <hr className="profile-dropdown-divider" />

        {/* Section 4: Logout */}
        <button
          onClick={onLogout}
          className="clay-btn btn-sm btn-red btn-full"
          style={{ padding: '10px 16px', fontSize: '14px' }}
          role="menuitem"
        >
          🚪 Logout
        </button>
      </div>
    </>
  )
}

export default memo(ProfileDropdown)
