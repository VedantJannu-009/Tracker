import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Play, BarChart3 } from 'lucide-react'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardGreeting() {
  const navigate = useNavigate()
  const greeting = useMemo(() => getGreeting(), [])
  const date = useMemo(() => format(new Date(), 'EEEE, MMMM d'), [])

  return (
    <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="min-w-0 flex-1"
      >
        <h1 className="text-xl sm:text-2xl font-bold truncate">{greeting}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{date}</p>
      </motion.div>
      <div className="flex items-center gap-2 shrink-0">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/statistics')}
            aria-label="View statistics"
          >
            <BarChart3 size={18} />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button size="icon" onClick={() => navigate('/workout')} aria-label="Start workout">
            <Play size={18} className="ml-0.5" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
