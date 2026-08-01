import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { toLocalDateKey } from '@/lib/dates'

export function useExerciseStats(exerciseId: string) {
  const exercise = useLiveQuery(async () => {
    const ex = await db.exercises.get(exerciseId)
    return ex ?? null
  }, [exerciseId])
  const muscle = useLiveQuery(
    () => exercise ? db.muscleGroups.get(exercise.muscleGroupId) : undefined,
    [exercise]
  ) ?? undefined

  const workoutExercises = useLiveQuery(
    () => db.workoutExercises.where('exerciseId').equals(exerciseId).toArray(),
    [exerciseId]
  )

  const sets = useLiveQuery(async () => {
    if (!workoutExercises?.length) return []
    const ids = workoutExercises.map(we => we.id)
    return db.workoutSets.where('workoutExerciseId').anyOf(ids).toArray()
  }, [workoutExercises])

  const workouts = useLiveQuery(async () => {
    if (!workoutExercises?.length) return []
    const ids = [...new Set(workoutExercises.map(we => we.workoutId))]
    return db.workouts.where('id').anyOf(ids).reverse().toArray()
  }, [workoutExercises])

  const groupedByDate = (() => {
    if (!workouts || !sets || !workoutExercises) return []
    const map = new Map<string, { sets: number; reps: number; weight: number; volume: number }>()
    for (const we of workoutExercises) {
      const w = workouts.find(w => w.id === we.workoutId)
      if (!w) continue
      const dateKey = toLocalDateKey(w.date)
      const exerciseSets = sets.filter(s => s.workoutExerciseId === we.id)
      const totalWeight = exerciseSets.reduce((sum, s) => Math.max(sum, s.weight), 0)
      const totalSets = exerciseSets.length
      const totalReps = exerciseSets.reduce((sum, s) => sum + s.reps, 0)
      const totalVolume = exerciseSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
      const existing = map.get(dateKey)
      if (existing) {
        map.set(dateKey, {
          sets: existing.sets + totalSets,
          reps: existing.reps + totalReps,
          weight: Math.max(existing.weight, totalWeight),
          volume: existing.volume + totalVolume,
        })
      } else {
        map.set(dateKey, { sets: totalSets, reps: totalReps, weight: totalWeight, volume: totalVolume })
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
  })()

  const totalSets = sets?.length ?? 0
  const totalReps = sets?.reduce((sum, s) => sum + s.reps, 0) ?? 0
  const maxWeight = Math.max(0, ...(sets?.map(s => s.weight) ?? [0]))
  const lastWorkout = workouts?.[0]
  const lastWorkoutDate = lastWorkout?.date ?? null

  return {
    exercise,
    muscle,
    loading: exercise === undefined,
    workoutExercises: workoutExercises ?? [],
    sets: sets ?? [],
    workouts: workouts ?? [],
    groupedByDate,
    totalSets,
    totalReps,
    maxWeight,
    lastWorkoutDate,
  }
}
