import { db } from '@/db/schema'
import type { WorkoutExercise, Exercise } from '@/types'

export interface DeleteExerciseResult {
  setsDeleted: number
  prsDeleted: number
}

export async function deleteExercise(exerciseId: string): Promise<DeleteExerciseResult> {
  const workoutExercises: WorkoutExercise[] = await db.workoutExercises
    .where('exerciseId')
    .equals(exerciseId)
    .toArray()

  const weIds = workoutExercises.map(we => we.id)
  let setsDeleted = 0

  if (weIds.length > 0) {
    const sets = await db.workoutSets.where('workoutExerciseId').anyOf(weIds).toArray()
    setsDeleted = sets.length
    await db.workoutSets.bulkDelete(sets.map(s => s.id))
    await db.workoutExercises.bulkDelete(weIds)
  }

  const prs = await db.personalRecords.where('exerciseId').equals(exerciseId).toArray()
  const prsDeleted = prs.length
  if (prs.length > 0) {
    await db.personalRecords.bulkDelete(prs.map(pr => pr.id))
  }

  await db.exercises.delete(exerciseId)

  return { setsDeleted, prsDeleted }
}

export async function renameExercise(exerciseId: string, newName: string): Promise<void> {
  await db.exercises.update(exerciseId, { name: newName })
}

export async function duplicateExercise(exerciseId: string): Promise<string> {
  const exercise = await db.exercises.get(exerciseId)
  if (!exercise) throw new Error('Exercise not found')

  const newId = crypto.randomUUID()
  const copy: Exercise = {
    ...exercise,
    id: newId,
    name: `${exercise.name} (copy)`,
  }

  await db.exercises.add(copy)
  return newId
}
