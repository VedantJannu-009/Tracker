import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/schema'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Target } from 'lucide-react'

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

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

interface FocusResult {
  muscle: { id: string; name: string; icon: string }
  done: number
  target: number
  remaining: number
}

export function TodaysFocusCard() {
  const navigate = useNavigate()
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const weeklyGoals = useLiveQuery(() => db.weeklyGoals.toArray())
  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())
  const allWorkouts = useLiveQuery(() => db.workouts.toArray())

  const focus = useMemo<FocusResult | null>(() => {
    if (!muscleGroups || !weeklyGoals || !allExercises || !allWorkoutExercises || !allSets || !allWorkouts) return null
    if (weeklyGoals.length === 0) return null

    const goalMap = new Map(weeklyGoals.map(g => [g.muscleGroupId, g.targetSets]))

    const weekStart = getWeekStart()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekStartTs = weekStart.getTime()
    const weekEndTs = weekEnd.getTime()

    const weekWorkouts = allWorkouts.filter(w => {
      const t = new Date(w.date).getTime()
      return t >= weekStartTs && t < weekEndTs
    })

    const weekWids = new Set(weekWorkouts.map(w => w.id))
    const weekWes = allWorkoutExercises.filter(we => weekWids.has(we.workoutId))
    const weekWeIds = new Set(weekWes.map(we => we.id))
    const weekSets = allSets.filter(s => weekWeIds.has(s.workoutExerciseId))

    const exerciseMuscleMap = new Map<string, string>()
    for (const ex of allExercises) exerciseMuscleMap.set(ex.id, ex.muscleGroupId)
    const weExerciseMap = new Map<string, string>()
    for (const we of weekWes) weExerciseMap.set(we.id, we.exerciseId)

    const setCount = new Map<string, number>()
    for (const s of weekSets) {
      const exerciseId = weExerciseMap.get(s.workoutExerciseId)
      const muscleId = exerciseId ? exerciseMuscleMap.get(exerciseId) : undefined
      if (muscleId) setCount.set(muscleId, (setCount.get(muscleId) ?? 0) + 1)
    }

    let best: FocusResult | null = null
    let bestRemaining = -1
    for (const mg of muscleGroups) {
      const target = goalMap.get(mg.id)
      if (!target || target <= 0) continue
      const done = setCount.get(mg.id) ?? 0
      const remaining = Math.max(0, target - done)
      if (remaining > bestRemaining) {
        bestRemaining = remaining
        best = { muscle: mg, done, target, remaining }
      }
    }
    return best
  }, [muscleGroups, weeklyGoals, allExercises, allWorkoutExercises, allSets, allWorkouts])

  const loaded = !!muscleGroups && !!weeklyGoals && !!allExercises && !!allWorkoutExercises && !!allSets && !!allWorkouts
  if (!loaded) return null

  if (!focus) {
    return (
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Today's Focus</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Target size={18} className="text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base">Set a weekly goal</h3>
              <p className="text-xs text-muted-foreground">Pick muscles to focus on this week</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => navigate('/weekly-goals')}
          >
            Weekly Goals <ArrowRight size={14} />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const color = GROUP_COLORS[focus.muscle.name.toLowerCase()] || '#3b82f6'
  const pct = focus.target > 0 ? Math.min(100, Math.round((focus.done / focus.target) * 100)) : 0

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Today's Focus</p>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                {focus.muscle.icon}
              </div>
              <h3 className="font-semibold text-base sm:text-lg">{focus.muscle.name}</h3>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2 py-1 rounded-full" style={{ color, backgroundColor: `${color}1f` }}>
            {focus.remaining > 0 ? `${focus.remaining} sets to go` : 'Goal complete'}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {focus.done}/{focus.target}
          </span>
        </div>
        <Button className="w-full bg-gradient-to-r from-primary to-indigo-500" onClick={() => navigate('/workout')}>
          Train {focus.muscle.name} <ArrowRight size={14} className="ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}
