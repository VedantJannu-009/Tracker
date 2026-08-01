import { describe, expect, it } from 'vitest'
import {
  buildSessions,
  computeProgress,
  computeMonthlyComparison,
  type SessionStat,
} from '@/lib/exerciseProgress'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types'

const WE = (id: string, workoutId: string): WorkoutExercise => ({ id, workoutId, exerciseId: 'ex', order: 0 })

function workout(id: string, date: string): Workout {
  return { id, name: `Workout ${id}`, date, createdAt: 0 }
}

function set(id: string, weId: string, weight: number, reps: number, order = 0): WorkoutSet {
  return { id, workoutExerciseId: weId, weight, reps, order }
}

const A_DATE = '2026-07-01T10:00:00.000Z'
const B_DATE = '2026-07-15T10:00:00.000Z'

describe('buildSessions', () => {
  it('groups logged sets into per-workout sessions sorted ascending', () => {
    const workouts = [workout('w2', B_DATE), workout('w1', A_DATE)]
    const wes = [WE('we1', 'w1'), WE('we2', 'w2')]
    const sets = [set('s1', 'we1', 60, 8), set('s2', 'we2', 70, 6)]

    const sessions = buildSessions(workouts, wes, sets)

    expect(sessions).toHaveLength(2)
    expect(sessions[0].id).toBe('w1')
    expect(sessions[1].id).toBe('w2')
    expect(sessions[1].bestWeight).toBe(70)
    expect(sessions[1].totalReps).toBe(6)
    expect(sessions[1].totalVolume).toBe(420)
  })

  it('ignores empty placeholder sets within a session', () => {
    const sessions = buildSessions(
      [workout('w1', A_DATE)],
      [WE('we1', 'w1')],
      [set('s1', 'we1', 0, 0), set('s2', 'we1', 60, 10)],
    )
    expect(sessions[0].totalSets).toBe(1)
    expect(sessions[0].totalReps).toBe(10)
  })

  it('skips workouts with no logged sets', () => {
    const sessions = buildSessions(
      [workout('w1', A_DATE)],
      [WE('we1', 'w1')],
      [set('s1', 'we1', 0, 0)],
    )
    expect(sessions).toHaveLength(0)
  })

  it('flags bodyweight-only sessions without weight data', () => {
    const sessions = buildSessions(
      [workout('w1', A_DATE)],
      [WE('we1', 'w1')],
      [set('s1', 'we1', 0, 15)],
    )
    expect(sessions[0].hasWeightData).toBe(false)
    expect(sessions[0].bestWeight).toBe(0)
  })
})

describe('computeProgress', () => {
  const previous: SessionStat = {
    id: 'w1', date: A_DATE, dateKey: '2026-07-01', name: 'W', sets: [],
    totalSets: 5, totalReps: 40, totalVolume: 2400, bestWeight: 60, hasWeightData: true,
  }
  const current: SessionStat = {
    id: 'w2', date: B_DATE, dateKey: '2026-07-15', name: 'W', sets: [],
    totalSets: 6, totalReps: 48, totalVolume: 3456, bestWeight: 72, hasWeightData: true,
  }

  it('computes weight-based progress when weights exist', () => {
    const result = computeProgress(current, previous)
    expect(result.progressPct).toBe(20)
    expect(result.weightImprovement).toBe(12)
    expect(result.repImprovement).toBe(8)
  })

  it('falls back to volume progress for bodyweight-only work', () => {
    const bw = { ...previous, bestWeight: 0, hasWeightData: false, totalVolume: 200 }
    const bwCurrent = { ...current, bestWeight: 0, hasWeightData: false, totalVolume: 250 }
    const result = computeProgress(bwCurrent, bw)
    expect(result.progressPct).toBe(25)
    expect(result.weightImprovement).toBeNull()
  })

  it('returns nulls when a baseline is missing', () => {
    expect(computeProgress(current, null)).toEqual({ progressPct: null, weightImprovement: null, repImprovement: null })
    expect(computeProgress(null, previous)).toEqual({ progressPct: null, weightImprovement: null, repImprovement: null })
  })

  it('reports regression as a negative progress', () => {
    const regressed = { ...current, bestWeight: 50 }
    const result = computeProgress(regressed, previous)
    expect(result.progressPct).toBeLessThan(0)
    expect(result.weightImprovement).toBe(-10)
  })
})

describe('computeMonthlyComparison', () => {
  const july: SessionStat = {
    id: 'w1', date: A_DATE, dateKey: '2026-07-01', name: 'W', sets: [],
    totalSets: 5, totalReps: 40, totalVolume: 2400, bestWeight: 60, hasWeightData: true,
  }
  const june: SessionStat = {
    id: 'w2', date: '2026-06-10T10:00:00.000Z', dateKey: '2026-06-10', name: 'W', sets: [],
    totalSets: 4, totalReps: 30, totalVolume: 1800, bestWeight: 55, hasWeightData: true,
  }
  const reference = new Date(2026, 6, 15)

  it('compares the current month against the previous month', () => {
    const result = computeMonthlyComparison([july, june], reference)
    expect(result).not.toBeNull()
    expect(result!.current.workoutCount).toBe(1)
    expect(result!.previous.workoutCount).toBe(1)
    expect(result!.current.label).toBe('Jul 2026')
    expect(result!.previous.label).toBe('Jun 2026')
  })

  it('returns null when neither month has data', () => {
    const old: SessionStat = { ...july, date: '2026-01-05T10:00:00.000Z', dateKey: '2026-01-05' }
    expect(computeMonthlyComparison([old], reference)).toBeNull()
  })

  it('returns null with no sessions', () => {
    expect(computeMonthlyComparison([], reference)).toBeNull()
  })
})
