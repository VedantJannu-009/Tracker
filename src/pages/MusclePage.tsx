import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '@/db/schema'
import { useMuscleStats } from '@/hooks/useMuscleStats'
import { useIsMobile } from '@/hooks/useIsMobile'
import { deleteExercise, renameExercise } from '@/services/exerciseUtils'
import { sortExercisesByRecency } from '@/lib/exerciseOrdering'
import { detectPersonalRecords } from '@/services/prDetection'
import { refreshRecovery } from '@/services/recoveryEngine'
import { RecoveryCard } from '@/components/muscle/RecoveryCard'
import { WorkoutHistorySection } from '@/components/muscle/WorkoutHistorySection'
import { MuscleChartsSection } from '@/components/muscle/MuscleChartsSection'
import { ExerciseIcon } from '@/components/exercise/ExerciseIcon'
import { MuscleIcon } from '@/components/muscle/MuscleIcon'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/page-loading'
import { ArrowLeft, Dumbbell, Activity, Trophy, Clock, Plus, Trash2, Check, X, Save, Loader2, MoreVertical, Pencil, ChevronRight } from 'lucide-react'
import { formatRelative, generateId } from '@/lib/utils'
import type { Exercise, WorkoutSet } from '@/types'
import { useUnit } from '@/hooks/useUnit'
import { unitToKg, formatWeight, formatWeightValue, type Unit } from '@/lib/units'

interface SessionExercise {
  workoutExerciseId: string
  exercise: Exercise
  sets: WorkoutSet[]
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const variant = difficulty === 'beginner' ? 'default' : difficulty === 'intermediate' ? 'warning' : 'destructive'
  return <Badge variant={variant} className="text-[10px] capitalize">{difficulty}</Badge>
}

