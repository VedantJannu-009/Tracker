import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { useWeeklyStats } from '@/hooks/useWeeklyStats'

const GROUP_COLORS: Record<string, string> = {
  chest: '#3b82f6',
  back: '#22c55e',
  shoulders: '#f59e0b',
  legs: '#ef4444',
  abs: '#8b5cf6',
  biceps: '#ec4899',
  triceps: '#14b8a6',
  forearms: '#f97316',
  neck: '#6366f1',
}

export function WeeklyMuscleProgress() {
  const navigate = useNavigate()
  const stats = useWeeklyStats()

  const data = useMemo(() => {
    if (!stats.loaded || stats.weekWorkouts.length === 0) return null
    return stats.muscleStats
      .map(mg => ({
        ...mg,
        pct: mg.target > 0 ? Math.min(100, Math.round((mg.sets / mg.target) * 100)) : 0,
      }))
      .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name))
  }, [stats])

  if (!data) return null

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Weekly Muscle Completion</h2>
      <Card>
        <CardContent className="p-4 space-y-3">
          {data.map(mg => {
            const color = GROUP_COLORS[mg.name.toLowerCase()] || '#3b82f6'
            return (
              <div
                key={mg.id}
                onClick={() => navigate(`/muscles/${mg.id}`)}
                className="cursor-pointer hover:bg-muted/20 rounded-lg -mx-1 px-1 py-1 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{mg.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {mg.sets} / {mg.target} Sets
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${mg.pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[11px] font-medium w-9 text-right" style={{ color }}>{mg.pct}%</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
