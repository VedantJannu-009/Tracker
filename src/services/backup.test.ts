import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'
import { exportBackup, importBackup } from '@/services/backup'

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

describe('backup', () => {
  beforeEach(clearAll)

  it('round-trips all tables', async () => {
    await db.workouts.add({ id: 'w1', name: 'Leg day', date: new Date().toISOString(), createdAt: 123 })
    await db.workoutExercises.add({ id: 'we1', workoutId: 'w1', exerciseId: 'squat', order: 0 })
    await db.workoutSets.add({ id: 's1', workoutExerciseId: 'we1', weight: 120, reps: 5, order: 0 })
    await db.goals.add({ id: 'g1', title: 'Squat 200', targetValue: 200, currentValue: 180, unit: 'kg', createdAt: 1, completed: false })
    await db.weeklyGoals.add({ id: 'wg1', muscleGroupId: 'legs', targetSets: 12 })
    await db.settings.put({ id: 'default', theme: 'dark', unit: 'kg', soundEnabled: true, restTimer: 90 })
    await db.muscleGroups.add({ id: 'legs', name: 'Legs', icon: '🦵' })
    await db.exercises.add({ id: 'squat', name: 'Squat', muscleGroupId: 'legs', equipment: 'Barbell', difficulty: 'intermediate' })

    const backup = await exportBackup()
    expect(backup.workouts).toHaveLength(1)
    expect(backup.weeklyGoals).toHaveLength(1)

    await clearAll()

    await importBackup(backup)

    expect(await db.workouts.get('w1')).toMatchObject({ name: 'Leg day' })
    expect(await db.workoutSets.get('s1')).toMatchObject({ weight: 120, reps: 5 })
    expect(await db.weeklyGoals.get('wg1')).toMatchObject({ targetSets: 12 })
    expect(await db.settings.get('default')).toMatchObject({ theme: 'dark' })
    expect(await db.exercises.get('squat')).toMatchObject({ name: 'Squat' })
  })

  it('rejects data that is not a backup', async () => {
    await expect(importBackup({ foo: 'bar' })).rejects.toThrow('Not a Gym Tracker backup file')
    await expect(importBackup(null)).rejects.toThrow()
    await expect(importBackup('nope')).rejects.toThrow()
  })
})
