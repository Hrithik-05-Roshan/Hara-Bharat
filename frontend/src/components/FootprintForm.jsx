import { useState, useCallback, useEffect, useMemo, memo } from 'react'
import { calculateDailyCO2, getDayRating } from '../utils/carbonCalculator'
import { validateNumericInput } from '../utils/validators'
import { API_BASE_URL, LS_KEYS } from '../utils/constants'

const INITIAL_FORM = {
  transport: { car_km: 0, bike_km: 0, bus_km: 0, train_km: 0, auto_km: 0, walk_km: 0 },
  food: { nonveg_meals: 0, veg_meals: 0, packaged_meals: 0, homemade_meals: 0 },
  energy: { ac_hours: 0, geyser_hours: 0, washing_loads: 0, fan_lights_hours: 0 },
  waste: { plastic_items: 0, delivery_orders: 0, recycling_done: false },
}

const SECTIONS = [
  { key: 'transport', emoji: '🚗', title: 'Transport', fields: [
    { name: 'car_km', label: 'Petrol gaadi (km)', max: 1000 },
    { name: 'bike_km', label: 'Bike / motorcycle (km)', max: 1000 },
    { name: 'bus_km', label: 'Bus (km)', max: 1000 },
    { name: 'train_km', label: 'Train (km)', max: 5000 },
    { name: 'auto_km', label: 'Auto-rickshaw (km)', max: 500 },
    { name: 'walk_km', label: 'Cycle / Paidal (km)', max: 100 },
  ]},
  { key: 'food', emoji: '🍽️', title: 'Khana-Peena (Food)', fields: [
    { name: 'nonveg_meals', label: 'Non-veg khana (meals)', max: 10, step: 1 },
    { name: 'veg_meals', label: 'Veg khana (meals)', max: 10, step: 1 },
    { name: 'packaged_meals', label: 'Packaged / processed food (meals)', max: 10, step: 1 },
    { name: 'homemade_meals', label: 'Ghar ka khana (meals)', max: 10, step: 1 },
  ]},
  { key: 'energy', emoji: '⚡', title: 'Bijli-Paani (Energy)', fields: [
    { name: 'ac_hours', label: 'AC usage (hours)', max: 24 },
    { name: 'geyser_hours', label: 'Geyser / water heater (hours)', max: 24 },
    { name: 'washing_loads', label: 'Washing machine (loads)', max: 10, step: 1 },
    { name: 'fan_lights_hours', label: 'Fan + lights (hours)', max: 24 },
  ]},
  { key: 'waste', emoji: '🗑️', title: 'Kachra (Waste)', fields: [
    { name: 'plastic_items', label: 'Plastic items (count)', max: 100, step: 1 },
    { name: 'delivery_orders', label: 'Online delivery orders', max: 20, step: 1 },
  ]},
]

