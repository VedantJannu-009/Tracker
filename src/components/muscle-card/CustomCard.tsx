import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { useCustomCardStats } from '@/hooks/useCustomCardStats'
import { Sparkline } from '@/components/charts/Sparkline'
import { formatRelative } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { CustomCard as CustomCardType } from '@/types'

interface CustomCardProps {
  card: CustomCardType
}

export function CustomCard({ card }: CustomCardProps) {
  const muscles = useLiveQuery(
    () => card.muscleGroupIds.length > 0
      ? db.muscleGroups.where('id').anyOf(card.muscleGroupIds).toArray()
      : [],
    [card.muscleGroupIds]
  )

  const { totalSets, totalReps, lastDate, sparkline } = useCustomCardStats(card.muscleGroupIds)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border/50 card-glow p-3 sm:p-4"
      style={{ borderLeftColor: card.accentColor, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg shrink-0">{card.icon}</span>
          <h3 className="font-semibold text-sm truncate">{card.title}</h3>
        </div>
        <div className="flex gap-1.5 sm:gap-2 text-xs text-muted-foreground shrink-0 items-center">
          <div className="whitespace-nowrap">{totalSets}s</div>
          <div>&middot;</div>
          <div className="whitespace-nowrap">{totalReps}r</div>
        </div>
      </div>
      {sparkline.length > 0 && (
        <Sparkline data={sparkline} color={card.accentColor} height={32} />
      )}
      <div className="text-[11px] text-muted-foreground mt-1">
        {lastDate ? `Last ${formatRelative(lastDate)}` : 'No data'}
      </div>
      {muscles && muscles.length > 0 && (
        <div className="flex gap-1 mt-2">
          {muscles.map(m => (
            <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {m.name}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
