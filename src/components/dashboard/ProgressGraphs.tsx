import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { AreaChart } from '@/components/charts/AreaChart'
import { BarChart } from '@/components/charts/BarChart'
import { PieChart } from '@/components/charts/PieChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, TrendingUp, Dumbbell, Activity, Trophy } from 'lucide-react'
import { toLocalDateKey } from '@/lib/dates'

type Range = 7 | 30 | 90 | 365

const RANGES: { label: string; days: Range }[] = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '1 Year', days: 365 },
]

function getDateKey(d: Date): string {
  return toLocalDateKey(d)
}

function getWeekKey(d: Date): string {
  const start = new Date(d)
  start.setDate(start.getDate() - start.getDay())
  return getDateKey(start)
}

function computeStreak(dates: Set<string>): number {
  let streak = 0
  const today = new Date()
  const cursor = new Date(today)
  while (true) {
    const key = getDateKey(cursor)
    if (dates.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function ProgressGraphs() {
  const [range, setRange] = useState<Range>(30)

  const allWorkouts = useLiveQuery(() => db.workouts.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())
  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const personalRecords = useLiveQuery(() => db.personalRecords.toArray())

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - range)
    return d.getTime()
  }, [range])

  const filtered = useMemo(() => {
    if (!allWorkouts || !allWorkoutExercises || !allSets) return null

    const recentWorkouts = allWorkouts.filter(w => new Date(w.date).getTime() >= cutoff)
    const recentWids = new Set(recentWorkouts.map(w => w.id))
    const recentWes = allWorkoutExercises.filter(we => recentWids.has(we.workoutId))
    const recentWeIds = new Set(recentWes.map(we => we.id))
    const recentSets = allSets.filter(s => recentWeIds.has(s.workoutExerciseId))

    const weekKeys = [...new Set(recentWorkouts.map(w => getWeekKey(new Date(w.date))))].sort()

    const weeklyFreq = weekKeys.map(key => {
      const count = recentWorkouts.filter(w => getWeekKey(new Date(w.date)) === key).length
      return { label: key.slice(5), value: count }
    })

    const weeklySets = weekKeys.map(key => {
      const wids = new Set(recentWorkouts.filter(w => getWeekKey(new Date(w.date)) === key).map(w => w.id))
      const wes = recentWes.filter(we => wids.has(we.workoutId))
      const weIds = new Set(wes.map(we => we.id))
      const total = recentSets.filter(s => weIds.has(s.workoutExerciseId)).length
      return { label: key.slice(5), value: total }
    })

    const weeklyReps = weekKeys.map(key => {
      const wids = new Set(recentWorkouts.filter(w => getWeekKey(new Date(w.date)) === key).map(w => w.id))
      const wes = recentWes.filter(we => wids.has(we.workoutId))
      const weIds = new Set(wes.map(we => we.id))
      const total = recentSets.filter(s => weIds.has(s.workoutExerciseId)).reduce((sum, s) => sum + s.reps, 0)
      return { label: key.slice(5), value: total }
    })

    const muscleFreq = new Map<string, number>()
    if (allExercises) {
      for (const we of recentWes) {
        const ex = allExercises.find(e => e.id === we.exerciseId)
        if (ex) {
          muscleFreq.set(ex.muscleGroupId, (muscleFreq.get(ex.muscleGroupId) ?? 0) + 1)
        }
      }
    }

    const muscleFreqData = [...muscleFreq.entries()]
      .map(([id, count]) => ({
        label: muscleGroups?.find(m => m.id === id)?.name ?? id,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)

    const allDates = new Set(allWorkouts.map(w => getDateKey(new Date(w.date))))
    const streak = computeStreak(allDates)

    const prData = (personalRecords ?? [])
      .filter(pr => new Date(pr.achievedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime())
      .map(pr => ({ label: toLocalDateKey(pr.achievedAt).slice(5), value: pr.value }))

    return { weeklyFreq, weeklySets, weeklyReps, muscleFreqData, prData, streak, workoutCount: recentWorkouts.length }
  }, [allWorkouts, allWorkoutExercises, allSets, allExercises, muscleGroups, personalRecords, cutoff])

  if (!filtered || filtered.workoutCount === 0) return null

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Progress</h2>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                range === r.days ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs">Streak</span>
          </div>
          <div className="text-2xl font-bold">{filtered.streak} {filtered.streak === 1 ? 'day' : 'days'}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs">Workouts</span>
          </div>
          <div className="text-2xl font-bold">{filtered.workoutCount}</div>
        </Card>
      </div>

      <div className="space-y-3">
        {filtered.weeklyFreq.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs"><TrendingUp size={12} className="inline mr-1" />Weekly Workout Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={filtered.weeklyFreq} color="#3b82f6" height={160} />
            </CardContent>
          </Card>
        )}

        {filtered.weeklySets.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs"><Dumbbell size={12} className="inline mr-1" />Sets per Week</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={filtered.weeklySets} color="#22c55e" height={160} />
            </CardContent>
          </Card>
        )}

        {filtered.weeklyReps.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs"><Activity size={12} className="inline mr-1" />Reps per Week</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={filtered.weeklyReps} color="#f59e0b" height={160} />
            </CardContent>
          </Card>
        )}

        {filtered.muscleFreqData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs"><Dumbbell size={12} className="inline mr-1" />Muscle Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart data={filtered.muscleFreqData} height={180} />
            </CardContent>
          </Card>
        )}

        {filtered.prData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs"><Trophy size={12} className="inline mr-1" />Personal Record Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart data={filtered.prData} color="#8b5cf6" height={160} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
