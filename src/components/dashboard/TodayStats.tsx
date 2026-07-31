import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { Flame, TrendingUp, Dumbbell, Activity, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { toLocalDateKey } from '@/lib/dates'

function getDateKey(d: Date): string {
  return toLocalDateKey(d)
}

function computeStreak(workoutDateKeys: Set<string>): number {
  let streak = 0
  const today = new Date()
  const cursor = new Date(today)
  while (true) {
    const key = getDateKey(cursor)
    if (workoutDateKeys.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function TodayStats() {
  const allWorkouts = useLiveQuery(() => db.workouts.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())
  const prs = useLiveQuery(() => db.personalRecords.toArray())

  const stats = useMemo(() => {
    if (!allWorkouts) return null

    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const cutoff = sevenDaysAgo.getTime()

    const allDateKeys = new Set(allWorkouts.map(w => getDateKey(new Date(w.date))))
    const streak = computeStreak(allDateKeys)

    const recentWorkouts = allWorkouts.filter(w => new Date(w.date).getTime() >= cutoff)
    const workoutsThisWeek = recentWorkouts.length

    const recentWids = new Set(recentWorkouts.map(w => w.id))
    const recentWes = allWorkoutExercises?.filter(we => recentWids.has(we.workoutId)) ?? []
    const recentWeIds = new Set(recentWes.map(we => we.id))
    const recentSets = allSets?.filter(s => recentWeIds.has(s.workoutExerciseId)) ?? []

    const totalSetsThisWeek = recentSets.length
    const totalRepsThisWeek = recentSets.reduce((sum, s) => sum + s.reps, 0)
    const newPRsThisWeek = prs?.filter(pr => new Date(pr.achievedAt).getTime() >= cutoff).length ?? 0

    return { streak, workoutsThisWeek, totalSetsThisWeek, totalRepsThisWeek, newPRsThisWeek }
  }, [allWorkouts, allWorkoutExercises, allSets, prs])

  if (!stats) return null

  const items = [
    { label: 'Streak', value: stats.streak, unit: stats.streak === 1 ? 'day' : 'days', icon: Flame, color: 'text-orange-500' },
    { label: 'Workouts', value: stats.workoutsThisWeek, icon: TrendingUp, color: 'text-primary' },
    { label: 'Sets', value: stats.totalSetsThisWeek, icon: Dumbbell, color: 'text-green-500' },
    { label: 'Reps', value: stats.totalRepsThisWeek, icon: Activity, color: 'text-yellow-500' },
    { label: 'PRs', value: stats.newPRsThisWeek, icon: Trophy, color: 'text-purple-500' },
  ]

  if (items.every(item => item.value === 0)) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Today's Stats</h2>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {items.map(item => (
              <div key={item.label} className="text-center">
                <item.icon size={16} className={`${item.color} mx-auto mb-1`} />
                <div className="text-lg font-bold">{item.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.unit || item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
