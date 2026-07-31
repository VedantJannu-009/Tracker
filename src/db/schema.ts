import Dexie, { type EntityTable } from 'dexie'
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

export class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  workoutExercises!: EntityTable<WorkoutExercise, 'id'>
  workoutSets!: EntityTable<WorkoutSet, 'id'>
  muscleGroups!: EntityTable<MuscleGroup, 'id'>
  goals!: EntityTable<Goal, 'id'>
  personalRecords!: EntityTable<PersonalRecord, 'id'>
  bodyMeasurements!: EntityTable<BodyMeasurement, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  customCards!: EntityTable<CustomCard, 'id'>
  weeklyGoals!: EntityTable<WeeklyGoal, 'id'>

  constructor() {
    super('gymtracker')
    this.version(1).stores({
      exercises: 'id, name, muscleGroupId, equipment, difficulty',
      workouts: 'id, name, date, createdAt',
      workoutExercises: 'id, workoutId, exerciseId, order',
      workoutSets: 'id, workoutExerciseId, weight, reps, order',
      muscleGroups: 'id, name',
      goals: 'id, title, exerciseId, muscleGroupId, completed, createdAt',
      personalRecords: 'id, exerciseId, type, achievedAt',
      bodyMeasurements: 'id, date',
      settings: 'id',
      customCards: 'id, title, pinned, order',
    })
    this.version(2).stores({
      weeklyGoals: 'id, muscleGroupId',
    })
    this.version(3).stores({
      exercises: 'id, name, muscleGroupId, equipment, difficulty',
      workouts: 'id, name, date, createdAt',
      workoutExercises: 'id, workoutId, exerciseId, order',
      workoutSets: 'id, workoutExerciseId, weight, reps, order',
      muscleGroups: 'id, name',
      goals: 'id, title, exerciseId, muscleGroupId, completed, createdAt',
      personalRecords: 'id, exerciseId, type, achievedAt, workoutId, [exerciseId+type]',
      bodyMeasurements: 'id, date',
      settings: 'id',
      customCards: 'id, title, pinned, order',
      weeklyGoals: 'id, muscleGroupId',
    })
  }
}

export const db = new GymDB()
