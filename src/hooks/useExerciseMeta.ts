import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'

export interface ExerciseMeta {
  lastDate: string | null
  weight: number | null
  reps: number | null
  volume: number | null
}

export function useExerciseMeta(exerciseIds: string[]) {
  const key = exerciseIds.join('|')

  return useLiveQuery<Record<string, ExerciseMeta>>(
    async () => {
      const ids = [...new Set(exerciseIds)]
      if (!ids.length) return {}

      const wes = await db.workoutExercises.where('exerciseId').anyOf(ids).toArray()
      const workoutIds = [...new Set(wes.map(w => w.workoutId))]
      const workouts = workoutIds.length
        ? await db.workouts.where('id').anyOf(workoutIds).toArray()
        : []
      const records = await db.personalRecords.where('exerciseId').anyOf(ids).toArray()

      const meta: Record<string, ExerciseMeta> = {}
      for (const id of ids) {
        const related = wes.filter(w => w.exerciseId === id)
        const relevant = workouts.filter(w => related.some(r => r.workoutId === w.id))
        const last = relevant.sort((a, b) => b.date.localeCompare(a.date))[0]?.date ?? null
        meta[id] = {
          lastDate: last,
          weight: records.find(r => r.exerciseId === id && r.type === 'weight')?.value ?? null,
          reps: records.find(r => r.exerciseId === id && r.type === 'reps')?.value ?? null,
          volume: records.find(r => r.exerciseId === id && r.type === 'volume')?.value ?? null,
        }
      }
      return meta
    },
    [key]
  )
}
