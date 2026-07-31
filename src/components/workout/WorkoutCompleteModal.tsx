import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Timer, Dumbbell, ListChecks, Activity, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import { formatWeightValue } from '@/lib/units'
import type { Unit } from '@/lib/units'

export interface WorkoutSummary {
  workoutName: string
  durationSec: number
  exerciseCount: number
  setCount: number
  volume: number
  best: { weight: number; exerciseName: string } | null
}

interface WorkoutCompleteModalProps {
  open: boolean
  summary: WorkoutSummary
  unit: Unit
  onDone: () => void
}

export function WorkoutCompleteModal({ open, summary, unit, onDone }: WorkoutCompleteModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onDone])

  if (!open) return null

  const rows = [
    { icon: Timer, label: 'Duration', value: formatTime(Math.max(1, Math.round(summary.durationSec / 60))) },
    { icon: Dumbbell, label: 'Exercises', value: String(summary.exerciseCount) },
    { icon: ListChecks, label: 'Sets', value: String(summary.setCount) },
    { icon: Activity, label: 'Volume', value: `${formatWeightValue(summary.volume, unit)} ${unit}` },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Workout Complete"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl"
      >
        <div className="flex flex-col items-center text-center mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.05 }}
            className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3"
          >
            <CheckCircle2 size={28} className="text-success" />
          </motion.div>
          <h2 className="text-lg font-bold">Workout Complete</h2>
          <p className="text-sm text-muted-foreground truncate max-w-full">{summary.workoutName}</p>
        </div>

        <div className="space-y-1.5 mb-5">
          {rows.map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
            >
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <row.icon size={15} /> {row.label}
              </span>
              <span className="text-sm font-semibold tabular-nums">{row.value}</span>
            </div>
          ))}
          {summary.best && (
            <div className="flex items-center justify-between py-1.5 gap-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                <Trophy size={15} className="text-primary" /> Best lift
              </span>
              <span className="text-sm font-semibold truncate text-right">
                {summary.best.exerciseName} · {formatWeightValue(summary.best.weight, unit)} {unit}
              </span>
            </div>
          )}
        </div>

        <Button className="w-full" size="lg" onClick={onDone}>
          Done
        </Button>
      </motion.div>
    </div>
  )
}
