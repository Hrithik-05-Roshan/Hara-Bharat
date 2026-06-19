import { useState, useRef, useEffect, useCallback, memo } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const QUICK_QUESTIONS = [
  { text: '🚗 Car vs Bike?', prompt: 'Car vs bike mein carbon footprint ka kya difference hai?' },
  { text: '🥗 Veg carbon footprint?', prompt: 'Vegetarian khane ka carbon footprint kitna kam hota hai non-veg se?' },
  { text: '💡 AC kaise bachayein?', prompt: 'Ghar mein AC use karte waqt electricity aur carbon kaise bachayein?' },
  { text: '♻️ Recycle tips?', prompt: 'Ghar par recycling shuru karne ke liye top 3 easy tips do.' }
]

const EMISSION_FACTORS = {
  car: 0.21,
  bike: 0.103,
  bus: 0.089,
  train: 0.041,
  auto: 0.098,
  walk: 0.0,
  nonveg_meal: 3.3,
  veg_meal: 1.1,
  packaged_meal: 2.0,
  homemade_meal: 0.8,
  ac: 1.2,
  geyser: 1.0,
  washing: 0.5,
  fan_lights: 0.1,
  plastic_item: 0.06,
  delivery_order: 0.5,
  recycling_offset: -0.1
}

function ConfirmationCard({ pendingActivities, onConfirm, onCancel, loading }) {
  const items = []
  let totalCO2 = 0

  const t = pendingActivities.transport || {}
  if (t.car_km > 0) {
    const co2 = t.car_km * EMISSION_FACTORS.car
    totalCO2 += co2
    items.push({ icon: '🚗', name: 'Car travel', val: `${t.car_km} km`, co2: `${co2.toFixed(1)} kg` })
  }
  if (t.bike_km > 0) {
    const co2 = t.bike_km * EMISSION_FACTORS.bike
    totalCO2 += co2
    items.push({ icon: '🏍️', name: 'Bike travel', val: `${t.bike_km} km`, co2: `${co2.toFixed(1)} kg` })
  }
  if (t.bus_km > 0) {
    const co2 = t.bus_km * EMISSION_FACTORS.bus
    totalCO2 += co2
    items.push({ icon: '🚌', name: 'Bus travel', val: `${t.bus_km} km`, co2: `${co2.toFixed(1)} kg` })
  }
  if (t.train_km > 0) {
    const co2 = t.train_km * EMISSION_FACTORS.train
    totalCO2 += co2
    items.push({ icon: '🚆', name: 'Train travel', val: `${t.train_km} km`, co2: `${co2.toFixed(1)} kg` })
  }
  if (t.auto_km > 0) {
    const co2 = t.auto_km * EMISSION_FACTORS.auto
    totalCO2 += co2
    items.push({ icon: '🛺', name: 'Auto travel', val: `${t.auto_km} km`, co2: `${co2.toFixed(1)} kg` })
  }
  if (t.walk_km > 0) {
    items.push({ icon: '🚲', name: 'Walk / Cycle', val: `${t.walk_km} km`, co2: '0 kg' })
  }

  const f = pendingActivities.food || {}
  if (f.nonveg_meals > 0) {
    const co2 = f.nonveg_meals * EMISSION_FACTORS.nonveg_meal
    totalCO2 += co2
    items.push({ icon: '🥩', name: 'Non-Veg Meals', val: f.nonveg_meals, co2: `${co2.toFixed(1)} kg` })
  }
  if (f.veg_meals > 0) {
    const co2 = f.veg_meals * EMISSION_FACTORS.veg_meal
    totalCO2 += co2
    items.push({ icon: '🥗', name: 'Veg Meals', val: f.veg_meals, co2: `${co2.toFixed(1)} kg` })
  }
  if (f.packaged_meals > 0) {
    const co2 = f.packaged_meals * EMISSION_FACTORS.packaged_meal
    totalCO2 += co2
    items.push({ icon: '📦', name: 'Packaged Food', val: f.packaged_meals, co2: `${co2.toFixed(1)} kg` })
  }
  if (f.homemade_meals > 0) {
    const co2 = f.homemade_meals * EMISSION_FACTORS.homemade_meal
    totalCO2 += co2
    items.push({ icon: '🏠', name: 'Homemade Meals', val: f.homemade_meals, co2: `${co2.toFixed(1)} kg` })
  }

  const e = pendingActivities.energy || {}
  if (e.ac_hours > 0) {
    const co2 = e.ac_hours * EMISSION_FACTORS.ac
    totalCO2 += co2
    items.push({ icon: '❄️', name: 'AC running', val: `${e.ac_hours} hrs`, co2: `${co2.toFixed(1)} kg` })
  }
  if (e.geyser_hours > 0) {
    const co2 = e.geyser_hours * EMISSION_FACTORS.geyser
    totalCO2 += co2
    items.push({ icon: '🚿', name: 'Geyser running', val: `${e.geyser_hours} hrs`, co2: `${co2.toFixed(1)} kg` })
  }
  if (e.washing_loads > 0) {
    const co2 = e.washing_loads * EMISSION_FACTORS.washing
    totalCO2 += co2
    items.push({ icon: '🫧', name: 'Washing machine', val: `${e.washing_loads} loads`, co2: `${co2.toFixed(1)} kg` })
  }
  if (e.fan_lights_hours > 0) {
    const co2 = e.fan_lights_hours * EMISSION_FACTORS.fan_lights
    totalCO2 += co2
    items.push({ icon: '💡', name: 'Fans & Lights', val: `${e.fan_lights_hours} hrs`, co2: `${co2.toFixed(1)} kg` })
  }

  const w = pendingActivities.waste || {}
  if (w.plastic_items > 0) {
    const co2 = w.plastic_items * EMISSION_FACTORS.plastic_item
    totalCO2 += co2
    items.push({ icon: '🥤', name: 'Plastic Items', val: w.plastic_items, co2: `${co2.toFixed(1)} kg` })
  }
  if (w.delivery_orders > 0) {
    const co2 = w.delivery_orders * EMISSION_FACTORS.delivery_order
    totalCO2 += co2
    items.push({ icon: '📦', name: 'Delivery Orders', val: w.delivery_orders, co2: `${co2.toFixed(1)} kg` })
  }
  if (w.recycling_done) {
    const co2 = EMISSION_FACTORS.recycling_offset
    totalCO2 += co2
    items.push({ icon: '♻️', name: 'Segregated & Recycled', val: 'Yes', co2: `${co2.toFixed(1)} kg` })
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="agent-confirmation-card" style={{
      background: 'var(--bg-deeper)',
      border: '1.5px solid rgba(109,191,116,0.3)',
      borderRadius: '16px',
      padding: '16px',
      marginTop: '12px',
      boxShadow: 'var(--s-card), 0 8px 24px rgba(45,122,45,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>📋</span>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: 'var(--text-dark)' }}>Confirm Log Details</h4>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: 'var(--text-dark)' }}>
              <span>{item.icon}</span> {item.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="clay-pill pill-white" style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 800 }}>{item.val}</span>
              <span style={{ fontSize: '11px', color: item.co2.startsWith('-') ? '#2E7D32' : 'var(--text-muted)', fontWeight: 850 }}>
                {item.co2}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)' }}>Estimated Footprint:</span>
        <span className="clay-pill pill-mint" style={{ fontSize: '14px', fontWeight: 900 }}>
          {totalCO2.toFixed(2)} kg CO₂
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={onConfirm}
          className="clay-btn btn-sm btn-full"
          style={{
            background: 'linear-gradient(135deg, var(--clay-green), var(--clay-green-dk))',
            color: 'white',
            fontWeight: 850,
            flex: 2,
            padding: '8px 12px'
          }}
          disabled={loading}
        >
          {loading ? 'Saving...' : '✅ Save Log'}
        </button>
        <button
          onClick={onCancel}
          className="clay-btn btn-sm btn-ghost"
          style={{ flex: 1, padding: '8px' }}
          disabled={loading}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  )
}

