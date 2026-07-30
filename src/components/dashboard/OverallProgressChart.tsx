import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { AreaChart as RechartsAreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'

type Range = 7 | 30 | 90 | 180 | 365
type Metric = 'sets' | 'reps' | 'frequency'

const RANGES: { label: string; days: Range }[] = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
]

const METRICS: { label: string; value: Metric }[] = [
  { label: 'Total Sets', value: 'sets' },
  { label: 'Total Reps', value: 'reps' },
  { label: 'Workout Frequency', value: 'frequency' },
]

function getDateKey(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function OverallProgressChart() {
  const [range, setRange] = useState<Range>(30)
  const [metric, setMetric] = useState<Metric>('sets')

  const allWorkouts = useLiveQuery(() => db.workouts.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - range)
    return d.getTime()
  }, [range])

  const chartData = useMemo(() => {
    if (!allWorkouts || !allWorkoutExercises || !allSets) return []

    const recentWorkouts = allWorkouts
      .filter(w => new Date(w.date).getTime() >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const dateMap = new Map<string, { sets: number; reps: number; frequency: number }>()

    for (const w of recentWorkouts) {
      const key = getDateKey(new Date(w.date))
      const existing = dateMap.get(key) ?? { sets: 0, reps: 0, frequency: 0 }
      existing.frequency += 1

      const wes = allWorkoutExercises.filter(we => we.workoutId === w.id)
      for (const we of wes) {
        const exerciseSets = allSets.filter(s => s.workoutExerciseId === we.id)
        existing.sets += exerciseSets.length
        existing.reps += exerciseSets.reduce((sum, s) => sum + s.reps, 0)
      }
      dateMap.set(key, existing)
    }

    const sortedKeys = [...dateMap.keys()].sort()

    if (metric === 'frequency') {
      return sortedKeys.map(key => ({
        label: key.slice(5),
        value: dateMap.get(key)!.frequency,
      }))
    }

    return sortedKeys.map(key => ({
      label: key.slice(5),
      value: dateMap.get(key)![metric],
    }))
  }, [allWorkouts, allWorkoutExercises, allSets, cutoff, metric])

  if (!chartData.length) return null

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall Progress</h2>
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
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
            {METRICS.map(m => (
              <button
                key={m.value}
                onClick={() => setMetric(m.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  metric === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
              <RechartsAreaChart data={chartData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #2a2a2a)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis-tick, #a3a3a3)' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: 'var(--chart-tooltip-bg, #1a1a1a)', border: '1px solid var(--chart-tooltip-border, #2a2a2a)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--chart-tooltip-label, #a3a3a3)' }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#progressGradient)" dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={true} animationDuration={600} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
