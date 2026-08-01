import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { AreaChart } from '@/components/charts/AreaChart'

type TabKey = 'sets' | 'reps' | 'volume'

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'sets', label: 'Sets', color: '#3b82f6' },
  { key: 'reps', label: 'Reps', color: '#22c55e' },
  { key: 'volume', label: 'Volume', color: '#8b5cf6' },
]

export function MuscleChartsSection({
  chartData,
}: {
  chartData: {
    setsByDate: { label: string; value: number }[]
    repsByDate: { label: string; value: number }[]
    volumeByDate: { label: string; value: number }[]
  }
}) {
  const [active, setActive] = useState<TabKey>('sets')
  const dataMap: Record<TabKey, { label: string; value: number }[]> = {
    sets: chartData.setsByDate,
    reps: chartData.repsByDate,
    volume: chartData.volumeByDate,
  }
  const activeTab = TABS.find(t => t.key === active) ?? TABS[0]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-border/30" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1">
          <BarChart3 size={10} />
          Charts
        </span>
        <div className="h-px flex-1 bg-border/30" />
      </div>

      <div className="flex rounded-xl bg-muted p-0.5 mb-3 w-fit">
        {TABS.map(tab => (
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

      <AreaChart data={dataMap[active]} color={activeTab.color} height={200} />
    </div>
  )
}
