import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/schema'
import { detectPersonalRecords } from '@/services/prDetection'

async function clearAll() {
  await db.workouts.clear()
  await db.workoutExercises.clear()
  await db.workoutSets.clear()
  await db.personalRecords.clear()
}

async function seed(workoutId: string, exerciseId: string, sets: { weight: number; reps: number }[]) {
  const weId = `we-${workoutId}`
  await db.workoutExercises.add({ id: weId, workoutId, exerciseId, order: 0 })
  await db.workoutSets.bulkAdd(
    sets.map((s, i) => ({ id: `set-${workoutId}-${i}`, workoutExerciseId: weId, weight: s.weight, reps: s.reps, order: i }))
  )
}

describe('detectPersonalRecords', () => {
  beforeEach(clearAll)

  it('creates weight, reps, and volume records on first workout', async () => {
    await seed('w1', 'bench-press', [
      { weight: 60, reps: 8 },
      { weight: 80, reps: 5 },
    ])

    await detectPersonalRecords('w1')

    const records = await db.personalRecords.toArray()
    expect(records).toHaveLength(3)
    expect(records.find(r => r.type === 'weight')?.value).toBe(80)
    expect(records.find(r => r.type === 'reps')?.value).toBe(8)
    expect(records.find(r => r.type === 'volume')?.value).toBe(480)
  })

  it('updates the existing record when a PR is beaten', async () => {
    await seed('w1', 'bench-press', [{ weight: 80, reps: 5 }])
    await detectPersonalRecords('w1')
    await seed('w2', 'bench-press', [{ weight: 90, reps: 6 }])
    await detectPersonalRecords('w2')

    const records = await db.personalRecords.toArray()
    expect(records).toHaveLength(3)
    const weight = records.find(r => r.type === 'weight')!
    expect(weight.value).toBe(90)
    expect(weight.workoutId).toBe('w2')
  })

  it('keeps the existing record when the max is not beaten', async () => {
    await seed('w1', 'bench-press', [{ weight: 100, reps: 10 }])
    await detectPersonalRecords('w1')
    await seed('w2', 'bench-press', [{ weight: 90, reps: 8 }])
    await detectPersonalRecords('w2')

    const records = await db.personalRecords.toArray()
    expect(records).toHaveLength(3)
    const weight = records.find(r => r.type === 'weight')!
    expect(weight.value).toBe(100)
    expect(weight.workoutId).toBe('w1')
  })

  it('skips exercises with no sets', async () => {
    await seed('w1', 'bench-press', [])
    await detectPersonalRecords('w1')
    expect(await db.personalRecords.toArray()).toHaveLength(0)
  })
})
