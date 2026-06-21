import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Emission Factors (specified in prompt Section 6)
const FACTORS = {
  // Transport (per km)
  car: 0.21,
  bike: 0.103,
  bus: 0.089,
  train: 0.041,
  auto: 0.11,
  walk: 0.0,

  // Food (per meal)
  nonveg: 3.3,
  veg: 1.1,
  packaged: 2.0,
  homemade: 0.7,

  // Energy (per hour/load)
  ac: 1.2,
  geyser: 1.0,
  washing: 0.5,
  fan_lights: 0.1,

  // Waste (per item/order)
  plastic: 0.06,
  delivery: 0.5,
  recycling: -0.3
}

/**
 * Track - Page component that provides inputs for logging transport, food, energy, and waste activities.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function Track({ userId }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('transport') // 'transport', 'food', 'energy', 'waste'

  // Transport State
  const [carKm, setCarKm] = useState('')
  const [bikeKm, setBikeKm] = useState('')
  const [busKm, setBusKm] = useState('')
  const [trainKm, setTrainKm] = useState('')
  const [autoKm, setAutoKm] = useState('')
  const [walkKm, setWalkKm] = useState('')

  // Food State
  const [selectedFood, setSelectedFood] = useState({
    nonveg: false,
    veg: false,
    packaged: false,
    homemade: false
  })
  const [foodMeals, setFoodMeals] = useState({
    nonveg: 0,
    veg: 0,
    packaged: 0,
    homemade: 0
  })

  // Energy State (Sliders)
  const [acHours, setAcHours] = useState(0)
  const [geyserHours, setGeyserHours] = useState(0)
  const [washingLoads, setWashingLoads] = useState(0)
  const [fanLightsHours, setFanLightsHours] = useState(0)

  // Waste State
  const [plasticItems, setPlasticItems] = useState(0)
  const [deliveryOrders, setDeliveryOrders] = useState(0)
  const [recyclingDone, setRecyclingDone] = useState(false)

  // Submission Status
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Fetch today's log on mount to pre-populate (Section 12 - Skeleton loaders & drafts)
  useEffect(() => {
    async function fetchTodayLog() {
      try {
        const res = await fetch(`${API}/api/activities/${userId}/today`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.activity_id !== '') {
            // Retrieve actual logs and populated states if already saved
            // We can fetch details or just make a request to the main db.
            // Since GET /today returns totals, let's fetch activity history/today details.
            // Let's populate from draft if exists or from api if possible.
            // The API `/api/activities/{user_id}/today` returns activity_id.
            // Wait, does the API return the full input inputs?
            // In activities.py: `get_today_activity` returns `ActivityResponse` with `category_breakdown` but not the exact inputs.
            // But wait! We can store the draft inputs in LocalStorage when saved and load them here!
            // Let's check LocalStorage for form draft first.
            const draft = localStorage.getItem(`harabharat_draft_${userId}`)
            if (draft) {
              const d = JSON.parse(draft)
              setCarKm(d.transport?.car_km || '')
              setBikeKm(d.transport?.bike_km || '')
              setBusKm(d.transport?.bus_km || '')
              setTrainKm(d.transport?.train_km || '')
              setAutoKm(d.transport?.auto_km || '')
              setWalkKm(d.transport?.walk_km || '')

              setSelectedFood({
                nonveg: (d.food?.nonveg_meals || 0) > 0,
                veg: (d.food?.veg_meals || 0) > 0,
                packaged: (d.food?.packaged_meals || 0) > 0,
                homemade: (d.food?.homemade_meals || 0) > 0
              })
              setFoodMeals({
                nonveg: d.food?.nonveg_meals || 0,
                veg: d.food?.veg_meals || 0,
                packaged: d.food?.packaged_meals || 0,
                homemade: d.food?.homemade_meals || 0
              })

              setAcHours(d.energy?.ac_hours || 0)
              setGeyserHours(d.energy?.geyser_hours || 0)
              setWashingLoads(d.energy?.washing_loads || 0)
              setFanLightsHours(d.energy?.fan_lights_hours || 0)

              setPlasticItems(d.waste?.plastic_items || 0)
              setDeliveryOrders(d.waste?.delivery_orders || 0)
              setRecyclingDone(d.waste?.recycling_done || false)
            }
          }
        }
      } catch (err) {
        // Quietly fail
      }
    }
    if (userId) {
      fetchTodayLog()
    }
  }, [userId])

  // Live Calculations (Section 6)
  const transportCalculated = useMemo(() => {
    const carVal = (parseFloat(carKm) || 0) * FACTORS.car
    const bikeVal = (parseFloat(bikeKm) || 0) * FACTORS.bike
    const busVal = (parseFloat(busKm) || 0) * FACTORS.bus
    const trainVal = (parseFloat(trainKm) || 0) * FACTORS.train
    const autoVal = (parseFloat(autoKm) || 0) * FACTORS.auto
    const walkVal = (parseFloat(walkKm) || 0) * FACTORS.walk

    return {
      car: carVal,
      bike: bikeVal,
      bus: busVal,
      train: trainVal,
      auto: autoVal,
      walk: walkVal,
      total: carVal + bikeVal + busVal + trainVal + autoVal + walkVal
    }
  }, [carKm, bikeKm, busKm, trainKm, autoKm, walkKm])

  const foodCalculated = useMemo(() => {
    const nvVal = (selectedFood.nonveg ? foodMeals.nonveg || 1 : 0) * FACTORS.nonveg
    const vVal = (selectedFood.veg ? foodMeals.veg || 1 : 0) * FACTORS.veg
    const pVal = (selectedFood.packaged ? foodMeals.packaged || 1 : 0) * FACTORS.packaged
    const hVal = (selectedFood.homemade ? foodMeals.homemade || 1 : 0) * FACTORS.homemade

    return {
      nonveg: nvVal,
      veg: vVal,
      packaged: pVal,
      homemade: hVal,
      total: nvVal + vVal + pVal + hVal
    }
  }, [selectedFood, foodMeals])

  const energyCalculated = useMemo(() => {
    const acVal = acHours * FACTORS.ac
    const geyserVal = geyserHours * FACTORS.geyser
    const washingVal = washingLoads * FACTORS.washing
    const fanVal = fanLightsHours * FACTORS.fan_lights

    return {
      ac: acVal,
      geyser: geyserVal,
      washing: washingVal,
      fan: fanVal,
      total: acVal + geyserVal + washingVal + fanVal
    }
  }, [acHours, geyserHours, washingLoads, fanLightsHours])

  const wasteCalculated = useMemo(() => {
    const plasticVal = plasticItems * FACTORS.plastic
    const deliveryVal = deliveryOrders * FACTORS.delivery
    const recyclingVal = recyclingDone ? FACTORS.recycling : 0.0

    return {
      plastic: plasticVal,
      delivery: deliveryVal,
      recycling: recyclingVal,
      total: Math.max(-10, plasticVal + deliveryVal + recyclingVal) // allow negative offsets but cap
    }
  }, [plasticItems, deliveryOrders, recyclingDone])

  const grandTotal = useMemo(() => {
    const sum = transportCalculated.total + foodCalculated.total + energyCalculated.total + wasteCalculated.total
    return Math.max(0, sum)
  }, [transportCalculated, foodCalculated, energyCalculated, wasteCalculated])

  // Zone pill label
  const zoneLabel = useMemo(() => {
    if (grandTotal < 5) return '🌿 Green Zone!'
    if (grandTotal < 10) return '⚠️ Yellow Zone'
    return '🔴 Red Zone'
  }, [grandTotal])

  const zonePillClass = useMemo(() => {
    if (grandTotal < 5) return 'pill-green'
    if (grandTotal < 10) return 'pill-yellow'
    return 'pill-red'
  }, [grandTotal])

  // Food Card selections
  const toggleFoodCard = (key) => {
    setSelectedFood(prev => {
      const nextState = { ...prev, [key]: !prev[key] }
      // Default to 1 meal if selected and was 0
      if (nextState[key] && foodMeals[key] === 0) {
        setFoodMeals(f => ({ ...f, [key]: 1 }))
      }
      return nextState
    })
  }

  const handleMealCountChange = (key, val) => {
    const num = Math.max(0, parseInt(val) || 0)
    setFoodMeals(prev => ({ ...prev, [key]: num }))
    if (num > 0) {
      setSelectedFood(prev => ({ ...prev, [key]: true }))
    } else {
      setSelectedFood(prev => ({ ...prev, [key]: false }))
    }
  }

  // Counter helpers for Waste
  const incrementWaste = (key) => {
    if (key === 'plastic') setPlasticItems(p => p + 1)
    if (key === 'delivery') setDeliveryOrders(d => d + 1)
  }

  const decrementWaste = (key) => {
    if (key === 'plastic') setPlasticItems(p => Math.max(0, p - 1))
    if (key === 'delivery') setDeliveryOrders(d => Math.max(0, d - 1))
  }

  // Save/Submit Action
  const handleSaveLog = async () => {
    setLoading(true)
    setErrorMsg('')

    const payload = {
      user_id: userId,
      log_date: new Date().toISOString().split('T')[0],
      transport: {
        car_km: parseFloat(carKm) || 0.0,
        bike_km: parseFloat(bikeKm) || 0.0,
        bus_km: parseFloat(busKm) || 0.0,
        train_km: parseFloat(trainKm) || 0.0,
        auto_km: parseFloat(autoKm) || 0.0,
        walk_km: parseFloat(walkKm) || 0.0
      },
      food: {
        nonveg_meals: selectedFood.nonveg ? foodMeals.nonveg || 1 : 0,
        veg_meals: selectedFood.veg ? foodMeals.veg || 1 : 0,
        packaged_meals: selectedFood.packaged ? foodMeals.packaged || 1 : 0,
        homemade_meals: selectedFood.homemade ? foodMeals.homemade || 1 : 0
      },
      energy: {
        ac_hours: parseFloat(acHours) || 0.0,
        geyser_hours: parseFloat(geyserHours) || 0.0,
        washing_loads: parseInt(washingLoads) || 0,
        fan_lights_hours: parseFloat(fanLightsHours) || 0.0
      },
      waste: {
        plastic_items: parseInt(plasticItems) || 0,
        delivery_orders: parseInt(deliveryOrders) || 0,
        recycling_done: recyclingDone
      }
    }

    try {
      const res = await fetch(`${API}/api/activities/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Save karne mein koi problem aayi!')
      }

      // Save draft offline so we can pre-populate later
      localStorage.setItem(`harabharat_draft_${userId}`, JSON.stringify(payload))

      // Trigger custom events so navbar can fetch new streak, and dashboard updates
      window.dispatchEvent(new Event('activityLogged'))
      window.dispatchEvent(new Event('streakUpdated'))

      // Trigger Confetti Overlay
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/dashboard')
      }, 1500)

    } catch (err) {
      setErrorMsg(err.message || 'Server se connect nahi ho paaye. Check parameters!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="track-page-container anim-fade-up">
      {/* PAGE HEADER */}
      <header className="track-header">
        <h1 className="track-title">📝 Aaj Ka Carbon Log</h1>
        <p className="track-subtitle">Sach batao — planet judge nahi karega, samjhega! 😄</p>
      </header>

      {/* CATEGORY TABS */}
      <div className="category-tabs-flex" role="tablist">
        <button
          onClick={() => setActiveTab('transport')}
          className={`clay-btn btn-sm category-tab-btn ${activeTab === 'transport' ? 'active' : 'btn-ghost'}`}
          role="tab"
          aria-selected={activeTab === 'transport'}
        >
          🚗 Transport
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`clay-btn btn-sm category-tab-btn ${activeTab === 'food' ? 'active' : 'btn-ghost'}`}
          role="tab"
          aria-selected={activeTab === 'food'}
        >
          🍛 Khana
        </button>
        <button
          onClick={() => setActiveTab('energy')}
          className={`clay-btn btn-sm category-tab-btn ${activeTab === 'energy' ? 'active' : 'btn-ghost'}`}
          role="tab"
          aria-selected={activeTab === 'energy'}
        >
          ⚡ Bijli
        </button>
        <button
          onClick={() => setActiveTab('waste')}
          className={`clay-btn btn-sm category-tab-btn ${activeTab === 'waste' ? 'active' : 'btn-ghost'}`}
          role="tab"
          aria-selected={activeTab === 'waste'}
        >
          🗑️ Kachra
        </button>
      </div>

      {/* TRANSPORT SECTION */}
      {activeTab === 'transport' && (
        <section className="clay-card no-hover" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span className="clay-pill pill-sky">🚗 Aaj kaise gaye aap?</span>
          </div>

          {/* Row 1 - Petrol Gaadi */}
          <div className="vehicle-grid-row">
            <div className="circle-emoji-container">🚗</div>
            <div>
              <label htmlFor="car-input" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)' }}>Petrol Gaadi</label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per km: 0.21 kg CO₂</div>
            </div>
            <input
              id="car-input"
              type="number"
              className="clay-input"
              style={{ width: '100px' }}
              value={carKm}
              onChange={(e) => setCarKm(e.target.value)}
              placeholder="0 km"
              min="0"
            />
            <span className="clay-pill pill-white">{transportCalculated.car.toFixed(1)} kg</span>
          </div>

          {/* Row 2 - Bike */}
          <div className="vehicle-grid-row">
            <div className="circle-emoji-container">🏍️</div>
            <div>
              <label htmlFor="bike-input" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)' }}>Bike</label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per km: 0.103 kg CO₂</div>
            </div>
            <input
              id="bike-input"
              type="number"
              className="clay-input"
              style={{ width: '100px' }}
              value={bikeKm}
              onChange={(e) => setBikeKm(e.target.value)}
              placeholder="0 km"
              min="0"
            />
            <span className="clay-pill pill-white">{transportCalculated.bike.toFixed(1)} kg</span>
          </div>

          {/* Row 3 - Bus */}
          <div className="vehicle-grid-row">
            <div className="circle-emoji-container">🚌</div>
            <div>
              <label htmlFor="bus-input" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)' }}>Bus</label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per km: 0.089 kg CO₂</div>
            </div>
            <input
              id="bus-input"
              type="number"
              className="clay-input"
              style={{ width: '100px' }}
              value={busKm}
              onChange={(e) => setBusKm(e.target.value)}
              placeholder="0 km"
              min="0"
            />
            <span className="clay-pill pill-white">{transportCalculated.bus.toFixed(1)} kg</span>
          </div>

          {/* Row 4 - Train */}
          <div className="vehicle-grid-row">
            <div className="circle-emoji-container">🚆</div>
            <div>
              <label htmlFor="train-input" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)' }}>Train</label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per km: 0.041 kg CO₂</div>
            </div>
            <input
              id="train-input"
              type="number"
              className="clay-input"
              style={{ width: '100px' }}
              value={trainKm}
              onChange={(e) => setTrainKm(e.target.value)}
              placeholder="0 km"
              min="0"
            />
            <span className="clay-pill pill-white">{transportCalculated.train.toFixed(1)} kg</span>
          </div>

          {/* Row 5 - Auto-Rickshaw */}
          <div className="vehicle-grid-row">
            <div className="circle-emoji-container">🛺</div>
            <div>
              <label htmlFor="auto-input" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)' }}>Auto-Rickshaw</label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per km: 0.11 kg CO₂</div>
            </div>
            <input
              id="auto-input"
              type="number"
              className="clay-input"
              style={{ width: '100px' }}
              value={autoKm}
              onChange={(e) => setAutoKm(e.target.value)}
              placeholder="0 km"
              min="0"
            />
            <span className="clay-pill pill-white">{transportCalculated.auto.toFixed(1)} kg</span>
          </div>

          {/* Row 6 - Cycle/Paidal */}
          <div className="vehicle-grid-row">
            <div className="circle-emoji-container">🚲</div>
            <div>
              <label htmlFor="walk-input" style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-dark)' }}>Cycle / Paidal</label>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per km: 0 kg CO₂</div>
            </div>
            <input
              id="walk-input"
              type="number"
              className="clay-input"
              style={{ width: '100px' }}
              value={walkKm}
              onChange={(e) => setWalkKm(e.target.value)}
              placeholder="0 km"
              min="0"
            />
            <span className="clay-pill pill-green">0 kg 🎉</span>
          </div>
        </section>
      )}

      {/* FOOD SECTION */}
      {activeTab === 'food' && (
        <section className="clay-card no-hover" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span className="clay-pill pill-mint">🍛 Aaj kya khaya?</span>
          </div>

          <div className="food-cards-grid">
            {/* Card 1 — Non Veg */}
            <div
              onClick={() => toggleFoodCard('nonveg')}
              className={`clay-card food-select-card ${selectedFood.nonveg ? 'selected cc-peach' : ''}`}
            >
              <div className="food-card-header">
                <span style={{ fontSize: '32px' }} aria-hidden="true">🥩</span>
                {selectedFood.nonveg && <div className="food-card-checkmark">✓</div>}
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-dark)' }}>Non-Veg Khana</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>3.3 kg CO₂ per meal</p>
              
              <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px' }}>
                <label htmlFor="nonveg-meals-input" className="sr-only">Non-veg meals count</label>
                <input
                  id="nonveg-meals-input"
                  type="number"
                  placeholder="0 meals"
                  className="clay-input"
                  value={foodMeals.nonveg || ''}
                  onChange={(e) => handleMealCountChange('nonveg', e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Card 2 — Veg */}
            <div
              onClick={() => toggleFoodCard('veg')}
              className={`clay-card food-select-card ${selectedFood.veg ? 'selected cc-mint' : ''}`}
            >
              <div className="food-card-header">
                <span style={{ fontSize: '32px' }} aria-hidden="true">🥗</span>
                {selectedFood.veg && <div className="food-card-checkmark">✓</div>}
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-dark)' }}>Veg Khana</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>1.1 kg CO₂ per meal</p>
              
              <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px' }}>
                <label htmlFor="veg-meals-input" className="sr-only">Veg meals count</label>
                <input
                  id="veg-meals-input"
                  type="number"
                  placeholder="0 meals"
                  className="clay-input"
                  value={foodMeals.veg || ''}
                  onChange={(e) => handleMealCountChange('veg', e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Card 3 — Packaged */}
            <div
              onClick={() => toggleFoodCard('packaged')}
              className={`clay-card food-select-card ${selectedFood.packaged ? 'selected cc-yellow' : ''}`}
            >
              <div className="food-card-header">
                <span style={{ fontSize: '32px' }} aria-hidden="true">📦</span>
                {selectedFood.packaged && <div className="food-card-checkmark">✓</div>}
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-dark)' }}>Packaged Food</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>2.0 kg CO₂ per meal</p>
              
              <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px' }}>
                <label htmlFor="packaged-meals-input" className="sr-only">Packaged meals count</label>
                <input
                  id="packaged-meals-input"
                  type="number"
                  placeholder="0 meals"
                  className="clay-input"
                  value={foodMeals.packaged || ''}
                  onChange={(e) => handleMealCountChange('packaged', e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Card 4 — Ghar ka Khana */}
            <div
              onClick={() => toggleFoodCard('homemade')}
              className={`clay-card food-select-card ${selectedFood.homemade ? 'selected cc-lime' : ''}`}
            >
              <div className="food-card-header">
                <span style={{ fontSize: '32px' }} aria-hidden="true">🏠</span>
                {selectedFood.homemade && <div className="food-card-checkmark">✓</div>}
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-dark)' }}>Ghar Ka Khana</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>0.7 kg CO₂ — Best choice! 🌿</p>
              
              <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '10px' }}>
                <label htmlFor="homemade-meals-input" className="sr-only">Homemade meals count</label>
                <input
                  id="homemade-meals-input"
                  type="number"
                  placeholder="0 meals"
                  className="clay-input"
                  value={foodMeals.homemade || ''}
                  onChange={(e) => handleMealCountChange('homemade', e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ENERGY SECTION */}
      {activeTab === 'energy' && (
        <section className="clay-card no-hover" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span className="clay-pill pill-green">⚡ Ghar ki bijli ka haal?</span>
          </div>

          {/* AC Slider */}
          <div className="slider-grid-row">
            <div className="slider-label-row">
              <span className="slider-label-text">❄️ AC (Air Conditioner)</span>
              <span className="clay-pill pill-sky slider-value-pill">{acHours} ghante = {energyCalculated.ac.toFixed(1)} kg</span>
            </div>
            <label htmlFor="ac-range" className="sr-only">AC Hours Slider</label>
            <input
              id="ac-range"
              type="range"
              min="0"
              max="12"
              step="0.5"
              className="clay-range"
              value={acHours}
              onChange={(e) => setAcHours(parseFloat(e.target.value))}
            />
          </div>

          {/* Geyser Slider */}
          <div className="slider-grid-row">
            <div className="slider-label-row">
              <span className="slider-label-text">🚿 Geyser</span>
              <span className="clay-pill pill-peach slider-value-pill">{geyserHours} ghante = {energyCalculated.geyser.toFixed(1)} kg</span>
            </div>
            <label htmlFor="geyser-range" className="sr-only">Geyser Hours Slider</label>
            <input
              id="geyser-range"
              type="range"
              min="0"
              max="4"
              step="0.5"
              className="clay-range"
              value={geyserHours}
              onChange={(e) => setGeyserHours(parseFloat(e.target.value))}
            />
          </div>

          {/* Washing Machine Slider */}
          <div className="slider-grid-row">
            <div className="slider-label-row">
              <span className="slider-label-text">🫧 Washing Machine</span>
              <span className="clay-pill pill-mint slider-value-pill">{washingLoads} loads = {energyCalculated.washing.toFixed(1)} kg</span>
            </div>
            <label htmlFor="washing-range" className="sr-only">Washing Machine Loads Slider</label>
            <input
              id="washing-range"
              type="range"
              min="0"
              max="5"
              className="clay-range"
              value={washingLoads}
              onChange={(e) => setWashingLoads(parseInt(e.target.value))}
            />
          </div>

          {/* Fan & Lights Slider */}
          <div className="slider-grid-row">
            <div className="slider-label-row">
              <span className="slider-label-text">💡 Fan + Lights</span>
              <span className="clay-pill pill-yellow slider-value-pill">{fanLightsHours} ghante = {energyCalculated.fan.toFixed(1)} kg</span>
            </div>
            <label htmlFor="fan-lights-range" className="sr-only">Fan and Lights Hours Slider</label>
            <input
              id="fan-lights-range"
              type="range"
              min="0"
              max="18"
              step="0.5"
              className="clay-range"
              value={fanLightsHours}
              onChange={(e) => setFanLightsHours(parseFloat(e.target.value))}
            />
          </div>
        </section>
      )}

      {/* WASTE SECTION */}
      {activeTab === 'waste' && (
        <section className="clay-card no-hover" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span className="clay-pill pill-peach">🗑️ Kachra aur packaging?</span>
          </div>

          {/* Plastic items counter */}
          <div className="waste-grid-row">
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-dark)' }}>🥤 Plastic Items</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bottles, cups, polythenes (0.06 kg each)</p>
            </div>
            <div className="counter-flex">
              <button type="button" onClick={() => decrementWaste('plastic')} className="clay-btn btn-sm btn-ghost" aria-label="Decrease plastic count">-</button>
              <span className="counter-value">{plasticItems}</span>
              <button type="button" onClick={() => incrementWaste('plastic')} className="clay-btn btn-sm btn-ghost" aria-label="Increase plastic count">+</button>
            </div>
          </div>

          {/* Online delivery counter */}
          <div className="waste-grid-row">
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-dark)' }}>📦 Online Delivery Orders</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Zomato, Swiggy, Amazon packaging (0.5 kg each)</p>
            </div>
            <div className="counter-flex">
              <button type="button" onClick={() => decrementWaste('delivery')} className="clay-btn btn-sm btn-ghost" aria-label="Decrease delivery count">-</button>
              <span className="counter-value">{deliveryOrders}</span>
              <button type="button" onClick={() => incrementWaste('delivery')} className="clay-btn btn-sm btn-ghost" aria-label="Increase delivery count">+</button>
            </div>
          </div>

          {/* Recycling toggle */}
          <div className="waste-grid-row">
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-dark)' }}>♻️ Recycling Done?</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dry/wet waste segregation, composting</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {recyclingDone && (
                <span className="clay-pill pill-green">♻️ Great! -0.3 kg saved</span>
              )}
              <label className="clay-toggle" htmlFor="recycling-toggle">
                <input
                  id="recycling-toggle"
                  type="checkbox"
                  checked={recyclingDone}
                  onChange={(e) => setRecyclingDone(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>
      )}

      {/* GLOBAL ERROR DISPLAY */}
      {errorMsg && (
        <div className="error-pill" role="alert" aria-live="polite" style={{ width: '100%', marginTop: '20px', padding: '12px 18px' }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* STICKY BOTTOM BAR */}
      <footer className="sticky-track-bar">
        <div className="sticky-left">
          <span className="sticky-left-label">Abhi Tak:</span>
          <div className="sticky-left-value">
            {grandTotal.toFixed(1)} kg CO₂
            <span className={`clay-pill ${zonePillClass}`} style={{ fontSize: '12px', padding: '3px 10px' }}>
              {zoneLabel}
            </span>
          </div>
        </div>

        {/* Center Breakdown Pills */}
        <div className="sticky-center-breakdown">
          <span className="clay-pill pill-sky" style={{ fontSize: '11px', padding: '4px 10px' }}>
            🚗 {transportCalculated.total.toFixed(1)}kg
          </span>
          <span className="clay-pill pill-yellow" style={{ fontSize: '11px', padding: '4px 10px' }}>
            🍛 {foodCalculated.total.toFixed(1)}kg
          </span>
          <span className="clay-pill pill-green" style={{ fontSize: '11px', padding: '4px 10px' }}>
            ⚡ {energyCalculated.total.toFixed(1)}kg
          </span>
          <span className="clay-pill pill-peach" style={{ fontSize: '11px', padding: '4px 10px' }}>
            🗑️ {wasteCalculated.total.toFixed(1)}kg
          </span>
        </div>

        <div>
          <button
            type="button"
            onClick={handleSaveLog}
            className="clay-btn btn-lg"
            style={{ background: 'linear-gradient(135deg, var(--clay-green), var(--clay-green-dk))', color: 'white' }}
            disabled={loading}
          >
            {loading ? 'Saving...' : '💾 Aaj Ka Log Save Karo'}
          </button>
        </div>
      </footer>

      {/* SUCCESS FULL SCREEN OVERLAY ANIMATION (Section 11) */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(223, 242, 225, 0.97)',
            backdropFilter: 'blur(20px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Confetti Rain (8 falling squares) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[...Array(8)].map((_, i) => {
              const colors = ['#6DBF74', '#9FE2C2', '#B8F07A', '#FFE259', '#FFAE6D', '#7EC8E3', '#C3AEE8', '#FF8A80']
              const randomLeft = Math.floor(Math.random() * 90) + 5
              const randomDelay = (Math.random() * 0.8).toFixed(1)
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    left: `${randomLeft}%`,
                    width: '16px',
                    height: '16px',
                    backgroundColor: colors[i % colors.length],
                    borderRadius: '4px',
                    animation: `shimmer-bar 1.5s infinite linear`,
                    animationDelay: `${randomDelay}s`,
                    opacity: 0.8,
                    transform: `rotate(${Math.random() * 360}deg)`
                  }}
                ></div>
              )
            })}
          </div>

          <div className="anim-bounce-in" style={{ fontSize: '100px', marginBottom: '20px' }}>
            ✅
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-dark)' }}>
            Saved! 🎉
          </h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 800, marginTop: '8px' }}>
            Ek kadam aur green Bharat ki taraf! 🌿
          </p>
        </div>
      )}
    </div>
  )
}

export default Track
