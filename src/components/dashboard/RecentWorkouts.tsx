import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { formatRelative } from '@/lib/utils'
import { TrendingUp, Dumbbell, Clock } from 'lucide-react'

interface WorkoutSummary {
  id: string
  name: string
  date: string
  duration?: number
  muscleNames: string
  exerciseCount: number
  totalSets: number
}

function formatDuration(minutes?: number): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function RecentWorkouts() {
  const navigate = useNavigate()
  const workouts = useLiveQuery(
    () => db.workouts.orderBy('createdAt').reverse().limit(10).toArray()
  )

  const summaries = useLiveQuery<WorkoutSummary[]>(
    async () => {
      if (!workouts) return []
      const result: WorkoutSummary[] = []

      for (const w of workouts) {
        const wes = await db.workoutExercises.where('workoutId').equals(w.id).toArray()
        if (wes.length === 0) continue

        const exerciseIds = [...new Set(wes.map(we => we.exerciseId))]
        const exercises = await db.exercises.where('id').anyOf(exerciseIds).toArray()
        const muscleGroupIds = [...new Set(exercises.map(e => e.muscleGroupId))]
        const muscleGroups = await db.muscleGroups.where('id').anyOf(muscleGroupIds).toArray()

        const weIds = wes.map(we => we.id)
        const sets = await db.workoutSets.where('workoutExerciseId').anyOf(weIds).toArray()

        result.push({
          id: w.id,
          name: w.name,
          date: w.date,
          duration: w.duration,
          muscleNames: muscleGroups.map(m => m.name).join(', '),
          exerciseCount: wes.length,
          totalSets: sets.length,
        })
      }

      return result
    },
    [workouts]
  )

  if (!summaries || summaries.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Workouts</h2>
      <div className="space-y-2">
        {summaries.map(s => (
          <div
            key={s.id}
            onClick={() => navigate(`/workout/${s.id}`)}
            className="rounded-xl bg-muted/50 p-3 sm:p-3.5 cursor-pointer hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-between mb-1 gap-2">
              <span className="font-medium text-sm truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatRelative(s.date)}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              <span>{s.muscleNames}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
              {s.duration ? (
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDuration(s.duration)}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Dumbbell size={12} />
                {s.exerciseCount} {s.exerciseCount === 1 ? 'exercise' : 'exercises'}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp size={12} />
                {s.totalSets} {s.totalSets === 1 ? 'set' : 'sets'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
