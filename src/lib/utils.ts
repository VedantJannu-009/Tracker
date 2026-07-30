import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | number): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  return format(d, 'MMM dd, yyyy')
}

export function formatRelative(date: string | number): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date)
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15)
}
