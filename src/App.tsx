import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { SplashScreen } from '@/components/launch/SplashScreen'
import { WelcomeOverlay } from '@/components/launch/WelcomeOverlay'
import { Toaster } from '@/components/ui/toast'
import { useLaunchStore } from '@/stores/launchStore'

const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })))
const MusclePage = lazy(() => import('@/pages/MusclePage').then(m => ({ default: m.MusclePage })))
const ExercisePage = lazy(() => import('@/pages/ExercisePage').then(m => ({ default: m.ExercisePage })))
const WorkoutPage = lazy(() => import('@/pages/WorkoutPage').then(m => ({ default: m.WorkoutPage })))
const BodyMapPage = lazy(() => import('@/pages/BodyMap').then(m => ({ default: m.BodyMapPage })))
const BodyMeasurementsPage = lazy(() => import('@/pages/BodyMeasurements').then(m => ({ default: m.BodyMeasurementsPage })))
const GoalsPage = lazy(() => import('@/pages/Goals').then(m => ({ default: m.GoalsPage })))
const PersonalRecordsPage = lazy(() => import('@/pages/PersonalRecords').then(m => ({ default: m.PersonalRecordsPage })))
const SearchPage = lazy(() => import('@/pages/Search').then(m => ({ default: m.SearchPage })))
const SettingsPage = lazy(() => import('@/pages/Settings').then(m => ({ default: m.SettingsPage })))
const CustomCardsPage = lazy(() => import('@/pages/CustomCardsPage').then(m => ({ default: m.CustomCardsPage })))
const WeeklyGoalsPage = lazy(() => import('@/pages/WeeklyGoals').then(m => ({ default: m.WeeklyGoalsPage })))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading…
    </div>
  )
}

export default function App() {
  const phase = useLaunchStore(s => s.phase)
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/muscles/:id/*" element={<MusclePage />} />
          <Route path="/exercise/:id/*" element={<ExercisePage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/workout/:id" element={<WorkoutPage />} />
          <Route path="/body" element={<BodyMapPage />} />
          <Route path="/measurements" element={<BodyMeasurementsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/weekly-goals" element={<WeeklyGoalsPage />} />
          <Route path="/records" element={<PersonalRecordsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/custom-cards" element={<CustomCardsPage />} />
        </Routes>
      </Suspense>
      <BottomNav />
      <Toaster />
      {phase !== 'done' && <SplashScreen />}
      <WelcomeOverlay />
    </div>
  )
}
