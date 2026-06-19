import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../components/Dashboard'

// Mock fetch
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes('/summary')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          today_score: 3.5,
          week_avg: 4.2,
          streak_days: 3,
          total_xp: 75,
          badges_count: 2,
          challenges_completed_today: 1,
          day_rating: 'green',
        }),
      })
    }
    if (url.includes('/history')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { log_date: '2026-06-18', total_kg_co2: 4.5, transport_co2: 2, food_co2: 1.5, energy_co2: 0.8, waste_co2: 0.2 },
        ]),
      })
    }
    if (url.includes('/badges')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
})

function renderDashboard(todayScore = 3.5) {
  return render(
    <BrowserRouter>
      <Dashboard userId="test-user-id-0000-0000-000000000001" userName="TestUser" />
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  it('renders carbon score after loading', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('3.5')).toBeInTheDocument()
    })
  })

  it('shows green zone message when score < 5kg', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/Green zone/i)).toBeInTheDocument()
    })
  })

  it('renders greeting with username', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/Namaste, TestUser!/i)).toBeInTheDocument()
    })
  })

  it('shows streak badge when streak > 0', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/3 din green streak/i)).toBeInTheDocument()
    })
  })

  it('renders chart section', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/Quick Stats/i)).toBeInTheDocument()
    })
  })
})
