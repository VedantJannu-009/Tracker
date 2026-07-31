import { db } from '@/db/schema'
import { generateId } from '@/lib/utils'
import type { PersonalRecord } from '@/types'

export async function detectPersonalRecords(workoutId: string) {
  const wes = await db.workoutExercises.where('workoutId').equals(workoutId).toArray()
  for (const we of wes) {
    const exerciseId = we.exerciseId
    const sets = await db.workoutSets.where('workoutExerciseId').equals(we.id).toArray()
    if (!sets.length) continue

    const maxWeight = Math.max(...sets.map(s => s.weight))
    const maxReps = Math.max(...sets.map(s => s.reps))
    const maxVolume = Math.max(...sets.map(s => s.weight * s.reps))

    await upsertRecord(exerciseId, 'weight', maxWeight, workoutId)
    await upsertRecord(exerciseId, 'reps', maxReps, workoutId)
    await upsertRecord(exerciseId, 'volume', maxVolume, workoutId)
  }
}

async function upsertRecord(
  exerciseId: string,
  type: PersonalRecord['type'],
  value: number,
  workoutId: string,
) {
  const existing = await db.personalRecords
    .where({ exerciseId, type })
    .first()
  if (existing) {
    if (value > existing.value) {
      await db.personalRecords.update(existing.id, {
        value,
        achievedAt: new Date().toISOString(),
        workoutId,
      })
    }
    return
  }
  await db.personalRecords.add({
    id: generateId(),
    exerciseId,
    value,
    type,
    achievedAt: new Date().toISOString(),
    workoutId,
  })
}
