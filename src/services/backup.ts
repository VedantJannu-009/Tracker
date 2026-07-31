import { db } from '@/db/schema'
import type { Table } from 'dexie'
import type {
  Exercise,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  MuscleGroup,
  Goal,
  PersonalRecord,
  BodyMeasurement,
  AppSettings,
  CustomCard,
  WeeklyGoal,
} from '@/types'

export interface BackupData {
  version: 1
  exportedAt: string
  muscleGroups?: MuscleGroup[]
  exercises?: Exercise[]
  workouts?: Workout[]
  workoutExercises?: WorkoutExercise[]
  workoutSets?: WorkoutSet[]
  goals?: Goal[]
  weeklyGoals?: WeeklyGoal[]
  personalRecords?: PersonalRecord[]
  bodyMeasurements?: BodyMeasurement[]
  customCards?: CustomCard[]
  settings?: AppSettings[]
}

export async function exportBackup(): Promise<BackupData> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    muscleGroups: await db.muscleGroups.toArray(),
    exercises: await db.exercises.toArray(),
    workouts: await db.workouts.toArray(),
    workoutExercises: await db.workoutExercises.toArray(),
    workoutSets: await db.workoutSets.toArray(),
    goals: await db.goals.toArray(),
    weeklyGoals: await db.weeklyGoals.toArray(),
    personalRecords: await db.personalRecords.toArray(),
    bodyMeasurements: await db.bodyMeasurements.toArray(),
    customCards: await db.customCards.toArray(),
    settings: await db.settings.toArray(),
  }
}

export function downloadBackup(data: BackupData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gym-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const TABLES = [
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

export async function importBackup(raw: unknown): Promise<void> {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid backup file')
  }
  const data = raw as Partial<BackupData>
  if (!Array.isArray(data.workouts) || !Array.isArray(data.workoutExercises)) {
    throw new Error('Not a Gym Tracker backup file')
  }

  await db.transaction('rw', TABLES, async () => {
    for (const table of TABLES) {
      await table.clear()
    }

    const additions: Array<{ table: Table<unknown, string>; rows?: unknown[] }> = [
      { table: db.muscleGroups, rows: data.muscleGroups },
      { table: db.exercises, rows: data.exercises },
      { table: db.workouts, rows: data.workouts },
      { table: db.workoutExercises, rows: data.workoutExercises },
      { table: db.workoutSets, rows: data.workoutSets },
      { table: db.goals, rows: data.goals },
      { table: db.weeklyGoals, rows: data.weeklyGoals },
      { table: db.personalRecords, rows: data.personalRecords },
      { table: db.bodyMeasurements, rows: data.bodyMeasurements },
      { table: db.customCards, rows: data.customCards },
      { table: db.settings, rows: data.settings },
    ]

    for (const { table, rows } of additions) {
      if (rows && rows.length > 0) {
        await table.bulkAdd(rows)
      }
    }
  })
}
