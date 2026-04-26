/**
 * Analytics Utilities
 * Helper functions for analytics operations
 */

// Constants for time calculations
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30; // Approximate for default ranges

export const MILLISECONDS_PER_DAY = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * HOURS_PER_DAY;
export const DEFAULT_ANALYTICS_PERIOD_DAYS = DAYS_PER_MONTH;

/**
 * Get date range for analytics
 * @param endDate - End date (defaults to now)
 * @param days - Number of days to go back (defaults to 30)
 * @returns Object with start and end dates
 */
export function getDateRange(endDate: Date = new Date(), days: number = DEFAULT_ANALYTICS_PERIOD_DAYS): { start: Date; end: Date } {
  const end = new Date(endDate);
  const start = new Date(end.getTime() - days * MILLISECONDS_PER_DAY);

  return { start, end };
}

/**
 * Validate time range parameters
 * @param startDate - Start date
 * @param endDate - End date
 * @throws Error if validation fails
 */
export function validateTimeRange(startDate: Date, endDate: Date): void {
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    throw new Error('Invalid start date provided');
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    throw new Error('Invalid end date provided');
  }

  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }

  const maxRangeDays = 365; // Maximum 1 year range
  const rangeMs = endDate.getTime() - startDate.getTime();
  const rangeDays = rangeMs / MILLISECONDS_PER_DAY;

  if (rangeDays > maxRangeDays) {
    throw new Error(`Date range cannot exceed ${maxRangeDays} days`);
  }
}

/**
 * Calculate period duration in days
 * @param start - Start date
 * @param end - End date
 * @returns Number of days between dates
 */
export function calculatePeriodDays(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY);
}