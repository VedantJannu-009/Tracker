import { create } from 'zustand'
import { db } from '@/db/schema'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types'
import { generateId } from '@/lib/utils'
import { detectPersonalRecords } from '@/services/prDetection'

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
  },

  addExercise: async (exerciseId) => {
    const { currentWorkout, currentExercises } = get()
    if (!currentWorkout) return
    if (currentExercises.some(e => e.exerciseId === exerciseId)) return
    const we: WorkoutExercise = {
      id: generateId(),
      workoutId: currentWorkout.id,
      exerciseId,
      order: currentExercises.length,
    }
    await db.workoutExercises.add(we)
    set({ currentExercises: [...currentExercises, { ...we, sets: [] }] })
  },

  addSet: async (workoutExerciseId, weight, reps) => {
    const ws: WorkoutSet = {
      id: generateId(),
      workoutExerciseId,
      weight,
      reps,
      order: 0,
    }
    await db.workoutSets.add(ws)
    set((state) => {
      const ex = state.currentExercises.find(e => e.id === workoutExerciseId)
      if (!ex) return state
      ws.order = ex.sets.length
      db.workoutSets.update(ws.id, { order: ws.order })
      return {
        currentExercises: state.currentExercises.map(e =>
          e.id === workoutExerciseId ? { ...e, sets: [...e.sets, ws] } : e
        ),
      }
    })
  },

  removeSet: async (setId) => {
    const { currentExercises } = get()
    const exercise = currentExercises.find(e => e.sets.some(s => s.id === setId))
    const remaining = exercise?.sets.filter(s => s.id !== setId) ?? []

    await db.workoutSets.delete(setId)

    await Promise.all(remaining.map((s, i) => db.workoutSets.update(s.id, { order: i })))

    set({
      currentExercises: currentExercises.map(e => {
        if (!e.sets.some(s => s.id === setId)) return e
        return {
          ...e,
          sets: e.sets
            .filter(s => s.id !== setId)
            .map((s, i) => ({ ...s, order: i })),
        }
      }),
    })
  },

  updateSet: async (setId, weight, reps) => {
    await db.workoutSets.update(setId, { weight, reps })
    const { currentExercises } = get()
    set({
      currentExercises: currentExercises.map(e => ({
        ...e,
        sets: e.sets.map(s => s.id === setId ? { ...s, weight, reps } : s),
      })),
    })
  },

  removeExercise: async (id) => {
    const sets = await db.workoutSets.where('workoutExerciseId').equals(id).toArray()
    await db.workoutSets.bulkDelete(sets.map(s => s.id))
    await db.workoutExercises.delete(id)
    set({ currentExercises: get().currentExercises.filter(e => e.id !== id) })
  },

  saveWorkout: async () => {
    const { currentWorkout } = get()
    if (currentWorkout) {
      await detectPersonalRecords(currentWorkout.id)
    }
    set({ currentWorkout: null, currentExercises: [] })
  },

  deleteWorkout: async (id) => {
    const wes = await db.workoutExercises.where('workoutId').equals(id).toArray()
    for (const we of wes) {
      await db.workoutSets.where('workoutExerciseId').equals(we.id).delete()
    }
    await db.workoutExercises.where('workoutId').equals(id).delete()
    await db.workouts.delete(id)
  },

  loadWorkout: async (id) => {
    set({ loading: true })
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
  },

  reset: () => set({ currentWorkout: null, currentExercises: [], loading: false }),
}))
