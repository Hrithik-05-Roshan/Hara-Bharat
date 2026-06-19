/**
 * Frontend input validators for HaraBharat.
 * All user inputs are sanitized and validated before submission.
 * Backend also validates via Pydantic — defense in depth.
 */

/**
 * Sanitize text input — strip HTML tags and trim whitespace.
 * @param {string} text
 * @returns {string} Cleaned text
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate user name.
 * @param {string} name
 * @returns {{ valid: boolean, error: string }}
 */
export function validateName(name) {
  const clean = sanitizeText(name);
  if (!clean) {
    return { valid: false, error: 'Naam daalna zaroori hai!' };
  }
  if (clean.length > 50) {
    return { valid: false, error: 'Naam 50 characters se zyada nahi ho sakta!' };
  }
  if (clean.length < 2) {
    return { valid: false, error: 'Naam kam se kam 2 characters ka hona chahiye!' };
  }
  return { valid: true, error: '' };
}

/**
 * Validate city name.
 * @param {string} city
 * @returns {{ valid: boolean, error: string }}
 */
export function validateCity(city) {
  const clean = sanitizeText(city);
  if (!clean) {
    return { valid: false, error: 'City daalna zaroori hai!' };
  }
  if (clean.length > 100) {
    return { valid: false, error: 'City 100 characters se zyada nahi ho sakta!' };
  }
  return { valid: true, error: '' };
}

/**
 * Validate 4-digit PIN.
 * @param {string} pin
 * @returns {{ valid: boolean, error: string }}
 */
export function validatePin(pin) {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'PIN daalna zaroori hai!' };
  }
  if (pin.length !== 4) {
    return { valid: false, error: 'PIN exactly 4 digits ka hona chahiye!' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { valid: false, error: 'PIN mein sirf numbers hone chahiye!' };
  }
  return { valid: true, error: '' };
}

/**
 * Validate a numeric input field (non-negative).
 * @param {number|string} value
 * @param {string} fieldName - Hinglish field name for error messages
 * @param {number} max - Maximum allowed value
 * @returns {{ valid: boolean, error: string, value: number }}
 */
export function validateNumericInput(value, fieldName = 'Value', max = 10000) {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} ek valid number hona chahiye!`, value: 0 };
  }
  if (num < 0) {
    return { valid: false, error: `${fieldName} negative nahi ho sakta!`, value: 0 };
  }
  if (num > max) {
    return { valid: false, error: `${fieldName} ${max} se zyada nahi ho sakta!`, value: 0 };
  }
  return { valid: true, error: '', value: num };
}

/**
 * Validate chat message.
 * @param {string} message
 * @returns {{ valid: boolean, error: string }}
 */
export function validateChatMessage(message) {
  const clean = sanitizeText(message);
  if (!clean) {
    return { valid: false, error: 'Message khali nahi ho sakta!' };
  }
  if (clean.length > 500) {
    return { valid: false, error: 'Message 500 characters se zyada nahi ho sakta!' };
  }
  return { valid: true, error: '' };
}
