import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Dumbbell, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExerciseIcon } from '@/components/exercise/ExerciseIcon'
import { WorkoutTimeline } from '@/components/workout/WorkoutTimeline'
import { useUnit } from '@/hooks/useUnit'
import { formatWeightValue, type Unit } from '@/lib/units'
import { buildWorkoutTimeline, type TimelineDay, type TimelineSession } from '@/lib/workoutTimeline'
import type { Exercise, Workout, WorkoutExercise, WorkoutSet } from '@/types'

const INITIAL_VISIBLE = 8

interface WorkoutHistorySectionProps {
  workouts: Workout[]
  workoutExercises: WorkoutExercise[]
  sets: WorkoutSet[]
  exercises: Exercise[]
}

export function WorkoutHistorySection({ workouts, workoutExercises, sets, exercises }: WorkoutHistorySectionProps) {
  const navigate = useNavigate()
  const unit = useUnit()
  const [showAll, setShowAll] = useState(false)

  const days = useMemo(
    () => buildWorkoutTimeline({ workouts, workoutExercises, sets, exercises }),
    [workouts, workoutExercises, sets, exercises]
  )

  const totalSessions = days.reduce((n, d) => n + d.sessions.length, 0)
  const visibleDays = useMemo(() => limitSessions(days, INITIAL_VISIBLE), [days])
  const hasMore = !showAll && totalSessions > INITIAL_VISIBLE

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-border/30" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
          <History size={10} />
          Workout History
        </span>
        <div className="h-px flex-1 bg-border/30" />
      </div>

      {days.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">No workouts logged yet</div>
      ) : (
        <WorkoutTimeline
          days={visibleDays}
          renderSession={session => (
            <TimelineSessionCard
              session={session}
              unit={unit}
              onOpen={() => navigate(`/workout/${session.id}`)}
            />
          )}
        />
      )}

      {hasMore && (
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setShowAll(true)}>
          Show all {totalSessions} workouts
        </Button>
      )}
    </div>
  )
}

function TimelineSessionCard({
  session,
  unit,
  onOpen,
}: {
  session: TimelineSession
  unit: Unit
  onOpen: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      aria-label={`Open ${session.name}`}
      className="rounded-xl border border-border/60 bg-card/60 overflow-hidden cursor-pointer transition-colors hover:bg-muted/20"
    >
      <div className="flex items-center gap-2 px-3 sm:px-4 pt-2.5 pb-2 border-b border-border/30">
        <Dumbbell size={13} className="text-primary shrink-0" />
        <span className="text-sm font-semibold truncate">{session.name}</span>
      </div>

      <div className="px-3 sm:px-4 py-2.5">
        {session.exercises.map((ex, i) => (
          <div key={ex.key} className={i > 0 ? 'mt-2.5' : ''}>
            <div className="flex items-center gap-1.5 mb-1">
              <ExerciseIcon name={ex.name} equipment={ex.equipment} size={12} className="text-muted-foreground shrink-0" />
              <span className="text-xs font-medium truncate">{ex.name}</span>
            </div>
            <div className="pl-[18px] space-y-0.5">
              {ex.sets.map(set => (
                <div key={set.id} className="text-xs text-muted-foreground tabular-nums">
                  {set.weight > 0 ? `${formatWeightValue(set.weight, unit)} ${unit} × ${set.reps}` : `Bodyweight × ${set.reps}`}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 sm:px-4 py-2 border-t border-border/30 flex items-center gap-1.5">
        <Check size={12} className="text-emerald-500 shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Workout Complete</span>
      </div>
    </div>
  )
}

function limitSessions(days: TimelineDay[], limit: number): TimelineDay[] {
  const out: TimelineDay[] = []
  let count = 0
  for (const day of days) {
    if (count >= limit) break
    const take = Math.min(day.sessions.length, limit - count)
    out.push({ ...day, sessions: day.sessions.slice(0, take) })
    count += take
  }
  return out
}
