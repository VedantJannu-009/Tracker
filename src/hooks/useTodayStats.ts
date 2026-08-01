import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { useWorkoutStore } from '@/stores/workoutStore'
import { toLocalDateKey } from '@/lib/dates'
import type { Workout } from '@/types'

const AVG_SEC_PER_SET = 180

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export interface TodayStats {
  loaded: boolean
  activeWorkout: Workout | null
  hasActiveWorkout: boolean
  workoutName: string
  exercisesCompleted: number
  setsCompleted: number
  todayWorkoutCount: number
  todayDurationMinutes: number | null
  todayExercisesCompleted: number
  todaySetsCompleted: number
  todayGoalSets: number
  estimatedFinishTime: Date | null
  estimatedFinishMinutes: number | null
  targetSets: number
  progressPct: number
}

export function useTodayStats(): TodayStats {
  const storeWorkout = useWorkoutStore(s => s.currentWorkout)
  const allWorkouts = useLiveQuery(() => db.workouts.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())
  const weeklyGoals = useLiveQuery(() => db.weeklyGoals.toArray())

  return useMemo<TodayStats>(() => {
    if (!allWorkouts || !allWorkoutExercises || !allSets || !weeklyGoals) {
      return {
        loaded: false,
        activeWorkout: null,
        hasActiveWorkout: false,
        workoutName: '',
        exercisesCompleted: 0,
        setsCompleted: 0,
        todayWorkoutCount: 0,
        todayDurationMinutes: null,
        todayExercisesCompleted: 0,
        todaySetsCompleted: 0,
        todayGoalSets: 0,
        estimatedFinishTime: null,
        estimatedFinishMinutes: null,
        targetSets: 0,
        progressPct: 0,
      }
    }

    const todayKey = toLocalDateKey(new Date())
    const todayWorkouts = allWorkouts.filter(w => toLocalDateKey(w.date) === todayKey)

    const activeWorkout = storeWorkout ?? todayWorkouts.find(w => w.duration == null) ?? null

    const weById = new Map(allWorkoutExercises.map(we => [we.id, we]))
    const setsByWorkout = new Map<string, number>()
    for (const s of allSets) {
      const we = weById.get(s.workoutExerciseId)
      if (!we) continue
      setsByWorkout.set(we.workoutId, (setsByWorkout.get(we.workoutId) ?? 0) + 1)
    }

    const activeWes = activeWorkout
      ? allWorkoutExercises.filter(we => we.workoutId === activeWorkout.id)
      : []
    const activeWeIds = new Set(activeWes.map(we => we.id))
    const activeExerciseIds = new Set(activeWes.map(we => we.exerciseId))
    const activeSets = allSets.filter(s => activeWeIds.has(s.workoutExerciseId))

    const todayWeIds = new Set(
      allWorkoutExercises.filter(we => todayWorkouts.some(w => w.id === we.workoutId)).map(we => we.id)
    )
    const todayExerciseIds = new Set(
      allWorkoutExercises.filter(we => todayWorkouts.some(w => w.id === we.workoutId)).map(we => we.exerciseId)
    )
    const todaySets = allSets.filter(s => todayWeIds.has(s.workoutExerciseId))

    const goalTotal = weeklyGoals.reduce((sum, g) => sum + g.targetSets, 0)

    const recentCompleted = allWorkouts
      .filter(w => w.duration != null && setsByWorkout.get(w.id) != null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
    const avgSets = recentCompleted.length > 0
      ? Math.round(recentCompleted.reduce((sum, w) => sum + (setsByWorkout.get(w.id) ?? 0), 0) / recentCompleted.length)
      : null

    const targetSets = goalTotal > 0
      ? clamp(Math.round(goalTotal), 6, 20)
      : avgSets !== null
        ? clamp(avgSets, 4, 20)
        : 12

    const todaySetsGoal = clamp(targetSets, 4, 20)

    const activeSetsCount = activeSets.length
    const activeExercisesCount = activeExerciseIds.size

    const hasActiveWorkout = activeWorkout !== null
    const remainingSets = hasActiveWorkout ? Math.max(0, targetSets - activeSetsCount) : 0

    const estimatedFinishMinutes = hasActiveWorkout
      ? Math.round((remainingSets * AVG_SEC_PER_SET) / 60)
      : null
    const estimatedFinishTime = hasActiveWorkout
      ? new Date(Date.now() + remainingSets * AVG_SEC_PER_SET * 1000)
      : null

    const progressPct = hasActiveWorkout
      ? clamp(Math.round((activeSetsCount / Math.max(1, targetSets)) * 100), 0, 100)
      : clamp(Math.round((todaySets.length / Math.max(1, todaySetsGoal)) * 100), 0, 100)

    const todayDurationMinutes = (() => {
      const durations = todayWorkouts
        .map(w => w.duration)
        .filter((d): d is number => typeof d === 'number')
      return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) : null
    })()

    return {
      loaded: true,
      activeWorkout,
      hasActiveWorkout,
      workoutName: activeWorkout?.name ?? todayWorkouts[0]?.name ?? '',
      exercisesCompleted: activeExercisesCount,
      setsCompleted: activeSetsCount,
      todayWorkoutCount: todayWorkouts.length,
      todayDurationMinutes,
      todayExercisesCompleted: todayExerciseIds.size,
      todaySetsCompleted: todaySets.length,
      todayGoalSets: todaySetsGoal,
      estimatedFinishTime,
      estimatedFinishMinutes,
      targetSets,
      progressPct,
    }
  }, [storeWorkout, allWorkouts, allWorkoutExercises, allSets, weeklyGoals])
}
