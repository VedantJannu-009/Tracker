import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'muted' | 'primary'
}

export function EmptyState({ icon: Icon, title, description, action, tone = 'muted' }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="text-center py-12"
    >
      <div
        className={cn(
          'w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center mb-4',
          tone === 'primary'
            ? 'bg-primary/10 border-primary/10'
            : 'bg-muted/60 border-border/60'
        )}
      >
        <Icon size={26} className={tone === 'primary' ? 'text-primary' : 'text-muted-foreground'} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className={cn('text-sm text-muted-foreground max-w-xs mx-auto', action ? 'mb-4' : undefined)}>
          {description}
        </p>
      )}
      {action}
    </motion.div>
  )
}
