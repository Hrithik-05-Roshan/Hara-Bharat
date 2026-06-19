import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
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

function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem(LS_KEYS.USER_ID) || '')
  const [userName, setUserName] = useState(() => localStorage.getItem(LS_KEYS.USER_NAME) || '')

  const handleAuth = useCallback((id, name) => {
    localStorage.setItem(LS_KEYS.USER_ID, id)
    localStorage.setItem(LS_KEYS.USER_NAME, name)
    setUserId(id)
    setUserName(name)
  }, [])

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
