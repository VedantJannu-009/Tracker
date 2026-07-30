import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import type { MuscleGroup, Exercise, WorkoutExercise, WorkoutSet, Workout, PersonalRecord } from '@/types'

interface MuscleQueryResult {
  muscle: MuscleGroup | undefined
  exercises: Exercise[]
  workoutExercises: WorkoutExercise[]
  workoutSets: WorkoutSet[]
  workouts: Workout[]
  personalRecords: PersonalRecord[]
}

export function useMuscleStats(muscleGroupId: string) {
  const data = useLiveQuery<MuscleQueryResult>(
    async () => {
      const muscle = await db.muscleGroups.get(muscleGroupId)
      const exercises = await db.exercises.where('muscleGroupId').equals(muscleGroupId).toArray()
      const exerciseIds = exercises.map(e => e.id)

      let workoutExercises: WorkoutExercise[] = []
      let workoutSets: WorkoutSet[] = []
      let workouts: Workout[] = []
      let personalRecords: PersonalRecord[] = []

      if (exerciseIds.length > 0) {
        workoutExercises = await db.workoutExercises.where('exerciseId').anyOf(exerciseIds).toArray()
        const weIds = workoutExercises.map(we => we.id)
        const workoutIds = [...new Set(workoutExercises.map(we => we.workoutId))]

        if (weIds.length > 0) {
          workoutSets = await db.workoutSets.where('workoutExerciseId').anyOf(weIds).toArray()
        }
        if (workoutIds.length > 0) {
          workouts = await db.workouts.where('id').anyOf(workoutIds).reverse().toArray()
        }
        personalRecords = await db.personalRecords.where('exerciseId').anyOf(exerciseIds).toArray()
      }

      return { muscle, exercises, workoutExercises, workoutSets, workouts, personalRecords } as MuscleQueryResult
    },
    [muscleGroupId]
  )

  return useMemo(() => {
    const muscle = data?.muscle ?? null
    const exercises = data?.exercises ?? []
    const workoutExercises = data?.workoutExercises ?? []
    const sets = data?.workoutSets ?? []
    const workouts = data?.workouts ?? []
    const personalRecords = data?.personalRecords ?? []

    const totalSets = sets.length
    const totalReps = sets.reduce((sum, s) => sum + s.reps, 0)
    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
    const lastWorkout = workouts[0] ?? null
    const lastWorkoutDate = lastWorkout?.date ?? null

    const bestSet = sets.length > 0
      ? sets.reduce((best, s) => s.weight > best.weight ? s : best, sets[0])
      : null

    const sparkline = (() => {
      if (!workouts.length || !sets.length || !workoutExercises.length) return []
      const map = new Map<string, number>()
      for (const we of workoutExercises) {
        const w = workouts.find(wk => wk.id === we.workoutId)
        if (!w) continue
        const dateKey = w.date.split('T')[0]
        const exerciseSets = sets.filter(s => s.workoutExerciseId === we.id)
        const vol = exerciseSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
        map.set(dateKey, (map.get(dateKey) ?? 0) + vol)
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([, v]) => v)
    })()

    const progressPercentage = (() => {
      if (sparkline.length < 2) return 0
      const first = sparkline[0]
      const last = sparkline[sparkline.length - 1]
      if (first === 0) return last > 0 ? 100 : 0
      return Math.round(((last - first) / first) * 100)
    })()

    const sortedWorkouts = [...workouts].reverse()
    const chartData = {
      setsByDate: sortedWorkouts.map(w => {
        const wes = workoutExercises.filter(we => we.workoutId === w.id)
        const exerciseSets = wes.flatMap(we => sets.filter(s => s.workoutExerciseId === we.id))
        return { label: w.date.split('T')[0], value: exerciseSets.length }
      }),
      repsByDate: sortedWorkouts.map(w => {
        const wes = workoutExercises.filter(we => we.workoutId === w.id)
        const exerciseSets = wes.flatMap(we => sets.filter(s => s.workoutExerciseId === we.id))
        return { label: w.date.split('T')[0], value: exerciseSets.reduce((sum, s) => sum + s.reps, 0) }
      }),
      volumeByDate: sortedWorkouts.map(w => {
        const wes = workoutExercises.filter(we => we.workoutId === w.id)
        const exerciseSets = wes.flatMap(we => sets.filter(s => s.workoutExerciseId === we.id))
        return { label: w.date.split('T')[0], value: exerciseSets.reduce((sum, s) => sum + s.weight * s.reps, 0) }
      }),
    }

    const exerciseDistribution = exercises.map(ex => {
      const wes = workoutExercises.filter(we => we.exerciseId === ex.id)
      const total = wes.reduce((sum, we) => {
        const exerciseSets = sets.filter(s => s.workoutExerciseId === we.id)
        return sum + exerciseSets.reduce((s, set) => s + set.reps, 0)
      }, 0)
      return { label: ex.name, value: total }
    }).filter(d => d.value > 0)

    const exerciseStatsList = exercises.map(ex => {
      const wes = workoutExercises.filter(we => we.exerciseId === ex.id)
      const exSets = wes.flatMap(we => sets.filter(s => s.workoutExerciseId === we.id))
      const totalSets = exSets.length
      const bestWeight = exSets.reduce((best, s) => Math.max(best, s.weight), 0)
      const wesWithDates = wes.map(we => ({
        we,
        workout: workouts.find(w => w.id === we.workoutId),
      })).filter(x => x.workout)
      const lastDate = wesWithDates.length > 0
        ? wesWithDates.sort((a, b) => b.workout!.date.localeCompare(a.workout!.date))[0].workout!.date
        : null
      return {
        exercise: ex,
        totalSets,
        totalReps: exSets.reduce((sum, s) => sum + s.reps, 0),
        bestWeight,
        lastDate,
        totalVolume: exSets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      }
    })

    const workoutCount = workouts.length
    const lastWorkoutTimestamp = lastWorkoutDate
      ? new Date(lastWorkoutDate).getTime()
      : null
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const isRecentlyTrained = lastWorkoutTimestamp !== null && lastWorkoutTimestamp > sevenDaysAgo
    const isFrequentlyTrained = workoutCount >= 10
    const hasData = totalSets > 0

    return {
      muscle,
      exercises,
      workoutExercises,
      sets,
      workouts,
      personalRecords,
      totalSets,
      totalReps,
      totalVolume,
      lastWorkoutDate,
      sparkline,
      progressPercentage,
      bestSet,
      hasData,
      chartData,
      exerciseDistribution,
      exerciseStatsList,
      workoutCount,
      isRecentlyTrained,
      isFrequentlyTrained,
    }
  }, [data])
}
