import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { computeWeeklyInsights, type TrainingInsight } from '@/lib/weeklyInsights'

const TICK_MS = 60 * 1000

interface WeeklyInsightsData {
  workouts: { id: string; date: string }[]
  workoutExercises: { id: string; workoutId: string; exerciseId: string }[]
  workoutSets: { id: string; workoutExerciseId: string; weight: number; reps: number }[]
  exercises: { id: string; muscleGroupId: string }[]
  muscleGroups: { id: string; name: string }[]
}

export function useWeeklyInsights(): { loading: boolean; insights: TrainingInsight[] } {
  const data = useLiveQuery<WeeklyInsightsData | undefined>(
    async () => {
      const [workouts, workoutExercises, workoutSets, exercises, muscleGroups] = await Promise.all([
        db.workouts.toArray(),
        db.workoutExercises.toArray(),
        db.workoutSets.toArray(),
        db.exercises.toArray(),
        db.muscleGroups.toArray(),
      ])
      return { workouts, workoutExercises, workoutSets, exercises, muscleGroups }
    },
    [],
  )

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const insights = useMemo(() => {
    if (!data) return []
    return computeWeeklyInsights({ ...data, now })
  }, [data, now])

  return { loading: !data, insights }
}
