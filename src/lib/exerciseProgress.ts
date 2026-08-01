import { format } from 'date-fns'
import { toLocalDateKey } from '@/lib/dates'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types'

export interface SessionStat {
  id: string
  date: string
  dateKey: string
  name: string
  sets: WorkoutSet[]
  totalSets: number
  totalReps: number
  totalVolume: number
  bestWeight: number
  hasWeightData: boolean
}

export function buildSessions(
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: WorkoutSet[],
): SessionStat[] {
  const weWorkout = new Map(workoutExercises.map(we => [we.id, we.workoutId]))
  const workoutMap = new Map(workouts.map(w => [w.id, w]))
  const setsByWorkout = new Map<string, WorkoutSet[]>()

  for (const set of sets) {
    const workoutId = weWorkout.get(set.workoutExerciseId)
    if (!workoutId) continue
    const list = setsByWorkout.get(workoutId) ?? []
    list.push(set)
    setsByWorkout.set(workoutId, list)
  }

  const sessions: SessionStat[] = []
  for (const [workoutId, workoutSets] of setsByWorkout) {
    const workout = workoutMap.get(workoutId)
    if (!workout) continue
    const logged = workoutSets.filter(s => s.reps > 0 || s.weight > 0)
    if (logged.length === 0) continue
    sessions.push({
      id: workoutId,
      date: workout.date,
      dateKey: toLocalDateKey(workout.date),
      name: workout.name,
      sets: [...logged].sort((a, b) => a.order - b.order),
      totalSets: logged.length,
      totalReps: logged.reduce((sum, s) => sum + s.reps, 0),
      totalVolume: logged.reduce((sum, s) => sum + s.weight * s.reps, 0),
      bestWeight: Math.max(0, ...logged.map(s => s.weight)),
      hasWeightData: logged.some(s => s.weight > 0),
    })
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

export interface ProgressResult {
  progressPct: number | null
  weightImprovement: number | null
  repImprovement: number | null
}

export function computeProgress(
  current: SessionStat | null,
  previous: SessionStat | null,
): ProgressResult {
  if (!current || !previous) {
    return { progressPct: null, weightImprovement: null, repImprovement: null }
  }

  const bothBodyweight = current.bestWeight === 0 && previous.bestWeight === 0

  let progressPct: number | null = null
  if (bothBodyweight) {
    if (previous.totalVolume > 0) {
      progressPct = Math.round(((current.totalVolume - previous.totalVolume) / previous.totalVolume) * 100)
    }
  } else if (previous.bestWeight > 0) {
    progressPct = Math.round(((current.bestWeight - previous.bestWeight) / previous.bestWeight) * 100)
  } else if (current.bestWeight > 0) {
    progressPct = 100
  }

  const weightImprovement = !bothBodyweight && (current.bestWeight > 0 || previous.bestWeight > 0)
    ? current.bestWeight - previous.bestWeight
    : null
  const repImprovement = current.totalReps - previous.totalReps

  return { progressPct, weightImprovement, repImprovement }
}

export interface MonthStat {
  key: string
  label: string
  workoutCount: number
  totalSets: number
  totalReps: number
  totalVolume: number
  bestWeight: number
  hasWeightData: boolean
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMM yyyy')
}

export function computeMonthlyComparison(
  sessions: SessionStat[],
  reference: Date = new Date(),
): { current: MonthStat; previous: MonthStat } | null {
  if (sessions.length === 0) return null

  const currentKey = monthKey(reference)
  const previousKey = monthKey(new Date(reference.getFullYear(), reference.getMonth() - 1, 1))

  const build = (key: string): MonthStat => {
    const monthSessions = sessions.filter(s => s.dateKey.startsWith(key))
    return {
      key,
      label: monthLabel(key),
      workoutCount: monthSessions.length,
      totalSets: monthSessions.reduce((sum, s) => sum + s.totalSets, 0),
      totalReps: monthSessions.reduce((sum, s) => sum + s.totalReps, 0),
      totalVolume: monthSessions.reduce((sum, s) => sum + s.totalVolume, 0),
      bestWeight: monthSessions.reduce((best, s) => Math.max(best, s.bestWeight), 0),
      hasWeightData: monthSessions.some(s => s.hasWeightData),
    }
  }

  const current = build(currentKey)
  const previous = build(previousKey)

  if (current.workoutCount === 0 && previous.workoutCount === 0) return null
  return { current, previous }
}
