import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

/**
 * Merge Tailwind CSS classes with clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string or Date object as "MMM d, yyyy" (e.g. "Jan 5, 2025").
 */
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

/**
 * Format a date string or Date object as a relative time string
 * (e.g. "3 days ago", "about 2 hours ago").
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Extract the bare domain from a URL, stripping protocol and www.
 * Returns null if the URL is invalid or empty.
 */
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    const { hostname } = new URL(normalized)
    return hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Truncate a string to a maximum length, appending "…" when truncated.
 */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + '…'
}
