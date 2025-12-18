import { format } from "date-fns";

/**
 * Format date as "WEDNESDAY, DEC 18, 2025"
 */
export function formatEditorialDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "EEEE, MMM d, yyyy").toUpperCase();
}

/**
 * Format date as "Dec 16" for article metadata
 */
export function formatArticleDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM d");
}

