import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Inline Leaflet Map component to avoid heavy external bundles
/**
 * LeafletMap - Inline map component that dynamically imports and loads Leaflet library to display markers.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function LeafletMap({ lat, lng, spots }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    const initMap = () => {
      if (!window.L || !mapRef.current) return

      // Clean up previous map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      // Initialize map
      const map = window.L.map(mapRef.current).setView([lat, lng], 12)
      mapInstanceRef.current = map

      // Add Tile Layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      // Add spots
      spots.forEach((spot) => {
        const marker = window.L.marker([spot.lat, spot.lng]).addTo(map)
        marker.bindPopup(`
          <div style="font-family: 'Nunito', sans-serif; padding: 4px; max-width: 200px;">
            <strong style="font-size: 14px; color: #1e3a27; display: block; margin-bottom: 2px;">${spot.name}</strong>
            <span style="display: inline-block; padding: 2px 6px; font-size: 10px; background: #CCE8CF; border-radius: 12px; font-weight: 800; color: #155724; margin-bottom: 6px;">
              ${spot.category}
            </span>
            <p style="margin: 0; font-size: 12px; color: #555;">${spot.benefit}</p>
          </div>
        `)
      })
    }

    if (!window.L) {
      // Dynamically load CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      // Dynamically load JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        if (isMounted) initMap()
      }
      document.head.appendChild(script)
    } else {
      initMap()
    }

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [lat, lng, spots])

  return (
    <div
      ref={mapRef}
      style={{
        height: '350px',
        width: '100%',
        borderRadius: '24px',
        border: '6px solid var(--clay-border-white)',
        boxShadow: 'var(--clay-shadow-sm)',
        zIndex: 1,
        position: 'relative'
      }}
    />
  )
}

/**
 * LocationPage - Page component showing the local environmental weather, AQI, comparison statistics, and action challenges.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function LocationPage({ userId }) {
  // Initialize state
  const [city, setCity] = useState(() => localStorage.getItem('userCity') || 'Kolkata')
  const [selectedCityInput, setSelectedCityInput] = useState('')
  const [showCityPicker, setShowCityPicker] = useState(false)

  const [weatherData, setWeatherData] = useState(null)
  const [insights, setInsights] = useState('')
  const [comparison, setComparison] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [spotsData, setSpotsData] = useState(null)

  const [loadingWeather, setLoadingWeather] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [loadingComparison, setLoadingComparison] = useState(true)
  const [loadingChallenges, setLoadingChallenges] = useState(true)

  const [acceptedChallenges, setAcceptedChallenges] = useState({})
  const [toastMsg, setToastMsg] = useState('')

  // Simulator State
  const [usersPercent, setUsersPercent] = useState(25) // 25% of city users
  const [acTempAdjust, setAcTempAdjust] = useState(2) // 2 deg increase

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  // Fetch API handlers
  const fetchAllLocationData = useCallback(async (targetCity) => {
    setLoadingWeather(true)
    setLoadingInsights(true)
    setLoadingComparison(true)
    setLoadingChallenges(true)

    try {
      // 1. Fetch Weather/AQI
      const weatherRes = await fetch(`${API}/api/location/weather?city=${encodeURIComponent(targetCity)}`)
      if (!weatherRes.ok) throw new Error('Weather API failed')
      const weatherJson = await weatherRes.json()
      setWeatherData(weatherJson)
      setLoadingWeather(false)

      // 2. Fetch City comparison metrics
      const compRes = await fetch(`${API}/api/location/comparison/${userId}`)
      let userScore = 3.5
      if (compRes.ok) {
        const compJson = await compRes.json()
        setComparison(compJson)
        userScore = compJson.user_avg
      }
      setLoadingComparison(false)

      // 3. Fetch AI Insights
      try {
        const insightsRes = await fetch(`${API}/api/location/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city: weatherJson.city,
            aqi: weatherJson.aqi,
            temp: weatherJson.temp,
            humidity: weatherJson.humidity,
            carbon_score: userScore
          })
        })
        if (insightsRes.ok) {
          const insightsJson = await insightsRes.json()
          setInsights(insightsJson.recommendation)
        }
      } catch (err) {
        setInsights("Mausam normal hai, green options select karein! 🌿")
      }
      setLoadingInsights(false)

      // 4. Fetch local challenges
      const chalRes = await fetch(`${API}/api/location/challenges?city=${encodeURIComponent(targetCity)}`)
      if (chalRes.ok) {
        const chalJson = await chalRes.json()
        setChallenges(chalJson.challenges || [])
      }
      setLoadingChallenges(false)

      // 5. Fetch green spots mapping
      const spotsRes = await fetch(`${API}/api/location/green-spots?city=${encodeURIComponent(targetCity)}`)
      if (spotsRes.ok) {
        const spotsJson = await spotsRes.json()
        setSpotsData(spotsJson)
      }
    } catch (err) {
      showToast('Kucch data fetch nahi ho paya. Dobara try karein.')
    }
  }, [userId])

  useEffect(() => {
    if (city) {
      fetchAllLocationData(city)
    }
  }, [city, fetchAllLocationData])

  const handleCityChangeSubmit = (e) => {
    e.preventDefault()
    if (selectedCityInput.trim()) {
      const formattedCity = selectedCityInput.trim()
      setCity(formattedCity)
      localStorage.setItem('userCity', formattedCity)
      setShowCityPicker(false)
      setSelectedCityInput('')
      showToast(`City changed to ${formattedCity}! 🌍`)
    }
  }

  const handleAcceptChallenge = (index, challengeText) => {
    setAcceptedChallenges(prev => ({ ...prev, [index]: true }))
    showToast(`Challenge Accept Kiya: "${challengeText}"! +25 XP 🎯`)
    // Dispatch event to sync XP on header
    window.dispatchEvent(new Event('streakUpdated'))
  }

  // Simulator Calculations
  // Assumes a medium Indian city has 10,000 active app users
  const totalCo2SavedDaily = (
    (usersPercent * 100) * 1.5 + // 1.5kg CO2 saved daily per user carpooling
    (acTempAdjust * 0.8) * 10000 // 0.8kg per degree saved per household
  ).toFixed(0)

  const yearlyCo2Tons = ((totalCo2SavedDaily * 365) / 1000).toFixed(1)

  // Color Coding for AQI
  const getAqiColorClass = (aqi) => {
    if (aqi <= 50) return 'pill-green'
    if (aqi <= 100) return 'pill-yellow'
    if (aqi <= 150) return 'pill-orange'
    return 'pill-red'
  }

  return (
    <div className="challenges-page-container anim-fade-up" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div 
          className="clay-card" 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            background: 'var(--clay-green)',
            color: 'white',
            fontWeight: 800,
            padding: '16px 24px',
            borderRadius: '16px',
            animation: 'fadeInUp 0.3s ease-out'
          }}
          role="alert"
        >
          {toastMsg}
        </div>
      )}

      {/* HEADER SECTION */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="track-title">Mera Shehar 🌍</h1>
          <p className="track-subtitle">Local environmental intelligence aur green actions mapping</p>
        </div>
        <button 
          onClick={() => setShowCityPicker(prev => !prev)} 
          className="clay-btn btn-mint"
        >
          📍 Change City ({city})
        </button>
      </header>

      {/* CITY PICKER MODAL/PANEL */}
      {showCityPicker && (
        <section className="clay-card cc-green" style={{ marginBottom: '24px', padding: '20px' }}>
          <h3 className="chart-title" style={{ fontSize: '18px', marginBottom: '12px' }}>Apna shehar choose karo</h3>
          <form onSubmit={handleCityChangeSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g., Delhi, Mumbai, Bangalore..."
              value={selectedCityInput}
              onChange={(e) => setSelectedCityInput(e.target.value)}
              className="clay-input"
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button type="submit" className="clay-btn btn-green">Update</button>
            <button type="button" onClick={() => setShowCityPicker(false)} className="clay-btn btn-white">Cancel</button>
          </form>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Delhi', 'Kolkata', 'Mumbai', 'Bangalore', 'Asansol'].map(cName => (
              <button 
                key={cName}
                type="button" 
                onClick={() => {
                  setCity(cName)
                  localStorage.setItem('userCity', cName)
                  setShowCityPicker(false)
                  showToast(`City set to ${cName}! 🌍`)
                }} 
                className="clay-pill pill-white"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                📍 {cName}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* GRID LAYOUT FOR SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
        
        {/* SECTION 1 — CITY ENVIRONMENT SNAPSHOT */}
        <section className="clay-card no-hover" style={{ padding: '28px', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-deeper))' }}>
          {loadingWeather ? (
            <div style={{ padding: '20px' }}>
              <div className="skeleton" style={{ width: '30%', height: '24px', marginBottom: '16px' }} />
              <div className="skeleton" style={{ width: '80%', height: '14px', marginBottom: '10px' }} />
              <div className="skeleton" style={{ width: '50%', height: '14px' }} />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span className="clay-pill pill-white" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>
                    LOCAL WEATHER & AQI
                  </span>
                  <h2 className="chart-title" style={{ fontSize: '32px', margin: '8px 0 4px', fontWeight: 900 }}>
                    {weatherData.city}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px' }}>
                    Aaj aapke area ki environment health
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="clay-card" style={{ padding: '12px 18px', textAlign: 'center', minWidth: '90px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>TEMP</span>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-dark)' }}>{weatherData.temp}°C</div>
                  </div>
                  <div className="clay-card" style={{ padding: '12px 18px', textAlign: 'center', minWidth: '90px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>HUMIDITY</span>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-dark)' }}>{weatherData.humidity}%</div>
                  </div>
                </div>
              </div>

              {/* AQI & Risk Details Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '24px' }}>
                <div className="clay-card no-hover" style={{ padding: '16px', borderLeft: '8px solid var(--clay-green)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>AIR QUALITY INDEX</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <span className="chart-title" style={{ fontSize: '36px', fontWeight: 900 }}>{weatherData.aqi}</span>
                    <span className={`clay-pill ${getAqiColorClass(weatherData.aqi)}`} style={{ fontWeight: 800 }}>
                      {weatherData.status}
                    </span>
                  </div>
                </div>

                <div className="clay-card no-hover" style={{ padding: '16px', borderLeft: '8px solid var(--clay-orange)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>CARBON RISK LEVEL</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                    <span className="chart-title" style={{ fontSize: '32px', fontWeight: 900 }}>
                      {weatherData.risk}
                    </span>
                    <span className="clay-pill pill-white" style={{ fontWeight: 800 }}>
                      ⚠️ Avoid Exhaust
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2 — AI LOCAL INSIGHTS */}
        <section className="clay-card cc-green no-hover" style={{ padding: '28px' }}>
          <h2 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🤖</span> Eco Mitra Ka Shehar Analysis
          </h2>
          {loadingInsights ? (
            <div style={{ marginTop: '16px' }}>
              <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ width: '40%', height: '14px' }} />
            </div>
          ) : (
            <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '40px' }} aria-hidden="true">💡</div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                  background: 'rgba(255, 255, 255, 0.5)',
                  padding: '20px',
                  borderRadius: '20px',
                  border: '2px solid var(--clay-border-white)'
                }}>
                  {insights}
                </p>
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--clay-green-dk)' }}>
                  ⚡ Real-time environmental suggestions dynamically customized by Eco Mitra AI.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3 — CITY VS YOU */}
        <section className="clay-card no-hover" style={{ padding: '28px' }}>
          <h2 className="chart-title" style={{ marginBottom: '8px' }}>📊 City vs Aapka Score</h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '24px' }}>
            Dekhein aapki local performance comparison metrics kahan khadi hai
          </p>

          {loadingComparison ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: '100px' }} />
              ))}
            </div>
          ) : (
            <div>
              {/* Badge Callout */}
              <div 
                className="clay-card cc-green" 
                style={{ 
                  padding: '16px', 
                  marginBottom: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--clay-green-dk)' }}>
                    CURRENT RANKING
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>
                    Aap apne city average users se {' '}
                    <span style={{ color: comparison.comparison_percentage >= 0 ? 'var(--clay-green-dk)' : 'var(--clay-red-dk)' }}>
                      {Math.abs(comparison.comparison_percentage)}% {' '}
                      {comparison.comparison_percentage >= 0 ? 'behtar' : 'piche'}
                    </span> perform kar rahe hain.
                  </div>
                </div>
                <span className="clay-pill pill-yellow" style={{ fontSize: '14px', fontWeight: 900, padding: '8px 16px' }}>
                  {comparison.ranking_badge}
                </span>
              </div>

              {/* 4 Clay Statistic Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="clay-card no-hover" style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800 }}>AAPKA WEEKLY AVG</span>
                  <div className="chart-title" style={{ fontSize: '28px', margin: '8px 0', color: 'var(--clay-green-dk)' }}>
                    {comparison.user_avg} kg
                  </div>
                  <div className="clay-progress-track" style={{ height: '8px' }}>
                    <div className="clay-progress-fill" style={{ width: `${Math.min((comparison.user_avg / 10) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="clay-card no-hover" style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800 }}>CITY USERS AVG</span>
                  <div className="chart-title" style={{ fontSize: '28px', margin: '8px 0' }}>
                    {comparison.city_avg} kg
                  </div>
                  <div className="clay-progress-track" style={{ height: '8px' }}>
                    <div className="clay-progress-fill" style={{ width: `${Math.min((comparison.city_avg / 10) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="clay-card no-hover" style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800 }}>RECOMMENDED TARGET</span>
                  <div className="chart-title" style={{ fontSize: '28px', margin: '8px 0', color: 'var(--clay-green-dk)' }}>
                    {comparison.target} kg
                  </div>
                  <div className="clay-progress-track" style={{ height: '8px' }}>
                    <div className="clay-progress-fill" style={{ width: `${Math.min((comparison.target / 10) * 100, 100)}%` }} />
                  </div>
                </div>

                <div className="clay-card no-hover" style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800 }}>NATIONAL AVERAGE</span>
                  <div className="chart-title" style={{ fontSize: '28px', margin: '8px 0' }}>
                    {comparison.national_avg} kg
                  </div>
                  <div className="clay-progress-track" style={{ height: '8px' }}>
                    <div className="clay-progress-fill" style={{ width: `${Math.min((comparison.national_avg / 10) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4 — ECO ACTION CENTER */}
        <section className="clay-card no-hover" style={{ padding: '28px' }}>
          <h2 className="chart-title" style={{ marginBottom: '8px' }}>🚀 Local Eco Action Center</h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '24px' }}>
            {city} ke custom environmental problems ko tackle karne ke liye actions accept karein
          </p>

          {loadingChallenges ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: '80px' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {challenges.map((c, index) => (
                <div 
                  key={index} 
                  className={`clay-card no-hover ${acceptedChallenges[index] ? 'cc-green' : ''}`}
                  style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}
                >
                  <div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span className="clay-pill pill-mint" style={{ fontSize: '10px' }}>
                        Saving: {c.co2_saving}kg CO₂
                      </span>
                      <span className="clay-pill pill-white" style={{ fontSize: '10px' }}>
                        {c.difficulty}
                      </span>
                      <span className="clay-pill pill-yellow" style={{ fontSize: '10px' }}>
                        {'⭐'.repeat(c.impact)}
                      </span>
                    </div>
                    <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)', marginBottom: '16px' }}>
                      {c.text}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleAcceptChallenge(index, c.text)}
                    disabled={acceptedChallenges[index]}
                    className={`clay-btn btn-sm ${acceptedChallenges[index] ? 'btn-white' : 'btn-green'}`}
                    style={{ width: '100%' }}
                  >
                    {acceptedChallenges[index] ? '✓ Active Challenge' : '🎯 Accept Challenge'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 5 — GREEN SPOTS NEAR YOU (MAP) */}
        <section className="clay-card no-hover" style={{ padding: '28px' }}>
          <h2 className="chart-title" style={{ marginBottom: '8px' }}>🗺️ Green Spots Near You</h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '20px' }}>
            {city} ke eco-friendly areas, EV charging points, and public transit nodes explore karein
          </p>

          {spotsData ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {/* Leaflet Map Component */}
              <LeafletMap lat={spotsData.lat} lng={spotsData.lng} spots={spotsData.spots} />
              
              {/* Legend List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {spotsData.spots.map((spot, i) => (
                  <div key={i} className="clay-card no-hover" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }} aria-hidden="true">
                      {spot.category === 'Park' ? '🌳' : spot.category === 'EV Charging' ? '⚡' : '🚇'}
                    </span>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text-dark)' }}>{spot.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{spot.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="skeleton" style={{ height: '350px' }} />
          )}
        </section>

        {/* SECTION 6 — FUTURE IMPACT SIMULATOR */}
        <section className="clay-card no-hover" style={{ padding: '28px', background: 'linear-gradient(135deg, var(--bg-card), var(--bg))' }}>
          <h2 className="chart-title" style={{ marginBottom: '8px' }}>🔮 Shehar Future Impact Simulator</h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '24px' }}>
            Agar {city} ke log milkar carbon habits change karein, toh kya impact hoga? Slider drag karke check karein!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            {/* Input Slider 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 800 }}>
                <span>🚗 % users carpooling or public transport opting:</span>
                <span className="clay-pill pill-mint">{usersPercent}% Users</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={usersPercent} 
                onChange={(e) => setUsersPercent(parseInt(e.target.value))} 
                className="clay-input"
                style={{ width: '100%', height: '10px', padding: 0, cursor: 'pointer' }}
              />
            </div>

            {/* Input Slider 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 800 }}>
                <span>❄️ AC temperature adjustment (increase by):</span>
                <span className="clay-pill pill-yellow">+{acTempAdjust}°C</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="5" 
                value={acTempAdjust} 
                onChange={(e) => setAcTempAdjust(parseInt(e.target.value))} 
                className="clay-input"
                style={{ width: '100%', height: '10px', padding: 0, cursor: 'pointer' }}
              />
            </div>

            {/* Result Showcase */}
            <div 
              className="clay-card no-hover" 
              style={{ 
                padding: '24px', 
                textAlign: 'center', 
                background: 'var(--bg-deeper)', 
                border: '4px solid var(--clay-border-white)' 
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                ESTIMATED DAILY SAVINGS
              </span>
              <div className="chart-title" style={{ fontSize: '36px', fontWeight: 900, color: 'var(--clay-green-dk)', margin: '8px 0' }}>
                {totalCo2SavedDaily} kg CO₂
              </div>
              <p style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)' }}>
                Equates to <span className="clay-pill pill-yellow" style={{ fontSize: '15px', fontWeight: 900 }}>~{yearlyCo2Tons} Tons CO₂ / Year</span> saved! 🌳
              </p>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Calculated dynamically based on standard local household averages.
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}

export default LocationPage
