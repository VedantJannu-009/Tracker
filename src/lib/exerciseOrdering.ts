export interface ExerciseWithMeta {
  id: string
  name?: string
  createdAt?: number
}

export function sortExercisesByRecency<T extends ExerciseWithMeta>(
  exercises: T[],
  lastLoggedDateByExerciseId: ReadonlyMap<string, string>
): T[] {
  return [...exercises].sort((a, b) => {
    const aDate = lastLoggedDateByExerciseId.get(a.id)
    const bDate = lastLoggedDateByExerciseId.get(b.id)

    if (aDate && bDate) {
      const cmp = bDate.localeCompare(aDate)
      if (cmp !== 0) return cmp
    } else if (aDate && !bDate) {
      return -1
    } else if (!aDate && bDate) {
      return 1
    }

    const createdCmp = (b.createdAt ?? 0) - (a.createdAt ?? 0)
    if (createdCmp !== 0) return createdCmp
    return (a.name ?? '').localeCompare(b.name ?? '')
  })
}
