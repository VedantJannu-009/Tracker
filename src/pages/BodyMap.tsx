import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Anatomy } from '@/components/anatomy/Anatomy'
import { MuscleRow } from '@/components/body-map/MuscleRow'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { db } from '@/db/schema'

export function BodyMapPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'front' | 'back'>('front')
  const muscles = useLiveQuery(() => db.muscleGroups.toArray())

  const handleSelect = (id: string) => {
    const muscle = muscles?.find(m => m.id === id)
    if (muscle) navigate(`/muscles/${muscle.id}`)
  }

  return (
    <PageContainer>
      <div className="flex items-start sm:items-center justify-between mb-4 gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Body Map</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Click a muscle to view analytics</p>
        </div>
        <div className="flex rounded-xl bg-muted p-0.5 shrink-0">
          <button
            onClick={() => setView('front')}
            className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px] ${
              view === 'front' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px] ${
              view === 'back' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-2 sm:p-4">
          <Anatomy view={view} onMuscleClick={handleSelect} />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 mt-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">All Muscles</h2>
        <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400/60" /> Frequent
          </span>
          <span className="flex items-center gap-1 text-[10px] text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-400/60" /> Recent
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-white/10" /> Untrained
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {muscles?.map(m => (
          <MuscleRow key={m.id} muscle={m} onClick={() => navigate(`/muscles/${m.id}`)} />
        ))}
      </div>
    </PageContainer>
  )
}
