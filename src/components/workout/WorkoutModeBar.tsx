import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flag } from 'lucide-react'
import { useWorkoutStore } from '@/stores/workoutStore'
import { Button } from '@/components/ui/button'
import { formatWeightValue } from '@/lib/units'
import type { Unit } from '@/lib/units'

interface WorkoutModeBarProps {
  unit: Unit
  currentExerciseName: string | null
  onFinish: () => void
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function WorkoutModeBar({ unit, currentExerciseName, onFinish }: WorkoutModeBarProps) {
  const workout = useWorkoutStore(s => s.currentWorkout)
  const exercises = useWorkoutStore(s => s.currentExercises)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!workout) return null

  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0)
  if (totalSets === 0) return null

  const volume = exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0
  )
  const elapsed = Math.max(0, Math.floor((now - workout.createdAt) / 1000))

  const stats = [
    { label: 'Duration', value: formatElapsed(elapsed) },
    { label: 'Exercises', value: String(exercises.length) },
    { label: 'Sets', value: String(totalSets) },
    { label: 'Volume', value: formatWeightValue(volume, unit) },
  ]

  return (
    <div className="fixed left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.75rem)] z-40 px-4">
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="rounded-2xl border border-border/60 glass shadow-2xl p-3"
      >
        <div className="grid grid-cols-4 divide-x divide-border/40 mb-2">
          {stats.map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5 px-1 text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              <span className="text-sm font-bold tabular-nums">{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" aria-hidden="true" />
            <span className="text-[11px] text-muted-foreground shrink-0">Now</span>
            <span className="text-sm font-semibold truncate">{currentExerciseName ?? '—'}</span>
          </div>
          <Button
            onClick={onFinish}
            className="bg-gradient-to-r from-primary to-indigo-500 shrink-0 h-10 px-4 text-xs sm:text-sm whitespace-nowrap"
          >
            <Flag size={15} className="mr-1" /> Finish Workout
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
