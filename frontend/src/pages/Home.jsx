import { Link } from 'react-router-dom'
import { useEffect } from 'react'

/**
 * Home - Landing page component of the HaraBharat application describing its features and how it works.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function Home() {
  // Page transition effect
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleScrollToHow = (e) => {
    e.preventDefault()
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="anim-fade-up">
      {/* HERO SECTION */}
      <section className="hero-sec" role="banner">
        {/* Decorative background blobs */}
        <div className="hero-blob-1" aria-hidden="true"></div>
        <div className="hero-blob-2" aria-hidden="true"></div>
        <div className="hero-blob-3" aria-hidden="true"></div>

        {/* Floating leaves */}
        <span className="floating-leaf leaf-1" aria-hidden="true">🍃</span>
        <span className="floating-leaf leaf-2" aria-hidden="true">🍃</span>
        <span className="floating-leaf leaf-3" aria-hidden="true">🍃</span>
        <span className="floating-leaf leaf-4" aria-hidden="true">🍃</span>
        <span className="floating-leaf leaf-5" aria-hidden="true">🍃</span>
        <span className="floating-leaf leaf-6" aria-hidden="true">🍃</span>

        <div className="hero-content">
          <div className="clay-pill pill-mint anim-fade-up stagger-1" style={{ display: 'inline-flex', marginBottom: '20px' }}>
            ✨ India Ka #1 Carbon Tracker
          </div>

          <h1 className="hero-h1 anim-fade-up stagger-2">
            Apni Dharti
            <span className="hero-h1-gradient">Bachao! 🌍</span>
          </h1>

          <p className="hero-subtext anim-fade-up stagger-3">
            Carbon footprint track karo, Eco Mitra AI se Hinglish mein tips lo, aur ek better India banao — ek din, ek kadam 🌱
          </p>

          <div className="hero-cta anim-fade-up stagger-4">
            <Link
              to="/onboard"
              className="clay-btn btn-lg"
              style={{ background: 'linear-gradient(135deg, var(--clay-green), var(--clay-green-dk))', color: 'white' }}
              aria-label="Abhi shuru karo, registration page par jao"
            >
              🚀 Abhi Shuru Karo
            </Link>
            <a
              href="#how-it-works"
              onClick={handleScrollToHow}
              className="clay-btn btn-lg btn-ghost"
              aria-label="Kaise kaam karta hai section par scroll karo"
            >
              📊 Kaise Kaam Karta Hai?
            </a>
          </div>

          <div className="hero-stats anim-fade-up stagger-5">
            <span className="clay-pill pill-mint">🌱 10,000+ Users</span>
            <span className="clay-pill pill-yellow">🌍 50+ Ton CO₂ Saved</span>
            <span className="clay-pill pill-lavender">⭐ 4.9/5 Rating</span>
          </div>
        </div>

        <a href="#features" className="scroll-indicator" aria-label="Niche scroll karo aur features ke baare mein jaano">
          Aur jaano <span className="scroll-arrow" aria-hidden="true">↓</span>
        </a>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section id="features" className="features-sec" aria-labelledby="features-heading">
        <span className="clay-pill pill-green" style={{ display: 'inline-flex', marginBottom: '16px' }}>Features</span>
        <h2 id="features-heading" className="hero-h1" style={{ fontSize: 'clamp(28px, 5vw, 48px)', margin: '16px 0 48px' }}>
          HaraBharat kya karta hai?
        </h2>

        <div className="grid-3">
          {/* Card 1 */}
          <div className="clay-card cc-mint" style={{ padding: '36px', textAlign: 'center' }}>
            <div className="feature-icon-wrapper cc-lime clay-card no-hover">
              <span style={{ fontSize: '40px' }} aria-label="Car emoji">🚗</span>
            </div>
            <h3 className="feature-title">Carbon Track Karo</h3>
            <p className="feature-desc">
              Daily habits se hone wale carbon emissions ko automatically calculate karo, easy category-wise logs ke saath.
            </p>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="clay-pill pill-white">🚗 Transport</span>
              <span className="clay-pill pill-white">🍛 Khana</span>
              <span className="clay-pill pill-white">⚡ Bijli</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="clay-card cc-lime" style={{ padding: '36px', textAlign: 'center' }}>
            <div className="feature-icon-wrapper cc-sky clay-card no-hover">
              <span style={{ fontSize: '40px' }} aria-label="Robot emoji">🤖</span>
            </div>
            <h3 className="feature-title">Eco Mitra AI</h3>
            <p className="feature-desc">
              Gemini AI se direct connect ho jao aur personalized local Hinglish tips pao carbon emissions ghatane ke liye.
            </p>
            <div style={{ display: 'inline-block' }}>
              <span className="clay-pill pill-white">Gemini 1.5 Flash Powered</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="clay-card cc-peach" style={{ padding: '36px', textAlign: 'center' }}>
            <div className="feature-icon-wrapper cc-lavender clay-card no-hover">
              <span style={{ fontSize: '40px' }} aria-label="Trophy emoji">🏆</span>
            </div>
            <h3 className="feature-title">Badges aur XP Kamao</h3>
            <p className="feature-desc">
              Khel khel mein environment bachaayein! Challenges pure karke badges aur XP points accumulate karke profile share karein.
            </p>
            <div style={{ display: 'inline-block' }}>
              <span className="clay-pill pill-white">+50 XP per challenge</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="clay-card cc-yellow" style={{ padding: '36px', textAlign: 'center' }}>
            <div className="feature-icon-wrapper cc-mint clay-card no-hover">
              <span style={{ fontSize: '40px' }} aria-label="Bar chart emoji">📊</span>
            </div>
            <h3 className="feature-title">Smart Carbon Ledger</h3>
            <p className="feature-desc">
              Har activity database mein permanently log hoti hai jisse aapka carbon footprint records transparent aur safe rehte hain.
            </p>
            <div style={{ display: 'inline-block' }}>
              <span className="clay-pill pill-white">Event-Sourced</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="clay-card cc-sky" style={{ padding: '36px', textAlign: 'center' }}>
            <div className="feature-icon-wrapper cc-peach clay-card no-hover">
              <span style={{ fontSize: '40px' }} aria-label="Calendar emoji">🗓️</span>
            </div>
            <h3 className="feature-title">Bijli Smart Scheduler</h3>
            <p className="feature-desc">
              Appliances use karne ke off-peak timings schedule karein greedy algorithm se, electricity bill aur carbon dono bachayein.
            </p>
            <div style={{ display: 'inline-block' }}>
              <span className="clay-pill pill-white">AI Optimized</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="clay-card cc-lavender" style={{ padding: '36px', textAlign: 'center' }}>
            <div className="feature-icon-wrapper cc-yellow clay-card no-hover">
              <span style={{ fontSize: '40px' }} aria-label="Growth chart emoji">📈</span>
            </div>
            <h3 className="feature-title">30 Din Ka Trend</h3>
            <p className="feature-desc">
              Apne 30-day performance trends ko interactive charts aur statistics ke saath analyze karke improvement track karein.
            </p>
            <div style={{ display: 'inline-block' }}>
              <span className="clay-pill pill-white">Real-time Charts</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="how-it-works-sec" aria-labelledby="how-heading">
        <h2 id="how-heading" className="feature-title" style={{ fontSize: '32px' }}>Kaise Kaam Karta Hai? 🤔</h2>
        
        <div className="steps-container">
          <div className="steps-connector-line" aria-hidden="true"></div>

          {/* Step 1 */}
          <div className="step-item">
            <div className="step-number" aria-label="Step 1">1</div>
            <div className="step-icon" aria-hidden="true">👤</div>
            <h3 className="step-title">Naam Batao</h3>
            <p className="step-desc">Bas apna naam aur PIN daalo. Koi password nahi, zero tracking, secure data.</p>
          </div>

          {/* Step 2 */}
          <div className="step-item">
            <div className="step-number" aria-label="Step 2">2</div>
            <div className="step-icon" aria-hidden="true">📝</div>
            <h3 className="step-title">Activity Log Karo</h3>
            <p className="step-desc">Ghar ki bijli, transport, khana, plastic waste track karo. It takes only 2 mins!</p>
          </div>

          {/* Step 3 */}
          <div className="step-item">
            <div className="step-number" aria-label="Step 3">3</div>
            <div className="step-icon" aria-hidden="true">🌿</div>
            <h3 className="step-title">Tips Pao</h3>
            <p className="step-desc">Eco Mitra AI feedback, statistics aur green rating se daily footprint kam karo.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-sec" role="contentinfo">
        <p className="footer-line-1">🌿 HaraBharat — Ek Kadam Ek Din</p>
        <p>Made with 💚 for a Greener India</p>
      </footer>
    </div>
  )
}

export default Home
