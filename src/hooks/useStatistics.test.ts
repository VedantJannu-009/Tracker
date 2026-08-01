import { describe, expect, it } from 'vitest'
import { computeStreaks, computeWorkoutsPerWeek, isCompletedWorkout } from '@/hooks/useStatistics'
import { toLocalDateKey } from '@/lib/dates'
import type { Workout } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgoKey(n: number): string {
  return toLocalDateKey(new Date(Date.now() - n * DAY_MS))
}

describe('computeStreaks', () => {
  it('returns zeros with no data', () => {
    expect(computeStreaks([])).toEqual({ longest: 0, current: 0 })
  })

  it('counts a single day as a streak of one', () => {
    expect(computeStreaks([daysAgoKey(2)])).toEqual({ longest: 1, current: 0 })
  })

  it('counts consecutive days as the longest streak', () => {
    const keys = [daysAgoKey(0), daysAgoKey(1), daysAgoKey(2)]
    expect(computeStreaks(keys).longest).toBe(3)
  })

  it('breaks the streak on a gap', () => {
    const keys = [daysAgoKey(0), daysAgoKey(1), daysAgoKey(2), daysAgoKey(5)]
    expect(computeStreaks(keys).longest).toBe(3)
  })

  it('counts the current streak when today is trained', () => {
    const keys = [daysAgoKey(0), daysAgoKey(1), daysAgoKey(2), daysAgoKey(10)]
    const { longest, current } = computeStreaks(keys)
    expect(longest).toBe(3)
    expect(current).toBe(3)
  })

  it('counts the current streak from yesterday when today is not trained', () => {
    const keys = [daysAgoKey(1), daysAgoKey(2), daysAgoKey(9)]
    const { longest, current } = computeStreaks(keys)
    expect(longest).toBe(2)
    expect(current).toBe(2)
  })

  it('handles unsorted input', () => {
    const keys = [daysAgoKey(5), daysAgoKey(0), daysAgoKey(1), daysAgoKey(2)]
    expect(computeStreaks(keys).longest).toBe(3)
  })
})

describe('computeWorkoutsPerWeek', () => {
  const reference = new Date(2026, 0, 15)

  function workout(date: string): Workout {
    return { id: date, name: 'W', date: new Date(date).toISOString(), createdAt: 0 }
  }

  it('produces the requested number of weekly buckets', () => {
    const buckets = computeWorkoutsPerWeek([], 8, reference)
    expect(buckets).toHaveLength(8)
    expect(buckets.every(b => b.value === 0)).toBe(true)
  })

  it('buckets workouts into the correct week', () => {
    const wednesday = new Date(2026, 0, 14)
    const previousMonday = new Date(2026, 0, 5)
    const buckets = computeWorkoutsPerWeek([workout(wednesday.toISOString()), workout(previousMonday.toISOString())], 12, reference)
    const withData = buckets.filter(b => b.value > 0)
    expect(withData).toHaveLength(2)
    expect(withData.every(b => b.value === 1)).toBe(true)
  })

  it('ignores workouts older than the window', () => {
    const old = new Date(2025, 5, 1)
    const buckets = computeWorkoutsPerWeek([workout(old.toISOString())], 12, reference)
    expect(buckets.some(b => b.value > 0)).toBe(false)
  })
})

describe('isCompletedWorkout', () => {
  const base: Workout = { id: 'w', name: 'W', date: new Date().toISOString(), createdAt: 0 }

  it('is true when a duration is present', () => {
    expect(isCompletedWorkout({ ...base, duration: 45 }, new Set())).toBe(true)
  })

  it('is true when the workout has logged sets', () => {
    expect(isCompletedWorkout(base, new Set(['w']))).toBe(true)
  })

  it('is false when neither duration nor logged sets exist', () => {
    expect(isCompletedWorkout(base, new Set())).toBe(false)
  })
})
