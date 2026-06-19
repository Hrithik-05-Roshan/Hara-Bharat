import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LocationPage from '../pages/Location'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LocationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful fetch calls
    mockFetch.mockImplementation((url) => {
      if (url.includes('/weather')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            city: 'Delhi',
            temp: 32.0,
            aqi: 210,
            humidity: 65,
            status: 'Poor Air Quality',
            risk: 'High'
          })
        })
      }
      if (url.includes('/comparison')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user_avg: 3.5,
            city_avg: 4.8,
            target: 3.0,
            national_avg: 5.2,
            comparison_percentage: 27.1,
            ranking_badge: 'Carbon Crusher Elite 👑'
          })
        })
      }
      if (url.includes('/insights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            recommendation: 'Mock advice: Metro use karein 🚇'
          })
        })
      }
      if (url.includes('/challenges')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            city: 'Delhi',
            challenges: [
              { text: 'Metro use karo 🚇', co2_saving: 3.4, difficulty: 'Easy', impact: 4 }
            ]
          })
        })
      }
      if (url.includes('/green-spots')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            city: 'Delhi',
            lat: 28.6139,
            lng: 77.2090,
            spots: [
              { name: 'Lodhi Gardens 🌳', lat: 28.5933, lng: 77.2188, category: 'Park', benefit: 'Oxygen sanctuary' }
            ]
          })
        })
      }
      return Promise.reject(new Error('Unknown url requested'))
    })
  })

  const renderLocation = () => {
    return render(
      <BrowserRouter>
        <LocationPage userId="test-user-uuid" />
      </BrowserRouter>
    )
  }

  it('renders header and city button', async () => {
    renderLocation()
    expect(screen.getByText(/Mera Shehar/i)).toBeInTheDocument()
    
    // Wait for weather data to load
    await waitFor(() => {
      expect(screen.getByText(/Delhi/i)).toBeInTheDocument()
    })
  })

  it('displays weather statistics card', async () => {
    renderLocation()
    await waitFor(() => {
      expect(screen.getByText(/Poor Air Quality/i)).toBeInTheDocument()
      expect(screen.getByText('210')).toBeInTheDocument()
      expect(screen.getByText('32°C')).toBeInTheDocument()
    })
  })

  it('displays city vs user comparison values', async () => {
    renderLocation()
    await waitFor(() => {
      expect(screen.getByText('3.5 kg')).toBeInTheDocument()
      expect(screen.getByText('4.8 kg')).toBeInTheDocument()
      expect(screen.getByText('Carbon Crusher Elite 👑')).toBeInTheDocument()
    })
  })

  it('future impact simulator updates successfully on slider drag', async () => {
    renderLocation()
    await waitFor(() => {
      expect(screen.getByText(/Future Impact Simulator/i)).toBeInTheDocument()
    })

    // Default daily saving is: (25 * 100) * 1.5 + (2 * 0.8) * 10000 = 3750 + 16000 = 19750
    expect(screen.getByText(/19750 kg CO₂/i)).toBeInTheDocument()

    // Find sliders and adjust values
    const sliders = screen.getAllByRole('slider')
    
    // Drag first slider to 50%
    fireEvent.change(sliders[0], { target: { value: '50' } })
    // New saving should be: (50 * 100) * 1.5 + (2 * 0.8) * 10000 = 7500 + 16000 = 23500
    await waitFor(() => {
      expect(screen.getByText(/23500 kg CO₂/i)).toBeInTheDocument()
    })
  })
})
