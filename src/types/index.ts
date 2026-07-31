export interface MuscleGroup {
  id: string
  name: string
  icon: string
}

export interface Exercise {
  id: string
  name: string
  muscleGroupId: string
  equipment: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface Workout {
  id: string
  name: string
  date: string
  createdAt: number
  duration?: number
  notes?: string
}

export interface WorkoutExercise {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  notes?: string
}

export interface WorkoutSet {
  id: string
  workoutExerciseId: string
  weight: number
  reps: number
  rpe?: number
  order: number
}

export interface Goal {
  id: string
  title: string
  description?: string
  targetValue: number
  currentValue: number
  unit: string
  exerciseId?: string
  muscleGroupId?: string
  deadline?: string
  createdAt: number
  completed: boolean
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  value: number
  type: 'weight' | 'reps' | 'volume'
  achievedAt: string
  workoutId: string
}

export interface BodyMeasurement {
  id: string
  date: string
  weight?: number
  bodyFat?: number
  chest?: number
  waist?: number
  arms?: number
  thighs?: number
  neck?: number
}

export interface CustomCard {
  id: string
  title: string
  icon: string
  accentColor: string
  muscleGroupIds: string[]
  pinned: boolean
  collapsed: boolean
  order: number
}

export interface AppSettings {
  id: string
  theme: 'light' | 'dark' | 'system'
  unit: 'kg' | 'lbs'
  soundEnabled: boolean
  restTimer: number
}

export interface WeeklyGoal {
  id: string
  muscleGroupId: string
  targetSets: number
}
