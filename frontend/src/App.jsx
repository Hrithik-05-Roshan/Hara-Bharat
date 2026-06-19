import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import Navbar from './components/Navbar'
import EcoMitraChat from './components/EcoMitraChat'
import Home from './pages/Home'
import Onboard from './pages/Onboard'
import DashboardPage from './pages/DashboardPage'
import Track from './pages/Track'
import Challenges from './pages/Challenges'
import Insights from './pages/Insights'
import LocationPage from './pages/Location'
import { LS_KEYS } from './utils/constants'

// Apply saved theme before first paint to prevent flash
;(function initTheme() {
  const saved = localStorage.getItem(LS_KEYS.THEME)
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})()

function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem(LS_KEYS.USER_ID) || '')
  const [userName, setUserName] = useState(() => localStorage.getItem(LS_KEYS.USER_NAME) || '')
  const [userCity, setUserCity] = useState(() => localStorage.getItem(LS_KEYS.USER_CITY) || '')
  const [theme, setTheme] = useState(() => localStorage.getItem(LS_KEYS.THEME) || 'light')

  const handleAuth = useCallback((id, name) => {
    localStorage.setItem(LS_KEYS.USER_ID, id)
    localStorage.setItem(LS_KEYS.USER_NAME, name)
    setUserId(id)
    setUserName(name)
  }, [])

  // Listen for profileUpdated events dispatched by ProfileDropdown or other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      const storedName = localStorage.getItem(LS_KEYS.USER_NAME) || ''
      const storedCity = localStorage.getItem(LS_KEYS.USER_CITY) || ''
      setUserName(storedName)
      setUserCity(storedCity)
    }

    const handleThemeUpdate = () => {
      const storedTheme = localStorage.getItem(LS_KEYS.THEME) || 'light'
      setTheme(storedTheme)
      document.documentElement.setAttribute('data-theme', storedTheme === 'dark' ? 'dark' : '')
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)
    window.addEventListener('themeUpdated', handleThemeUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
      window.removeEventListener('themeUpdated', handleThemeUpdate)
    }
  }, [])

  // Sync theme attribute on mount and when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '')
  }, [theme])

  // When user first logs in via onboarding (which sets city), pick it up
  useEffect(() => {
    if (userId) {
      const storedCity = localStorage.getItem(LS_KEYS.USER_CITY) || localStorage.getItem('userCity') || ''
      if (storedCity && storedCity !== userCity) {
        setUserCity(storedCity)
      }
    }
  }, [userId])

  const isLoggedIn = Boolean(userId)

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-nav">Main content par jao</a>
      {isLoggedIn && <Navbar userId={userId} userName={userName} onLogout={() => handleAuth('', '')} />}
      <main id="main-content" role="main">
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Home />} />
          <Route path="/onboard" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Onboard onAuth={handleAuth} />} />
          <Route path="/dashboard" element={isLoggedIn ? <DashboardPage userId={userId} userName={userName} /> : <Navigate to="/" />} />
          <Route path="/track" element={isLoggedIn ? <Track userId={userId} /> : <Navigate to="/" />} />
          <Route path="/challenges" element={isLoggedIn ? <Challenges userId={userId} /> : <Navigate to="/" />} />
          <Route path="/insights" element={isLoggedIn ? <Insights userId={userId} /> : <Navigate to="/" />} />
          <Route path="/location" element={isLoggedIn ? <LocationPage userId={userId} /> : <Navigate to="/" />} />
        </Routes>
      </main>
      {isLoggedIn && <EcoMitraChat userId={userId} />}
      <div aria-live="polite" className="sr-only" id="aria-live-region"></div>
    </BrowserRouter>
  )
}

export default App
