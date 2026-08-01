import type { MuscleGroup } from '@/types'

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

export type InsightSentiment = 'positive' | 'negative' | 'neutral'
export type InsightType = 'imbalance' | 'neglect' | 'consistency' | 'recovery'

export interface TrainingInsight {
  id: string
  type: InsightType
  sentiment: InsightSentiment
  title: string
  detail?: string
  score: number
}

export interface InsightInput {
  workouts: { id: string; date: string }[]
  workoutExercises: { id: string; workoutId: string; exerciseId: string }[]
  workoutSets: { id: string; workoutExerciseId: string; weight: number; reps: number }[]
  exercises: { id: string; muscleGroupId: string }[]
  muscleGroups: Pick<MuscleGroup, 'id' | 'name'>[]
  now?: number
}

export const INSIGHT_LIMIT = 3
export const NEGLECT_THRESHOLD_DAYS = 5
export const IMBALANCE_RATIO = 2
export const RECOVERY_CHANGE_HOURS = 2

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function fmtRatio(ratio: number): string {
  const rounded = Math.round(ratio * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function fmtRest(hours: number): string {
  if (hours >= 48) return `${(Math.round((hours / 24) * 10) / 10).toFixed(1)} days`
  return `${Math.round(hours)}h`
}

function isLogged(set: { weight: number; reps: number }): boolean {
  return set.reps > 0 || set.weight > 0
}

export function selectTopInsights(insights: TrainingInsight[], limit = INSIGHT_LIMIT): TrainingInsight[] {
  return [...insights].sort((a, b) => b.score - a.score).slice(0, limit)
}

export function computeWeeklyInsights(input: InsightInput): TrainingInsight[] {
  const now = input.now ?? Date.now()
  const thisWeekStart = now - WEEK_MS
  const prevWeekStart = now - 2 * WEEK_MS

  const weExercise = new Map(input.workoutExercises.map(we => [we.id, we.exerciseId]))
  const weWorkout = new Map(input.workoutExercises.map(we => [we.id, we.workoutId]))
  const exMuscle = new Map(input.exercises.map(e => [e.id, e.muscleGroupId]))
  const muscleName = new Map(input.muscleGroups.map(m => [m.id, m.name]))

  const workoutTime = new Map<string, number>()
  for (const w of input.workouts) {
    const t = new Date(w.date).getTime()
    if (!Number.isNaN(t)) workoutTime.set(w.id, t)
  }

  const trainedMuscles = new Set<string>()
  const lastTrainedAt = new Map<string, number>()
  const weeklyVolume = new Map<string, number>()
  const weeklySets = new Map<string, number>()
  const completedWorkoutIds = new Set<string>()

  for (const set of input.workoutSets) {
    if (!isLogged(set)) continue
    const workoutId = weWorkout.get(set.workoutExerciseId)
    if (workoutId === undefined) continue
    const t = workoutTime.get(workoutId)
    if (t === undefined) continue
    const exerciseId = weExercise.get(set.workoutExerciseId)
    const muscleId = exerciseId === undefined ? undefined : exMuscle.get(exerciseId)
    if (muscleId === undefined) continue

    completedWorkoutIds.add(workoutId)
    const prevLast = lastTrainedAt.get(muscleId)
    if (prevLast === undefined || t > prevLast) lastTrainedAt.set(muscleId, t)
    trainedMuscles.add(muscleId)

    if (t >= thisWeekStart && t < now) {
      weeklyVolume.set(muscleId, (weeklyVolume.get(muscleId) ?? 0) + set.weight * set.reps)
      weeklySets.set(muscleId, (weeklySets.get(muscleId) ?? 0) + 1)
    }
  }

  const insights: TrainingInsight[] = []

  const nameOf = (id: string) => muscleName.get(id) ?? id

  let worstMuscle: { id: string; gap: number } | null = null
  for (const id of trainedMuscles) {
    const gap = Math.floor((now - (lastTrainedAt.get(id) ?? now)) / DAY_MS)
    if (gap >= NEGLECT_THRESHOLD_DAYS && (!worstMuscle || gap > worstMuscle.gap)) {
      worstMuscle = { id, gap }
    }
  }
  if (worstMuscle) {
    insights.push({
      id: `neglect:${worstMuscle.id}`,
      type: 'neglect',
      sentiment: 'negative',
      title: `It's been ${plural(worstMuscle.gap, 'day')} since you trained ${nameOf(worstMuscle.id)}.`,
      detail: 'This muscle is fully recovered and ready for attention.',
      score: Math.min(worstMuscle.gap, 14),
    })
  }

  const weighted = [...weeklyVolume.entries()]
    .filter(([id, volume]) => volume > 0 && (weeklySets.get(id) ?? 0) >= 2)
    .sort((a, b) => b[1] - a[1])

  let bestPair: { hi: string; lo: string; ratio: number } | null = null
  for (let i = 0; i < weighted.length; i++) {
    for (let j = i + 1; j < weighted.length; j++) {
      const ratio = weighted[i][1] / weighted[j][1]
      if (ratio < IMBALANCE_RATIO) continue
      if (!bestPair || ratio > bestPair.ratio) {
        bestPair = { hi: weighted[i][0], lo: weighted[j][0], ratio }
      }
    }
  }
  if (bestPair) {
    insights.push({
      id: `imbalance:${bestPair.hi}:${bestPair.lo}`,
      type: 'imbalance',
      sentiment: 'neutral',
      title: `${nameOf(bestPair.hi)} received ${fmtRatio(bestPair.ratio)}x more volume than ${nameOf(bestPair.lo)}.`,
      detail: `Balance your next few sessions around ${nameOf(bestPair.lo)}.`,
      score: Math.min(bestPair.ratio, 5),
    })
  }

  const completedTimes = [...completedWorkoutIds]
    .map(id => workoutTime.get(id))
    .filter((t): t is number => t !== undefined)

  const thisWeekCount = completedTimes.filter(t => t >= thisWeekStart && t < now).length
  const prevWeekCount = completedTimes.filter(t => t >= prevWeekStart && t < thisWeekStart).length

  if (thisWeekCount > prevWeekCount) {
    insights.push({
      id: 'consistency:up',
      type: 'consistency',
      sentiment: 'positive',
      title: 'Training consistency improved.',
      detail: `You trained ${plural(thisWeekCount, 'session')} this week, up from ${plural(prevWeekCount, 'session')} last week.`,
      score: 3 + Math.min(thisWeekCount - prevWeekCount, 3),
    })
  } else if (thisWeekCount < prevWeekCount) {
    insights.push({
      id: 'consistency:down',
      type: 'consistency',
      sentiment: 'negative',
      title: 'Training consistency dropped.',
      detail: `You trained ${plural(thisWeekCount, 'session')} this week, down from ${plural(prevWeekCount, 'session')} last week.`,
      score: 3 + Math.min(prevWeekCount - thisWeekCount, 3),
    })
  }

  const sorted = [...completedTimes].sort((a, b) => a - b)
  const gapsThisWeek: number[] = []
  const gapsPrevWeek: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    const hours = (cur - prev) / (60 * 60 * 1000)
    if (cur >= thisWeekStart && cur < now) gapsThisWeek.push(hours)
    else if (cur >= prevWeekStart && cur < thisWeekStart) gapsPrevWeek.push(hours)
  }
  const avg = (arr: number[]) => (arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length)
  const avgThis = avg(gapsThisWeek)
  const avgPrev = avg(gapsPrevWeek)

  if (avgThis !== null && avgPrev !== null) {
    const change = avgThis - avgPrev
    if (change >= RECOVERY_CHANGE_HOURS) {
      insights.push({
        id: 'recovery:up',
        type: 'recovery',
        sentiment: 'positive',
        title: 'Recovery improved.',
        detail: `You averaged ${fmtRest(avgThis)} of rest between workouts this week, up from ${fmtRest(avgPrev)} last week.`,
        score: 4 + Math.min(Math.round(change / 4), 3),
      })
    } else if (change <= -RECOVERY_CHANGE_HOURS) {
      insights.push({
        id: 'recovery:down',
        type: 'recovery',
        sentiment: 'negative',
        title: 'Recovery could improve.',
        detail: `You averaged ${fmtRest(avgThis)} of rest between workouts this week, down from ${fmtRest(avgPrev)} last week.`,
        score: 4 + Math.min(Math.round(-change / 4), 3),
      })
    }
  }

  return selectTopInsights(insights)
}
