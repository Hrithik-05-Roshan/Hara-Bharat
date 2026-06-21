import { useState, useEffect, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
)

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Insights - Page component visualizing the 30-day carbon journey and displaying the AI-generated weekly report.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function Insights({ userId }) {
  const [history, setHistory] = useState([])
  const [report, setReport] = useState(null)
  
  const [loading, setLoading] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [reportError, setReportError] = useState('')

  const fetchInsightsData = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`${API}/api/activities/${userId}/history?days=30`)
      if (!res.ok) {
        throw new Error('Could not fetch history data')
      }
      const data = await res.json()
      setHistory(data)

      // Check if report already exists in localStorage to avoid unnecessary loading
      const cachedReport = localStorage.getItem(`harabharat_report_${userId}`)
      if (cachedReport) {
        setReport(JSON.parse(cachedReport))
      }
    } catch (err) {
      setErrorMsg('Insights data load nahi ho paya. Server check karein!')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchInsightsData()
    }
  }, [userId])

  // Calculate statistics (Section 9)
  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return { avg: 0, total: 0, best: 0, worst: 0, greenDays: 0, successRate: 0 }
    }
    const totalDays = history.length
    const values = history.map(h => h.total_kg_co2)
    const sum = values.reduce((a, b) => a + b, 0)
    const greenDays = history.filter(h => h.total_kg_co2 < 5).length

    return {
      avg: (sum / totalDays).toFixed(1),
      total: totalDays,
      best: Math.min(...values).toFixed(1),
      worst: Math.max(...values).toFixed(1),
      greenDays,
      successRate: ((greenDays / totalDays) * 100).toFixed(0)
    }
  }, [history])

  // Chart configuration (Section 9)
  const lineChartData = useMemo(() => {
    const labels = history.map(h => {
      const d = new Date(h.log_date)
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    })

    return {
      labels,
      datasets: [
        {
          label: 'Daily CO₂ (kg)',
          data: history.map(h => h.total_kg_co2),
          borderColor: '#4CA354',
          borderWidth: 3.5,
          pointBackgroundColor: '#FFE259',
          pointBorderColor: '#4CA354',
          pointBorderWidth: 2.5,
          pointRadius: 6,
          pointHoverRadius: 9,
          tension: 0.4,
          fill: true,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx
            const gradient = ctx.createLinearGradient(0, 0, 0, 300)
            gradient.addColorStop(0, 'rgba(109,191,116,0.32)')
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
          font: { family: 'Nunito', weight: '700', size: 12 },
        },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#5E876A',
          font: { family: 'Nunito', weight: '700', size: 12 },
        },
        title: {
          display: true,
          text: 'kg CO₂',
          color: '#5E876A',
          font: { family: 'Nunito', weight: '800' }
        }
      },
    },
  }

  // Generate Weekly AI report
  const generateWeeklyReport = async () => {
    setLoadingReport(true)
    setReportError('')
    try {
      const res = await fetch(`${API}/api/insights/${userId}/weekly-report`)
      const data = await res.ok ? await res.json() : null

      if (!res.ok || !data) {
        throw new Error('Weekly report fetch failed')
      }

      setReport(data)
      localStorage.setItem(`harabharat_report_${userId}`, JSON.stringify(data))
    } catch (err) {
      setReportError('Weekly report generate nahi ho saka. AI key expired hai ya data kam hai! 🤔')
    } finally {
      setLoadingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="container" aria-busy="true" aria-label="Loading insights data">
        <div className="skeleton" style={{ width: '50%', height: '32px', marginBottom: '28px' }}></div>
        <div className="stat-cards-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="clay-card cc-lime no-hover" style={{ height: '140px' }}></div>
          ))}
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="container text-center" style={{ padding: '80px 24px' }}>
        <div className="clay-card cc-red no-hover" style={{ display: 'inline-block', padding: '40px', maxWidth: '500px' }}>
          <span style={{ fontSize: '50px' }} aria-hidden="true">⚠️</span>
          <h2 style={{ fontWeight: 900, margin: '16px 0 8px' }}>Error</h2>
          <p style={{ fontWeight: 600, color: '#7A0000', marginBottom: '24px' }}>{errorMsg}</p>
          <button onClick={fetchInsightsData} className="clay-btn btn-yellow">🔄 Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container anim-fade-up" style={{ paddingBottom: '40px' }}>
      
      {/* PAGE HEADER */}
      <header className="track-header">
        <h1 className="track-title">📈 Insights & Weekly Reports</h1>
        <p className="track-subtitle">Apne progress ko deeper levels pe samjho aur AI recommendations pao! 📊</p>
      </header>

      {/* STAT CARDS ROW */}
      <section className="stat-cards-grid" aria-label="Emissions metrics over 30 days">
        {/* Card 1 — Avg Daily */}
        <div className="clay-card cc-mint no-hover" style={{ padding: '24px' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">Average Daily CO₂</span>
            <span className="stat-card-emoji" aria-hidden="true">🌿</span>
          </div>
          <div className="stat-card-value">{stats.avg} kg</div>
          <span className="clay-pill pill-white" style={{ fontSize: '11px', marginTop: '6px' }}>Target: &lt;5.0 kg</span>
        </div>

        {/* Card 2 — Total Logs */}
        <div className="clay-card cc-yellow no-hover" style={{ padding: '24px' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">Total Din Logged</span>
            <span className="stat-card-emoji" aria-hidden="true">📅</span>
          </div>
          <div className="stat-card-value">{stats.total} Din</div>
          <span className="clay-pill pill-white" style={{ fontSize: '11px', marginTop: '6px' }}>Past 30 days</span>
        </div>

        {/* Card 3 — Best Day */}
        <div className="clay-card cc-lime no-hover" style={{ padding: '24px' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">Best Day</span>
            <span className="stat-card-emoji" aria-hidden="true">🏆</span>
          </div>
          <div className="stat-card-value">{stats.best} kg</div>
          <span className="clay-pill pill-green" style={{ fontSize: '11px', marginTop: '6px' }}>Lowest carbon day</span>
        </div>

        {/* Card 4 — Worst Day */}
        <div className="clay-card cc-peach no-hover" style={{ padding: '24px' }}>
          <div className="stat-card-title-row">
            <span className="stat-card-label">Worst Day</span>
            <span className="stat-card-emoji" aria-hidden="true">⚠️</span>
          </div>
          <div className="stat-card-value">{stats.worst} kg</div>
          <span className="clay-pill pill-red" style={{ fontSize: '11px', marginTop: '6px' }}>Highest carbon day</span>
        </div>
      </section>

      {/* SUCCESS METRIC BANNER */}
      <section className="clay-card cc-mint no-hover" style={{ padding: '20px', textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-dark)' }}>
          🌿 {stats.greenDays} din green zone mein ({stats.total} mein se) — {stats.successRate}% success rate!
        </h2>
      </section>

      {/* 30-DAY CHART */}
      <section className="clay-card no-hover" style={{ padding: '28px', marginBottom: '24px' }}>
        <div className="chart-header-row">
          <h2 className="chart-title">📈 30 Din Ka Carbon Journey</h2>
          <span className="clay-pill pill-green">Interactive Chart</span>
        </div>
        <div style={{ height: '300px', position: 'relative' }}>
          {history.length > 0 ? (
            <Line data={lineChartData} options={lineChartOptions} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Data loading or empty history. 🌿
            </div>
          )}
        </div>
      </section>

      {/* WEEKLY AI REPORT */}
      <section className="clay-card no-hover" style={{ padding: '32px' }} aria-labelledby="report-heading">
        <h2 id="report-heading" className="chart-title" style={{ fontSize: '20px', marginBottom: '16px' }}>
          📝 Weekly AI Report
        </h2>

        {report ? (
          <div className="report-container anim-fade-up">
            <div className="clay-pill pill-yellow" style={{ marginBottom: '16px' }}>
              📅 Report for {new Date(report.week_start).toLocaleDateString('en-IN')} to {new Date(report.week_end).toLocaleDateString('en-IN')}
            </div>
            
            <div
              className="clay-card cc-white no-hover"
              style={{
                padding: '24px',
                lineHeight: '1.7',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-dark)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {report.report_text}
            </div>

            <button
              onClick={generateWeeklyReport}
              className="clay-btn btn-ghost"
              style={{ marginTop: '20px' }}
              disabled={loadingReport}
            >
              {loadingReport ? '🤖 Refreshing...' : '🔄 Refresh Report'}
            </button>
          </div>
        ) : (
          <div className="text-center" style={{ padding: '24px 0' }}>
            <span style={{ fontSize: '60px', display: 'block', marginBottom: '16px' }} aria-hidden="true">🤖</span>
            <p style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '16px', marginBottom: '24px' }}>
              Eco Mitra se apna weekly performance audit aur personalized AI report generate karo!
            </p>
            
            <button
              onClick={generateWeeklyReport}
              className="clay-btn btn-lg"
              style={{ background: 'linear-gradient(135deg, var(--clay-green), var(--clay-green-dk))', color: 'white' }}
              disabled={loadingReport}
              aria-label="Weekly report generate karo"
            >
              {loadingReport ? '🤖 AI Generating...' : '🤖 Weekly Report Dekho'}
            </button>

            {reportError && (
              <div className="error-pill" role="alert" aria-live="polite" style={{ marginTop: '20px' }}>
                ❌ {reportError}
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  )
}

export default Insights
