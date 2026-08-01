import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import type { MuscleGroup, Workout, WeeklyGoal } from '@/types'

export const DEFAULT_WEEKLY_TARGET = 12

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export interface WeeklyMuscleStat {
  id: string
  name: string
  sets: number
  target: number
}

export interface WeeklyStats {
  loaded: boolean
  muscleGroups: MuscleGroup[]
  weeklyGoals: WeeklyGoal[]
  targetMap: Map<string, number>
  muscleStats: WeeklyMuscleStat[]
  weekWorkouts: Workout[]
}

export function useWeeklyStats(): WeeklyStats {
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const weeklyGoals = useLiveQuery(() => db.weeklyGoals.toArray())
  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())
  const allWorkouts = useLiveQuery(() => db.workouts.toArray())

  return useMemo<WeeklyStats>(() => {
    if (!muscleGroups || !weeklyGoals || !allExercises || !allWorkoutExercises || !allSets || !allWorkouts) {
      return {
        loaded: false,
        muscleGroups: [],
        weeklyGoals: [],
        targetMap: new Map(),
        muscleStats: [],
        weekWorkouts: [],
      }
    }

    const targetMap = new Map<string, number>()
    for (const g of weeklyGoals) targetMap.set(g.muscleGroupId, g.targetSets)

    const weekStart = getWeekStart()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekStartTs = weekStart.getTime()
    const weekEndTs = weekEnd.getTime()

    const weekWorkouts = allWorkouts.filter(w => {
      const t = new Date(w.date).getTime()
      return t >= weekStartTs && t < weekEndTs
    })

    const weekWorkoutIds = new Set(weekWorkouts.map(w => w.id))
    const weekWes = allWorkoutExercises.filter(we => weekWorkoutIds.has(we.workoutId))
    const weekWeIds = new Set(weekWes.map(we => we.id))
    const weekSets = allSets.filter(s => weekWeIds.has(s.workoutExerciseId))

    const exerciseMuscleMap = new Map<string, string>()
    for (const ex of allExercises) exerciseMuscleMap.set(ex.id, ex.muscleGroupId)
    const weExerciseMap = new Map<string, string>()
    for (const we of weekWes) weExerciseMap.set(we.id, we.exerciseId)

    const setCount = new Map<string, number>()
    for (const s of weekSets) {
      const exerciseId = weExerciseMap.get(s.workoutExerciseId)
      if (!exerciseId) continue
      const muscleId = exerciseMuscleMap.get(exerciseId)
      if (!muscleId) continue
      setCount.set(muscleId, (setCount.get(muscleId) ?? 0) + 1)
    }

    const muscleStats: WeeklyMuscleStat[] = muscleGroups.map(mg => {
      const target = targetMap.get(mg.id) ?? DEFAULT_WEEKLY_TARGET
      return {
        id: mg.id,
        name: mg.name,
        sets: setCount.get(mg.id) ?? 0,
        target,
      }
    })

    return {
      loaded: true,
      muscleGroups,
      weeklyGoals,
      targetMap,
      muscleStats,
      weekWorkouts,
    }
  }, [muscleGroups, weeklyGoals, allExercises, allWorkoutExercises, allSets, allWorkouts])
}
