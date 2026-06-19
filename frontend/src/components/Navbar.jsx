import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import ProfileDropdown from './ProfileDropdown'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/track', label: 'Track', icon: '📝' },
  { to: '/location', label: 'Mera Shehar 🌍', icon: '🌍' },
  { to: '/challenges', label: 'Challenges', icon: '🎯' },
  { to: '/insights', label: 'Insights', icon: '📈' },
]

function Navbar({ userId, userName, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [streak, setStreak] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
    window.addEventListener('activityLogged', handleUpdate)
    window.addEventListener('streakUpdated', handleUpdate)

    return () => {
      window.removeEventListener('activityLogged', handleUpdate)
      window.removeEventListener('streakUpdated', handleUpdate)
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
              aria-label={`Logged in as ${userName}, streak is ${streak} days. Click to open profile menu.`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsDropdownOpen(prev => !prev)
                }
              }}
            >
              👤 {userName} | 🔥 {streak} din
            </span>
            {isDropdownOpen && (
              <ProfileDropdown
                userId={userId}
                userName={userName}
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
