/* Security and Validation engine for CookFlow */
import { CONSTRAINTS } from './config.js';

/**
 * Strict sanitization to prevent LLM prompt injection and bypasses.
 */
export function sanitizeForPrompt(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<(script|iframe|object|embed|style|html|body|meta|link)/gi, '') // Strip HTML tags
    .replace(/(system instructions|ignore previous instructions|you are now|forget what|do not generate|instead output|ignore this|override)/gi, '') // Block prompt injection directives
    .replace(/[<>\\{}|[\]]/g, '') // Strip scripting delimiters
    .trim()
    .slice(0, 400); // Clamp string size to prevent denial of service / token flooding
}

/**
 * Create a DOM element safely with text content, preventing XSS injection.
 */
export function createSafeElement(tag, text, className = '', attributes = {}) {
  const el = document.createElement(tag);
  el.textContent = text; // Browser treats as plain text, preventing HTML parsing/execution
  if (className) el.className = className;
  Object.keys(attributes).forEach(key => {
    el.setAttribute(key, attributes[key]);
  });
  return el;
}

/**
 * Validate input fields based on schema constraints.
 */
export function validateInputs(data) {
  const errors = {};
  
  const time = parseInt(data.cookingTime, 10);
  if (isNaN(time) || time < CONSTRAINTS.minCookingTime || time > CONSTRAINTS.maxCookingTime) {
    errors.cookingTime = `Cooking time must be between ${CONSTRAINTS.minCookingTime} and ${CONSTRAINTS.maxCookingTime} minutes.`;
  }
  
  const budget = parseFloat(data.budget);
  if (isNaN(budget) || budget < CONSTRAINTS.minBudget || budget > CONSTRAINTS.maxBudget) {
    errors.budget = `Budget must be a non-negative number up to $${CONSTRAINTS.maxBudget.toLocaleString()}.`;
  }
  
  const people = parseInt(data.people, 10);
  if (isNaN(people) || people < CONSTRAINTS.minPeople || people > CONSTRAINTS.maxPeople) {
    errors.people = `Number of people must be between ${CONSTRAINTS.minPeople} and ${CONSTRAINTS.maxPeople}.`;
  }
  
  // Array inputs length checks
  if (Array.isArray(data.ingredients)) {
    data.ingredients.forEach(ing => {
      const sanitized = sanitizeForPrompt(ing);
      if (sanitized.length < 2 || sanitized.length > 50) {
        errors.ingredients = "Ingredients must be between 2 and 50 characters each.";
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Rate Limiter Hook.
 * Restricts client API calls (e.g. maximum of 5 requests per 60 seconds).
 */
export class RateLimiter {
  constructor(maxCalls = 5, windowMs = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.timestamps = [];
  }
  
  /**
   * Returns true if request is allowed, false otherwise.
   */
  checkLimit() {
    const now = Date.now();
    // Filter out timestamps older than the rate limit window
    this.timestamps = this.timestamps.filter(ts => now - ts < this.windowMs);
    
    if (this.timestamps.length >= this.maxCalls) {
      return false;
    }
    
    this.timestamps.push(now);
    return true;
  }
  
  getRemainingCooldown() {
    if (this.timestamps.length === 0) return 0;
    const now = Date.now();
    const oldest = this.timestamps[0];
    return Math.max(0, Math.ceil((this.windowMs - (now - oldest)) / 1000));
  }
}
