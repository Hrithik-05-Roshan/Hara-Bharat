/**
 * Frontend carbon emission calculator.
 * Performs all math client-side to avoid unnecessary API calls.
 * Emission factors match backend (services/carbon_calculator.py) exactly.
 */

import { EMISSION_FACTORS } from './constants';

/**
 * Calculate transport CO2 emissions (kg).
 * @param {object} transport - { car_km, bike_km, bus_km, train_km, auto_km, walk_km }
 * @returns {number} CO2 in kg, rounded to 2 decimal places
 */
export function calculateTransportCO2(transport = {}) {
  const {
    car_km = 0,
    bike_km = 0,
    bus_km = 0,
    train_km = 0,
    auto_km = 0,
    walk_km = 0,
  } = transport;

  const total =
    car_km * EMISSION_FACTORS.car +
    bike_km * EMISSION_FACTORS.bike +
    bus_km * EMISSION_FACTORS.bus +
    train_km * EMISSION_FACTORS.train +
    auto_km * EMISSION_FACTORS.auto +
    walk_km * EMISSION_FACTORS.walk;

  return Math.round(Math.max(total, 0) * 100) / 100;
}

/**
 * Calculate food CO2 emissions (kg).
 * @param {object} food - { nonveg_meals, veg_meals, packaged_meals, homemade_meals }
 * @returns {number} CO2 in kg
 */
export function calculateFoodCO2(food = {}) {
  const {
    nonveg_meals = 0,
    veg_meals = 0,
    packaged_meals = 0,
    homemade_meals = 0,
  } = food;

  const total =
    nonveg_meals * EMISSION_FACTORS.nonveg_meal +
    veg_meals * EMISSION_FACTORS.veg_meal +
    packaged_meals * EMISSION_FACTORS.packaged_meal +
    homemade_meals * EMISSION_FACTORS.homemade_meal;

  return Math.round(Math.max(total, 0) * 100) / 100;
}

/**
 * Calculate energy CO2 emissions (kg).
 * @param {object} energy - { ac_hours, geyser_hours, washing_loads, fan_lights_hours }
 * @returns {number} CO2 in kg
 */
export function calculateEnergyCO2(energy = {}) {
  const {
    ac_hours = 0,
    geyser_hours = 0,
    washing_loads = 0,
    fan_lights_hours = 0,
  } = energy;

  const total =
    ac_hours * EMISSION_FACTORS.ac +
    geyser_hours * EMISSION_FACTORS.geyser +
    washing_loads * EMISSION_FACTORS.washing +
    fan_lights_hours * EMISSION_FACTORS.fan_lights;

  return Math.round(Math.max(total, 0) * 100) / 100;
}

/**
 * Calculate waste CO2 emissions (kg).
 * @param {object} waste - { plastic_items, delivery_orders, recycling_done }
 * @returns {number} CO2 in kg
 */
export function calculateWasteCO2(waste = {}) {
  const {
    plastic_items = 0,
    delivery_orders = 0,
    recycling_done = false,
  } = waste;

  let total =
    plastic_items * EMISSION_FACTORS.plastic_item +
    delivery_orders * EMISSION_FACTORS.delivery_order;

  if (recycling_done) {
    total += EMISSION_FACTORS.recycling_offset;
  }

  return Math.round(Math.max(total, 0) * 100) / 100;
}

/**
 * Calculate total daily CO2 from all categories.
 * @param {object} data - { transport, food, energy, waste }
 * @returns {{ total: number, breakdown: { transport, food, energy, waste } }}
 */
export function calculateDailyCO2(data = {}) {
  const transportCO2 = calculateTransportCO2(data.transport);
  const foodCO2 = calculateFoodCO2(data.food);
  const energyCO2 = calculateEnergyCO2(data.energy);
  const wasteCO2 = calculateWasteCO2(data.waste);

  const total = Math.round((transportCO2 + foodCO2 + energyCO2 + wasteCO2) * 100) / 100;

  return {
    total,
    breakdown: {
      transport: transportCO2,
      food: foodCO2,
      energy: energyCO2,
      waste: wasteCO2,
    },
  };
}

/**
 * Get day rating based on total CO2.
 * @param {number} totalKg - Total CO2 in kg
 * @returns {'green'|'yellow'|'red'}
 */
export function getDayRating(totalKg) {
  if (totalKg < 5) return 'green';
  if (totalKg <= 10) return 'yellow';
  return 'red';
}
