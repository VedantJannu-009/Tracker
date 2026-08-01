import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExerciseStats } from '@/hooks/useExerciseStats'
import { deleteExercise, renameExercise, duplicateExercise } from '@/services/exerciseUtils'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CollapsibleSection } from '@/components/exercise/CollapsibleSection'
import { ProgressChart } from '@/components/exercise/ProgressChart'
import { PerformanceComparison } from '@/components/exercise/PerformanceComparison'
import { MonthlyComparison } from '@/components/exercise/MonthlyComparison'
import { ExerciseSessionCard } from '@/components/exercise/ExerciseSessionCard'
import { WorkoutTimeline } from '@/components/workout/WorkoutTimeline'
import { ArrowLeft, Dumbbell, TrendingUp, Clock, MoreVertical, Pencil, Copy, Trash2, LineChart, CalendarRange, History } from 'lucide-react'
import { formatRelative } from '@/lib/utils'
import { useUnit } from '@/hooks/useUnit'
import { formatWeight } from '@/lib/units'
import { buildSessions, computeMonthlyComparison } from '@/lib/exerciseProgress'
import { buildWorkoutTimeline } from '@/lib/workoutTimeline'
import { EmptyState } from '@/components/ui/empty-state'
import { PageLoading } from '@/components/ui/page-loading'

export function ExercisePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const stats = useExerciseStats(id ?? '')
  const unit = useUnit()
  const { sets, workoutExercises, workouts } = stats
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())

  const sessions = useMemo(() => buildSessions(workouts, workoutExercises, sets), [workouts, workoutExercises, sets])
  const monthly = useMemo(() => computeMonthlyComparison(sessions), [sessions])

  const toggleExpanded = (id: string) => {
    setExpandedWorkouts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async () => {
    if (!id) return
    const backPath = stats.muscle ? `/muscles/${stats.muscle.id}` : '/'
    setDeleting(true)
    await deleteExercise(id)
    navigate(backPath, { replace: true })
  }

  const handleRenameOpen = () => {
    if (!stats.exercise) return
    setRenameValue(stats.exercise.name)
    setShowRename(true)
  }

  const handleRename = async () => {
    if (!id || !renameValue.trim()) return
    setRenaming(true)
    await renameExercise(id, renameValue.trim())
    setShowRename(false)
    setRenameValue('')
    setRenaming(false)
  }

  const handleDuplicate = async () => {
    if (!id) return
    await duplicateExercise(id)
  }

  const exerciseTimeline = useMemo(() => {
    if (!stats.exercise) return []
    return buildWorkoutTimeline({
      workouts: stats.workouts,
      workoutExercises: stats.workoutExercises,
      sets: stats.sets,
      exercises: [stats.exercise],
    })
  }, [stats.workouts, stats.workoutExercises, stats.sets, stats.exercise])

  if (stats.loading) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={20} />
          </Button>
        </div>
        <PageLoading />
      </PageContainer>
    )
  }

  if (!stats.exercise) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back to home">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Exercise not found</h1>
        </div>
      </PageContainer>
    )
  }

  const backPath = stats.muscle ? `/muscles/${stats.muscle.id}` : '/'

  return (
    <PageContainer>
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)} aria-label="Back">
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{stats.exercise.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {stats.muscle?.name} &middot; {stats.exercise.equipment}
          </p>
        </div>
        <Badge className="shrink-0">{stats.exercise.difficulty}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Actions for ${stats.exercise.name}`} className="ml-1">
            <MoreVertical size={16} className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleRenameOpen}>
              <Pencil size={14} /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy size={14} /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive">
              <Trash2 size={14} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Card className="p-3 sm:p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp size={14} />
            <span className="text-xs">Best Weight</span>
          </div>
          <div className="text-lg sm:text-xl font-bold">{formatWeight(stats.maxWeight, unit)}</div>
        </Card>
        <Card className="p-3 sm:p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock size={14} />
            <span className="text-xs">Last Workout</span>
          </div>
          <div className="text-sm font-medium">
            {stats.lastWorkoutDate ? formatRelative(stats.lastWorkoutDate) : 'Never'}
          </div>
        </Card>
        <Card className="p-3 sm:p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Dumbbell size={14} />
            <span className="text-xs">Total Sessions</span>
          </div>
          <div className="text-lg sm:text-xl font-bold">{stats.workouts.length}</div>
        </Card>
      </div>

      {sessions.length >= 2 && <PerformanceComparison sessions={sessions} unit={unit} />}

      {sessions.length >= 2 && (
        <CollapsibleSection
          title="Progress Chart"
          icon={<LineChart size={18} className="text-primary" />}
          summary={`${sessions.length} sessions`}
        >
          <ProgressChart sessions={sessions} />
        </CollapsibleSection>
      )}

      {monthly && (
        <CollapsibleSection
          title="Monthly Comparison"
          icon={<CalendarRange size={18} className="text-primary" />}
          summary={`${monthly.current.workoutCount} workouts in ${monthly.current.label}`}
        >
          <MonthlyComparison sessions={sessions} />
        </CollapsibleSection>
      )}

      {exerciseTimeline.length > 0 && (
        <CollapsibleSection
          title="Workout History"
          icon={<History size={18} className="text-primary" />}
          summary={`${exerciseTimeline.reduce((n, d) => n + d.sessions.length, 0)} workouts`}
          defaultOpen
        >
          <WorkoutTimeline
            days={exerciseTimeline}
            renderSession={session => (
              <ExerciseSessionCard
                session={session}
                unit={unit}
                expanded={expandedWorkouts.has(session.id)}
                onToggle={() => toggleExpanded(session.id)}
              />
            )}
          />
        </CollapsibleSection>
      )}

      {exerciseTimeline.length === 0 && stats.exercise && (
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          description={`Start logging ${stats.exercise.name} to see your progress`}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Exercise?"
        description={
          <>
            <p>
              This will permanently delete <strong>{stats.exercise.name}</strong>.
            </p>
            {stats.totalSets > 0 ? (
              <p className="text-destructive mt-1">
                All associated sets, reps, history, personal records, and analytics will also be deleted.
              </p>
            ) : (
              <p className="mt-1">This exercise has no workout history.</p>
            )}
          </>
        }
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="rename-exercise-title" className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl">
            <h3 id="rename-exercise-title" className="text-lg font-semibold mb-2">Rename Exercise</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Enter a new name for <strong>{stats.exercise?.name}</strong>.
            </p>
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && renameValue.trim()) handleRename() }}
              placeholder="Exercise name"
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowRename(false); setRenameValue('') }} disabled={renaming}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleRename} disabled={renaming || !renameValue.trim()}>
                {renaming ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
