import { Routes, Route } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Home } from '@/pages/Home'
import { MusclePage } from '@/pages/MusclePage'
import { ExercisePage } from '@/pages/ExercisePage'
import { WorkoutPage } from '@/pages/WorkoutPage'
import { BodyMapPage } from '@/pages/BodyMap'
import { BodyMeasurementsPage } from '@/pages/BodyMeasurements'
import { GoalsPage } from '@/pages/Goals'
import { PersonalRecordsPage } from '@/pages/PersonalRecords'
import { SearchPage } from '@/pages/Search'
import { SettingsPage } from '@/pages/Settings'
import { CustomCardsPage } from '@/pages/CustomCardsPage'
import { WeeklyGoalsPage } from '@/pages/WeeklyGoals'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
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
      <BottomNav />
    </div>
  )
}
