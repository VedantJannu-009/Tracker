import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'

interface CardStats {
  totalSets: number
  totalReps: number
  lastDate: string | null
  sparkline: number[]
}

export function useCustomCardStats(muscleGroupIds: string[]): CardStats {
  const data = useLiveQuery(
    async () => {
      if (muscleGroupIds.length === 0) {
        return { exercises: [], workoutExercises: [], sets: [], workouts: [] }
      }

      const exercises = await db.exercises.where('muscleGroupId').anyOf(muscleGroupIds).toArray()
      const exerciseIds = exercises.map(e => e.id)
      if (exerciseIds.length === 0) {
        return { exercises: [], workoutExercises: [], sets: [], workouts: [] }
      }

      const workoutExercises = await db.workoutExercises.where('exerciseId').anyOf(exerciseIds).toArray()
      const weIds = workoutExercises.map(we => we.id)
      const workoutIds = [...new Set(workoutExercises.map(we => we.workoutId))]
      const sets = weIds.length > 0
        ? await db.workoutSets.where('workoutExerciseId').anyOf(weIds).toArray()
        : []
      const workouts = workoutIds.length > 0
        ? await db.workouts.where('id').anyOf(workoutIds).toArray()
        : []

      return { exercises, workoutExercises, sets, workouts }
    },
    [muscleGroupIds.join(',')]
  )

  return useMemo(() => {
    const exercises = data?.exercises ?? []
    const workoutExercises = data?.workoutExercises ?? []
    const sets = data?.sets ?? []
    const workouts = data?.workouts ?? []

    const totalSets = sets.length
    const totalReps = sets.reduce((sum, s) => sum + s.reps, 0)
    const lastDate = workouts.length > 0
      ? workouts.map(w => w.date).sort().reverse()[0] ?? null
      : null

    const sparkline = (() => {
      const muscleByExercise = new Map(exercises.map(e => [e.id, e.muscleGroupId]))
      const volumeByMuscle = new Map<string, Map<string, number>>()

      for (const we of workoutExercises) {
        const muscleId = muscleByExercise.get(we.exerciseId)
        const workout = workouts.find(w => w.id === we.workoutId)
        if (!muscleId || !workout) continue

        const dateKey = workout.date.split('T')[0]
        if (!volumeByMuscle.has(muscleId)) volumeByMuscle.set(muscleId, new Map())
        const dayMap = volumeByMuscle.get(muscleId)!
        const exerciseSets = sets.filter(s => s.workoutExerciseId === we.id)
        const volume = exerciseSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
        dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + volume)
      }

      let longest: number[] = []
      for (const dayMap of volumeByMuscle.values()) {
        const series = Array.from(dayMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-14)
          .map(([, v]) => v)
        if (series.length > longest.length) longest = series
      }
      return longest
    })()

    return { totalSets, totalReps, lastDate, sparkline }
  }, [data])
}
