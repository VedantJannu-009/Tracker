import { create } from 'zustand'
import { db } from '@/db/schema'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types'
import { generateId } from '@/lib/utils'
import { detectPersonalRecords } from '@/services/prDetection'
import { toast } from '@/stores/toastStore'

interface WorkoutState {
  currentWorkout: Workout | null
  currentExercises: (WorkoutExercise & { sets: WorkoutSet[] })[]
  loading: boolean
  startWorkout: (name?: string) => Promise<string>
  addExercise: (exerciseId: string) => Promise<void>
  addSet: (workoutExerciseId: string, weight: number, reps: number) => Promise<void>
  removeSet: (setId: string) => Promise<void>
  updateSet: (setId: string, weight: number, reps: number) => Promise<void>
  removeExercise: (id: string) => Promise<void>
  saveWorkout: () => Promise<void>
  deleteWorkout: (id: string) => Promise<void>
  loadWorkout: (id: string) => Promise<void>
  reset: () => void
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentWorkout: null,
  currentExercises: [],
  loading: false,

  startWorkout: async (name) => {
    try {
      const id = generateId()
      const workout: Workout = {
        id,
        name: name || `Workout ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        createdAt: Date.now(),
      }
      await db.workouts.add(workout)
      set({ currentWorkout: workout, currentExercises: [] })
      return id
    } catch (err) {
      console.error('Failed to start workout', err)
      toast('Failed to start workout', 'error')
      return ''
    }
  },

  addExercise: async (exerciseId) => {
    const { currentWorkout, currentExercises } = get()
    if (!currentWorkout) return
    if (currentExercises.some(e => e.exerciseId === exerciseId)) return
    try {
      const we: WorkoutExercise = {
        id: generateId(),
        workoutId: currentWorkout.id,
        exerciseId,
        order: currentExercises.length,
      }
      await db.workoutExercises.add(we)
      set({ currentExercises: [...currentExercises, { ...we, sets: [] }] })
    } catch (err) {
      console.error('Failed to add exercise', err)
      toast('Failed to add exercise', 'error')
    }
  },

  addSet: async (workoutExerciseId, weight, reps) => {
    const { currentExercises } = get()
    const exercise = currentExercises.find(e => e.id === workoutExerciseId)
    if (!exercise) return
    try {
      const ws: WorkoutSet = {
        id: generateId(),
        workoutExerciseId,
        weight,
        reps,
        order: exercise.sets.length,
      }
      await db.workoutSets.add(ws)
      set({
        currentExercises: currentExercises.map(e =>
          e.id === workoutExerciseId ? { ...e, sets: [...e.sets, ws] } : e
        ),
      })
    } catch (err) {
      console.error('Failed to add set', err)
      toast('Failed to add set', 'error')
    }
  },

  removeSet: async (setId) => {
    const { currentExercises } = get()
    const exercise = currentExercises.find(e => e.sets.some(s => s.id === setId))
    if (!exercise) return
    const remaining = exercise.sets.filter(s => s.id !== setId)
    try {
      await db.workoutSets.delete(setId)

      await Promise.all(remaining.map((s, i) => db.workoutSets.update(s.id, { order: i })))

      set({
        currentExercises: currentExercises.map(e => {
          if (!e.sets.some(s => s.id === setId)) return e
          return {
            ...e,
            sets: remaining.map((s, i) => ({ ...s, order: i })),
          }
        }),
      })
    } catch (err) {
      console.error('Failed to remove set', err)
      toast('Failed to remove set', 'error')
    }
  },

  updateSet: async (setId, weight, reps) => {
    try {
      await db.workoutSets.update(setId, { weight, reps })
      const { currentExercises } = get()
      set({
        currentExercises: currentExercises.map(e => ({
          ...e,
          sets: e.sets.map(s => s.id === setId ? { ...s, weight, reps } : s),
        })),
      })
    } catch (err) {
      console.error('Failed to update set', err)
      toast('Failed to update set', 'error')
    }
  },

  removeExercise: async (id) => {
    try {
      const sets = await db.workoutSets.where('workoutExerciseId').equals(id).toArray()
      await db.workoutSets.bulkDelete(sets.map(s => s.id))
      await db.workoutExercises.delete(id)
      set({ currentExercises: get().currentExercises.filter(e => e.id !== id) })
    } catch (err) {
      console.error('Failed to remove exercise', err)
      toast('Failed to remove exercise', 'error')
    }
  },

  saveWorkout: async () => {
    const { currentWorkout } = get()
    if (!currentWorkout) return
    try {
      const duration = Math.max(1, Math.round((Date.now() - currentWorkout.createdAt) / 60000))
      await db.workouts.update(currentWorkout.id, { duration })
      await detectPersonalRecords(currentWorkout.id)
      toast('Workout saved')
    } catch (err) {
      console.error('Failed to save workout', err)
      toast('Failed to save workout', 'error')
      return
    }
    set({ currentWorkout: null, currentExercises: [] })
  },

  deleteWorkout: async (id) => {
    try {
      await db.personalRecords.where('workoutId').equals(id).delete()
      const wes = await db.workoutExercises.where('workoutId').equals(id).toArray()
      await db.workoutSets.where('workoutExerciseId').anyOf(wes.map(w => w.id)).delete()
      await db.workoutExercises.where('workoutId').equals(id).delete()
      await db.workouts.delete(id)
      toast('Workout deleted')
    } catch (err) {
      console.error('Failed to delete workout', err)
      toast('Failed to delete workout', 'error')
    }
  },

  loadWorkout: async (id) => {
    set({ loading: true })
    try {
      const workout = await db.workouts.get(id)
      if (!workout) { set({ loading: false }); return }
      const wes = await db.workoutExercises.where('workoutId').equals(id).toArray()
      const exercisesWithSets = await Promise.all(
        wes.map(async (we) => {
          const sets = await db.workoutSets.where('workoutExerciseId').equals(we.id).toArray()
          return { ...we, sets: sets.sort((a, b) => a.order - b.order) }
        })
      )
      set({ currentWorkout: workout, currentExercises: exercisesWithSets, loading: false })
    } catch (err) {
      console.error('Failed to load workout', err)
      toast('Failed to load workout', 'error')
      set({ loading: false })
    }
  },

  reset: () => set({ currentWorkout: null, currentExercises: [], loading: false }),
}))
