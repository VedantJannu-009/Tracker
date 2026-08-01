import { describe, expect, it } from 'vitest'
import {
  computeWeeklyInsights,
  selectTopInsights,
  type InsightInput,
  type TrainingInsight,
} from '@/lib/weeklyInsights'

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2026, 6, 15, 12, 0, 0)
const daysAgo = (d: number) => new Date(NOW - d * DAY).toISOString()

function input(
  workouts: { id: string; date: string }[],
  wes: { id: string; workoutId: string; exerciseId: string }[],
  sets: { id: string; workoutExerciseId: string; weight: number; reps: number }[],
): InsightInput {
  return {
    workouts,
    workoutExercises: wes,
    workoutSets: sets,
    exercises: [
      { id: 'bench', muscleGroupId: 'chest' },
      { id: 'row', muscleGroupId: 'back' },
      { id: 'squat', muscleGroupId: 'legs' },
    ],
    muscleGroups: [
      { id: 'chest', name: 'Chest' },
      { id: 'back', name: 'Back' },
      { id: 'legs', name: 'Legs' },
    ],
    now: NOW,
  }
}

const find = (insights: TrainingInsight[], type: string) => insights.find(i => i.type === type)

describe('computeWeeklyInsights', () => {
  it('returns no insights with no data', () => {
    expect(computeWeeklyInsights(input([], [], []))).toEqual([])
  })

  it('reports a volume imbalance between muscle groups', () => {
    const result = computeWeeklyInsights(
      input(
        [
          { id: 'w1', date: daysAgo(1) },
          { id: 'w2', date: daysAgo(2) },
        ],
        [
          { id: 'we1', workoutId: 'w1', exerciseId: 'bench' },
          { id: 'we2', workoutId: 'w2', exerciseId: 'row' },
        ],
        [
          ...[1, 2, 3, 4].map(n => ({ id: `cb${n}`, workoutExerciseId: 'we1', weight: 60, reps: 10 })),
          ...[1, 2].map(n => ({ id: `rb${n}`, workoutExerciseId: 'we2', weight: 40, reps: 10 })),
        ],
      ),
    )

    const insight = find(result, 'imbalance')
    expect(insight).toBeDefined()
    expect(insight!.title).toBe('Chest received 3x more volume than Back.')
  })

  it('skips bodyweight-only muscles in the imbalance check', () => {
    const result = computeWeeklyInsights(
      input(
        [
          { id: 'w1', date: daysAgo(1) },
          { id: 'w2', date: daysAgo(2) },
        ],
        [
          { id: 'we1', workoutId: 'w1', exerciseId: 'bench' },
          { id: 'we2', workoutId: 'w2', exerciseId: 'row' },
        ],
        [
          ...[1, 2, 3].map(n => ({ id: `cb${n}`, workoutExerciseId: 'we1', weight: 0, reps: 10 })),
          ...[1, 2, 3].map(n => ({ id: `rb${n}`, workoutExerciseId: 'we2', weight: 0, reps: 10 })),
        ],
      ),
    )

    expect(find(result, 'imbalance')).toBeUndefined()
  })

  it('flags a muscle that has not been trained for many days', () => {
    const result = computeWeeklyInsights(
      input(
        [
          { id: 'w1', date: daysAgo(1) },
          { id: 'w2', date: daysAgo(9) },
        ],
        [
          { id: 'we1', workoutId: 'w1', exerciseId: 'bench' },
          { id: 'we2', workoutId: 'w2', exerciseId: 'squat' },
        ],
        [
          { id: 'cb1', workoutExerciseId: 'we1', weight: 60, reps: 10 },
          { id: 'sq1', workoutExerciseId: 'we2', weight: 100, reps: 8 },
        ],
      ),
    )

    const insight = find(result, 'neglect')
    expect(insight).toBeDefined()
    expect(insight!.sentiment).toBe('negative')
    expect(insight!.title).toBe("It's been 9 days since you trained Legs.")
  })

  it('reports improved training consistency', () => {
    const result = computeWeeklyInsights(
      input(
        [
          { id: 'w1', date: daysAgo(9) },
          { id: 'w2', date: daysAgo(3) },
          { id: 'w3', date: daysAgo(1) },
        ],
        [
          { id: 'we1', workoutId: 'w1', exerciseId: 'bench' },
          { id: 'we2', workoutId: 'w2', exerciseId: 'bench' },
          { id: 'we3', workoutId: 'w3', exerciseId: 'bench' },
        ],
        [
          { id: 'a1', workoutExerciseId: 'we1', weight: 60, reps: 10 },
          { id: 'a2', workoutExerciseId: 'we2', weight: 60, reps: 10 },
          { id: 'a3', workoutExerciseId: 'we3', weight: 60, reps: 10 },
        ],
      ),
    )

    const insight = find(result, 'consistency')
    expect(insight).toBeDefined()
    expect(insight!.sentiment).toBe('positive')
    expect(insight!.title).toBe('Training consistency improved.')
    expect(insight!.detail).toBe('You trained 2 sessions this week, up from 1 session last week.')
  })

  it('reports declining consistency as a negative insight', () => {
    const result = computeWeeklyInsights(
      input(
        [
          { id: 'w1', date: daysAgo(9) },
          { id: 'w2', date: daysAgo(8) },
          { id: 'w3', date: daysAgo(2) },
        ],
        [
          { id: 'we1', workoutId: 'w1', exerciseId: 'bench' },
          { id: 'we2', workoutId: 'w2', exerciseId: 'bench' },
          { id: 'we3', workoutId: 'w3', exerciseId: 'bench' },
        ],
        [
          { id: 'a1', workoutExerciseId: 'we1', weight: 60, reps: 10 },
          { id: 'a2', workoutExerciseId: 'we2', weight: 60, reps: 10 },
          { id: 'a3', workoutExerciseId: 'we3', weight: 60, reps: 10 },
        ],
      ),
    )

    const insight = find(result, 'consistency')
    expect(insight).toBeDefined()
    expect(insight!.sentiment).toBe('negative')
    expect(insight!.title).toBe('Training consistency dropped.')
  })

  it('reports improved recovery from longer rest between workouts', () => {
    const result = computeWeeklyInsights(
      input(
        [
          { id: 'w1', date: daysAgo(16) },
          { id: 'w2', date: daysAgo(13) },
          { id: 'w3', date: daysAgo(9) },
          { id: 'w4', date: daysAgo(2) },
          { id: 'w5', date: daysAgo(1) },
        ],
        [1, 2, 3, 4, 5].map(n => ({ id: `we${n}`, workoutId: `w${n}`, exerciseId: 'bench' })),
        [1, 2, 3, 4, 5].map(n => ({ id: `s${n}`, workoutExerciseId: `we${n}`, weight: 60, reps: 10 })),
      ),
    )

    const insight = find(result, 'recovery')
    expect(insight).toBeDefined()
    expect(insight!.sentiment).toBe('positive')
    expect(insight!.title).toBe('Recovery improved.')
    expect(insight!.detail).toBe(
      'You averaged 4.0 days of rest between workouts this week, up from 3.5 days last week.',
    )
  })

  it('returns at most three insights ordered by importance', () => {
    const result = computeWeeklyInsights(
      input(
        [
          { id: 'w1', date: daysAgo(9) },
          { id: 'w2', date: daysAgo(2) },
          { id: 'w3', date: daysAgo(1) },
        ],
        [
          { id: 'we1', workoutId: 'w1', exerciseId: 'squat' },
          { id: 'we2', workoutId: 'w2', exerciseId: 'row' },
          { id: 'we3', workoutId: 'w3', exerciseId: 'bench' },
        ],
        [
          ...[1, 2].map(n => ({ id: `rb${n}`, workoutExerciseId: 'we2', weight: 40, reps: 10 })),
          ...[1, 2, 3, 4].map(n => ({ id: `cb${n}`, workoutExerciseId: 'we3', weight: 60, reps: 10 })),
          { id: 'sq1', workoutExerciseId: 'we1', weight: 100, reps: 8 },
        ],
      ),
    )

    expect(result.length).toBeLessThanOrEqual(3)
    expect(result[0].type).toBe('neglect')
    const types = result.map(i => i.type).sort()
    expect(types).toEqual(['consistency', 'imbalance', 'neglect'])
  })
})

describe('selectTopInsights', () => {
  const make = (type: string, score: number): TrainingInsight => ({
    id: type,
    type: type as TrainingInsight['type'],
    sentiment: 'neutral',
    title: type,
    score,
  })

  it('sorts by score descending and limits to three', () => {
    const selected = selectTopInsights([
      make('recovery', 4),
      make('neglect', 9),
      make('consistency', 5),
      make('imbalance', 3),
      make('streak', 7),
    ])
    expect(selected.map(i => i.id)).toEqual(['neglect', 'streak', 'consistency'])
  })
})
