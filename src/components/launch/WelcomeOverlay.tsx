import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'
import { useLaunchStore } from '@/stores/launchStore'

function greetingByTime(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function WelcomeOverlay() {
  const welcomeShown = useLaunchStore(s => s.welcomeShown)
  const isFirstLaunch = useLaunchStore(s => s.isFirstLaunch)
  const [visible, setVisible] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!welcomeShown || gone) return
    setVisible(true)
    const hold = setTimeout(() => setVisible(false), 2000)
    const done = setTimeout(() => setGone(true), 2500)
    return () => {
      clearTimeout(hold)
      clearTimeout(done)
    }
  }, [welcomeShown, gone])

  if (!welcomeShown || gone) return null

  const title = isFirstLaunch ? 'Welcome to My Tracker' : greetingByTime()
  const subtitle = isFirstLaunch ? "Let's build your best physique." : 'Ready to train?'

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <motion.div
        className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/10 flex items-center justify-center mb-5"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <Dumbbell size={36} className="text-primary" />
      </motion.div>
      <motion.h2
        className="text-2xl sm:text-3xl font-bold text-center px-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
      >
        {title}
      </motion.h2>
      <motion.p
        className="text-sm text-muted-foreground mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
      >
        {subtitle}
      </motion.p>
    </motion.div>
  )
}
