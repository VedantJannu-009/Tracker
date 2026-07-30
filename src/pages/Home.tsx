import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { MuscleCard } from '@/components/muscle-card/MuscleCard'
import { CustomCard as CustomCardComponent } from '@/components/muscle-card/CustomCard'
import { WorkoutCalendar } from '@/components/dashboard/WorkoutCalendar'
import { WeeklyMuscleProgress } from '@/components/dashboard/WeeklyMuscleProgress'
import { WeeklyMuscleDistributionChart } from '@/components/dashboard/WeeklyMuscleDistributionChart'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Plus, Target, Trophy, Ruler, LayoutGrid, Settings2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const customCards = useLiveQuery(async () => {
    const all = await db.customCards.toArray()
    return all.filter(c => c.pinned === 1)
  })

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Track your progress</p>
        </div>
        <Button size="icon" onClick={() => navigate('/workout')} className="shrink-0">
          <Plus size={20} />
        </Button>
      </div>

      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {[
          { to: '/goals', icon: Target, label: 'Goals' },
          { to: '/weekly-goals', icon: Settings2, label: 'Weekly Goals' },
          { to: '/records', icon: Trophy, label: 'Records' },
          { to: '/measurements', icon: Ruler, label: 'Measurements' },
          { to: '/custom-cards', icon: LayoutGrid, label: 'Custom' },
        ].map(({ to, icon: Icon, label }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all text-xs font-medium whitespace-nowrap"
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <WorkoutCalendar />
      <WeeklyMuscleProgress />
      <WeeklyMuscleDistributionChart />

      {customCards && customCards.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Custom Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customCards.map(cc => (
              <CustomCardComponent key={cc.id} card={cc} />
            ))}
          </div>
        </div>
      )}

      {muscleGroups && muscleGroups.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Muscles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {muscleGroups.map(m => (
              <MuscleCard key={m.id} muscle={m} />
            ))}
          </div>
        </>
      )}

      {muscleGroups && muscleGroups.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">💪</div>
          <h3 className="text-lg font-semibold mb-1">Welcome to Gym Tracker</h3>
          <p className="text-sm text-muted-foreground mb-4">Start your first workout to track your progress</p>
          <Button onClick={() => navigate('/workout')}>Start Workout</Button>
        </div>
      )}
    </PageContainer>
  )
}
