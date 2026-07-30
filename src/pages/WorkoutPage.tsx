import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { useWorkoutStore } from '@/stores/workoutStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Trash2, Play, Save, X, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function WorkoutPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const exercises = useLiveQuery(
    () => selectedMuscle ? db.exercises.where('muscleGroupId').equals(selectedMuscle).toArray() : [],
    [selectedMuscle]
  )
  const allExercises = useLiveQuery(() => db.exercises.toArray())

  useEffect(() => {
    if (id) loadWorkout(id)
  }, [id])

  const handleStartWorkout = async () => {
    const wid = await startWorkout(workoutName || undefined)
    if (!id) navigate(`/workout/${wid}`, { replace: true })
  }

  const handleAddExercise = async () => {
    if (!selectedExercise) return
    await addExercise(selectedExercise)
    setSelectedExercise('')
    setSelectedMuscle('')
    setShowAddExercise(false)
  }

  const handleAddSet = async (exerciseId: string) => {
    const w = parseFloat(weight[exerciseId] || '0')
    const r = parseInt(reps[exerciseId] || '0')
    if (w <= 0 || r <= 0) return
    await addSet(exerciseId, w, r)
    setWeight(prev => ({ ...prev, [exerciseId]: '' }))
    setReps(prev => ({ ...prev, [exerciseId]: '' }))
  }

  const handleSave = async () => {
    await saveWorkout()
    navigate('/')
  }

  const handleDelete = async () => {
    if (currentWorkout) {
      await deleteWorkout(currentWorkout.id)
      navigate('/')
    }
  }

  if (!currentWorkout) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">New Workout</h1>
        </div>

        <div className="text-center py-12">
          <div className="text-5xl mb-4">🏋️</div>
          <h2 className="text-xl font-semibold mb-2">Ready to train?</h2>
          <p className="text-sm text-muted-foreground mb-6">Start a new workout session</p>
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
        </div>

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
          <Button variant="ghost" size="icon" onClick={handleSave} className="shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold truncate">{currentWorkout.name}</h1>
            <p className="text-xs text-muted-foreground">{formatDate(currentWorkout.date)}</p>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={handleDelete} className="shrink-0">
            <Trash2 size={18} />
          </Button>
          <Button size="sm" onClick={handleSave} className="text-xs sm:text-sm whitespace-nowrap">
            <Save size={16} className="mr-1" /> Save
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {currentExercises.map(exercise => {
          const ex = allExercises?.find(e => e.id === exercise.exerciseId)
          return (
            <Card key={exercise.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{ex?.name ?? exercise.exerciseId}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeExercise(exercise.id)}>
                    <X size={14} />
                  </Button>
                </div>

                {exercise.sets.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <div className="hidden sm:flex items-center text-xs text-muted-foreground px-2 py-1">
                      <span className="w-8">Set</span>
                      <span className="flex-1 text-right">Weight</span>
                      <span className="w-16 text-right">Reps</span>
                      <span className="w-16 text-right">Volume</span>
                      <span className="w-8" />
                    </div>
                    {exercise.sets.map((set, i) => (
                      <div key={set.id} className="flex items-center px-2 py-1.5 rounded-lg bg-muted/30 gap-1">
                        <span className="w-6 sm:w-8 text-xs sm:text-sm text-muted-foreground shrink-0">{i + 1}</span>
                        <span className="flex-1 text-right text-xs sm:text-sm font-medium">{set.weight}</span>
                        <span className="text-xs text-muted-foreground mx-1">x</span>
                        <span className="w-10 sm:w-16 text-right text-xs sm:text-sm font-medium">{set.reps}</span>
                        <span className="hidden sm:block w-16 text-right text-xs text-muted-foreground">{set.weight * set.reps}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-6 sm:w-6 shrink-0" onClick={() => removeSet(set.id)}>
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Input
                    type="number"
                    placeholder="Wt"
                    value={weight[exercise.id] ?? ''}
                    onChange={e => setWeight(prev => ({ ...prev, [exercise.id]: e.target.value }))}
                    className="h-9 text-xs sm:text-sm w-16 sm:w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={reps[exercise.id] ?? ''}
                    onChange={e => setReps(prev => ({ ...prev, [exercise.id]: e.target.value }))}
                    className="h-9 text-xs sm:text-sm w-14 sm:w-20"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAddSet(exercise.id)}
                    disabled={!weight[exercise.id] || !reps[exercise.id]}
                    className="h-9 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Check size={14} className="mr-1" /> Set
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showAddExercise ? (
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add Exercise</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddExercise(false)}>
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
        <div
          key={w.id}
          onClick={() => onSelect(w.id)}
          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div>
            <div className="text-sm font-medium">{w.name}</div>
            <div className="text-xs text-muted-foreground">{formatDate(w.date)}</div>
          </div>
          <Button variant="ghost" size="sm">
            <Play size={14} />
          </Button>
        </div>
      ))}
    </div>
  )
}
