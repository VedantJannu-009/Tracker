import { useNavigate } from 'react-router-dom'
import { formatRelative } from '@/lib/utils'
import type { MuscleGroup } from '@/types'
import { useMuscleStats } from '@/hooks/useMuscleStats'
import { CalendarDays } from 'lucide-react'

interface MuscleCardProps {
  muscle: MuscleGroup
}

export function MuscleCard({ muscle }: MuscleCardProps) {
  const navigate = useNavigate()
  const { exercises, lastWorkoutDate, progressPercentage } = useMuscleStats(muscle.id)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/muscles/${muscle.id}`)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/muscles/${muscle.id}`) } }}
      aria-label={`Open ${muscle.name}`}
      className="rounded-2xl bg-card border border-border/50 card-glow p-3 sm:p-4 cursor-pointer hover:bg-muted/20 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted flex items-center justify-center text-base sm:text-lg shrink-0">
            {muscle.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base truncate">{muscle.name}</h3>
            <p className="text-xs text-muted-foreground">{exercises.length} exercises</p>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
              <CalendarDays size={11} className="shrink-0" />
              <span className="truncate">{lastWorkoutDate ? formatRelative(lastWorkoutDate) : 'Never'}</span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base sm:text-lg font-bold">{progressPercentage}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">progress</div>
        </div>
      </div>
    </div>
  )
}
