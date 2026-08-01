import { useRecovery } from '@/hooks/useRecovery'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, Timer } from 'lucide-react'
import { formatRelative } from '@/lib/utils'

const STATUS_META: Record<string, { label: string; variant: 'default' | 'success' | 'warning'; bar: string; text: string }> = {
  ready: { label: 'Ready', variant: 'success', bar: 'bg-green-500', text: 'text-green-500' },
  recovering: { label: 'Recovering', variant: 'warning', bar: 'bg-amber-500', text: 'text-amber-500' },
  inactive: { label: 'Inactive', variant: 'default', bar: 'bg-muted-foreground', text: 'text-muted-foreground' },
}

export function RecoveryCard({ muscleId, muscleName }: { muscleId: string; muscleName: string }) {
  const recovery = useRecovery(muscleId)
  const meta = STATUS_META[recovery?.status ?? 'inactive']

  const headline = !recovery
    ? 'Loading…'
    : recovery.status === 'ready'
      ? `${muscleName} is ready to train`
      : recovery.status === 'recovering'
        ? `${muscleName} is still recovering`
        : `No training data for ${muscleName} yet`

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Activity size={14} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">Recovery</div>
              <div className="text-[10px] text-muted-foreground truncate">{headline}</div>
            </div>
          </div>
          <Badge variant={meta.variant} className="shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${recovery?.status === 'recovering' ? 'bg-current animate-pulse' : 'bg-current'} mr-1.5`} />
            {meta.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className={`text-3xl font-bold ${meta.text}`}>{recovery?.pct ?? 0}%</div>
          <div className="flex-1 min-w-0">
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
                style={{ width: `${recovery?.pct ?? 0}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Timer size={11} className="shrink-0" />
              {recovery?.status === 'inactive' ? 'Train to start tracking' : `Est. recovery time: ${recovery?.remainingLabel ?? '—'}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/20 p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              <Clock size={10} />
              Last trained
            </div>
            <div className="text-sm font-medium truncate">{recovery?.lastWorkoutAt ? formatRelative(recovery.lastWorkoutAt) : '—'}</div>
          </div>
          <div className="rounded-lg bg-muted/20 p-2.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              <Timer size={10} />
              Estimated total
            </div>
            <div className="text-sm font-medium truncate">{recovery ? `${recovery.estimatedHours}h` : '—'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
