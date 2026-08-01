import { useMemo } from 'react'
import { CalendarRange, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { computeMonthlyComparison, type SessionStat } from '@/lib/exerciseProgress'
import { cn } from '@/lib/utils'

interface Row {
  label: string
  current: number
  previous: number
  suffix?: string
}

function DeltaValue({ value }: { value: number }) {
  if (value === 0) {
    return <Minus size={12} className="text-muted-foreground" />
  }
  const positive = value > 0
  return (
    <span className={cn('flex items-center gap-0.5 font-medium', positive ? 'text-emerald-500' : 'text-red-500')}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positive ? '+' : ''}
      {value.toLocaleString()}
    </span>
  )
}

export function MonthlyComparison({ sessions }: { sessions: SessionStat[] }) {
  const comparison = useMemo(() => computeMonthlyComparison(sessions), [sessions])
  if (!comparison) return null

  const { current, previous } = comparison
  const rows: Row[] = [
    { label: 'Workouts', current: current.workoutCount, previous: previous.workoutCount },
    { label: 'Sets', current: current.totalSets, previous: previous.totalSets },
    { label: 'Reps', current: current.totalReps, previous: previous.totalReps },
  ]
  if (current.hasWeightData || previous.hasWeightData) {
    rows.push({
      label: 'Volume',
      current: Math.round(current.totalVolume),
      previous: Math.round(previous.totalVolume),
      suffix: 'kg',
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <CalendarRange size={13} />
        <span>
          This month <span className="font-semibold text-foreground">{current.label}</span>
        </span>
        <span className="mx-1">&middot;</span>
        <span>
          Last month <span className="font-semibold text-foreground">{previous.label}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground px-2 pb-1">
        <span className="flex-1">Metric</span>
        <span className="w-14 text-right">This</span>
        <span className="w-14 text-right">Last</span>
        <span className="w-14 text-right">Change</span>
      </div>

      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-2 py-2 px-2 border-t border-border/30 text-sm">
          <span className="flex-1 text-muted-foreground">{row.label}</span>
          <span className="w-14 text-right font-semibold">{row.current.toLocaleString()}{row.suffix}</span>
          <span className="w-14 text-right text-muted-foreground">{row.previous.toLocaleString()}{row.suffix}</span>
          <span className="w-14 flex justify-end">
            <DeltaValue value={row.current - row.previous} />
          </span>
        </div>
      ))}
    </div>
  )
}
