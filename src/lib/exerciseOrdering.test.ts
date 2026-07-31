import { describe, it, expect } from 'vitest'
import { sortExercisesByRecency } from './exerciseOrdering'

const ex = (id: string, createdAt?: number) => ({ id, createdAt })

describe('sortExercisesByRecency', () => {
  it('sorts never-logged exercises by createdAt descending (newest first)', () => {
    const exercises = [ex('old', 100), ex('new', 300), ex('mid', 200)]
    expect(sortExercisesByRecency(exercises, new Map()).map(e => e.id)).toEqual(['new', 'mid', 'old'])
  })

  it('puts exercises with a recent workout at the top', () => {
    const exercises = [ex('unused', 500), ex('recent', 100), ex('older-log', 100)]
    const lastLogged = new Map([
      ['recent', '2026-07-31T10:00:00.000Z'],
      ['older-log', '2026-01-01T10:00:00.000Z'],
    ])
    expect(sortExercisesByRecency(exercises, lastLogged).map(e => e.id)).toEqual(['recent', 'older-log', 'unused'])
  })

  it('breaks ties on the same workout date by createdAt', () => {
    const exercises = [ex('a', 100), ex('b', 200)]
    const lastLogged = new Map([
      ['a', '2026-07-31T10:00:00.000Z'],
      ['b', '2026-07-31T10:00:00.000Z'],
    ])
    expect(sortExercisesByRecency(exercises, lastLogged).map(e => e.id)).toEqual(['b', 'a'])
  })

  it('falls back to alphabetical order when created at the same time', () => {
    const exercises = [
      { id: '1', name: 'Zulu', createdAt: 100 },
      { id: '2', name: 'Alpha', createdAt: 100 },
      { id: '3', name: 'Mid', createdAt: 100 },
    ]
    expect(sortExercisesByRecency(exercises, new Map()).map(e => e.name)).toEqual(['Alpha', 'Mid', 'Zulu'])
  })

  it('does not mutate the input array', () => {
    const exercises = [ex('a', 1), ex('b', 2)]
    const original = [...exercises]
    sortExercisesByRecency(exercises, new Map())
    expect(exercises).toEqual(original)
  })

  it('handles legacy exercises without createdAt', () => {
    const exercises = [
      { id: 'legacy' },
      { id: 'new', createdAt: 100 },
    ]
    expect(sortExercisesByRecency(exercises, new Map()).map(e => e.id)).toEqual(['new', 'legacy'])
  })
})
