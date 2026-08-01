import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  icon?: ReactNode
  summary?: string
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}

export function CollapsibleSection({
  title,
  icon,
  summary,
  defaultOpen = false,
  className,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `${title.toLowerCase().replace(/\s+/g, '-')}-panel`

  return (
    <div className={cn('mb-6', className)}>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {title}
      </h2>
      <Card className="overflow-hidden">
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full text-left p-4 sm:p-5 flex items-center gap-3 hover:bg-muted/20 transition-colors"
        >
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm sm:text-base">{title}</p>
            {summary && <p className="text-xs text-muted-foreground truncate">{summary}</p>}
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
              key={panelId}
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-5 pt-0">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
