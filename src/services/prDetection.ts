import { db } from '@/db/schema'
import { generateId } from '@/lib/utils'

export async function detectPersonalRecords(workoutId: string) {
  const wes = await db.workoutExercises.where('workoutId').equals(workoutId).toArray()
  for (const we of wes) {
    const exerciseId = we.exerciseId
    const sets = await db.workoutSets.where('workoutExerciseId').equals(we.id).toArray()
    if (!sets.length) continue

    const maxWeight = Math.max(...sets.map(s => s.weight))
    const maxReps = Math.max(...sets.map(s => s.reps))
    const maxVolume = Math.max(...sets.map(s => s.weight * s.reps))

    const existingWeight = await db.personalRecords
      .where({ exerciseId, type: 'weight' })
      .toArray()
    if (!existingWeight.length || maxWeight > Math.max(...existingWeight.map(pr => pr.value))) {
      await db.personalRecords.add({
        id: generateId(),
        exerciseId,
        value: maxWeight,
        type: 'weight',
        achievedAt: new Date().toISOString(),
        workoutId,
      })
    }

    const existingReps = await db.personalRecords
      .where({ exerciseId, type: 'reps' })
      .toArray()
    if (!existingReps.length || maxReps > Math.max(...existingReps.map(pr => pr.value))) {
      await db.personalRecords.add({
        id: generateId(),
        exerciseId,
        value: maxReps,
        type: 'reps',
        achievedAt: new Date().toISOString(),
        workoutId,
      })
    }

    const existingVolume = await db.personalRecords
      .where({ exerciseId, type: 'volume' })
      .toArray()
    if (!existingVolume.length || maxVolume > Math.max(...existingVolume.map(pr => pr.value))) {
      await db.personalRecords.add({
        id: generateId(),
        exerciseId,
        value: maxVolume,
        type: 'volume',
        achievedAt: new Date().toISOString(),
        workoutId,
      })
    }
  }
}
