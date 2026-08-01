import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { toLocalDateKey } from '@/lib/dates'
import type { PersonalRecord, Workout, WorkoutExercise, WorkoutSet, Exercise } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const FREQUENCY_WEEKS = 12

interface StatisticsQuery {
  workouts: Workout[]
  workoutExercises: WorkoutExercise[]
  workoutSets: WorkoutSet[]
  exercises: Exercise[]
  personalRecords: PersonalRecord[]
}

export interface StatisticsData {
  loading: boolean
  workoutCount: number
  trainingMinutes: number
  totalSets: number
  totalVolumeKg: number
  longestStreak: number
  currentStreak: number
  workoutsPerWeek: { label: string; value: number }[]
  personalRecords: PersonalRecord[]
  exerciseNameById: Map<string, string>
  hasData: boolean
}

function dayNumber(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS)
}

export function computeStreaks(dateKeys: string[]): { longest: number; current: number } {
  if (dateKeys.length === 0) return { longest: 0, current: 0 }

  const trained = new Set(dateKeys)
  let longest = 0
  let run = 0
  let prevDay = -Infinity

  for (const key of [...trained].sort()) {
    const day = dayNumber(new Date(`${key}T00:00:00`))
    run = day === prevDay + 1 ? run + 1 : 1
    prevDay = day
    longest = Math.max(longest, run)
  }

  const today = new Date()
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!trained.has(toLocalDateKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS)
  }
  let current = 0
  while (trained.has(toLocalDateKey(cursor))) {
    current += 1
    cursor = new Date(cursor.getTime() - DAY_MS)
  }

  return { longest, current }
}

export function computeWorkoutsPerWeek(
  workouts: Workout[],
  weeks = FREQUENCY_WEEKS,
  reference = new Date(),
): { label: string; value: number }[] {
  const mondayOffset = (reference.getDay() + 6) % 7
  const monday = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - mondayOffset)
  const mondayTime = monday.getTime()

  return Array.from({ length: weeks }, (_, i) => {
    const startTime = mondayTime - (weeks - 1 - i) * WEEK_MS
    const endTime = startTime + WEEK_MS
    const value = workouts.filter(w => {
      const t = new Date(w.date).getTime()
      return t >= startTime && t < endTime
    }).length
    const start = new Date(startTime)
    const label = `${start.getMonth() + 1}/${start.getDate()}`
    return { label, value }
  })
}

export function isCompletedWorkout(workout: Workout, workoutIdsWithSets: Set<string>): boolean {
  return workout.duration != null || workoutIdsWithSets.has(workout.id)
}

export function useStatistics(): StatisticsData {
  const data = useLiveQuery<StatisticsQuery | undefined>(
    async () => {
      const [workouts, workoutExercises, workoutSets, exercises, personalRecords] = await Promise.all([
        db.workouts.toArray(),
        db.workoutExercises.toArray(),
        db.workoutSets.toArray(),
        db.exercises.toArray(),
        db.personalRecords.toArray(),
      ])
      return { workouts, workoutExercises, workoutSets, exercises, personalRecords }
    },
    []
  )

  return useMemo(() => {
    if (!data) {
      return {
        loading: true,
        workoutCount: 0,
        trainingMinutes: 0,
        totalSets: 0,
        totalVolumeKg: 0,
        longestStreak: 0,
        currentStreak: 0,
        workoutsPerWeek: [],
        personalRecords: [],
        exerciseNameById: new Map(),
        hasData: false,
      }
    }

    const { workouts, workoutExercises, workoutSets, exercises, personalRecords } = data

    const weIdsWithLoggedSets = new Set(
      workoutSets.filter(s => s.reps > 0 || s.weight > 0).map(s => s.workoutExerciseId)
    )
    const workoutIdsWithSets = new Set(
      workoutExercises.filter(we => weIdsWithLoggedSets.has(we.id)).map(we => we.workoutId)
    )

    const completedWorkouts = workouts.filter(w => isCompletedWorkout(w, workoutIdsWithSets))
    const workoutCount = completedWorkouts.length
    const trainingMinutes = completedWorkouts.reduce((sum, w) => sum + (w.duration ?? 0), 0)
    const totalSets = workoutSets.length
    const totalVolumeKg = workoutSets.reduce((sum, s) => sum + s.weight * s.reps, 0)

    const { longest, current } = computeStreaks(completedWorkouts.map(w => toLocalDateKey(w.date)))

    return {
      loading: false,
      workoutCount,
      trainingMinutes,
      totalSets,
      totalVolumeKg,
      longestStreak: longest,
      currentStreak: current,
      workoutsPerWeek: computeWorkoutsPerWeek(completedWorkouts),
      personalRecords,
      exerciseNameById: new Map(exercises.map(e => [e.id, e.name])),
      hasData: workoutCount > 0 || personalRecords.length > 0 || totalSets > 0,
    }
  }, [data])
}
