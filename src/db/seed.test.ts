import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './schema'
import { initializeDatabase, defaultExercises, defaultMuscleGroups } from './seed'

const ALL_TABLES = [
  db.workouts,
  db.workoutExercises,
  db.workoutSets,
  db.goals,
  db.weeklyGoals,
  db.personalRecords,
  db.bodyMeasurements,
  db.customCards,
  db.settings,
  db.muscleGroups,
  db.exercises,
] as const

async function clearAll() {
  for (const table of ALL_TABLES) {
    await table.clear()
  }
}

describe('seed persistence', () => {
  beforeEach(clearAll)

  it('seeds defaults on first launch', async () => {
    await initializeDatabase()
    expect(await db.exercises.count()).toBe(defaultExercises.length)
    expect(await db.muscleGroups.count()).toBe(defaultMuscleGroups.length)
  })

  it('does not resurrect a deleted default exercise on re-init', async () => {
    await initializeDatabase()
    await db.exercises.delete('bench-press')

    await initializeDatabase()

    expect(await db.exercises.get('bench-press')).toBeUndefined()
  })

  it('does not reseed defaults after all exercises are deleted', async () => {
    await initializeDatabase()
    await db.exercises.clear()

    await initializeDatabase()

    expect(await db.exercises.count()).toBe(0)
  })

  it('leaves the deleted exercise permanently removed after repeated boots', async () => {
    await initializeDatabase()
    await db.exercises.delete('squat')

    for (let i = 0; i < 3; i++) {
      await initializeDatabase()
      expect(await db.exercises.get('squat')).toBeUndefined()
    }
  })
})
