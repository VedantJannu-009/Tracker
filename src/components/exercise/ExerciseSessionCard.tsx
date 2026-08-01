import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Clock, Dumbbell } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { formatWeight, type Unit } from '@/lib/units'
import type { TimelineSession } from '@/lib/workoutTimeline'

interface ExerciseSessionCardProps {
  session: TimelineSession
  unit: Unit
  expanded: boolean
  onToggle: () => void
}

export function ExerciseSessionCard({ session, unit, expanded, onToggle }: ExerciseSessionCardProps) {
  const sets = session.exercises[0]?.sets ?? []
  const totalSets = sets.length
  const totalReps = sets.reduce((n, s) => n + s.reps, 0)
  const bestWeight = sets.reduce((best, s) => Math.max(best, s.weight), 0)

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${session.name} workout details`}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        className="cursor-pointer transition-colors hover:bg-muted/20"
      >
        <div className="flex items-center gap-2 px-3 sm:px-4 pt-2.5 pb-2">
          <Dumbbell size={13} className="text-primary shrink-0" />
          <span className="text-sm font-semibold truncate">{session.name}</span>
          {session.duration != null && session.duration > 0 && (
            <span className="text-[11px] text-muted-foreground shrink-0 ml-auto flex items-center gap-1">
              <Clock size={11} />
              {formatTime(session.duration)}
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn('text-muted-foreground shrink-0 transition-transform', expanded && 'rotate-180')}
          />
        </div>
        <div className="px-3 sm:px-4 pb-2.5 flex items-center gap-2 sm:gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span>{totalSets} {totalSets === 1 ? 'set' : 'sets'}</span>
          <span className="opacity-40">·</span>
          <span>{totalReps} {totalReps === 1 ? 'rep' : 'reps'}</span>
          {bestWeight > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span>Best {formatWeight(bestWeight, unit)}</span>
            </>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 py-2.5 border-t border-border/30 space-y-1.5">
              {sets.map((set, i) => (
                <div key={set.id} className="flex items-center gap-3 text-sm">
                  <span className="text-[11px] text-muted-foreground w-10 shrink-0 tabular-nums">Set {i + 1}</span>
                  <span className="font-medium tabular-nums">
                    {set.weight > 0 ? `${formatWeight(set.weight, unit)}` : 'Bodyweight'} × {set.reps}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-3 sm:px-4 py-2 border-t border-border/30 flex items-center gap-1.5">
        <Check size={12} className="text-emerald-500 shrink-0" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Workout Complete</span>
      </div>
    </div>
  )
}
