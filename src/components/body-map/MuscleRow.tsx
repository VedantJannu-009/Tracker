import { useMuscleStats } from '@/hooks/useMuscleStats'
import { formatRelative } from '@/lib/utils'
import type { MuscleGroup } from '@/types'

interface MuscleRowProps {
  muscle: MuscleGroup
  onClick: () => void
}

export function MuscleRow({ muscle, onClick }: MuscleRowProps) {
  const stats = useMuscleStats(muscle.id)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      aria-label={`Open ${muscle.name}`}
      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors gap-2"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <span className="text-base sm:text-lg shrink-0">{muscle.icon}</span>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{muscle.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {stats.totalSets} sets &middot; {stats.totalReps} reps
          </div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">
        {stats.lastWorkoutDate ? formatRelative(stats.lastWorkoutDate) : 'Never'}
      </div>
    </div>
  )
}
