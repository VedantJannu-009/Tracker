import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AreaChart } from '@/components/charts/AreaChart'
import type { SessionStat } from '@/lib/exerciseProgress'

type TabKey = 'weight' | 'volume' | 'reps' | 'sets'

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'weight', label: 'Weight', color: '#3b82f6' },
  { key: 'volume', label: 'Volume', color: '#8b5cf6' },
  { key: 'reps', label: 'Reps', color: '#22c55e' },
  { key: 'sets', label: 'Sets', color: '#f59e0b' },
]

export function ProgressChart({ sessions }: { sessions: SessionStat[] }) {
  const hasWeightData = sessions.some(s => s.hasWeightData)
  const [active, setActive] = useState<TabKey>(hasWeightData ? 'weight' : 'reps')

  const tabs = hasWeightData ? TABS : TABS.filter(t => t.key !== 'weight')

  const dataMap = useMemo(() => {
    const toChart = (value: (s: SessionStat) => number) =>
      sessions.map(s => ({ label: format(new Date(s.date), 'MMM d'), value: value(s) }))
    return {
      weight: toChart(s => s.bestWeight),
      volume: toChart(s => Math.round(s.totalVolume)),
      reps: toChart(s => s.totalReps),
      sets: toChart(s => s.totalSets),
    }
  }, [sessions])

  const activeTab = tabs.find(t => t.key === active) ?? tabs[0]

  return (
    <div>
      <div className="flex rounded-xl bg-muted p-0.5 mb-3 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            aria-pressed={active === tab.key}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px] ${
              active === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <AreaChart data={dataMap[activeTab.key]} color={activeTab.color} height={200} />
    </div>
  )
}
