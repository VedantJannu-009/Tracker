import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Trophy, Dumbbell, Activity, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function PersonalRecordsPage() {
  const navigate = useNavigate()
  const prs = useLiveQuery(() => db.personalRecords.orderBy('achievedAt').reverse().toArray())
  const exercises = useLiveQuery(() => db.exercises.toArray())

  const getExerciseName = (id: string) => exercises?.find(e => e.id === id)?.name ?? id

  const byType = {
    weight: prs?.filter(p => p.type === 'weight') ?? [],
    reps: prs?.filter(p => p.type === 'reps') ?? [],
    volume: prs?.filter(p => p.type === 'volume') ?? [],
  }

  const icons = {
    weight: <TrendingUp size={16} />,
    reps: <Activity size={16} />,
    volume: <Dumbbell size={16} />,
  }

  const labels = {
    weight: 'Best Weight',
    reps: 'Most Reps',
    volume: 'Highest Volume',
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <Trophy size={24} className="text-yellow-500 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Personal Records</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Your best performances</p>
        </div>
      </div>

      {(prs && prs.length === 0) ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-lg font-semibold mb-1">No records yet</h3>
          <p className="text-sm text-muted-foreground">Personal records appear automatically as you progress</p>
        </div>
      ) : (
        ['weight', 'reps', 'volume'].map(type => {
          const items = byType[type as keyof typeof byType]
          if (!items.length) return null
          return (
            <div key={type} className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                {icons[type as keyof typeof icons]}
                {labels[type as keyof typeof labels]}
              </h2>
              <div className="space-y-2">
                {items.map(pr => (
                  <Card key={pr.id} className="border-success/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{getExerciseName(pr.exerciseId)}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(pr.achievedAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-success">{pr.value}</div>
                          <div className="text-xs text-muted-foreground">{pr.type === 'reps' ? 'reps' : 'kg'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })
      )}
    </PageContainer>
  )
}
