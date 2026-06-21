import { useMemo, memo } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

/**
 * CarbonChart - Renders line and doughnut charts representing carbon emission trends and breakdown.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function CarbonChart({ history = [], todayBreakdown = null }) {
  const lineData = useMemo(() => {
    if (!history.length) return null
    const labels = history.map(h => {
      const d = new Date(h.log_date)
      return `${d.getDate()}/${d.getMonth() + 1}`
    })
    return {
      labels,
      datasets: [{
        label: 'Daily CO₂ (kg)',
        data: history.map(h => h.total_kg_co2),
        borderColor: '#2D6A4F',
        backgroundColor: 'rgba(82,183,136,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#2D6A4F',
      }],
    }
  }, [history])

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: '30 Din Ka Carbon Trend', font: { size: 14, weight: 'bold' } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'kg CO₂' } },
    },
  }), [])

  // Category breakdown donut from latest history entry or today's data
  const donutData = useMemo(() => {
    const src = todayBreakdown || (history.length ? history[history.length - 1] : null)
    if (!src) return null
    const t = src.transport_co2 ?? src.transport ?? 0
    const f = src.food_co2 ?? src.food ?? 0
    const e = src.energy_co2 ?? src.energy ?? 0
    const w = src.waste_co2 ?? src.waste ?? 0
    if (t + f + e + w === 0) return null
    return {
      labels: ['🚗 Transport', '🍽️ Khana', '⚡ Bijli', '🗑️ Kachra'],
      datasets: [{
        data: [t, f, e, w],
        backgroundColor: ['#2D6A4F', '#52B788', '#D4AC0D', '#C0392B'],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    }
  }, [history, todayBreakdown])

  const donutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 12, font: { size: 12 } } },
      title: { display: true, text: 'Category Breakdown', font: { size: 14, weight: 'bold' } },
    },
  }), [])

  const trendSummary = useMemo(() => {
    if (!history.length) return 'Koi data nahi hai abhi.'
    const vals = history.map(h => h.total_kg_co2)
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
    const best = Math.min(...vals).toFixed(1)
    const worst = Math.max(...vals).toFixed(1)
    return `Average: ${avg} kg, Best: ${best} kg, Worst: ${worst} kg CO₂ per day over ${history.length} days.`
  }, [history])

  return (
    <div className="grid-dashboard">
      <div className="card">
        <div className="chart-container" aria-describedby="trend-summary">
          {lineData ? (
            <Line data={lineData} options={lineOptions} />
          ) : (
            <p className="text-center" style={{ color: 'var(--text-muted)', padding: '40px 0' }}>
              📊 Chart dikhne ke liye pehle kuch din carbon log karo!
            </p>
          )}
        </div>
        <p id="trend-summary" className="sr-only">{trendSummary}</p>
      </div>
      <div className="card">
        <div className="chart-container" aria-describedby="donut-summary">
          {donutData ? (
            <Doughnut data={donutData} options={donutOptions} />
          ) : (
            <p className="text-center" style={{ color: 'var(--text-muted)', padding: '40px 0' }}>
              🍩 Category breakdown dikhne ke liye pehle log karo!
            </p>
          )}
        </div>
        <p id="donut-summary" className="sr-only">Category wise carbon breakdown chart.</p>
      </div>
    </div>
  )
}

export default memo(CarbonChart)
