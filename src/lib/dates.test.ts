import { describe, it, expect } from 'vitest'
import { toLocalDateKey } from './dates'

describe('toLocalDateKey', () => {
  it('returns the local calendar date for a UTC instant', () => {
    expect(toLocalDateKey('2026-07-31T20:00:00Z')).toBe('2026-08-01')
  })

  it('accepts a Date instance', () => {
    expect(toLocalDateKey(new Date('2026-07-31T20:00:00Z'))).toBe('2026-08-01')
  })

  it('accepts a millisecond timestamp', () => {
    expect(toLocalDateKey(Date.parse('2026-07-31T20:00:00Z'))).toBe('2026-08-01')
  })

  it('pads month and day', () => {
    expect(toLocalDateKey('2026-01-05T10:00:00Z')).toBe('2026-01-05')
  })

  it('keeps late-evening local workouts on the same calendar day', () => {
    expect(toLocalDateKey('2026-07-31T13:00:00Z')).toBe('2026-07-31')
  })

  it('moves a post-midnight local workout to the local day, not the UTC day', () => {
    expect(toLocalDateKey('2026-07-31T19:00:00Z')).toBe('2026-08-01')
  })
})
