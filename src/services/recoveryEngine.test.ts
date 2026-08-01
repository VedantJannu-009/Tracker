import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'
import {
  computeRecoveryForMuscle,
  fatigueMultiplier,
  computeAllRecovery,
} from '@/services/recoveryEngine'

const HOUR_MS = 60 * 60 * 1000

describe('fatigueMultiplier', () => {
  it('is 1 with no logged sets', () => {
    expect(fatigueMultiplier([{ weight: 0, reps: 0 }])).toBe(1)
  })

  it('scales up with volume, reps, and weight', () => {
    const light = fatigueMultiplier([{ weight: 20, reps: 8 }])
    const heavy = fatigueMultiplier([{ weight: 100, reps: 12 }])
    expect(heavy).toBeGreaterThan(light)
  })

  it('caps at 2.5', () => {
    const max = fatigueMultiplier(Array.from({ length: 30 }, () => ({ weight: 200, reps: 30 })))
    expect(max).toBe(2.5)
  })
})

describe('computeRecoveryForMuscle', () => {
  const now = 1_700_000_000_000

  it('is inactive with no training data', () => {
    const result = computeRecoveryForMuscle({
      lastWorkoutAt: null,
      sets: [],
      baseHours: 48,
      now,
    })
    expect(result.status).toBe('inactive')
    expect(result.pct).toBe(0)
    expect(result.readyAt).toBeNull()
  })

  it('is recovering shortly after a session', () => {
    const result = computeRecoveryForMuscle({
      lastWorkoutAt: now - 2 * HOUR_MS,
      sets: [{ weight: 60, reps: 10 }],
      baseHours: 48,
      now,
    })
    expect(result.status).toBe('recovering')
    expect(result.pct).toBeGreaterThan(0)
    expect(result.pct).toBeLessThan(100)
    expect(result.readyAt).toBeGreaterThan(now)
  })

  it('is ready once recovery time has elapsed', () => {
    const input = { sets: [{ weight: 60, reps: 10 }], baseHours: 48 }
    const probe = computeRecoveryForMuscle({ ...input, lastWorkoutAt: now, now })
    const result = computeRecoveryForMuscle({
      ...input,
      lastWorkoutAt: now - (probe.estimatedHours + 2) * HOUR_MS,
      now,
    })
    expect(result.status).toBe('ready')
    expect(result.pct).toBe(100)
  })

  it('flips to ready exactly at the estimated recovery time', () => {
    const input = { sets: [{ weight: 60, reps: 10 }], baseHours: 48 }
    const probe = computeRecoveryForMuscle({ ...input, lastWorkoutAt: now, now })
    const result = computeRecoveryForMuscle({
      ...input,
      lastWorkoutAt: now - probe.estimatedHours * HOUR_MS,
      now,
    })
    expect(result.status).toBe('ready')
    expect(result.pct).toBe(100)
  })

  it('is inactive when only empty placeholder sets exist', () => {
    const result = computeRecoveryForMuscle({
      lastWorkoutAt: now - HOUR_MS,
      sets: [{ weight: 0, reps: 0 }],
      baseHours: 48,
      now,
    })
    expect(result.status).toBe('inactive')
  })

  it('estimates longer recovery for heavier sessions', () => {
    const light = computeRecoveryForMuscle({
      lastWorkoutAt: now,
      sets: [{ weight: 20, reps: 8 }],
      baseHours: 48,
      now,
    })
    const heavy = computeRecoveryForMuscle({
      lastWorkoutAt: now,
      sets: [{ weight: 120, reps: 12 }],
      baseHours: 48,
      now,
    })
    expect(heavy.estimatedHours).toBeGreaterThan(light.estimatedHours)
  })
})

describe('computeAllRecovery', () => {
  beforeEach(async () => {
    await db.muscleGroups.clear()
    await db.exercises.clear()
    await db.workouts.clear()
    await db.workoutExercises.clear()
    await db.workoutSets.clear()
    await db.recovery.clear()
  })

  it('persists a snapshot for each muscle group', async () => {
    const now = Date.now()
    await db.muscleGroups.bulkAdd([
      { id: 'chest', name: 'Chest' },
      { id: 'legs', name: 'Legs' },
    ])
    await db.exercises.bulkAdd([
      { id: 'bench-press', name: 'Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' },
      { id: 'squat', name: 'Squat', muscleGroupId: 'legs', equipment: 'Barbell', difficulty: 'intermediate' },
    ])
    await db.workouts.add({ id: 'w1', name: 'Chest', date: new Date(now - 3 * HOUR_MS).toISOString(), createdAt: now - 3 * HOUR_MS })
    await db.workoutExercises.add({ id: 'we1', workoutId: 'w1', exerciseId: 'bench-press', order: 0 })
    await db.workoutSets.add({ id: 's1', workoutExerciseId: 'we1', weight: 60, reps: 10, order: 0 })

    const snapshots = await computeAllRecovery(now)

    expect(snapshots).toHaveLength(2)
    const chest = snapshots.find(s => s.id === 'chest')!
    const legs = snapshots.find(s => s.id === 'legs')!
    expect(chest.status).toBe('recovering')
    expect(chest.lastWorkoutAt).toBe(now - 3 * HOUR_MS)
    expect(chest.readyAt).toBeGreaterThan(now)
    expect(legs.status).toBe('inactive')

    const stored = await db.recovery.get('chest')
    expect(stored?.status).toBe('recovering')
  })

  it('recomputes after new training data is added', async () => {
    const now = Date.now()
    await db.muscleGroups.add({ id: 'chest', name: 'Chest' })
    await db.exercises.add({ id: 'bench-press', name: 'Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' })
    await db.workouts.add({ id: 'w1', name: 'Chest', date: new Date(now - 100 * HOUR_MS).toISOString(), createdAt: now - 100 * HOUR_MS })
    await db.workoutExercises.add({ id: 'we1', workoutId: 'w1', exerciseId: 'bench-press', order: 0 })
    await db.workoutSets.add({ id: 's1', workoutExerciseId: 'we1', weight: 60, reps: 10, order: 0 })

    await computeAllRecovery(now)
    expect((await db.recovery.get('chest'))?.status).toBe('ready')

    await db.workouts.add({ id: 'w2', name: 'Chest', date: new Date(now - HOUR_MS).toISOString(), createdAt: now - HOUR_MS })
    await db.workoutExercises.add({ id: 'we2', workoutId: 'w2', exerciseId: 'bench-press', order: 0 })
    await db.workoutSets.add({ id: 's2', workoutExerciseId: 'we2', weight: 70, reps: 8, order: 0 })

    await computeAllRecovery(now)
    expect((await db.recovery.get('chest'))?.status).toBe('recovering')
  })
})
