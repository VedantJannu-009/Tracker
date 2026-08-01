import { motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { MuscleIcon } from '@/components/muscle/MuscleIcon'
import { useMuscleStats } from '@/hooks/useMuscleStats'
import { db } from '@/db/schema'
import { formatRelative } from '@/lib/utils'

interface TooltipProps {
  muscleId: string
  x: number
  y: number
}

export function Tooltip({ muscleId, x, y }: TooltipProps) {
  const stats = useMuscleStats(muscleId)
  const muscle = useLiveQuery(() => db.muscleGroups.get(muscleId), [muscleId])

  if (!muscle) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="fixed z-50 pointer-events-none"
      style={{
        left: Math.min(x, window.innerWidth - 180),
        top: Math.max(y - 12, 8),
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="px-3.5 py-2.5 rounded-xl bg-card/95 border border-border/60 shadow-2xl backdrop-blur-xl min-w-[160px]">
        <div className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
          <MuscleIcon muscleId={muscle.id} size={14} />
          {muscle.name}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Exercises</span>
            <span className="font-medium">{stats.exercises.length}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Sets</span>
            <span className="font-medium">{stats.totalSets}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Reps</span>
            <span className="font-medium">{stats.totalReps}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Last</span>
            <span className="font-medium">
              {stats.lastWorkoutDate ? formatRelative(stats.lastWorkoutDate) : 'Never'}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t border-border/30 text-[10px] text-muted-foreground flex items-center gap-1.5">
          {stats.isFrequentlyTrained ? (
            <span className="text-blue-400">Frequently trained</span>
          ) : stats.isRecentlyTrained ? (
            <span className="text-green-400">Recently trained</span>
          ) : stats.hasData ? (
            <span className="text-blue-300">Trained</span>
          ) : (
            <span className="text-muted-foreground">Not trained</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