function EcoMitraChat({ userId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [chatContext, setChatContext] = useState(null)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Namaste! 🌿 Main hoon Eco Mitra — aapka sustainability dost. Apne daily activities ko Hinglish/English/Hindi mein describe karein, main automatically record kar doonga!'
    }
  ])
  const [inputVal, setInputVal] = useState('')
  const [loading, setLoading] = useState(false)

  const bodyRef = useRef(null)

  const scrollToBottom = () => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen, messages, loading])

  const handleConfirmLog = async (pendingActivities) => {
    setLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const payload = {
        user_id: userId,
        log_date: todayStr,
        transport: pendingActivities.transport || {},
        food: pendingActivities.food || {},
        energy: pendingActivities.energy || {},
        waste: pendingActivities.waste || {}
      }

      const res = await fetch(`${API}/api/activities/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('Log save failed')
      }

      setChatContext(null)
      setMessages(prev => {
        const clean = prev.filter(m => !m.isConfirmation)
        return [
          ...clean,
          {
            role: 'bot',
            text: '✅ Aapka daily carbon log save ho gaya hai! Dashboard aur stats update ho gaye hain. 🌿'
          }
        ]
      })

      window.dispatchEvent(new Event('activityLogged'))
      window.dispatchEvent(new Event('streakUpdated'))
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: 'Oops! Log save karne mein dikkat aayi. Dobara try karo!'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCancelLog = () => {
    setChatContext(null)
    setMessages(prev => {
      const clean = prev.filter(m => !m.isConfirmation)
      return [
        ...clean,
        {
          role: 'bot',
          text: 'Log cancel kar diya hai. Agar kuch aur log karna ho toh batayein!'
        }
      ]
    })
  }

  const handleSendMessage = async (textToSend) => {
    const trimmed = textToSend.trim()
    if (!trimmed) return

    setMessages(prev => [...prev, { role: 'user', text: trimmed }])
    setInputVal('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: trimmed,
          user_context: chatContext
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Eco Mitra response empty!')
      }

      setChatContext(data.user_context)

      if (data.show_confirmation && data.pending_activities) {
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: data.reply || 'Aapki details ready hain! Ek baar check kijiye:',
            isConfirmation: true,
            pendingActivities: data.pending_activities
          }
        ])
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'Kuch samajh nahi aaya, dobara poocho!' }])
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: 'Abhi Eco Mitra thoda busy hai, thodi der baad try karo! Meanwhile, aaj cycle chalao 🚴'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputVal)
    }
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-fab-custom"
        aria-label={isOpen ? 'Eco Mitra AI chat band karein' : 'Eco Mitra AI chatbot kholein'}
        aria-expanded={isOpen}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window Widget */}
      {isOpen && (
        <div className="chatbot-widget-container" role="dialog" aria-label="Eco Mitra AI Chatbot">
          {/* Header */}
          <header className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-header-avatar">🤖</div>
              <div className="chatbot-header-title-col">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="chatbot-header-title">Eco Mitra AI</span>
                  <span className="chatbot-status-dot" aria-label="Online status indicator"></span>
                </div>
                <span className="chatbot-header-subtitle">24/7 Green Advisor (Hinglish)</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="clay-btn btn-sm btn-ghost"
              style={{ padding: '4px 8px', minWidth: 'auto' }}
              aria-label="Close chat"
            >
              ✕
            </button>
          </header>

          {/* Messages Body */}
          <div ref={bodyRef} className="chat-body-scrollable" role="log" aria-live="polite">
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: msg.role === 'bot' ? 'flex-start' : 'flex-end', maxWidth: '85%', width: '100%' }}>
                <div className={`chat-msg-row ${msg.role === 'bot' ? 'bot' : 'user'}`} style={{ maxWidth: '100%', width: '100%' }}>
                  <div className={`chat-msg-avatar ${msg.role === 'bot' ? 'bot' : 'user'}`} aria-hidden="true">
                    {msg.role === 'bot' ? '🤖' : '👤'}
                  </div>
                  <div className={`chat-msg-bubble ${msg.role === 'bot' ? 'bot' : 'user'}`} style={{ flex: 1 }}>
                    {msg.text}
                  </div>
                </div>
                {msg.isConfirmation && msg.pendingActivities && (
                  <div style={{ marginLeft: '42px', marginTop: '4px' }}>
                    <ConfirmationCard
                      pendingActivities={msg.pendingActivities}
                      onConfirm={() => handleConfirmLog(msg.pendingActivities)}
                      onCancel={handleCancelLog}
                      loading={loading}
                    />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-msg-row bot">
                <div className="chat-msg-avatar bot" aria-hidden="true">🤖</div>
                <div className="chat-msg-bubble bot">
                  <div className="typing-dots-flex" aria-label="Eco Mitra is typing">
                    <span className="typing-dot-bounce"></span>
                    <span className="typing-dot-bounce"></span>
                    <span className="typing-dot-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Questions Pills Bar */}
          <div className="quick-questions-scroll">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                type="button"
                className="clay-pill pill-white quick-question-pill-btn"
                onClick={() => handleSendMessage(q.prompt)}
                disabled={loading}
              >
                {q.text}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="chatbot-input-row">
            <input
              type="text"
              className="clay-input"
              style={{ flex: 1 }}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Eco Mitra se kuch poocho..."
              aria-label="Ask Eco Mitra a question"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage(inputVal)}
              className="clay-btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, var(--clay-green), var(--clay-green-dk))',
                color: 'white',
                minWidth: '60px'
              }}
              disabled={!inputVal.trim() || loading}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default memo(EcoMitraChat)
