import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'

export function useAllMuscleStats(enabled = true) {
  const data = useLiveQuery(
    async () => {
      if (!enabled) return new Map()
      const muscles = await db.muscleGroups.toArray()
      const exercises = await db.exercises.toArray()
      const workoutExercises = await db.workoutExercises.toArray()
      const sets = await db.workoutSets.toArray()
      const workouts = await db.workouts.toArray()

      const muscleMap = new Map<string, { hasData: boolean; isRecentlyTrained: boolean; isFrequentlyTrained: boolean }>()
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

      for (const muscle of muscles) {
        const muscleExercises = exercises.filter(e => e.muscleGroupId === muscle.id)
        const exerciseIds = muscleExercises.map(e => e.id)
        const wes = workoutExercises.filter(we => exerciseIds.includes(we.exerciseId))
        const weIds = wes.map(we => we.id)
        const muscleSets = sets.filter(s => weIds.includes(s.workoutExerciseId))
        const workoutIds = [...new Set(wes.map(we => we.workoutId))]
        const muscleWorkouts = workouts.filter(w => workoutIds.includes(w.id))

        const totalSets = muscleSets.length
        const workoutCount = muscleWorkouts.length
        const lastDate = muscleWorkouts.length > 0
          ? Math.max(...muscleWorkouts.map(w => new Date(w.date).getTime()))
          : null
        const isRecentlyTrained = lastDate !== null && lastDate > sevenDaysAgo
        const isFrequentlyTrained = workoutCount >= 10

        muscleMap.set(muscle.id, {
          hasData: totalSets > 0,
          isRecentlyTrained,
          isFrequentlyTrained,
        })
      }

      return muscleMap
    },
    [enabled]
  )

  return useMemo(() => data ?? new Map(), [data])
}
