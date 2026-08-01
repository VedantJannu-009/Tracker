import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence } from 'framer-motion'
import { db } from '@/db/schema'
import { useWorkoutStore } from '@/stores/workoutStore'
import { toast } from '@/stores/toastStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import { WorkoutModeBar } from '@/components/workout/WorkoutModeBar'
import { WorkoutCompleteModal, type WorkoutSummary } from '@/components/workout/WorkoutCompleteModal'
import { useExerciseMeta } from '@/hooks/useExerciseMeta'
import { ArrowLeft, Plus, Trash2, Play, X, Dumbbell } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useUnit } from '@/hooks/useUnit'
import { unitToKg } from '@/lib/units'
import { EmptyState } from '@/components/ui/empty-state'

export function WorkoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const unit = useUnit()
  const {
    currentWorkout,
    currentExercises,
    startWorkout,
    addExercise,
    addSet,
    removeSet,
    removeExercise,
    saveWorkout,
    deleteWorkout,
    loadWorkout,
  } = useWorkoutStore()

  const [weight, setWeight] = useState<Record<string, string>>({})
  const [reps, setReps] = useState<Record<string, string>>({})
  const [workoutName, setWorkoutName] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string>('')
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [complete, setComplete] = useState<WorkoutSummary | null>(null)
  const [confirmDeleteWorkout, setConfirmDeleteWorkout] = useState(false)

  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const exercises = useLiveQuery(
    () => selectedMuscle ? db.exercises.where('muscleGroupId').equals(selectedMuscle).toArray() : [],
    [selectedMuscle]
  )
  const allExercises = useLiveQuery(() => db.exercises.toArray())
  const meta = useExerciseMeta(currentExercises.map(e => e.exerciseId))

  const totalSets = currentExercises.reduce((n, e) => n + e.sets.length, 0)
  const activeExerciseName = (() => {
    const entry = currentExercises.find(e => e.id === activeExerciseId) ?? currentExercises[0]
    if (!entry) return null
    return allExercises?.find(x => x.id === entry.exerciseId)?.name ?? entry.exerciseId
  })()

  const deleteTargetExercise = currentExercises.find(e => e.id === deleteTarget)
  const deleteTargetName = (() => {
    if (!deleteTargetExercise) return ''
    const ex = allExercises?.find(e => e.id === deleteTargetExercise.exerciseId)
    return ex?.name ?? deleteTargetExercise.exerciseId
  })()

  useEffect(() => {
    if (id) {
      loadWorkout(id).then(() => {
        const first = useWorkoutStore.getState().currentExercises[0]
        setActiveExerciseId(first?.id ?? null)
      })
    }
  }, [id, loadWorkout])

  const handleStartWorkout = async () => {
    const wid = await startWorkout(workoutName || undefined)
    if (!id) navigate(`/workout/${wid}`, { replace: true })
  }

  const handleAddExercise = async () => {
    if (!selectedExercise) return
    const before = useWorkoutStore.getState().currentExercises.length
    await addExercise(selectedExercise)
    const next = useWorkoutStore.getState().currentExercises
    const entry = next.find(e => e.exerciseId === selectedExercise)
    if (entry) setActiveExerciseId(entry.id)
    if (next.length > before) toast('Exercise added')
    setSelectedExercise('')
    setSelectedMuscle('')
    setShowAddExercise(false)
  }

  const handleAddSet = async (exerciseId: string) => {
    const w = parseFloat(weight[exerciseId] || '0')
    const r = parseInt(reps[exerciseId] || '0')
    if (w <= 0 || r <= 0) return
    const entry = currentExercises.find(e => e.id === exerciseId)
    const weightKg = unitToKg(w, unit)
    await addSet(exerciseId, weightKg, r)
    setActiveExerciseId(exerciseId)
    setWeight(prev => ({ ...prev, [exerciseId]: '' }))
    setReps(prev => ({ ...prev, [exerciseId]: '' }))
    if (entry) {
      const pr = await db.personalRecords
        .where('exerciseId')
        .equals(entry.exerciseId)
        .and(p => p.type === 'weight')
        .first()
      if (!pr || weightKg > pr.value) toast('Personal Record!')
    }
  }

  const handleFinish = () => {
    if (!currentWorkout) return
    const allSets = currentExercises.flatMap(e => e.sets)
    let best: WorkoutSummary['best'] = null
    for (const e of currentExercises) {
      for (const s of e.sets) {
        if (!best || s.weight > best.weight) {
          best = {
            weight: s.weight,
            exerciseName: allExercises?.find(x => x.id === e.exerciseId)?.name ?? e.exerciseId,
          }
        }
      }
    }
    setComplete({
      workoutName: currentWorkout.name,
      durationSec: Math.max(1, Math.round((Date.now() - currentWorkout.createdAt) / 1000)),
      exerciseCount: currentExercises.length,
      setCount: allSets.length,
      volume: allSets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      best,
    })
    setShowComplete(true)
  }

  const handleDone = () => {
    void saveWorkout()
    navigate('/')
  }

  const handleDeleteWorkout = async () => {
    if (!currentWorkout) return
    setConfirmDeleteWorkout(false)
    await deleteWorkout(currentWorkout.id)
    navigate('/')
  }

  const handleDeleteExercise = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await removeExercise(deleteTarget)
    if (activeExerciseId === deleteTarget) {
      setActiveExerciseId(useWorkoutStore.getState().currentExercises[0]?.id ?? null)
    }
    setDeleteTarget(null)
    setDeleting(false)
    toast('Exercise deleted')
  }

  if (!currentWorkout && !showComplete) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">New Workout</h1>
        </div>

        <EmptyState
          icon={Dumbbell}
          title="Ready to train?"
          description="Start a new workout session"
          action={
            <div className="max-w-xs mx-auto space-y-3">
              <Input
                placeholder="Workout name (optional)"
                value={workoutName}
                onChange={e => setWorkoutName(e.target.value)}
              />
              <Button className="w-full" size="lg" onClick={handleStartWorkout}>
                <Play size={18} className="mr-2" /> Start Workout
              </Button>
            </div>
          }
        />

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Workouts</h2>
          <RecentWorkoutList onSelect={(wid) => navigate(`/workout/${wid}`)} />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0" aria-label="Back">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold truncate">{currentWorkout?.name ?? complete?.workoutName ?? 'Workout'}</h1>
            <p className="text-xs text-muted-foreground">{currentWorkout ? formatDate(currentWorkout.date) : ''}</p>
          </div>
        </div>
        <div className="shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteWorkout(true)} className="shrink-0" aria-label="Delete workout">
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {currentExercises.map(exercise => {
          const ex = allExercises?.find(e => e.id === exercise.exerciseId)
          const info = meta?.[exercise.exerciseId]
          return (
            <ExerciseCard
              key={exercise.id}
              name={ex?.name ?? exercise.exerciseId}
              sets={exercise.sets}
              unit={unit}
              weight={weight[exercise.id] ?? ''}
              reps={reps[exercise.id] ?? ''}
              equipment={ex?.equipment}
              difficulty={ex?.difficulty}
              lastWorkout={info?.lastDate ?? null}
              pr={info && (info.weight || info.reps || info.volume)
                ? { weight: info.weight ?? 0, reps: info.reps ?? 0, volume: info.volume ?? 0 }
                : null}
              active={exercise.id === activeExerciseId}
              onWeightChange={v => setWeight(prev => ({ ...prev, [exercise.id]: v }))}
              onRepsChange={v => setReps(prev => ({ ...prev, [exercise.id]: v }))}
              onAddSet={() => handleAddSet(exercise.id)}
              onRemoveSet={setId => removeSet(setId)}
              onDelete={() => setDeleteTarget(exercise.id)}
              onEdit={() => navigate(`/exercise/${exercise.exerciseId}`)}
            />
          )
        })}
      </div>

      {showAddExercise ? (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add Exercise</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddExercise(false)} aria-label="Close add exercise">
                <X size={14} />
              </Button>
            </div>
            <select
              value={selectedMuscle}
              onChange={e => setSelectedMuscle(e.target.value)}
              className="w-full h-10 rounded-xl bg-muted/50 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Select muscle group</option>
              {muscleGroups?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {selectedMuscle && (
              <select
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                className="w-full h-10 rounded-xl bg-muted/50 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="">Select exercise</option>
                {exercises?.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            )}
            <Button className="w-full" disabled={!selectedExercise} onClick={handleAddExercise}>
              <Plus size={16} className="mr-1" /> Add Exercise
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAddExercise(true)}
        >
          <Plus size={16} className="mr-1" /> Add Exercise
        </Button>
      )}

      {totalSets > 0 && <div aria-hidden="true" className="h-48" />}

      <AnimatePresence>
        {totalSets > 0 && (
          <WorkoutModeBar unit={unit} currentExerciseName={activeExerciseName} onFinish={handleFinish} />
        )}
      </AnimatePresence>

      {complete && (
        <WorkoutCompleteModal open={showComplete} summary={complete} unit={unit} onDone={handleDone} />
      )}

      {deleteTarget && deleteTargetExercise && (
        <ConfirmDialog
          open
          title="Delete Exercise?"
          description={
            <>
              This will permanently remove <strong>{deleteTargetName}</strong> and all
              of its logged sets from this workout.
            </>
          }
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={handleDeleteExercise}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {confirmDeleteWorkout && currentWorkout && (
        <ConfirmDialog
          open
          title="Delete Workout?"
          description={
            <>
              This will permanently delete <strong>{currentWorkout.name}</strong> and all
              of its exercises and sets. This cannot be undone.
            </>
          }
          confirmLabel="Delete"
          onConfirm={handleDeleteWorkout}
          onCancel={() => setConfirmDeleteWorkout(false)}
        />
      )}
    </PageContainer>
  )
}

function RecentWorkoutList({ onSelect }: { onSelect: (id: string) => void }) {
  const recent = useLiveQuery(
    () => db.workouts.orderBy('createdAt').reverse().limit(10).toArray()
  )
  if (!recent?.length) return <p className="text-sm text-muted-foreground text-center py-4">No workouts yet</p>
  return (
    <div className="space-y-2">
      {recent.map(w => (
        <button
          key={w.id}
          onClick={() => onSelect(w.id)}
          className="flex items-center justify-between w-full text-left p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div>
            <div className="text-sm font-medium">{w.name}</div>
            <div className="text-xs text-muted-foreground">{formatDate(w.date)}</div>
          </div>
          <Play size={16} className="text-muted-foreground shrink-0 ml-2" />
        </button>
      ))}
    </div>
  )
}
