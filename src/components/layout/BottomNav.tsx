import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Dumbbell, Activity, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLaunchStore } from '@/stores/launchStore'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/body', icon: Activity, label: 'Body' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const entered = useLaunchStore(s => s.phase !== 'splash')
  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-bottom"
      initial={{ opacity: 0, y: 32 }}
      animate={entered ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.5, delay: 5 * 0.06, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] px-2 py-1 rounded-xl transition-all duration-200',
                  'text-muted-foreground hover:text-foreground',
                  isActive && 'text-primary'
                )
              }
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </div>
    </motion.nav>
  )
}
