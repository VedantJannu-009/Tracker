import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { TodaysFocusCard } from '@/components/dashboard/TodaysFocusCard'
import { InteractiveBodySection } from '@/components/dashboard/InteractiveBodySection'
import { WeeklyProgressSection } from '@/components/dashboard/WeeklyProgressSection'
import { HeatmapCalendar } from '@/components/dashboard/HeatmapCalendar'
import { PageContainer } from '@/components/layout/PageContainer'
import { LaunchSection } from '@/components/layout/LaunchSection'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'

export function Home() {
  const navigate = useNavigate()
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())

  return (
    <PageContainer>
      <LaunchSection index={0}>
        <DashboardGreeting />
      </LaunchSection>

      <LaunchSection index={1}>
        <TodaysFocusCard />
      </LaunchSection>

      <LaunchSection index={2}>
        <InteractiveBodySection />
      </LaunchSection>

      <LaunchSection index={3}>
        <WeeklyProgressSection />
      </LaunchSection>

      <LaunchSection index={4}>
        <HeatmapCalendar />
      </LaunchSection>

      {muscleGroups && muscleGroups.length === 0 && (
        <EmptyState
          icon={Dumbbell}
          tone="primary"
          title="Welcome to Gym Tracker"
          description="Start your first workout to track your progress"
          action={
            <Button onClick={() => navigate('/workout')}>Start Workout</Button>
          }
        />
      )}
    </PageContainer>
  )
}
