import { describe, it, expect } from 'vitest'
import {
  calculateTransportCO2,
  calculateFoodCO2,
  calculateEnergyCO2,
  calculateWasteCO2,
  calculateDailyCO2,
  getDayRating,
} from '../utils/carbonCalculator'

describe('calculateTransportCO2', () => {
  it('petrol car 10km = 2.1 kg CO2', () => {
    expect(calculateTransportCO2({ car_km: 10 })).toBe(2.1)
  })

  it('zero emissions for walking', () => {
    expect(calculateTransportCO2({ walk_km: 10 })).toBe(0)
  })

  it('motorcycle 20km = 2.06 kg CO2', () => {
    expect(calculateTransportCO2({ bike_km: 20 })).toBe(2.06)
  })

  it('combined transport is correct', () => {
    const result = calculateTransportCO2({ car_km: 10, bus_km: 5 })
    expect(result).toBe(Math.round((10 * 0.21 + 5 * 0.089) * 100) / 100)
  })

  it('0 input = 0 emissions', () => {
    expect(calculateTransportCO2({})).toBe(0)
  })

  it('handles undefined gracefully', () => {
    expect(calculateTransportCO2()).toBe(0)
  })
})

describe('calculateFoodCO2', () => {
  it('1 nonveg meal = 3.3 kg CO2', () => {
    expect(calculateFoodCO2({ nonveg_meals: 1 })).toBe(3.3)
  })

  it('1 veg meal = 1.1 kg CO2', () => {
    expect(calculateFoodCO2({ veg_meals: 1 })).toBe(1.1)
  })

  it('combined meals total correct', () => {
    expect(calculateFoodCO2({ nonveg_meals: 1, veg_meals: 2 })).toBe(5.5)
  })
})

describe('calculateEnergyCO2', () => {
  it('AC 3 hours = 3.6 kg', () => {
    expect(calculateEnergyCO2({ ac_hours: 3 })).toBe(3.6)
  })

  it('zero energy = 0', () => {
    expect(calculateEnergyCO2({})).toBe(0)
  })
})

describe('calculateWasteCO2', () => {
  it('2 plastic items = 0.12 kg', () => {
    expect(calculateWasteCO2({ plastic_items: 2 })).toBe(0.12)
  })

  it('recycling reduces footprint', () => {
    const withRecycling = calculateWasteCO2({ plastic_items: 5, recycling_done: true })
    const without = calculateWasteCO2({ plastic_items: 5, recycling_done: false })
    expect(withRecycling).toBeLessThan(without)
  })
})

describe('calculateDailyCO2', () => {
  it('combined category total is correct', () => {
    const result = calculateDailyCO2({
      transport: { car_km: 10 },
      food: { veg_meals: 1 },
      energy: {},
      waste: {},
    })
    expect(result.total).toBe(3.2)
    expect(result.breakdown.transport).toBe(2.1)
    expect(result.breakdown.food).toBe(1.1)
  })

  it('empty data = 0 total', () => {
    expect(calculateDailyCO2({}).total).toBe(0)
  })
})

describe('getDayRating', () => {
  it('< 5kg is green', () => expect(getDayRating(4.9)).toBe('green'))
  it('5kg is yellow', () => expect(getDayRating(5)).toBe('yellow'))
  it('10kg is yellow', () => expect(getDayRating(10)).toBe('yellow'))
  it('> 10kg is red', () => expect(getDayRating(10.1)).toBe('red'))
  it('0 is green', () => expect(getDayRating(0)).toBe('green'))
})
