import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCounter } from './AnimatedCounter'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  format?: (n: number) => string
  suffix?: string
  index: number
}

export function StatCard({ icon: Icon, label, value, format, suffix, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 + index * 0.07, ease: 'easeOut' }}
    >
      <Card className="h-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={14} className="text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium truncate">{label}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold truncate leading-tight">
            <AnimatedCounter value={value} format={format} delay={0.15 + index * 0.07} />
          </div>
          {suffix && <div className="text-[10px] text-muted-foreground truncate">{suffix}</div>}
        </CardContent>
      </Card>
    </motion.div>
  )
}
