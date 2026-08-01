import { db } from '@/db/schema'
import type { RecoverySnapshot, RecoveryStatus } from '@/types'

const HOUR_MS = 60 * 60 * 1000

export const RECOVERY_BASE_HOURS: Record<string, number> = {
  neck: 24,
  forearms: 24,
  abs: 24,
  biceps: 36,
  triceps: 36,
  shoulders: 36,
  chest: 48,
  back: 48,
  legs: 72,
}

export interface RecoveryCompute {
  status: RecoveryStatus
  pct: number
  readyAt: number | null
  estimatedHours: number
}

export function fatigueMultiplier(sets: { weight: number; reps: number }[]): number {
  const logged = sets.filter(s => s.reps > 0 || s.weight > 0)
  if (logged.length === 0) return 1
  const avgReps = logged.reduce((sum, s) => sum + s.reps, 0) / logged.length
  const avgWeight = logged.reduce((sum, s) => sum + s.weight, 0) / logged.length
  const setsFactor = logged.length / 10
  const repsFactor = 1 + avgReps / 30
  const weightFactor = 1 + avgWeight / 150
  return Math.min(2.5, 1 + setsFactor * repsFactor * weightFactor)
}

export function computeRecoveryForMuscle(input: {
  lastWorkoutAt: number | null
  sets: { weight: number; reps: number }[]
  baseHours: number
  now?: number
}): RecoveryCompute {
  const now = input.now ?? Date.now()
  const { lastWorkoutAt, baseHours } = input
  const logged = input.sets.filter(s => s.reps > 0 || s.weight > 0)

  if (lastWorkoutAt === null || logged.length === 0) {
    return { status: 'inactive', pct: 0, readyAt: null, estimatedHours: baseHours }
  }

  const estimatedHours = Math.max(1, Math.round(baseHours * fatigueMultiplier(logged)))
  const readyAt = lastWorkoutAt + estimatedHours * HOUR_MS
  const elapsedMs = now - lastWorkoutAt
  const pct = Math.min(100, Math.max(0, Math.round((elapsedMs / (estimatedHours * HOUR_MS)) * 100)))

  return {
    status: pct >= 100 ? 'ready' : 'recovering',
    pct,
    readyAt,
    estimatedHours,
  }
}

export function computeAllRecovery(now = Date.now()): Promise<RecoverySnapshot[]> {
  return (async () => {
    const muscles = await db.muscleGroups.toArray()
    const exercises = await db.exercises.toArray()
    const workoutExercises = await db.workoutExercises.toArray()
    const workoutSets = await db.workoutSets.toArray()
    const workouts = await db.workouts.toArray()

    const workoutTimeById = new Map(workouts.map(w => [w.id, new Date(w.date).getTime()]))
    const setsByWeId = new Map<string, { weight: number; reps: number }[]>()
    for (const set of workoutSets) {
      const list = setsByWeId.get(set.workoutExerciseId) ?? []
      list.push(set)
      setsByWeId.set(set.workoutExerciseId, list)
    }

    const snapshots: RecoverySnapshot[] = muscles.map((muscle) => {
      const baseHours = RECOVERY_BASE_HOURS[muscle.id] ?? 48
      const exerciseIds = new Set(exercises.filter(e => e.muscleGroupId === muscle.id).map(e => e.id))
      const wes = workoutExercises.filter(we => exerciseIds.has(we.exerciseId))

      const sets: { weight: number; reps: number }[] = []
      let lastWorkoutAt: number | null = null
      for (const we of wes) {
        const weSets = setsByWeId.get(we.id) ?? []
        if (weSets.length === 0) continue
        const workoutTime = workoutTimeById.get(we.workoutId)
        if (workoutTime === undefined) continue
        sets.push(...weSets)
        if (lastWorkoutAt === null || workoutTime > lastWorkoutAt) lastWorkoutAt = workoutTime
      }
      const computed = computeRecoveryForMuscle({ lastWorkoutAt, sets, baseHours, now })
      return {
        id: muscle.id,
        status: computed.status,
        lastWorkoutAt,
        readyAt: computed.readyAt,
        estimatedHours: computed.estimatedHours,
        computedAt: now,
      }
    })

    if (snapshots.length > 0) {
      await db.recovery.bulkPut(snapshots)
    }
    return snapshots
  })()
}

export function refreshRecovery(): Promise<RecoverySnapshot[]> {
  return computeAllRecovery()
}
