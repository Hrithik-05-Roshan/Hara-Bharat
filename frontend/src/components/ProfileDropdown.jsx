import { useState, useEffect, useRef, memo } from 'react'
import { API_BASE_URL, LS_KEYS } from '../utils/constants'

/**
 * ProfileDropdown - Component displaying the user profile quick details, stats, theme toggle, and settings.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function ProfileDropdown({ userId, userName, streak, onLogout, onClose }) {
  const [profileData, setProfileData] = useState(null)
  const [summaryData, setSummaryData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Display states — initialized from localStorage (source of truth), then API
  const [displayName, setDisplayName] = useState(() => localStorage.getItem(LS_KEYS.USER_NAME) || userName)
  const [displayCity, setDisplayCity] = useState(() => localStorage.getItem(LS_KEYS.USER_CITY) || 'City Not Set')

  // Edit inline states
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(displayName)

  const [isEditingCity, setIsEditingCity] = useState(false)
  const [draftCity, setDraftCity] = useState('')

  // Theme toggle
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem(LS_KEYS.THEME) || 'light')

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

  // Fetch profile and summary from existing APIs
  useEffect(() => {
    let active = true
    async function loadProfile() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile/${userId}`)
        if (res.ok && active) {
          const data = await res.json()
          setProfileData(data)
          // Only use API data if localStorage doesn't already have overrides
          const storedName = localStorage.getItem(LS_KEYS.USER_NAME)
          const storedCity = localStorage.getItem(LS_KEYS.USER_CITY)
          if (data.name && !storedName) {
            setDisplayName(data.name)
            setDraftName(data.name)
          }
          if (data.city) {
            // If no locally-overridden city, use the one from DB
            if (!storedCity) {
              setDisplayCity(data.city)
              setDraftCity(data.city)
              // Persist the API city to localStorage so Location page picks it up
              localStorage.setItem(LS_KEYS.USER_CITY, data.city)
              localStorage.setItem('userCity', data.city) // for Location.jsx compat
            }
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

  // Name save handler — persists to localStorage & dispatches sync event
  const handleSaveName = () => {
    const trimmed = draftName.trim()
    if (trimmed) {
      setDisplayName(trimmed)
      localStorage.setItem(LS_KEYS.USER_NAME, trimmed)
      window.dispatchEvent(new Event('profileUpdated'))
    }
    setIsEditingName(false)
  }

  // City save handler — persists to localStorage & dispatches sync event
  const handleSaveCity = () => {
    const trimmed = draftCity.trim()
    const newCity = trimmed || 'City Not Set'
    setDisplayCity(newCity)
    if (trimmed) {
      localStorage.setItem(LS_KEYS.USER_CITY, trimmed)
      localStorage.setItem('userCity', trimmed) // for Location.jsx compat
    }
    window.dispatchEvent(new Event('profileUpdated'))
    setIsEditingCity(false)
  }

  // Theme toggle handler
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    setCurrentTheme(newTheme)
    localStorage.setItem(LS_KEYS.THEME, newTheme)
    document.documentElement.setAttribute('data-theme', newTheme === 'dark' ? 'dark' : '')
    window.dispatchEvent(new Event('themeUpdated'))
  }

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
          background: var(--bg-card);
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
          background: var(--bg-deeper);
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

        .profile-dropdown-theme-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .profile-dropdown-theme-toggle {
          position: relative;
          width: 56px;
          height: 30px;
          border-radius: 15px;
          border: none;
          cursor: pointer;
          transition: background 0.3s ease;
          box-shadow: var(--s-input);
          display: flex;
          align-items: center;
          padding: 0 4px;
        }
        .profile-dropdown-theme-toggle.light {
          background: var(--clay-lime);
        }
        .profile-dropdown-theme-toggle.dark {
          background: #3a3a5c;
        }
        .profile-dropdown-theme-toggle .theme-knob {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 2px 2px 4px rgba(0,0,0,0.15);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .profile-dropdown-theme-toggle.dark .theme-knob {
          transform: translateX(26px);
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName() }}
                className="profile-dropdown-inline-input"
                autoFocus
                placeholder="Name"
                maxLength={50}
              />
              <button
                onClick={handleSaveName}
                className="clay-btn btn-sm profile-dropdown-edit-btn"
                aria-label="Save name"
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCity() }}
                className="profile-dropdown-inline-input"
                autoFocus
                placeholder="City"
                maxLength={100}
              />
              <button
                onClick={handleSaveCity}
                className="clay-btn btn-sm profile-dropdown-edit-btn"
                aria-label="Save city"
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

        {/* Section 4: Theme Toggle */}
        <div className="profile-dropdown-theme-row">
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-mid)' }}>
            {currentTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </span>
          <button
            className={`profile-dropdown-theme-toggle ${currentTheme}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
            role="menuitem"
          >
            <span className="theme-knob">
              {currentTheme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>
        </div>

        <hr className="profile-dropdown-divider" />

        {/* Section 5: Logout */}
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
