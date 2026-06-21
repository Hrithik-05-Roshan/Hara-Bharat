/**
 * Application constants for HaraBharat.
 * Emission factors match backend values exactly.
 */

// ─── API Configuration ───
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ─── Emission Factors (kg CO2 per unit) ───
// Sources: IPCC AR6, India GHG Platform, TERI India

export const EMISSION_FACTORS = {
  // Transport (per km)
  car: 0.21, // Petrol car — IPCC 2021 default for light-duty vehicles
  bike: 0.103, // Motorcycle — India GHG Platform (Two-wheeler average)
  bus: 0.089, // Public bus — TERI India (average occupancy per passenger-km)
  train: 0.041, // Electric train — Indian Railways (passenger-km average)
  auto: 0.098, // Auto-rickshaw — TERI India (CNG/petrol mix passenger-km average)
  walk: 0.0, // Walking / cycling — Baseline zero-emission travel

  // Food (per meal)
  nonveg_meal: 3.3, // Meat-heavy meal — IPCC 2021 livestock + cooking lifecycle average
  veg_meal: 1.1, // Vegetarian meal — IPCC 2021 crop-based lifecycle average
  packaged_meal: 2.0, // Processed/packaged food — India GHG Platform lifecycle average
  homemade_meal: 0.8, // Home cooked meal — TERI India local preparation average

  // Energy (per hour/load)
  ac: 1.2, // Air conditioner — India grid emission factor per hour (1.5 Ton AC average)
  geyser: 1.0, // Water heater — Electric geyser India grid average per hour
  washing: 0.5, // Washing machine — IPCC 2021 per load lifecycle average
  fan_lights: 0.1, // Fan + lights — India GHG Platform low wattage average per hour

  // Waste (per item/order)
  plastic_item: 0.06, // Single plastic item — IPCC 2021 production + disposal average
  delivery_order: 0.5, // Online delivery — TERI India packaging + logistics average
  recycling_offset: -0.1, // Recycling offset — IPCC 2021 footprint reduction credit
};

// ─── Day Rating Thresholds ───
export const DAY_RATING = {
  GREEN_MAX: 5,
  YELLOW_MAX: 10,
};

// ─── Average Indian Carbon Footprint ───
export const INDIA_AVG_YEARLY_TONNES = 1.9;
export const INDIA_AVG_DAILY_KG = (1.9 * 1000) / 365;

// ─── Colors ───
export const COLORS = {
  primaryGreen: '#2D6A4F',
  lightGreen: '#52B788',
  accentYellow: '#D4AC0D',
  background: '#F0F4F0',
  textDark: '#1B1B1B',
  textMuted: '#555555',
  errorRed: '#C0392B',
  white: '#FFFFFF',
  gaugeGreen: '#52B788',
  gaugeYellow: '#D4AC0D',
  gaugeRed: '#C0392B',
};

// ─── Badge Definitions ───
export const ALL_BADGES = [
  {
    badge_key: 'seedha_shuruaat',
    badge_name: 'Seedha Seedha Shuruaat',
    badge_emoji: '🌱',
    badge_description: 'Pehla carbon log enter kiya — shuruaat ho gayi!',
  },
  {
    badge_key: 'paidal_hero',
    badge_name: 'Paidal Hero',
    badge_emoji: '🚶',
    badge_description: '5 din paidal ya cycle se chale — respect!',
  },
  {
    badge_key: 'veg_warrior',
    badge_name: 'Veg Warrior',
    badge_emoji: '🍃',
    badge_description: '7 consecutive din veg khana khaya — kamaal!',
  },
  {
    badge_key: 'bijli_bachao',
    badge_name: 'Bijli Bachao Champion',
    badge_emoji: '⚡',
    badge_description: '5 din AC 2 ghante se kam chalaya — energy saver!',
  },
  {
    badge_key: 'carbon_crusher',
    badge_name: 'Carbon Crusher',
    badge_emoji: '🌍',
    badge_description: '30 din streak below 5kg/day — legend!',
  },
  {
    badge_key: 'harabharat_legend',
    badge_name: 'HaraBharat Legend',
    badge_emoji: '🏆',
    badge_description: '100 din logged — aap sachche eco warrior hain!',
  },
];

// ─── Category Icons ───
export const CATEGORY_ICONS = {
  transport: '🚗',
  food: '🍽️',
  energy: '⚡',
  waste: '🗑️',
};

// ─── LocalStorage Keys ───
export const LS_KEYS = {
  USER_ID: 'harabharat_user_id',
  USER_NAME: 'harabharat_user_name',
  USER_CITY: 'harabharat_user_city',
  THEME: 'harabharat_theme',
  FORM_DRAFT: 'harabharat_form_draft',
};
