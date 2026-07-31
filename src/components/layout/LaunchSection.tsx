import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useLaunchStore } from '@/stores/launchStore'

interface LaunchSectionProps {
  index: number
  children: ReactNode
  className?: string
}

export function LaunchSection({ index, children, className }: LaunchSectionProps) {
  const entered = useLaunchStore(s => s.phase !== 'splash')
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={entered ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
