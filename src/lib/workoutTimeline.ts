import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/types'
import { formatDate } from '@/lib/utils'
import { toLocalDateKey } from '@/lib/dates'

export interface TimelineSet {
  id: string
  weight: number
  reps: number
}

export interface TimelineExercise {
  key: string
  name: string
  equipment: string
  sets: TimelineSet[]
}

export interface TimelineSession {
  id: string
  name: string
  duration?: number
  exercises: TimelineExercise[]
}

export interface TimelineDay {
  key: string
  label: string
  sessions: TimelineSession[]
}

export interface TimelineInput {
  workouts: Workout[]
  workoutExercises: WorkoutExercise[]
  sets: WorkoutSet[]
  exercises: Exercise[]
  now?: number
}

const DAY_MS = 24 * 60 * 60 * 1000

export function buildWorkoutTimeline(input: TimelineInput): TimelineDay[] {
  const now = input.now ?? Date.now()

  const exerciseById = new Map(input.exercises.map(e => [e.id, e]))

  const wesByWorkout = new Map<string, WorkoutExercise[]>()
  for (const we of input.workoutExercises) {
    const list = wesByWorkout.get(we.workoutId) ?? []
    list.push(we)
    wesByWorkout.set(we.workoutId, list)
  }

  const setsByWe = new Map<string, WorkoutSet[]>()
  for (const s of input.sets) {
    const list = setsByWe.get(s.workoutExerciseId) ?? []
    list.push(s)
    setsByWe.set(s.workoutExerciseId, list)
  }

  const todayKey = toLocalDateKey(new Date(now))
  const yesterdayKey = toLocalDateKey(new Date(now - DAY_MS))

  const sortedWorkouts = [...input.workouts].sort((a, b) => b.date.localeCompare(a.date))

  const dayMap = new Map<string, TimelineDay>()
  for (const workout of sortedWorkouts) {
    const key = toLocalDateKey(workout.date)
    const label = key === todayKey ? 'Today' : key === yesterdayKey ? 'Yesterday' : formatDate(workout.date)
    const day = dayMap.get(key) ?? { key, label, sessions: [] }

    const exercises: TimelineExercise[] = []
    const wes = (wesByWorkout.get(workout.id) ?? []).sort((a, b) => a.order - b.order)
    for (const we of wes) {
      const ex = exerciseById.get(we.exerciseId)
      if (!ex) continue
      const sets = (setsByWe.get(we.id) ?? [])
        .filter(s => s.reps > 0 || s.weight > 0)
        .sort((a, b) => a.order - b.order)
        .map(s => ({ id: s.id, weight: s.weight, reps: s.reps }))
      if (sets.length === 0) continue
      exercises.push({ key: we.id, name: ex.name, equipment: ex.equipment, sets })
    }

    if (exercises.length === 0) continue
    day.sessions.push({ id: workout.id, name: workout.name, duration: workout.duration, exercises })
    dayMap.set(key, day)
  }

  return [...dayMap.values()]
}
