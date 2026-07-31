import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'
import { useWorkoutStore } from '@/stores/workoutStore'

async function clearAll() {
  await db.workouts.clear()
  await db.workoutExercises.clear()
  await db.workoutSets.clear()
  await db.personalRecords.clear()
  useWorkoutStore.getState().reset()
}

describe('workoutStore', () => {
  beforeEach(clearAll)

  it('startWorkout creates a workout and sets it as current', async () => {
    const id = await useWorkoutStore.getState().startWorkout('Push day')

    expect(id).toBeTruthy()
    const workout = await db.workouts.get(id)
    expect(workout?.name).toBe('Push day')
    expect(useWorkoutStore.getState().currentWorkout?.id).toBe(id)
  })

  it('assigns set order sequentially as sets are added', async () => {
    await useWorkoutStore.getState().startWorkout('A')
    await useWorkoutStore.getState().addExercise('bench-press')
    const exercise = useWorkoutStore.getState().currentExercises[0]

    await useWorkoutStore.getState().addSet(exercise.id, 60, 8)
    await useWorkoutStore.getState().addSet(exercise.id, 70, 6)

    const sets = await db.workoutSets.where('workoutExerciseId').equals(exercise.id).toArray()
    expect(sets.map(s => s.order).sort((a, b) => a - b)).toEqual([0, 1])
  })

  it('saveWorkout writes a duration and clears the current state', async () => {
    await useWorkoutStore.getState().startWorkout('A')
    const id = useWorkoutStore.getState().currentWorkout!.id
    await useWorkoutStore.getState().addExercise('bench-press')
    const exercise = useWorkoutStore.getState().currentExercises[0]
    await useWorkoutStore.getState().addSet(exercise.id, 60, 8)

    await useWorkoutStore.getState().saveWorkout()

    const workout = await db.workouts.get(id)
    expect(workout?.duration).toBeGreaterThanOrEqual(1)
    expect(useWorkoutStore.getState().currentWorkout).toBeNull()
    expect(useWorkoutStore.getState().currentExercises).toHaveLength(0)
  })

  it('deleteWorkout cascades sets, exercises, and personal records', async () => {
    const id = await useWorkoutStore.getState().startWorkout('A')
    await useWorkoutStore.getState().addExercise('bench-press')
    const exercise = useWorkoutStore.getState().currentExercises[0]
    await useWorkoutStore.getState().addSet(exercise.id, 100, 10)
    await useWorkoutStore.getState().saveWorkout()

    expect((await db.personalRecords.toArray()).length).toBeGreaterThan(0)

    await useWorkoutStore.getState().deleteWorkout(id)

    expect(await db.workouts.get(id)).toBeUndefined()
    expect(await db.workoutExercises.toArray()).toHaveLength(0)
    expect(await db.workoutSets.toArray()).toHaveLength(0)
    expect(await db.personalRecords.toArray()).toHaveLength(0)
  })

  it('addExercise ignores duplicates in the same workout', async () => {
    await useWorkoutStore.getState().startWorkout('A')
    await useWorkoutStore.getState().addExercise('bench-press')
    await useWorkoutStore.getState().addExercise('bench-press')

    expect(useWorkoutStore.getState().currentExercises).toHaveLength(1)
    expect(await db.workoutExercises.toArray()).toHaveLength(1)
  })
})
