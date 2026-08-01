import { motion } from 'framer-motion'
import { MuscleIcon } from '@/components/muscle/MuscleIcon'
import { useMuscleStats } from '@/hooks/useMuscleStats'
import { useRecovery } from '@/hooks/useRecovery'
import { formatRelative } from '@/lib/utils'
import type { MuscleGroup, RecoveryStatus } from '@/types'

interface MuscleRowProps {
  muscle: MuscleGroup
  onClick: () => void
}

const STATUS_THEME: Record<RecoveryStatus, { border: string; tint: string; icon: string }> = {
  ready: { border: '#4ade80', tint: 'bg-green-400/10', icon: 'text-green-500' },
  recovering: { border: '#fbbf24', tint: 'bg-amber-400/10', icon: 'text-amber-500' },
  inactive: { border: 'rgba(161, 161, 170, 0.25)', tint: 'bg-muted/40', icon: 'text-muted-foreground' },
}

export function MuscleRow({ muscle, onClick }: MuscleRowProps) {
  const stats = useMuscleStats(muscle.id)
  const recovery = useRecovery(muscle.id)
  const status: RecoveryStatus = recovery?.status ?? 'inactive'
  const theme = STATUS_THEME[status]

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      aria-label={`Open ${muscle.name}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer gap-2 border-l-2"
      style={{ borderLeftColor: theme.border }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${theme.tint} flex items-center justify-center shrink-0`}>
          <MuscleIcon muscleId={muscle.id} size={16} className={theme.icon} />
        </div>
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
    </motion.div>
  )
}
