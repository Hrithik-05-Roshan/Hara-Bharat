import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Onboard - Onboarding and authentication page handling user registration and login via PIN.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function Onboard({ onAuth }) {
  const [mode, setMode] = useState('register') // 'register' or 'login'
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  
  // Validation and API Errors
  const [nameError, setNameError] = useState('')
  const [cityError, setCityError] = useState('')
  const [pinError, setPinError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const navigate = useNavigate()

  // Refs for OTP PIN inputs to handle auto-focus and backspace
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  useEffect(() => {
    // Reset fields on mode change
    setName('')
    setCity('')
    setPinDigits(['', '', '', ''])
    setNameError('')
    setCityError('')
    setPinError('')
    setServerError('')
  }, [mode])

  const handlePinChange = (index, value) => {
    // Keep only numbers
    const cleanValue = value.replace(/[^0-9]/g, '')
    if (!cleanValue) {
      const newDigits = [...pinDigits]
      newDigits[index] = ''
      setPinDigits(newDigits)
      return
    }

    const digit = cleanValue[cleanValue.length - 1] // Get last character
    const newDigits = [...pinDigits]
    newDigits[index] = digit
    setPinDigits(newDigits)

    // Focus next input if not last
    if (index < 3) {
      pinRefs[index + 1].current?.focus()
    }
  }

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (pinDigits[index] === '') {
        // Focus previous input if current is empty and not first
        if (index > 0) {
          const newDigits = [...pinDigits]
          newDigits[index - 1] = ''
          setPinDigits(newDigits)
          pinRefs[index - 1].current?.focus()
        }
      } else {
        // Just clear current
        const newDigits = [...pinDigits]
        newDigits[index] = ''
        setPinDigits(newDigits)
      }
    }
  }

  const handlePinPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('Text').replace(/[^0-9]/g, '').slice(0, 4)
    if (pastedData) {
      const newDigits = [...pinDigits]
      for (let i = 0; i < Math.min(pastedData.length, 4); i++) {
        newDigits[i] = pastedData[i]
      }
      setPinDigits(newDigits)
      // Focus the last updated or next
      const nextFocus = Math.min(pastedData.length, 3)
      pinRefs[nextFocus].current?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNameError('')
    setCityError('')
    setPinError('')
    setServerError('')

    let valid = true

    // Check Name
    if (!name.trim()) {
      setNameError('Naam likhna zaroori hai! 👤')
      valid = false
    }

    // Check City (Only in register mode)
    if (mode === 'register' && !city.trim()) {
      setCityError('Shehar ka naam zaroori hai! 🏙️')
      valid = false
    }

    // Check PIN
    const fullPin = pinDigits.join('')
    if (fullPin.length < 4) {
      setPinError('4-digit PIN enter karein! 🔐')
      valid = false
    }

    if (!valid) return

    setLoading(true)
    try {
      const endpoint = mode === 'register' ? '/api/users/register' : '/api/users/login'
      const body = mode === 'register' 
        ? { name: name.trim(), city: city.trim(), pin: fullPin }
        : { name: name.trim(), pin: fullPin }

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Kuch galat ho gaya! Dobara try karein.')
      }

      // Success
      setSuccessMessage(data.message || 'Swagat hai! 🎉')
      setShowSuccessOverlay(true)
      
      // Save auth details
      onAuth(data.user_id, data.name)

      // Redirect after 1.5s (corresponds to success animation duration)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)

    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboard-page container">
      {/* Decorative background blobs to match hero styling */}
      <div className="hero-blob-1" aria-hidden="true" style={{ top: '-50px', left: '-50px' }}></div>
      <div className="hero-blob-2" aria-hidden="true" style={{ bottom: '-50px', right: '-50px' }}></div>

      <div className="clay-card onboard-card no-hover anim-fade-up">
        <span className="onboard-emoji-header" aria-label="Sprout emoji">🌿</span>
        
        <h1 className="onboard-title">
          {mode === 'register' ? 'Swagat Hai! 🎉' : 'Wapas Aaye! 🙏'}
        </h1>
        
        <p className="onboard-subtitle">
          Koi email nahi, koi password nahi — bas naam aur ek secret PIN.
        </p>

        {/* Tab System — Register / Login toggle */}
        <div className="onboard-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            onClick={() => setMode('register')}
            className={`clay-btn btn-sm btn-full ${mode === 'register' ? '' : 'btn-ghost'}`}
          >
            🌱 Register
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            onClick={() => setMode('login')}
            className={`clay-btn btn-sm btn-full ${mode === 'login' ? '' : 'btn-ghost'}`}
          >
            🔑 Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="onboard-form" noValidate>
          {/* Field 1 — Naam */}
          <div>
            <label htmlFor="onboard-name-input" className="input-label">👤 Aapka Naam</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">👤</span>
              <input
                id="onboard-name-input"
                type="text"
                className="clay-input has-icon"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jaise — Rahul, Priya, Arjun..."
                required
              />
            </div>
            {nameError && (
              <div className="error-pill" role="alert" aria-live="polite">
                {nameError}
              </div>
            )}
          </div>

          {/* Field 2 — Shehar (only for register) */}
          {mode === 'register' && (
            <div>
              <label htmlFor="onboard-city-input" className="input-label">🏙️ Aapka Shehar</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">🏙️</span>
                <input
                  id="onboard-city-input"
                  type="text"
                  className="clay-input has-icon"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai, Delhi, Asansol..."
                  required
                />
              </div>
              {cityError && (
                <div className="error-pill" role="alert" aria-live="polite">
                  {cityError}
                </div>
              )}
            </div>
          )}

          {/* Field 3 — 4-Digit PIN */}
          <div>
            <label className="input-label" id="pin-label">🔐 Apna Secret PIN</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '600' }}>
              Yaad rakhna! Wapas aane ke liye zaroori hai.
            </p>
            
            <div className="pin-inputs-row" aria-labelledby="pin-label">
              {pinDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  className="clay-input pin-input-box"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  onPaste={i === 0 ? handlePinPaste : undefined}
                  aria-label={`Digit ${i + 1} of PIN`}
                  required
                />
              ))}
            </div>
            {pinError && (
              <div className="error-pill" role="alert" aria-live="polite">
                {pinError}
              </div>
            )}
          </div>

          {/* Global API / Server error */}
          {serverError && (
            <div className="error-pill" role="alert" aria-live="polite" style={{ width: '100%' }}>
              ❌ {serverError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="clay-btn btn-lg btn-full"
            style={{ background: 'linear-gradient(135deg, var(--clay-green), var(--clay-green-dk))', color: 'white', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'register' ? '🚀 HaraBharat Shuru Karo' : 'Vapas Swagat Hai! 🙏'}
          </button>

          <div className="onboard-divider">— ya —</div>

          {/* Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            className="clay-btn btn-ghost btn-full"
          >
            {mode === 'register' ? '🔑 Login Karo' : '🌱 Register Karo'}
          </button>
        </form>

        {/* Bottom Trust Pills */}
        <div className="trust-pills-row">
          <span className="clay-pill pill-white">🔒 No Email</span>
          <span className="clay-pill pill-white">🚫 No Spam</span>
          <span className="clay-pill pill-white">💚 100% Private</span>
        </div>
      </div>

      {/* Success Animation Overlay (Section 11) */}
      {showSuccessOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(223, 242, 225, 0.96)',
            backdropFilter: 'blur(20px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="anim-bounce-in" style={{ fontSize: '100px', marginBottom: '20px' }}>
            ✅
          </div>
          <h2 className="onboard-title" style={{ fontSize: '36px' }}>
            {successMessage}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 800, marginTop: '8px' }}>
            Aapka account set ho raha hai... 🌍
          </p>
        </div>
      )}
    </div>
  )
}

export default Onboard
