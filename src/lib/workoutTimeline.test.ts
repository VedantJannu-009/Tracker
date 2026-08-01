import { describe, expect, it } from 'vitest'
import { buildWorkoutTimeline, type TimelineInput } from '@/lib/workoutTimeline'
import { formatDate } from '@/lib/utils'

const DAY_MS = 24 * 60 * 60 * 1000

function makeInput(overrides: Partial<TimelineInput> = {}): TimelineInput {
  const now = new Date(2026, 7, 2, 12, 0, 0, 0).getTime()
  return {
    workouts: [],
    workoutExercises: [],
    sets: [],
    exercises: [],
    now,
    ...overrides,
  }
}

describe('buildWorkoutTimeline', () => {
  it('groups sessions under Today, Yesterday and dated labels', () => {
    const now = new Date(2026, 7, 2, 12, 0, 0, 0).getTime()
    const days = buildWorkoutTimeline(
      makeInput({
        now,
        workouts: [
          { id: 'w-old', name: 'Old Day', date: new Date(now - 3 * DAY_MS).toISOString(), createdAt: now - 3 * DAY_MS },
          { id: 'w-yest', name: 'Leg Day', date: new Date(now - DAY_MS).toISOString(), createdAt: now - DAY_MS },
          { id: 'w-today', name: 'Chest Day', date: new Date(now).toISOString(), createdAt: now, duration: 35 },
        ],
        workoutExercises: [
          { id: 'we-old', workoutId: 'w-old', exerciseId: 'bench-press', order: 0 },
          { id: 'we-yest', workoutId: 'w-yest', exerciseId: 'squat', order: 0 },
          { id: 'we-today', workoutId: 'w-today', exerciseId: 'bench-press', order: 0 },
        ],
        sets: [
          { id: 's-old', workoutExerciseId: 'we-old', weight: 60, reps: 12, order: 0 },
          { id: 's-yest', workoutExerciseId: 'we-yest', weight: 100, reps: 5, order: 0 },
          { id: 's-today', workoutExerciseId: 'we-today', weight: 80, reps: 8, order: 0 },
        ],
        exercises: [
          { id: 'bench-press', name: 'Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' },
          { id: 'squat', name: 'Squat', muscleGroupId: 'legs', equipment: 'Barbell', difficulty: 'intermediate' },
        ],
      })
    )

    expect(days).toHaveLength(3)
    expect(days[0].label).toBe('Today')
    expect(days[0].sessions[0].name).toBe('Chest Day')
    expect(days[0].sessions[0].duration).toBe(35)
    expect(days[1].label).toBe('Yesterday')
    expect(days[1].sessions[0].name).toBe('Leg Day')
    expect(days[2].label).toBe(formatDate(now - 3 * DAY_MS))
  })

  it('sorts sessions newest first and groups exercises in workout order', () => {
    const now = new Date(2026, 7, 2, 12, 0, 0, 0).getTime()
    const days = buildWorkoutTimeline(
      makeInput({
        now,
        workouts: [
          { id: 'w-late', name: 'Late', date: new Date(now - 2 * 60 * 60 * 1000).toISOString(), createdAt: now - 2 * 60 * 60 * 1000 },
          { id: 'w-early', name: 'Early', date: new Date(now - 5 * 60 * 60 * 1000).toISOString(), createdAt: now - 5 * 60 * 60 * 1000 },
        ],
        workoutExercises: [
          { id: 'we-early-push', workoutId: 'w-early', exerciseId: 'push', order: 0 },
          { id: 'we-early-pull', workoutId: 'w-early', exerciseId: 'pull', order: 1 },
          { id: 'we-late-push', workoutId: 'w-late', exerciseId: 'push', order: 0 },
        ],
        sets: [
          { id: 's1', workoutExerciseId: 'we-early-push', weight: 60, reps: 10, order: 0 },
          { id: 's2', workoutExerciseId: 'we-early-pull', weight: 40, reps: 12, order: 0 },
          { id: 's3', workoutExerciseId: 'we-late-push', weight: 50, reps: 10, order: 0 },
        ],
        exercises: [
          { id: 'push', name: 'Push Up', muscleGroupId: 'chest', equipment: 'Bodyweight', difficulty: 'beginner' },
          { id: 'pull', name: 'Pull Up', muscleGroupId: 'back', equipment: 'Bodyweight', difficulty: 'intermediate' },
        ],
      })
    )

    const [day] = days
    expect(day.sessions.map(s => s.name)).toEqual(['Late', 'Early'])
    expect(day.sessions[1].exercises.map(e => e.name)).toEqual(['Push Up', 'Pull Up'])
  })

  it('orders logged sets and drops unlogged ones', () => {
    const now = new Date(2026, 7, 2, 12, 0, 0, 0).getTime()
    const days = buildWorkoutTimeline(
      makeInput({
        now,
        workouts: [{ id: 'w1', name: 'Chest Day', date: new Date(now).toISOString(), createdAt: now }],
        workoutExercises: [{ id: 'we1', workoutId: 'w1', exerciseId: 'bench-press', order: 0 }],
        sets: [
          { id: 's-empty', workoutExerciseId: 'we1', weight: 0, reps: 0, order: 0 },
          { id: 's2', workoutExerciseId: 'we1', weight: 75, reps: 10, order: 2 },
          { id: 's1', workoutExerciseId: 'we1', weight: 80, reps: 8, order: 1 },
        ],
        exercises: [
          { id: 'bench-press', name: 'Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' },
        ],
      })
    )

    const sets = days[0].sessions[0].exercises[0].sets
    expect(sets.map(s => s.reps)).toEqual([8, 10])
    expect(sets.every(s => s.weight > 0)).toBe(true)
  })

  it('skips exercises that have no logged sets', () => {
    const now = new Date(2026, 7, 2, 12, 0, 0, 0).getTime()
    const days = buildWorkoutTimeline(
      makeInput({
        now,
        workouts: [{ id: 'w1', name: 'Chest Day', date: new Date(now).toISOString(), createdAt: now }],
        workoutExercises: [
          { id: 'we-empty', workoutId: 'w1', exerciseId: 'bench-press', order: 0 },
          { id: 'we-logged', workoutId: 'w1', exerciseId: 'fly', order: 1 },
        ],
        sets: [{ id: 's1', workoutExerciseId: 'we-logged', weight: 20, reps: 15, order: 0 }],
        exercises: [
          { id: 'bench-press', name: 'Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' },
          { id: 'fly', name: 'Dumbbell Fly', muscleGroupId: 'chest', equipment: 'Dumbbell', difficulty: 'beginner' },
        ],
      })
    )

    expect(days[0].sessions[0].exercises.map(e => e.name)).toEqual(['Dumbbell Fly'])
  })

  it('preserves bodyweight sets', () => {
    const now = new Date(2026, 7, 2, 12, 0, 0, 0).getTime()
    const days = buildWorkoutTimeline(
      makeInput({
        now,
        workouts: [{ id: 'w1', name: 'Push Day', date: new Date(now).toISOString(), createdAt: now }],
        workoutExercises: [{ id: 'we1', workoutId: 'w1', exerciseId: 'push-up', order: 0 }],
        sets: [
          { id: 's1', workoutExerciseId: 'we1', weight: 0, reps: 15, order: 0 },
          { id: 's2', workoutExerciseId: 'we1', weight: 0, reps: 12, order: 1 },
        ],
        exercises: [
          { id: 'push-up', name: 'Push Up', muscleGroupId: 'chest', equipment: 'Bodyweight', difficulty: 'beginner' },
        ],
      })
    )

    const sets = days[0].sessions[0].exercises[0].sets
    expect(sets.map(s => s.reps)).toEqual([15, 12])
    expect(sets.every(s => s.weight === 0)).toBe(true)
  })

  it('returns an empty array when there is no data', () => {
    expect(buildWorkoutTimeline(makeInput())).toEqual([])
  })
})
