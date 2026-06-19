import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FootprintForm from '../components/FootprintForm'

// Mock fetch
global.fetch = vi.fn()

function renderForm() {
  return render(
    <BrowserRouter>
      <FootprintForm userId="test-user-id-0000-0000-000000000001" />
    </BrowserRouter>
  )
}

describe('FootprintForm', () => {
  it('renders all Hinglish section labels', () => {
    renderForm()
    expect(screen.getByText(/Transport/i)).toBeInTheDocument()
    expect(screen.getByText(/Khana-Peena/i)).toBeInTheDocument()
    expect(screen.getByText(/Bijli-Paani/i)).toBeInTheDocument()
    expect(screen.getByText(/Kachra/i)).toBeInTheDocument()
  })

  it('submit button present with Hinglish text', () => {
    renderForm()
    const btn = screen.getByRole('button', { name: /carbon log submit/i })
    expect(btn).toBeInTheDocument()
  })

  it('submit button disabled if no data entered', () => {
    renderForm()
    const btn = screen.getByRole('button', { name: /carbon log submit/i })
    expect(btn).toBeDisabled()
  })

  it('renders live total indicator', () => {
    renderForm()
    expect(screen.getByText(/running total/i)).toBeInTheDocument()
  })

  it('renders transport field labels', () => {
    renderForm()
    expect(screen.getByLabelText(/Petrol gaadi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cycle \/ Paidal/i)).toBeInTheDocument()
  })

  it('has accessible accordion buttons', () => {
    renderForm()
    const transportBtn = screen.getByRole('button', { name: /Transport section/i })
    expect(transportBtn).toHaveAttribute('aria-expanded')
  })
})
