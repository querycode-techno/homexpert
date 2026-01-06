/**
 * Subscription Duration Utility Functions
 * Provides dynamic duration parsing, calculation, and formatting
 */

/**
 * Parse duration string to extract number of months
 * @param {string} duration - Duration string in format "N-month" (e.g., "3-month", "12-month")
 * @returns {number|null} - Number of months or null if invalid
 */
export function parseDuration(duration) {
  if (!duration || typeof duration !== 'string') {
    return null;
  }

  const match = duration.match(/^(\d+)-month$/);
  if (!match) {
    return null;
  }

  const months = parseInt(match[1], 10);
  return isNaN(months) || months < 1 ? null : months;
}

/**
 * Calculate duration in days from number of months
 * Uses 30 days per month (approximate)
 * @param {number} months - Number of months
 * @returns {number} - Duration in days
 */
export function calculateDurationInDays(months) {
  if (!months || months < 1) {
    return 30; // Default to 1 month
  }
  return months * 30;
}

/**
 * Calculate duration in days from duration string
 * @param {string} duration - Duration string (e.g., "3-month")
 * @returns {number} - Duration in days
 */
export function getDurationInDays(duration) {
  const months = parseDuration(duration);
  if (months === null) {
    return 30; // Default to 1 month
  }
  return calculateDurationInDays(months);
}

/**
 * Format duration for display
 * @param {string} duration - Duration string (e.g., "3-month")
 * @returns {string} - Formatted string (e.g., "3 Months")
 */
export function formatDurationDisplay(duration) {
  const months = parseDuration(duration);
  if (months === null) {
    return duration; // Return as-is if invalid format
  }
  return `${months} Month${months !== 1 ? 's' : ''}`;
}

/**
 * Validate duration format
 * @param {string} duration - Duration string to validate
 * @param {number} maxMonths - Maximum allowed months (default: 24)
 * @returns {object} - { isValid: boolean, error?: string }
 */
export function validateDuration(duration, maxMonths = 24) {
  if (!duration || typeof duration !== 'string') {
    return { isValid: false, error: 'Duration is required' };
  }

  const months = parseDuration(duration);
  if (months === null) {
    return { isValid: false, error: 'Invalid duration format. Must be "N-month" (e.g., "3-month")' };
  }

  if (months < 1) {
    return { isValid: false, error: 'Duration must be at least 1 month' };
  }

  if (months > maxMonths) {
    return { isValid: false, error: `Duration cannot exceed ${maxMonths} months` };
  }

  return { isValid: true };
}

/**
 * Get number of months from duration string
 * @param {string} duration - Duration string (e.g., "3-month")
 * @returns {number} - Number of months (default: 1 if invalid)
 */
export function getDurationMonths(duration) {
  const months = parseDuration(duration);
  return months !== null ? months : 1;
}

/**
 * Create duration string from number of months
 * @param {number} months - Number of months
 * @returns {string} - Duration string (e.g., "3-month")
 */
export function createDurationString(months) {
  const numMonths = parseInt(months, 10);
  if (isNaN(numMonths) || numMonths < 1) {
    return '1-month';
  }
  return `${numMonths}-month`;
}

/**
 * Calculate monthly equivalent price
 * @param {number} price - Total price
 * @param {string} duration - Duration string (e.g., "3-month")
 * @returns {number} - Monthly equivalent price
 */
export function calculateMonthlyEquivalent(price, duration) {
  const months = getDurationMonths(duration);
  if (months === 0) return price;
  return Math.round(price / months);
}

/**
 * Generate list of duration options for dropdowns
 * @param {number} minMonths - Minimum months (default: 1)
 * @param {number} maxMonths - Maximum months (default: 24)
 * @returns {Array<{value: string, label: string}>} - Array of duration options
 */
export function getDurationOptions(minMonths = 1, maxMonths = 24) {
  const options = [];
  for (let i = minMonths; i <= maxMonths; i++) {
    options.push({
      value: createDurationString(i),
      label: formatDurationDisplay(createDurationString(i))
    });
  }
  return options;
}

