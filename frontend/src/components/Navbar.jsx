import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import ProfileDropdown from './ProfileDropdown'
import { LS_KEYS } from '../utils/constants'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/track', label: 'Track', icon: '📝' },
  { to: '/location', label: 'Mera Shehar 🌍', icon: '🌍' },
  { to: '/challenges', label: 'Challenges', icon: '🎯' },
  { to: '/insights', label: 'Insights', icon: '📈' },
]

/**
 * Navbar - Navigation bar component rendering header and footer menus depending on viewport size.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function Navbar({ userId, userName, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [streak, setStreak] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [displayName, setDisplayName] = useState(userName)

  // Sync displayName when userName prop changes (from App.jsx)
  useEffect(() => {
    setDisplayName(userName)
  }, [userName])

  const fetchStreak = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`${API}/api/activities/dashboard/${userId}/summary`)
      if (res.ok) {
        const data = await res.json()
        setStreak(data.streak_days || 0)
      }
    } catch (err) {
      // Quietly fail as per rules (no console.error in production)
    }
  }, [userId])

  useEffect(() => {
    fetchStreak()

    // Listen to custom events to update streak when activity is logged
    const handleUpdate = () => {
      fetchStreak()
    }

    // Listen for profile changes to update display name immediately
    const handleProfileUpdate = () => {
      const storedName = localStorage.getItem(LS_KEYS.USER_NAME) || ''
      if (storedName) setDisplayName(storedName)
      fetchStreak() // Also refresh streak in case data changed
    }

    window.addEventListener('activityLogged', handleUpdate)
    window.addEventListener('streakUpdated', handleUpdate)
    window.addEventListener('profileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('activityLogged', handleUpdate)
      window.removeEventListener('streakUpdated', handleUpdate)
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [fetchStreak])

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout()
    } else {
      localStorage.clear()
      window.location.href = '/'
    }
  }

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main Navigation">
        <NavLink to="/dashboard" className="navbar-logo" aria-label="HaraBharat home page">
          <span className="navbar-logo-emoji">🌿</span>
          <span className="navbar-logo-text">HaraBharat</span>
        </NavLink>

        <div className="navbar-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              aria-label={`${item.label} page par jao`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="user-chip-container" style={{ position: 'relative' }}>
            <span
              id="user-profile-chip"
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="clay-pill pill-mint"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              aria-label={`Logged in as ${displayName}, streak is ${streak} days. Click to open profile menu.`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsDropdownOpen(prev => !prev)
                }
              }}
            >
              👤 {displayName} | 🔥 {streak} din
            </span>
            {isDropdownOpen && (
              <ProfileDropdown
                userId={userId}
                userName={displayName}
                streak={streak}
                onLogout={handleLogoutClick}
                onClose={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (Section 10) */}
      <nav className="bottom-nav" role="navigation" aria-label="Mobile Navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-label={`${item.label} page par jao`}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          )
        })}
        <button
          onClick={handleLogoutClick}
          className="bottom-nav-item"
          aria-label="Logout karo"
        >
          <span className="bottom-nav-icon">🚪</span>
          <span className="bottom-nav-label">Logout</span>
        </button>
      </nav>
    </>
  )
}

export default Navbar
