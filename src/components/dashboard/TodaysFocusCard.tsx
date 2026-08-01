import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Dumbbell, Layers, Clock, CalendarDays, Play } from 'lucide-react'
import { useTodayStats } from '@/hooks/useTodayStats'

interface StatProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}

function Stat({ icon, label, value, sub }: StatProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground leading-tight truncate">{sub}</p>}
      </div>
    </div>
  )
}

export function TodaysFocusCard() {
  const navigate = useNavigate()
  const stats = useTodayStats()

  const etaLabel = useMemo(() => {
    if (!stats.estimatedFinishTime) return null
    return format(stats.estimatedFinishTime, 'h:mm a')
  }, [stats.estimatedFinishTime])

  if (!stats.loaded) return null

  const hasDataToday = stats.todayWorkoutCount > 0 || stats.hasActiveWorkout

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Today's Focus</p>
          {stats.hasActiveWorkout && (
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              In Progress
            </span>
          )}
        </div>

        {stats.hasActiveWorkout ? (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Dumbbell size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">{stats.workoutName || 'Today\'s Workout'}</h3>
                <p className="text-xs text-muted-foreground">Tap to keep training</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat icon={<Dumbbell size={14} />} label="Exercises" value={String(stats.exercisesCompleted)} />
              <Stat icon={<Layers size={14} />} label="Sets" value={String(stats.setsCompleted)} />
              <Stat
                icon={<Clock size={14} />}
                label="Est. Finish"
                value={etaLabel ?? '—'}
                sub={`~${stats.estimatedFinishMinutes ?? 0} min left`}
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Workout Progress</span>
                <span className="text-[11px] font-medium tabular-nums">{stats.progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            <Button className="w-full" onClick={() => navigate('/workout')}>
              Continue Workout <ArrowRight size={14} className="ml-1" />
            </Button>
          </>
        ) : hasDataToday ? (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <CalendarDays size={18} className="text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">{stats.workoutName || 'Today\'s Workout'}</h3>
                <p className="text-xs text-muted-foreground">
                  {stats.todayWorkoutCount} {stats.todayWorkoutCount === 1 ? 'workout' : 'workouts'} logged
                  {stats.todayDurationMinutes != null && ` · ${stats.todayDurationMinutes >= 60 ? Math.floor(stats.todayDurationMinutes / 60) + 'h' : ''} ${stats.todayDurationMinutes % 60}m`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat icon={<Dumbbell size={14} />} label="Exercises" value={String(stats.todayExercisesCompleted)} />
              <Stat icon={<Layers size={14} />} label="Sets" value={String(stats.todaySetsCompleted)} />
              <Stat icon={<Clock size={14} />} label="Today" value={stats.todayWorkoutCount > 0 ? formatTimeShort(stats.todayDurationMinutes) : '—'} />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Today's Progress</span>
                <span className="text-[11px] font-medium tabular-nums">{stats.progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-success"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>

            <Button className="w-full" onClick={() => navigate('/workout')}>
              Start New Workout <ArrowRight size={14} className="ml-1" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Play size={16} className="text-muted-foreground ml-0.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base">Ready to train?</h3>
                <p className="text-xs text-muted-foreground">No workouts logged yet today</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => navigate('/workout')}>
              Start Workout <ArrowRight size={14} className="ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function formatTimeShort(minutes: number | null): string {
  if (minutes == null) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
