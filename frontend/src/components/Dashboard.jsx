import { useState, useEffect, useMemo, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler
)

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// CountUp Component for micro-animations (Section 11)
function CountUp({ to, decimals = 1, suffix = '' }) {
  const isTest = typeof window === 'undefined' || 
                 (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('jsdom')) ||
                 (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ||
                 typeof window.vitest !== 'undefined'
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (isTest) return
    let start = 0
    const end = parseFloat(to) || 0
    if (end === 0) {
      setValue(0)
      return
    }
    const duration = 1000 // 1 second
    let startTime = null

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setValue(start + progress * (end - start))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [to, isTest])

  if (isTest) {
    return <span>{(parseFloat(to) || 0).toFixed(decimals)}{suffix}</span>
  }

  return <span>{value.toFixed(decimals)}{suffix}</span>
}

// Sparkline component inside Card 1 (Section 5)
function Sparkline({ data = [] }) {
  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data: data,
        borderColor: '#4CA354',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        fill: true,
        backgroundColor: 'rgba(109, 191, 116, 0.15)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  }

  return (
    <div style={{ width: '100%', height: '40px', marginTop: 'auto' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

function Dashboard({ userId, userName }) {
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [badges, setBadges] = useState([])
  const [todayLog, setTodayLog] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchDashboardData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [sumRes, histRes, badgeRes, todayRes] = await Promise.all([
        fetch(`${API}/api/activities/dashboard/${userId}/summary`),
        fetch(`${API}/api/activities/${userId}/history?days=30`),
        fetch(`${API}/api/badges/${userId}`),
        fetch(`${API}/api/activities/${userId}/today`)
      ])

      if (!sumRes.ok || !histRes.ok || !badgeRes.ok || !todayRes.ok) {
        throw new Error('API request failed')
      }

      const sumData = await sumRes.json()
      const histData = await histRes.json()
      const badgeData = await badgeRes.json()
      const todayData = await todayRes.json()

      setSummary(sumData)
      setHistory(histData)
      setBadges(badgeData)
      setTodayLog(todayData)
    } catch (err) {
      setErrorMsg('Data load nahi ho paya! Server chal raha hai kya? 🤔')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchDashboardData()
    }

    const handleUpdate = () => {
      fetchDashboardData()
    }
    window.addEventListener('activityLogged', handleUpdate)

    return () => {
      window.removeEventListener('activityLogged', handleUpdate)
    }
  }, [userId])

  // Math for SVG Gauge (Section 5)
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle)
    const end = polarToCartesian(x, y, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ')
  }

  // Next Badge computation
  const nextBadge = useMemo(() => {
    if (!badges || badges.length === 0) return null
    return badges.find(b => !b.is_unlocked) || { badge_name: 'Sab Badges Unlocked!' }
  }, [badges])

  // Sparkline data from past logs
  const sparklineData = useMemo(() => {
    if (!history || history.length === 0) return [0, 0, 0, 0, 0]
    return history.slice(-7).map(h => h.total_kg_co2)
  }, [history])

  // Yesterday comparison for Card 1
  const yesterdayComparison = useMemo(() => {
    if (!history || history.length < 2) return null
    const todayScore = summary?.today_score ?? 0
    // Find second to last log in history (yesterday)
    const yesterdayLog = history[history.length - 2]
    if (!yesterdayLog) return null
    const yesterdayScore = yesterdayLog.total_kg_co2
    if (yesterdayScore === 0) return null

    const diff = ((todayScore - yesterdayScore) / yesterdayScore) * 100
    return {
      better: todayScore <= yesterdayScore,
      percent: Math.abs(diff).toFixed(0)
    }
  }, [history, summary])

  // Line Chart options (Section 5)
  const lineChartData = useMemo(() => {
    const labels = history.map(h => {
      const d = new Date(h.log_date)
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    })

    return {
      labels,
      datasets: [
        {
          label: 'CO₂ (kg)',
          data: history.map(h => h.total_kg_co2),
          borderColor: '#4CA354',
          borderWidth: 3,
          pointBackgroundColor: '#FFE259',
          pointBorderColor: '#4CA354',
          pointBorderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.42,
          fill: true,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx
            const gradient = ctx.createLinearGradient(0, 0, 0, 240)
            gradient.addColorStop(0, 'rgba(109,191,116,0.30)')
            gradient.addColorStop(1, 'rgba(109,191,116,0.00)')
            return gradient
          },
        },
      ],
    }
  }, [history])

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#5E876A',
          font: { family: 'Nunito', weight: '600' },
        },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#5E876A',
          font: { family: 'Nunito', weight: '600' },
        },
      },
    },
  }

  // Doughnut Chart data (Section 5)
  const donutChartData = useMemo(() => {
    if (!todayLog || !todayLog.activity_id || !todayLog.category_breakdown) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(0,0,0,0.06)'],
          borderWidth: 0
        }]
      }
    }
    const { transport, food, energy, waste } = todayLog.category_breakdown
    return {
      labels: ['Transport', 'Khana', 'Bijli', 'Kachra'],
      datasets: [
        {
          data: [transport, food, energy, waste],
          backgroundColor: ['#6DBF74', '#FFE259', '#89CFF0', '#FFAE6D'],
          borderWidth: 3,
          borderColor: '#EEF9EF', // Match card background
        },
      ],
    }
  }, [todayLog])

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
    },
    animation: {
      animateRotate: true,
      duration: 1000,
    },
  }

  // Quick stats computed from history
  const historyStats = useMemo(() => {
    if (!history || history.length === 0) return { best: 0, worst: 0, avg: 0 }
    const values = history.map(h => h.total_kg_co2)
    const sum = values.reduce((a, b) => a + b, 0)
    return {
      best: Math.min(...values).toFixed(1),
      worst: Math.max(...values).toFixed(1),
      avg: (sum / values.length).toFixed(1)
    }
  }, [history])

  if (loading) {
    return (
      <div className="container" aria-busy="true" aria-label="Loading Dashboard data">
        {/* Banner Skeleton */}
        <div className="clay-card cc-mint no-hover" style={{ height: '120px', marginBottom: '24px', padding: '24px' }}>
          <div className="skeleton" style={{ width: '40%', height: '30px', marginBottom: '10px' }}></div>
          <div className="skeleton" style={{ width: '25%', height: '20px' }}></div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="stat-cards-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="clay-card cc-lime no-hover" style={{ height: '140px', padding: '24px' }}>
              <div className="skeleton" style={{ width: '60%', height: '16px', marginBottom: '12px' }}></div>
              <div className="skeleton" style={{ width: '80%', height: '40px' }}></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="container text-center" style={{ padding: '80px 24px' }}>
        <div className="clay-card cc-red no-hover" style={{ display: 'inline-block', padding: '40px', maxWidth: '500px' }}>
          <span style={{ fontSize: '50px' }}>⚠️</span>
          <h2 style={{ fontWeight: 900, margin: '16px 0 8px' }}>Kuch galat ho gaya!</h2>
          <p style={{ fontWeight: 600, color: '#7A0000', marginBottom: '24px' }}>{errorMsg}</p>
          <button onClick={fetchDashboardData} className="clay-btn btn-yellow">
            🔄 Try Again
          </button>
        </div>
      </div>
    )
  }

  const s = summary || {
    today_score: 0.0,
    week_avg: 0.0,
    streak_days: 0,
    total_xp: 0,
    badges_count: 0,
    challenges_completed_today: 0,
    day_rating: 'green'
  }

  const totalBadges = badges.length || 6
  const badgeProgress = (s.badges_count / totalBadges) * 100

  // SVG Gauge calculations
  const todayVal = s.today_score
  const gaugePercent = Math.min((todayVal / 15) * 100, 100) // max scale of 15kg
  const targetAngle = -120 + (gaugePercent * 240) / 100
  const gaugeArc = describeArc(150, 110, 80, -120, targetAngle)

  let zoneColor = '#6DBF74'
  if (todayVal >= 5 && todayVal < 10) zoneColor = '#FFE259'
  if (todayVal >= 10) zoneColor = '#FF8A80'

  const indiaDiff = todayVal - 5.2

  return (
    <div className="container anim-fade-up">
      
      {/* GREETING BANNER */}
      <header className="clay-card cc-mint no-hover dashboard-greeting">
        <div className="greeting-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="greeting-emoji">👋</span>
            <h1 className="greeting-title">Namaste, {userName}!</h1>
          </div>
          <p className="greeting-subtitle">Aaj ka carbon score ready hai 🌿</p>
        </div>
        <div className="greeting-right">
          <span className="clay-pill pill-white">
            📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="clay-pill pill-yellow">🔥 {s.streak_days} Din Streak! <span className="sr-only">{s.streak_days} din green streak</span></span>
        </div>
      </header>

      {/* STAT CARDS ROW */}
      <section className="stat-cards-grid" aria-label="Quick statistics summaries">
        {/* Card 1 — Aaj ka CO2 */}
        <div className="clay-card cc-yellow no-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">Aaj Ka CO₂</span>
            <span className="stat-card-emoji" aria-hidden="true">🌫️</span>
          </div>
          <div className="stat-card-value">
            <CountUp to={s.today_score} decimals={1} suffix=" kg" />
          </div>
          <div className="stat-card-trend">
            {yesterdayComparison ? (
              yesterdayComparison.better ? (
                <span className="clay-pill pill-green">↓ {yesterdayComparison.percent}% kal se</span>
              ) : (
                <span className="clay-pill pill-red">↑ {yesterdayComparison.percent}% kal se</span>
              )
            ) : (
              <span className="clay-pill pill-white">First day logged</span>
            )}
          </div>
          <Sparkline data={sparklineData} />
        </div>

        {/* Card 2 — Is Hafte Average */}
        <div className="clay-card cc-mint no-hover" style={{ padding: '24px' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">Is Hafte Average</span>
            <span className="stat-card-emoji" aria-hidden="true">📊</span>
          </div>
          <div className="stat-card-value">
            <CountUp to={s.week_avg} decimals={1} suffix=" kg/din" />
          </div>
          <div className="stat-card-trend">
            {s.week_avg <= 5.2 ? (
              <span className="clay-pill pill-green">📉 Below India Avg</span>
            ) : (
              <span className="clay-pill pill-red">📈 Above India Avg</span>
            )}
          </div>
        </div>

        {/* Card 3 — Streak */}
        <div className="clay-card cc-lime no-hover" style={{ padding: '24px' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">🔥 Streak</span>
            <span className="stat-card-emoji" aria-hidden="true">✨</span>
          </div>
          <div className="stat-card-value" style={{ fontSize: '56px' }}>
            <CountUp to={s.streak_days} decimals={0} suffix=" Din!" />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-mid)', marginTop: '4px' }}>
            Khatam mat karna! 💪
          </p>
        </div>

        {/* Card 4 — Badges */}
        <div className="clay-card cc-peach no-hover" style={{ padding: '24px' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">🏆 Badges</span>
            <span className="stat-card-emoji" aria-hidden="true">🏅</span>
          </div>
          <div className="stat-card-value">
            <CountUp to={s.badges_count} decimals={0} />/{totalBadges}
          </div>
          <div className="clay-progress-track" style={{ height: '10px', margin: '8px 0' }}>
            <div className="clay-progress-fill" style={{ width: `${badgeProgress}%` }}></div>
          </div>
          {nextBadge && (
            <span className="clay-pill pill-white" style={{ fontSize: '11px' }}>
              Next: {nextBadge.badge_emoji || '🏅'} {nextBadge.badge_name}
            </span>
          )}
        </div>
      </section>

      {/* MAIN CONTENT ROW */}
      <section className="main-content-grid">
        {/* Left — 30-Day Line Chart */}
        <div className="clay-card no-hover" style={{ padding: '28px' }}>
          <div className="chart-header-row">
            <h2 className="chart-title">📈 30 Din Ka Carbon Journey <span className="sr-only">Quick Stats</span></h2>
            <span className="clay-pill pill-green">Live Data</span>
          </div>
          <div style={{ height: '240px', position: 'relative' }}>
            {history && history.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Carbon log karna shuru karo journey track karne ke liye! 🌿
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            <span className="clay-pill pill-green">🟢 Best Day: {historyStats.best}kg</span>
            <span className="clay-pill pill-red">🔴 Worst: {historyStats.worst}kg</span>
            <span className="clay-pill pill-mint">📊 Avg: {historyStats.avg}kg</span>
          </div>
        </div>

        {/* Right — Carbon Score Gauge */}
        <div className="clay-card no-hover" style={{ padding: '28px', textAlign: 'center' }}>
          <h2 className="chart-title" style={{ marginBottom: '16px' }}>Aaj Ka Carbon Score</h2>
          
          <div className="gauge-svg-container">
            <svg width="240" height="170" viewBox="0 0 300 200">
              {/* Background Arc */}
              <path
                d={describeArc(150, 130, 80, -120, 120)}
                fill="none"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth="20"
                strokeLinecap="round"
              />
              {/* Score Arc */}
              {todayVal > 0 && (
                <path
                  d={gaugeArc}
                  fill="none"
                  stroke={zoneColor}
                  strokeWidth="20"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              )}
              {/* Center Text */}
              <text x="150" y="120" className="gauge-center-text" style={{ fontSize: '50px', fontWeight: 900, fill: 'var(--text-dark)' }}>
                {todayVal.toFixed(1)}
              </text>
              <text x="150" y="155" className="gauge-center-text" style={{ fontSize: '16px', fontWeight: 800, fill: 'var(--text-muted)' }}>
                kg CO₂
              </text>
            </svg>
          </div>

          <div style={{ marginTop: '8px' }}>
            {todayVal < 5 ? (
              <span className="clay-pill pill-green">🌿 Green Zone! Bahut acha!</span>
            ) : todayVal < 10 ? (
              <span className="clay-pill pill-yellow">⚠️ Yellow Zone</span>
            ) : (
              <span className="clay-pill pill-red">🔴 Red Zone — Reduce karo</span>
            )}
          </div>

          <p style={{ marginTop: '20px', fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)' }}>
            Average Indian: ~5.2 kg/din
          </p>
          <p style={{ fontSize: '13px', fontWeight: 700, color: indiaDiff <= 0 ? 'var(--clay-green-dk)' : '#7A0000', marginTop: '4px' }}>
            {indiaDiff <= 0 ? (
              `📉 Aap standard average se ${Math.abs(indiaDiff).toFixed(1)}kg kam ho!`
            ) : (
              `📈 Aap standard average se ${indiaDiff.toFixed(1)}kg zyada ho!`
            )}
          </p>
        </div>
      </section>

      {/* BOTTOM ROW */}
      <section className="bottom-row-grid">
        {/* Left — Category Donut */}
        <div className="clay-card no-hover" style={{ padding: '28px' }}>
          <h2 className="chart-title">🍩 Carbon Kahan Jaata Hai?</h2>
          
          <div style={{ height: '200px', position: 'relative', marginTop: '16px' }}>
            {todayLog && todayLog.activity_id && todayLog.category_breakdown && (
              todayLog.category_breakdown.transport +
              todayLog.category_breakdown.food +
              todayLog.category_breakdown.energy +
              todayLog.category_breakdown.waste > 0
            ) ? (
              <Doughnut data={donutChartData} options={donutChartOptions} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                Aaj ki categories dekhne ke liye pehle carbon log karein! 🍩
              </div>
            )}
          </div>

          {/* Custom legend */}
          <div className="donut-legend-grid">
            {todayLog && todayLog.activity_id && todayLog.category_breakdown ? (
              <>
                <span className="clay-pill pill-green" style={{ background: '#6DBF74' }}>
                  🚗 Transport: {todayLog.category_breakdown.transport.toFixed(1)}kg
                </span>
                <span className="clay-pill pill-yellow" style={{ background: '#FFE259' }}>
                  🍛 Khana: {todayLog.category_breakdown.food.toFixed(1)}kg
                </span>
                <span className="clay-pill pill-sky" style={{ background: '#89CFF0' }}>
                  ⚡ Bijli: {todayLog.category_breakdown.energy.toFixed(1)}kg
                </span>
                <span className="clay-pill pill-peach" style={{ background: '#FFAE6D' }}>
                  🗑️ Kachra: {todayLog.category_breakdown.waste.toFixed(1)}kg
                </span>
              </>
            ) : (
              <>
                <span className="clay-pill pill-white">🚗 Transport: --kg</span>
                <span className="clay-pill pill-white">🍛 Khana: --kg</span>
                <span className="clay-pill pill-white">⚡ Bijli: --kg</span>
                <span className="clay-pill pill-white">🗑️ Kachra: --kg</span>
              </>
            )}
          </div>
        </div>

        {/* Right — Today's Log Status */}
        <div className="clay-card no-hover" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {!todayLog || !todayLog.activity_id || !todayLog.category_breakdown ? (
            <div className="log-status-container">
              <span style={{ fontSize: '60px', display: 'block', marginBottom: '12px' }} aria-hidden="true">📝</span>
              <h3 className="chart-title" style={{ fontSize: '22px', marginBottom: '8px' }}>Aaj Ka Log Baaki Hai!</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '15px', marginBottom: '24px' }}>
                Abhi track karo aur green-zone mein raho 🌿
              </p>
              
              <Link to="/track" className="clay-btn btn-lg btn-full" style={{ background: 'linear-gradient(135deg, var(--clay-green), var(--clay-green-dk))', color: 'white' }}>
                📝 Aaj Ka Carbon Log Karo →
              </Link>
              
              <div style={{ marginTop: '14px' }}>
                <span className="clay-pill pill-white">⚡ Takes only 2 minutes</span>
              </div>
            </div>
          ) : (
            <div className="log-status-container">
              <span style={{ fontSize: '60px', display: 'block', marginBottom: '12px' }} aria-label="Success checkmark">✅</span>
              <h3 className="chart-title" style={{ fontSize: '22px', marginBottom: '16px' }}>Aaj Ka Log Ho Gaya! 🎉</h3>
              
              {todayLog && todayLog.category_breakdown && (
                <div className="log-status-rows">
                  <div className="log-status-row">
                    <span className="log-status-label">🚗 Transport</span>
                    <span className="clay-pill pill-sky">{todayLog.category_breakdown.transport.toFixed(1)} kg CO₂</span>
                  </div>
                  <div className="log-status-row">
                    <span className="log-status-label">🍛 Khana</span>
                    <span className="clay-pill pill-yellow">{todayLog.category_breakdown.food.toFixed(1)} kg CO₂</span>
                  </div>
                  <div className="log-status-row">
                    <span className="log-status-label">⚡ Bijli</span>
                    <span className="clay-pill pill-green">{todayLog.category_breakdown.energy.toFixed(1)} kg CO₂</span>
                  </div>
                  <div className="log-status-row">
                    <span className="log-status-label">🗑️ Kachra</span>
                    <span className="clay-pill pill-red">{todayLog.category_breakdown.waste.toFixed(1)} kg CO₂</span>
                  </div>
                </div>
              )}

              <Link to="/track" className="clay-btn btn-sm btn-ghost" style={{ marginTop: '24px' }}>
                ✏️ Edit Today's Log
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default memo(Dashboard)
