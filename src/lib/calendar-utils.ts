/**
 * Pure, client-safe date and calendar utility functions (no server or database imports)
 */

/**
 * Formats a Date object to YYYY-MM-DD using local time (avoids UTC day shifts)
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parses a YYYY-MM-DD string into a local Date object
 */
export function parseDateKey(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-')
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  return new Date(y, m, d)
}

/**
 * Adds days to a Date object without mutating
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime())
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Generates an array of YYYY-MM-DD date strings between start and end (inclusive)
 */
export function getDateRangeArray(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = []
  const current = parseDateKey(startDateStr)
  const end = parseDateKey(endDateStr)

  while (current <= end) {
    dates.push(formatDateKey(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}
