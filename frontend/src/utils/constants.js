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
  car: 0.21,
  bike: 0.103,
  bus: 0.089,
  train: 0.041,
  auto: 0.098,
  walk: 0.0,

  // Food (per meal)
  nonveg_meal: 3.3,
  veg_meal: 1.1,
  packaged_meal: 2.0,
  homemade_meal: 0.8,

  // Energy (per hour/load)
  ac: 1.2,
  geyser: 1.0,
  washing: 0.5,
  fan_lights: 0.1,

  // Waste (per item/order)
  plastic_item: 0.06,
  delivery_order: 0.5,
  recycling_offset: -0.1,
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
  FORM_DRAFT: 'harabharat_form_draft',
};
