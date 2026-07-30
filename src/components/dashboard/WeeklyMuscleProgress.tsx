import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/schema'
import { Card, CardContent } from '@/components/ui/card'

const DEFAULT_TARGET = 12

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const GROUP_COLORS: Record<string, string> = {
  chest: '#3b82f6',
  back: '#22c55e',
  shoulders: '#f59e0b',
  legs: '#ef4444',
  abs: '#8b5cf6',
  biceps: '#ec4899',
  triceps: '#14b8a6',
  forearms: '#f97316',
  neck: '#6366f1',
}

export function WeeklyMuscleProgress() {
  const navigate = useNavigate()
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const weeklyGoals = useLiveQuery(() => db.weeklyGoals.toArray())
  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())
  const allWorkouts = useLiveQuery(() => db.workouts.toArray())

  const targetMap = useMemo(() => {
    const map = new Map<string, number>()
    if (weeklyGoals) {
      for (const g of weeklyGoals) {
        map.set(g.muscleGroupId, g.targetSets)
      }
    }
    return map
  }, [weeklyGoals])

  const data = useMemo(() => {
    if (!muscleGroups || !allExercises || !allWorkoutExercises || !allSets || !allWorkouts) return null

    const weekStart = getWeekStart()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekStartTs = weekStart.getTime()
    const weekEndTs = weekEnd.getTime()

    const weekWorkouts = allWorkouts.filter(w => {
      const t = new Date(w.date).getTime()
      return t >= weekStartTs && t < weekEndTs
    })

    if (weekWorkouts.length === 0) return null

    const weekWorkoutIds = new Set(weekWorkouts.map(w => w.id))
    const weekWes = allWorkoutExercises.filter(we => weekWorkoutIds.has(we.workoutId))
    const weekWeIds = new Set(weekWes.map(we => we.id))
    const weekSets = allSets.filter(s => weekWeIds.has(s.workoutExerciseId))

    const exerciseMuscleMap = new Map<string, string>()
    for (const ex of allExercises) {
      exerciseMuscleMap.set(ex.id, ex.muscleGroupId)
    }

    const weExerciseMap = new Map<string, string>()
    for (const we of weekWes) {
      weExerciseMap.set(we.id, we.exerciseId)
    }

    const setCountPerMuscle = new Map<string, number>()
    for (const s of weekSets) {
      const exerciseId = weExerciseMap.get(s.workoutExerciseId)
      if (!exerciseId) continue
      const muscleId = exerciseMuscleMap.get(exerciseId)
      if (!muscleId) continue
      setCountPerMuscle.set(muscleId, (setCountPerMuscle.get(muscleId) ?? 0) + 1)
    }

    return muscleGroups
      .map(mg => {
        const target = targetMap.get(mg.id) ?? DEFAULT_TARGET
        const sets = setCountPerMuscle.get(mg.id) ?? 0
        return {
          id: mg.id,
          name: mg.name,
          sets,
          target,
          pct: target > 0 ? Math.min(100, Math.round((sets / target) * 100)) : 0,
        }
      })
      .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name))
  }, [muscleGroups, allExercises, allWorkoutExercises, allSets, allWorkouts, targetMap])

  if (!data) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Weekly Muscle Completion</h2>
      <Card>
        <CardContent className="p-4 space-y-3">
          {data.map(mg => {
            const color = GROUP_COLORS[mg.name.toLowerCase()] || '#3b82f6'
            return (
              <div
                key={mg.id}
                onClick={() => navigate(`/muscles/${mg.id}`)}
                className="cursor-pointer hover:bg-muted/20 rounded-lg -mx-1 px-1 py-1 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{mg.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {mg.sets} / {mg.target} Sets
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${mg.pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[11px] font-medium w-9 text-right" style={{ color }}>{mg.pct}%</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}