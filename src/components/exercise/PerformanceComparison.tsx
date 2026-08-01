import { useMemo } from 'react'
import { format } from 'date-fns'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { computeProgress, type SessionStat } from '@/lib/exerciseProgress'
import { formatWeight, type Unit } from '@/lib/units'
import { cn } from '@/lib/utils'

function Delta({ label, value }: { label: string; value: number }) {
  const positive = value > 0
  const negative = value < 0
  const text = `${positive ? '+' : ''}${value.toLocaleString()}`
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        positive && 'bg-emerald-500/10 text-emerald-500',
        negative && 'bg-red-500/10 text-red-500',
        !positive && !negative && 'bg-muted text-muted-foreground',
      )}
    >
      {label} {text}
    </span>
  )
}

export function PerformanceComparison({
  sessions,
  unit,
}: {
  sessions: SessionStat[]
  unit: Unit
}) {
  const comparison = useMemo(() => {
    if (sessions.length < 2) return null
    const current = sessions[sessions.length - 1]
    const previous = sessions[sessions.length - 2]
    return { current, previous, ...computeProgress(current, previous) }
  }, [sessions])

  if (!comparison) return null

  const { current, previous, progressPct, weightImprovement, repImprovement } = comparison
  const hasWeightData = current.hasWeightData || previous.hasWeightData
  const primary = (s: SessionStat) =>
    hasWeightData ? formatWeight(s.bestWeight, unit) : `${Math.round(s.totalVolume).toLocaleString()} kg volume`

  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} /> Performance
          </h3>
          {progressPct !== null && (
            <Badge variant={progressPct >= 0 ? 'success' : 'destructive'}>
              {progressPct >= 0 ? '+' : ''}
              {progressPct}%
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Previous</p>
            <p className="text-sm font-medium">{format(new Date(previous.date), 'MMM d')}</p>
            <p className="text-lg font-bold mt-1">{primary(previous)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {previous.totalReps} reps &middot; {previous.totalSets} sets
            </p>
          </div>
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-primary mb-1">Current</p>
            <p className="text-sm font-medium">{format(new Date(current.date), 'MMM d')}</p>
            <p className="text-lg font-bold mt-1">{primary(current)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {current.totalReps} reps &middot; {current.totalSets} sets
            </p>
          </div>
        </div>

        {(weightImprovement !== null || repImprovement !== null) && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {weightImprovement !== null && (
              <Delta label="Weight" value={Math.round(weightImprovement)} />
            )}
            {repImprovement !== null && <Delta label="Reps" value={repImprovement} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
