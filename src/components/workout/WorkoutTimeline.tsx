import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { TimelineDay, TimelineSession } from '@/lib/workoutTimeline'

interface WorkoutTimelineProps {
  days: TimelineDay[]
  renderSession: (session: TimelineSession) => ReactNode
}

export function WorkoutTimeline({ days, renderSession }: WorkoutTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/40" aria-hidden="true" />
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        {days.map(day => (
          <motion.div
            key={day.key}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
            }}
            className="relative pl-6 pb-6 last:pb-0"
          >
            <span
              className="absolute left-0 top-[3px] w-3.5 h-3.5 rounded-full border-2 border-background bg-primary"
              aria-hidden="true"
            />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {day.label}
            </span>
            <div className="mt-3 space-y-3">
              {day.sessions.map(session => (
                <div key={session.id}>{renderSession(session)}</div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