/**
 * FootprintForm - Renders the daily carbon footprint input questionnaire form.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function FootprintForm({ userId, onSubmitSuccess }) {
  const [formData, setFormData] = useState(() => {
    const draft = localStorage.getItem(LS_KEYS.FORM_DRAFT)
    return draft ? JSON.parse(draft) : INITIAL_FORM
  })
  const [openSection, setOpenSection] = useState('transport')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(LS_KEYS.FORM_DRAFT, JSON.stringify(formData))
  }, [formData])

  // Live CO2 calculation
  const liveCalc = useMemo(() => calculateDailyCO2(formData), [formData])
  const rating = useMemo(() => getDayRating(liveCalc.total), [liveCalc.total])

  const ratingColor = rating === 'green' ? 'var(--gauge-green)' : rating === 'yellow' ? 'var(--gauge-yellow)' : 'var(--gauge-red)'

  const handleChange = useCallback((section, field, value) => {
    const numVal = value === '' ? 0 : parseFloat(value)
    const validation = validateNumericInput(numVal, field, 10000)
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, [`${section}.${field}`]: validation.error }))
      return
    }
    setErrors(prev => { const n = { ...prev }; delete n[`${section}.${field}`]; return n })
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: validation.value },
    }))
  }, [])

  const handleRecycling = useCallback((checked) => {
    setFormData(prev => ({
      ...prev,
      waste: { ...prev.waste, recycling_done: checked },
    }))
  }, [])

  const hasData = useMemo(() => liveCalc.total > 0, [liveCalc.total])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!hasData) return
    setSubmitting(true)
    setSubmitMsg('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/activities/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          log_date: new Date().toISOString().split('T')[0],
          ...formData,
        }),
      })
      if (!res.ok) throw new Error('Submit failed')
      const data = await res.json()
      setSubmitMsg(`✅ Saved! Aaj ka total: ${data.total_kg_co2} kg CO2`)
      localStorage.removeItem(LS_KEYS.FORM_DRAFT)
      if (onSubmitSuccess) onSubmitSuccess(data)
      const liveRegion = document.getElementById('aria-live-region')
      if (liveRegion) liveRegion.textContent = `Carbon log saved. Total ${data.total_kg_co2} kg CO2.`
    } catch {
      setSubmitMsg('❌ Save nahi ho paya! Dobara try karo.')
    } finally {
      setSubmitting(false)
    }
  }, [formData, hasData, userId, onSubmitSuccess])

  return (
    <form onSubmit={handleSubmit} aria-label="Daily carbon footprint form">
      <div className="live-total" role="status" aria-live="polite" aria-label={`Live carbon total: ${liveCalc.total} kg CO2`}>
        <div>
          <div className="live-total__label">Aaj ka running total</div>
          <div className="live-total__value" style={{ color: ratingColor }}>
            {liveCalc.total} kg CO₂
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>🚗 {liveCalc.breakdown.transport}</div>
          <div>🍽️ {liveCalc.breakdown.food}</div>
          <div>⚡ {liveCalc.breakdown.energy}</div>
          <div>🗑️ {liveCalc.breakdown.waste}</div>
        </div>
      </div>

      <div className="accordion">
        {SECTIONS.map(section => (
          <div className="accordion__item" key={section.key}>
            <button
              type="button"
              className="accordion__header"
              onClick={() => setOpenSection(openSection === section.key ? '' : section.key)}
              aria-expanded={openSection === section.key}
              aria-controls={`section-${section.key}`}
              aria-label={`${section.title} section kholein`}
            >
              <span>{section.emoji} {section.title}</span>
              <span className={`accordion__icon ${openSection === section.key ? 'accordion__icon--open' : ''}`}>▼</span>
            </button>
            <div
              className={`accordion__body ${openSection === section.key ? 'accordion__body--open' : ''}`}
              id={`section-${section.key}`}
              role="region"
            >
              {section.fields.map(field => (
                <div className="form-group" key={field.name}>
                  <label htmlFor={`${section.key}-${field.name}`}>{field.label}</label>
                  <input
                    type="number"
                    id={`${section.key}-${field.name}`}
                    min="0"
                    max={field.max}
                    step={field.step || 'any'}
                    value={formData[section.key][field.name] || ''}
                    onChange={(e) => handleChange(section.key, field.name, e.target.value)}
                    aria-label={field.label}
                    placeholder="0"
                  />
                  {errors[`${section.key}.${field.name}`] && (
                    <p className="form-error" role="alert">{errors[`${section.key}.${field.name}`]}</p>
                  )}
                </div>
              ))}
              {section.key === 'waste' && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.waste.recycling_done}
                      onChange={(e) => handleRecycling(e.target.checked)}
                      aria-label="Kya aapne aaj recycling ki?"
                    />
                    ♻️ Recycling ki aaj?
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-24">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={!hasData || submitting}
          aria-label="Aaj ka carbon log submit karo"
          style={{ width: '100%' }}
        >
          {submitting ? 'Save ho raha hai...' : '🌿 Aaj ka carbon save karo'}
        </button>
      </div>

      {submitMsg && (
        <p className="mt-16 text-center" role="status" aria-live="polite" style={{ fontWeight: 600 }}>
          {submitMsg}
        </p>
      )}
    </form>
  )
}

export default memo(FootprintForm)
