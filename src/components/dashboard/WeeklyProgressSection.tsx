import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { ChevronDown, BarChart3 } from 'lucide-react'
import { useWeeklyStats } from '@/hooks/useWeeklyStats'
import { WeeklyMuscleProgress } from '@/components/dashboard/WeeklyMuscleProgress'
import { WeeklyMuscleDistributionChart } from '@/components/dashboard/WeeklyMuscleDistributionChart'

export function WeeklyProgressSection() {
  const [open, setOpen] = useState(false)
  const stats = useWeeklyStats()

  const summary = useMemo(() => {
    if (!stats.loaded) return null
    const targeted = stats.muscleStats.filter(m => m.target > 0)
    const setsDone = stats.muscleStats.reduce((sum, m) => sum + m.sets, 0)
    const targetTotal = stats.muscleStats.reduce((sum, m) => sum + m.target, 0)
    const onTrack = targeted.filter(m => m.sets >= m.target).length
    return { setsDone, targetTotal, onTrack, targeted: targeted.length }
  }, [stats])

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Weekly Progress</h2>
      <Card className="overflow-hidden">
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="weekly-progress-panel"
          className="w-full text-left p-4 sm:p-5 flex items-center gap-3 hover:bg-muted/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 size={18} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">
              {summary ? `${summary.setsDone} / ${summary.targetTotal} sets` : 'Weekly Progress'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {summary && summary.targeted > 0
                ? `${summary.onTrack} of ${summary.targeted} muscles on track`
                : 'Set weekly goals to start tracking'}
            </p>
          </div>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground shrink-0"
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="weekly-progress-panel"
              id="weekly-progress-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
          <div className="p-4 sm:p-5 pt-0 space-y-4">
            <WeeklyMuscleDistributionChart stats={stats} />
            <WeeklyMuscleProgress stats={stats} />
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
