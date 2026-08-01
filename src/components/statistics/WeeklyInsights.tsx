import { motion } from 'framer-motion'
import { Sparkles, Scale, AlarmClock, CalendarCheck2, HeartPulse, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { InsightSentiment, InsightType, TrainingInsight } from '@/lib/weeklyInsights'
import { cn } from '@/lib/utils'

const TYPE_META: Record<InsightType, { label: string; icon: LucideIcon }> = {
  imbalance: { label: 'Balance', icon: Scale },
  neglect: { label: 'Neglect', icon: AlarmClock },
  consistency: { label: 'Consistency', icon: CalendarCheck2 },
  recovery: { label: 'Recovery', icon: HeartPulse },
}

const SENTIMENT_STYLES: Record<InsightSentiment, { text: string; chip: string; glow: string }> = {
  positive: { text: 'text-emerald-500', chip: 'bg-emerald-500/10', glow: 'from-emerald-500/10' },
  negative: { text: 'text-red-500', chip: 'bg-red-500/10', glow: 'from-red-500/10' },
  neutral: { text: 'text-primary', chip: 'bg-primary/10', glow: 'from-primary/10' },
}

export function WeeklyInsights({ insights }: { insights: TrainingInsight[] }) {
  if (insights.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-yellow-500" />
          Weekly Insights
        </h2>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        {insights.map(insight => {
          const meta = TYPE_META[insight.type]
          const Icon = meta.icon
          const style = SENTIMENT_STYLES[insight.sentiment]
          return (
            <motion.div
              key={insight.id}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
              className="h-full"
            >
              <Card className="relative overflow-hidden h-full">
                <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent', style.glow)} />
                <CardContent className="relative p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', style.chip)}>
                      <Icon size={16} className={style.text} />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground pt-1">{meta.label}</span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug">{insight.title}</h3>
                  {insight.detail && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{insight.detail}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
