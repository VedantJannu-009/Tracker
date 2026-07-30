import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/db/schema'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function WeeklyMuscleDistributionChart() {
  const navigate = useNavigate()
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())
  const allWorkouts = useLiveQuery(() => db.workouts.toArray())

  const chartData = useMemo(() => {
    if (!muscleGroups || !allExercises || !allWorkoutExercises || !allSets || !allWorkouts) return []

    const weekStart = getWeekStart()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekStartTs = weekStart.getTime()
    const weekEndTs = weekEnd.getTime()

    const weekWorkouts = allWorkouts.filter(w => {
      const t = new Date(w.date).getTime()
      return t >= weekStartTs && t < weekEndTs
    })

    if (weekWorkouts.length === 0) return []

    const weekWids = new Set(weekWorkouts.map(w => w.id))
    const weekWes = allWorkoutExercises.filter(we => weekWids.has(we.workoutId))
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

    const setCount = new Map<string, number>()
    for (const s of weekSets) {
      const exerciseId = weExerciseMap.get(s.workoutExerciseId)
      if (!exerciseId) continue
      const muscleId = exerciseMuscleMap.get(exerciseId)
      if (!muscleId) continue
      setCount.set(muscleId, (setCount.get(muscleId) ?? 0) + 1)
    }

    const total = [...setCount.values()].reduce((sum, c) => sum + c, 0)
    if (total === 0) return []

    return muscleGroups
      .map(mg => ({
        id: mg.id,
        label: mg.name,
        value: Math.round(((setCount.get(mg.id) ?? 0) / total) * 100),
      }))
      .sort((a, b) => b.value - a.value)
  }, [muscleGroups, allExercises, allWorkoutExercises, allSets, allWorkouts])

  if (!chartData.length) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Muscle Distribution</h2>
      <Card>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                onClick={(data) => navigate(`/muscles/${data.payload.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--chart-tooltip-bg, #1a1a1a)', border: '1px solid var(--chart-tooltip-border, #2a2a2a)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--chart-tooltip-label, #a3a3a3)' }}
                formatter={(value) => `${value}%`}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {chartData.map((d, i) => (
              <div
                key={d.label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => navigate(`/muscles/${d.id}`)}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {d.label} {d.value}%
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