function SetRow({
  set,
  unit,
  onUpdate,
  onDelete,
}: {
  set: WorkoutSet
  unit: Unit
  onUpdate: (id: string, weight: number, reps: number) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 py-1.5 group">
      <span className="text-xs text-muted-foreground w-6 sm:w-8 shrink-0 text-right">{set.order + 1}</span>
      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
        <Input
          type="number"
          min={0}
          step={0.5}
          value={set.weight ? formatWeightValue(set.weight, unit) : ''}
          onChange={e => onUpdate(set.id, unitToKg(parseFloat(e.target.value) || 0, unit), set.reps)}
          className="h-8 w-14 sm:w-20 text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />
        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{unit}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground mx-0.5 shrink-0">x</span>
        <Input
          type="number"
          min={0}
          step={1}
          value={set.reps || ''}
          onChange={e => onUpdate(set.id, set.weight, parseInt(e.target.value) || 0)}
          className="h-8 w-12 sm:w-16 text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />
        <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">reps</span>
      </div>
      <button
        onClick={() => onDelete(set.id)}
        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive min-w-[28px] min-h-[28px] flex items-center justify-center"
        aria-label="Delete set"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function ExerciseWorkoutCard({
  sessionExercise,
  unit,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onRemoveFromWorkout,
}: {
  sessionExercise: SessionExercise
  unit: Unit
  onAddSet: (workoutExerciseId: string) => void
  onUpdateSet: (setId: string, weight: number, reps: number) => void
  onDeleteSet: (setId: string) => void
  onRemoveFromWorkout: (workoutExerciseId: string) => void
}) {
  const { exercise, sets } = sessionExercise

  return (
    <Card className="border-primary/20">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Dumbbell size={14} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{exercise.name}</div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                <span>{exercise.equipment}</span>
                <DifficultyBadge difficulty={exercise.difficulty} />
              </div>
            </div>
          </div>
          <button
            onClick={() => onRemoveFromWorkout(sessionExercise.workoutExerciseId)}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="space-y-0.5">
          {sets.map(set => (
            <SetRow
              key={set.id}
              set={set}
              unit={unit}
              onUpdate={onUpdateSet}
              onDelete={onDeleteSet}
            />
          ))}
        </div>

        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSet(sessionExercise.workoutExerciseId)}
            className="text-xs h-8 px-2"
          >
            <Plus size={12} className="mr-1" /> Add Set
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AvailableExerciseCard({
  exercise,
  lastDate,
  bestWeight,
  totalSets,
  unit,
  isMobile,
  onAddToWorkout,
  onDelete,
  onRename,
}: {
  exercise: Exercise
  lastDate: string | null
  bestWeight: number
  totalSets: number
  unit: Unit
  isMobile: boolean
  onAddToWorkout: (exerciseId: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}) {
  const navigate = useNavigate()
  return (
    <div
      data-testid="available-exercise"
      className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/30 group"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/exercise/${exercise.id}`)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/exercise/${exercise.id}`) } }}
        aria-label={`Open ${exercise.name}`}
        className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
          <ExerciseIcon name={exercise.name} equipment={exercise.equipment} size={14} className="text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{exercise.name}</div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
            <span>{exercise.equipment}</span>
            <DifficultyBadge difficulty={exercise.difficulty} />
            {totalSets > 0 && (
              <span className="text-primary/80">{bestWeight > 0 ? formatWeight(bestWeight, unit) : `${totalSets} sets`}</span>
            )}
            {lastDate && (
              <span className="hidden sm:inline">{formatRelative(lastDate)}</span>
            )}
          </div>
        </div>
        <ChevronRight size={14} className="text-muted-foreground shrink-0 ml-1" />
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-1 sm:ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${exercise.name}`}
            className={isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          >
            <MoreVertical size={14} className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onRename(exercise.id, exercise.name)}>
              <Pencil size={14} /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(exercise.id)} className="text-destructive">
              <Trash2 size={14} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAddToWorkout(exercise.id)}
          className="text-xs h-8"
        >
          <Plus size={12} className="mr-1" /> Add
        </Button>
      </div>
    </div>
  )
}

function AddExerciseForm({ muscleId, onCreated }: { muscleId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('Bodyweight')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    const exercise: Exercise = {
      id: generateId(),
      name: name.trim(),
      muscleGroupId: muscleId,
      equipment,
      difficulty,
      createdAt: Date.now(),
    }
    await db.exercises.add(exercise)
    setName('')
    setEquipment('Bodyweight')
    setDifficulty('beginner')
    setOpen(false)
    setSaving(false)
    onCreated()
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-2" /> Add Exercise
      </Button>
    )
  }

  return (
    <Card className="border-dashed border-primary/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">New Exercise</span>
          <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted/50" aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Exercise name"
          className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
          autoFocus
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={equipment}
            onChange={e => setEquipment(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs"
          >
            {['Bodyweight', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Plate', 'Band', 'Kettlebell'].map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value as typeof difficulty)}
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-xs"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit} disabled={!name.trim() || saving}>
          {saving ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Check size={12} className="mr-1" />}
          Create Exercise
        </Button>
      </CardContent>
    </Card>
  )
}

export function MusclePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const stats = useMuscleStats(id ?? '')
  const muscle = stats.muscle
  const allExercises = stats.exercises
  const unit = useUnit()
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([])
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const isMobile = useIsMobile()

  const savingRef = useRef(false)
  const workoutIdRef = useRef<string | null>(null)
  const sessionExercisesRef = useRef<SessionExercise[]>(sessionExercises)
  useEffect(() => {
    sessionExercisesRef.current = sessionExercises
  }, [sessionExercises])

  const deleteTargetExercise = useMemo(() => {
    if (!deleteTarget || !allExercises) return null
    return allExercises.find(e => e.id === deleteTarget) ?? null
  }, [deleteTarget, allExercises])

  const renameTargetExercise = useMemo(() => {
    if (!renameTarget || !allExercises) return null
    return allExercises.find(e => e.id === renameTarget) ?? null
  }, [renameTarget, allExercises])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteExercise(deleteTarget)
    setDeleteTarget(null)
    setDeleting(false)
  }

  const handleRenameOpen = (id: string, name: string) => {
    setRenameTarget(id)
    setRenameValue(name)
  }

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return
    setRenaming(true)
    await renameExercise(renameTarget, renameValue.trim())
    setRenameTarget(null)
    setRenameValue('')
    setRenaming(false)
  }

  useEffect(() => {
    workoutIdRef.current = workoutId
  }, [workoutId])

  const cleanupEmptyWorkout = useCallback(async () => {
    const wid = workoutIdRef.current
    if (!wid) return
    const remaining = await db.workoutExercises.where('workoutId').equals(wid).count()
    if (remaining === 0) {
      await db.workouts.delete(wid)
      workoutIdRef.current = null
      setWorkoutId(null)
    }
  }, [])

  const inWorkoutIds = new Set(sessionExercises.map(se => se.exercise.id))
  const lastLoggedByExercise = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of stats.exerciseStatsList) {
      if (s.lastDate) map.set(s.exercise.id, s.lastDate)
    }
    return map
  }, [stats.exerciseStatsList])
  const exerciseStatMap = useMemo(() => {
    const map = new Map<string, { lastDate: string | null; bestWeight: number; totalSets: number }>()
    for (const s of stats.exerciseStatsList) {
      map.set(s.exercise.id, { lastDate: s.lastDate, bestWeight: s.bestWeight, totalSets: s.totalSets })
    }
    return map
  }, [stats.exerciseStatsList])
  const sortedExercises = useMemo(
    () => sortExercisesByRecency(allExercises ?? [], lastLoggedByExercise),
    [allExercises, lastLoggedByExercise]
  )
  const availableExercises = sortedExercises.filter(ex => !inWorkoutIds.has(ex.id))

  const ensureWorkout = useCallback(async () => {
    if (workoutIdRef.current) return workoutIdRef.current
    const newId = generateId()
    await db.workouts.add({
      id: newId,
      name: `${muscle?.name ?? 'Workout'} - ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      createdAt: Date.now(),
    })
    workoutIdRef.current = newId
    setWorkoutId(newId)
    return newId
  }, [muscle?.name])

  const addToWorkout = useCallback(async (exerciseId: string) => {
    const exercise = allExercises?.find(e => e.id === exerciseId)
    if (!exercise || savingRef.current) return
    const wid = await ensureWorkout()
    const nextOrder = sessionExercisesRef.current.length
    const weId = generateId()
    await db.workoutExercises.add({
      id: weId,
      workoutId: wid,
      exerciseId,
      order: nextOrder,
    })
    const emptySetId = generateId()
    const firstSet: WorkoutSet = {
      id: emptySetId,
      workoutExerciseId: weId,
      weight: 0,
      reps: 0,
      order: 0,
    }
    await db.workoutSets.add(firstSet)
    setSessionExercises(prev => [
      ...prev,
      { workoutExerciseId: weId, exercise, sets: [firstSet] },
    ])
  }, [allExercises, ensureWorkout])

  const addSet = useCallback(async (workoutExerciseId: string) => {
    const setId = generateId()
    const current = sessionExercisesRef.current
    const se = current.find(e => e.workoutExerciseId === workoutExerciseId)
    const nextOrder = se ? se.sets.length : 0
    const set: WorkoutSet = {
      id: setId,
      workoutExerciseId,
      weight: 0,
      reps: 0,
      order: nextOrder,
    }
    await db.workoutSets.add(set)
    setSessionExercises(prev => prev.map(e =>
      e.workoutExerciseId === workoutExerciseId ? { ...e, sets: [...e.sets, set] } : e
    ))
  }, [])

  const updateSet = useCallback(async (setId: string, weight: number, reps: number) => {
    await db.workoutSets.update(setId, { weight, reps })
    setSessionExercises(prev => prev.map(e => ({
      ...e,
      sets: e.sets.map(s => s.id === setId ? { ...s, weight, reps } : s),
    })))
  }, [])

  const deleteSet = useCallback(async (setId: string) => {
    const current = sessionExercisesRef.current
    const exercise = current.find(e => e.sets.some(s => s.id === setId))
    const remaining = exercise?.sets.filter(s => s.id !== setId) ?? []

    await db.workoutSets.delete(setId)

    if (remaining.length === 0 && exercise) {
      await db.workoutExercises.delete(exercise.workoutExerciseId)
      await cleanupEmptyWorkout()
      setSessionExercises(prev => prev.filter(e => e.workoutExerciseId !== exercise.workoutExerciseId))
      return
    }

    // Renumber remaining sets in DB
    await Promise.all(remaining.map((s, i) => db.workoutSets.update(s.id, { order: i })))

    setSessionExercises(prev => {
      const updated = prev.map(e => {
        if (e.sets.some(s => s.id === setId)) {
          return {
            ...e,
            sets: e.sets
              .filter(s => s.id !== setId)
              .map((s, i) => ({ ...s, order: i })),
          }
        }
        return e
      })
      return updated.filter(e => e.sets.length > 0)
    })
  }, [cleanupEmptyWorkout])

  const removeFromWorkout = useCallback(async (workoutExerciseId: string) => {
    const sets = await db.workoutSets.where('workoutExerciseId').equals(workoutExerciseId).toArray()
    await db.workoutSets.bulkDelete(sets.map(s => s.id))
    await db.workoutExercises.delete(workoutExerciseId)
    setSessionExercises(prev => prev.filter(e => e.workoutExerciseId !== workoutExerciseId))
    await cleanupEmptyWorkout()
  }, [cleanupEmptyWorkout])

  const saveWorkout = useCallback(async () => {
    const wid = workoutIdRef.current
    if (!wid || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const workout = await db.workouts.get(wid)
      if (workout) {
        const duration = Math.max(1, Math.round((Date.now() - workout.createdAt) / 60000))
        await db.workouts.update(wid, { duration })
      }
      await detectPersonalRecords(wid)
      await refreshRecovery()
      workoutIdRef.current = null
      setWorkoutId(null)
      setSessionExercises([])
    } finally {
      setSaving(false)
      savingRef.current = false
    }
  }, [])

  const totalSetsAcrossExercises = sessionExercises.reduce((sum, e) => sum + e.sets.length, 0)

  if (stats.loading) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back to home">
            <ArrowLeft size={20} />
          </Button>
        </div>
        <PageLoading />
      </PageContainer>
    )
  }

  if (!muscle) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back to home">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Muscle not found</h1>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back to home">
          <ArrowLeft size={20} />
        </Button>
        <div className="text-sm text-muted-foreground">
          Home &middot; {muscle.name}
        </div>
      </div>

      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-b from-primary/5 to-transparent border border-border/50 p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <MuscleIcon muscleId={muscle.id} size={20} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold truncate">{muscle.name}</h1>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="text-center hidden sm:block">
            <div className="text-base sm:text-lg font-bold">{stats.exercises.length}</div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              <Activity size={10} />
              Exercises
            </div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold">{stats.totalSets}</div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              <Dumbbell size={10} />
              Sets
            </div>
          </div>
          <div className="text-center">
            <div className="text-base sm:text-lg font-bold truncate">{stats.bestSet ? formatWeight(stats.bestSet.weight, unit) : '-'}</div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              <Trophy size={10} />
              Best
            </div>
          </div>
          <div className="text-center min-w-0">
            <div className="text-xs sm:text-lg font-bold truncate">{stats.lastWorkoutDate ? formatRelative(stats.lastWorkoutDate) : '-'}</div>
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              <Clock size={10} />
              Last
            </div>
          </div>
        </div>
      </div>

      <RecoveryCard muscleId={muscle.id} muscleName={muscle.name} />

      <div className="mt-3 space-y-3">
        {sessionExercises.map(se => (
          <ExerciseWorkoutCard
            key={se.workoutExerciseId}
            sessionExercise={se}
            unit={unit}
            onAddSet={addSet}
            onUpdateSet={updateSet}
            onDeleteSet={deleteSet}
            onRemoveFromWorkout={removeFromWorkout}
          />
        ))}

        {availableExercises.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-border/30" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Add Exercise
              </span>
              <div className="h-px flex-1 bg-border/30" />
            </div>
            <div className="space-y-2">
              {availableExercises.map(ex => {
                const exStat = exerciseStatMap.get(ex.id)
                return (
                  <AvailableExerciseCard
                    key={ex.id}
                    exercise={ex}
                    lastDate={exStat?.lastDate ?? null}
                    bestWeight={exStat?.bestWeight ?? 0}
                    totalSets={exStat?.totalSets ?? 0}
                    unit={unit}
                    isMobile={isMobile}
                    onAddToWorkout={addToWorkout}
                    onDelete={setDeleteTarget}
                    onRename={handleRenameOpen}
                  />
                )
              })}
            </div>
          </div>
        )}

        <AddExerciseForm muscleId={muscle.id} onCreated={() => {}} />

        {workoutId && totalSetsAcrossExercises > 0 && (
          <Button
            size="lg"
            className="w-full mt-2"
            onClick={saveWorkout}
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Save Workout ({totalSetsAcrossExercises} {totalSetsAcrossExercises === 1 ? 'set' : 'sets'})
          </Button>
        )}
      </div>

      <div className="mt-6">
        <WorkoutHistorySection
          workouts={stats.workouts}
          workoutExercises={stats.workoutExercises}
          sets={stats.sets}
          exercises={stats.exercises}
        />
      </div>

      <div className="mt-6">
        <MuscleChartsSection chartData={stats.chartData} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget && !!deleteTargetExercise}
        title="Delete Exercise?"
        description={
          <>
            <p>
              This will permanently delete <strong>{deleteTargetExercise?.name}</strong>.
            </p>
            <p className="text-destructive mt-1">
              All associated sets, reps, history, personal records, and analytics will also be deleted.
            </p>
          </>
        }
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {renameTarget && renameTargetExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="rename-exercise-title" className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl">
            <h3 id="rename-exercise-title" className="text-lg font-semibold mb-2">Rename Exercise</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Enter a new name for <strong>{renameTargetExercise.name}</strong>.
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
              <Button variant="outline" size="sm" onClick={() => { setRenameTarget(null); setRenameValue('') }} disabled={renaming}>
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
