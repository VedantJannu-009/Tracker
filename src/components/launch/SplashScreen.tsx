import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useLaunchStore } from '@/stores/launchStore'

type Stage = 'init' | 'logo' | 'title' | 'tagline' | 'preparing' | 'leaving'

const STAGE_AT: { at: number; stage: Stage }[] = [
  { at: 300, stage: 'logo' },
  { at: 800, stage: 'title' },
  { at: 1300, stage: 'tagline' },
  { at: 2000, stage: 'preparing' },
]

const EXIT_AT = 2800
const EXIT_DURATION = 500

export function SplashScreen() {
  const ready = useLaunchStore(s => s.ready)
  const beginEnter = useLaunchStore(s => s.beginEnter)
  const finishSplash = useLaunchStore(s => s.finishSplash)
  const [stage, setStage] = useState<Stage>('init')
  const mountedAt = useRef<number>(Date.now())
  const exiting = useRef(false)

  useEffect(() => {
    const timers = STAGE_AT.map(({ at, stage }) => setTimeout(() => setStage(stage), at))
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (stage !== 'preparing' || !ready || exiting.current) return
    const elapsed = Date.now() - mountedAt.current
    const delay = Math.max(0, EXIT_AT - elapsed)
    const timer = setTimeout(() => {
      exiting.current = true
      beginEnter()
      setStage('leaving')
    }, delay)
    return () => clearTimeout(timer)
  }, [stage, ready, beginEnter])

  useEffect(() => {
    if (stage !== 'leaving') return
    const timer = setTimeout(finishSplash, EXIT_DURATION)
    return () => clearTimeout(timer)
  }, [stage, finishSplash])

  const leaving = stage === 'leaving'
  const titleVisible = stage === 'title' || stage === 'tagline' || stage === 'preparing' || leaving

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      initial={false}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: EXIT_DURATION / 1000, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center px-8">
        <motion.div
          className="text-6xl sm:text-7xl mb-5"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={stage === 'init' ? { opacity: 0, scale: 0.85 } : { opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          💪
        </motion.div>

        <motion.h1
          className="text-2xl sm:text-3xl font-extrabold tracking-[0.35em] text-white mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={titleVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          MY TRACKER
        </motion.h1>

        {stage === 'tagline' && (
          <motion.p
            className="text-sm text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            Train. Track. Progress.
          </motion.p>
        )}
      </div>

      {(stage === 'preparing' || leaving) && (
        <motion.div
          className="absolute bottom-14 left-0 right-0 flex flex-col items-center gap-3 px-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <p className="text-xs text-white/60 tracking-wide">Preparing your workout...</p>
          <div className="w-full max-w-[240px] h-1 rounded-full bg-white/15 overflow-hidden">
            <motion.div
              className="h-full w-1/3 rounded-full bg-primary"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
