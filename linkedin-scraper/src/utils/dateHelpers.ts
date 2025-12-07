import { subDays, subHours, subWeeks, subMonths } from 'date-fns';

/**
 * Parse LinkedIn's relative date strings to actual Date objects
 * Examples: "2 days ago", "1 week ago", "3 hours ago"
 */
export function parsePostedDate(dateString: string): Date {
  const now = new Date();
  const lowerDate = dateString.toLowerCase().trim();

  // Match patterns like "X hours/days/weeks/months ago"
  const hoursMatch = lowerDate.match(/(\d+)\s*hour/);
  if (hoursMatch) {
    return subHours(now, parseInt(hoursMatch[1]));
  }

  const daysMatch = lowerDate.match(/(\d+)\s*day/);
  if (daysMatch) {
    return subDays(now, parseInt(daysMatch[1]));
  }

  const weeksMatch = lowerDate.match(/(\d+)\s*week/);
  if (weeksMatch) {
    return subWeeks(now, parseInt(weeksMatch[1]));
  }

  const monthsMatch = lowerDate.match(/(\d+)\s*month/);
  if (monthsMatch) {
    return subMonths(now, parseInt(monthsMatch[1]));
  }

  // Handle "just now" or "today"
  if (lowerDate.includes('just now') || lowerDate.includes('today')) {
    return now;
  }

  // Default to current date if we can't parse
  return now;
}

/**
 * Convert relative date string to ISO format for storage
 */
export function normalizeDate(dateString: string): string {
  return parsePostedDate(dateString).toISOString();
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return 'Just now';
  }

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
}
