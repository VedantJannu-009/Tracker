import { db } from './schema'
import type { MuscleGroup, Exercise } from '@/types'

export const defaultMuscleGroups: MuscleGroup[] = [
  { id: 'neck', name: 'Neck', icon: '🦒' },
  { id: 'chest', name: 'Chest', icon: '💪' },
  { id: 'shoulders', name: 'Shoulders', icon: '🏋️' },
  { id: 'back', name: 'Back', icon: '🔙' },
  { id: 'legs', name: 'Legs', icon: '🦵' },
  { id: 'abs', name: 'Abs', icon: '🔥' },
  { id: 'biceps', name: 'Biceps', icon: '💪' },
  { id: 'triceps', name: 'Triceps', icon: '💪' },
  { id: 'forearms', name: 'Forearms', icon: '✊' },
]

export const defaultExercises: Exercise[] = [
  { id: 'bench-press', name: 'Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'incline-bench', name: 'Incline Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', muscleGroupId: 'chest', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'push-up', name: 'Push Up', muscleGroupId: 'chest', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'cable-crossover', name: 'Cable Crossover', muscleGroupId: 'chest', equipment: 'Cable', difficulty: 'intermediate' },
  { id: 'decline-bench', name: 'Decline Bench Press', muscleGroupId: 'chest', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'serratus-punch', name: 'Serratus Punch', muscleGroupId: 'chest', equipment: 'Dumbbell', difficulty: 'intermediate' },
  { id: 'overhead-press', name: 'Overhead Press', muscleGroupId: 'shoulders', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell Shoulder Press', muscleGroupId: 'shoulders', equipment: 'Dumbbell', difficulty: 'intermediate' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroupId: 'shoulders', equipment: 'Dumbbell', difficulty: 'intermediate' },
  { id: 'front-raise', name: 'Front Raise', muscleGroupId: 'shoulders', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroupId: 'shoulders', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscleGroupId: 'shoulders', equipment: 'Cable', difficulty: 'beginner' },
  { id: 'reverse-fly', name: 'Reverse Fly', muscleGroupId: 'shoulders', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroupId: 'shoulders', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'reverse-pec-deck', name: 'Reverse Pec Deck', muscleGroupId: 'shoulders', equipment: 'Machine', difficulty: 'beginner' },
  { id: 'bent-over-rear-delt', name: 'Bent Over Rear Delt Raise', muscleGroupId: 'shoulders', equipment: 'Dumbbell', difficulty: 'intermediate' },
  { id: 'seated-barbell-press', name: 'Seated Barbell Press', muscleGroupId: 'shoulders', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', muscleGroupId: 'shoulders', equipment: 'Machine', difficulty: 'beginner' },
  { id: 'upright-row', name: 'Upright Row', muscleGroupId: 'shoulders', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'landmine-press', name: 'Landmine Press', muscleGroupId: 'shoulders', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'pull-up', name: 'Pull Up', muscleGroupId: 'back', equipment: 'Bodyweight', difficulty: 'intermediate' },
  { id: 'bent-over-row', name: 'Bent Over Row', muscleGroupId: 'back', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroupId: 'back', equipment: 'Cable', difficulty: 'beginner' },
  { id: 'deadlift', name: 'Deadlift', muscleGroupId: 'back', equipment: 'Barbell', difficulty: 'advanced' },
  { id: 'seated-row', name: 'Seated Row', muscleGroupId: 'back', equipment: 'Cable', difficulty: 'beginner' },
  { id: 't-bar-row', name: 'T-Bar Row', muscleGroupId: 'back', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'shrug', name: 'Barbell Shrug', muscleGroupId: 'back', equipment: 'Barbell', difficulty: 'beginner' },
  { id: 'face-pull', name: 'Face Pull', muscleGroupId: 'back', equipment: 'Cable', difficulty: 'beginner' },
  { id: 'good-morning', name: 'Good Morning', muscleGroupId: 'back', equipment: 'Barbell', difficulty: 'advanced' },
  { id: 'cable-pullover', name: 'Cable Pullover', muscleGroupId: 'back', equipment: 'Cable', difficulty: 'intermediate' },
  { id: 'squat', name: 'Squat', muscleGroupId: 'legs', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'leg-press', name: 'Leg Press', muscleGroupId: 'legs', equipment: 'Machine', difficulty: 'beginner' },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroupId: 'legs', equipment: 'Machine', difficulty: 'beginner' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroupId: 'legs', equipment: 'Machine', difficulty: 'beginner' },
  { id: 'lunge', name: 'Lunge', muscleGroupId: 'legs', equipment: 'Dumbbell', difficulty: 'intermediate' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroupId: 'legs', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroupId: 'legs', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'glute-bridge', name: 'Glute Bridge', muscleGroupId: 'legs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'calf-raise', name: 'Calf Raise', muscleGroupId: 'legs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'seated-calf', name: 'Seated Calf Raise', muscleGroupId: 'legs', equipment: 'Machine', difficulty: 'beginner' },
  { id: 'donkey-calf', name: 'Donkey Calf Raise', muscleGroupId: 'legs', equipment: 'Machine', difficulty: 'intermediate' },
  { id: 'hip-flexor-stretch', name: 'Hip Flexor Raise', muscleGroupId: 'legs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'cable-pull', name: 'Cable Hip Flexion', muscleGroupId: 'legs', equipment: 'Cable', difficulty: 'intermediate' },
  { id: 'adductor-machine', name: 'Adductor Machine', muscleGroupId: 'legs', equipment: 'Machine', difficulty: 'beginner' },
  { id: 'copenhagen-plank', name: 'Copenhagen Plank', muscleGroupId: 'legs', equipment: 'Bodyweight', difficulty: 'intermediate' },
  { id: 'dorsiflexion', name: 'Dorsiflexion', muscleGroupId: 'legs', equipment: 'Cable', difficulty: 'beginner' },
  { id: 'tib-raise', name: 'Tibialis Raise', muscleGroupId: 'legs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'crunch', name: 'Crunch', muscleGroupId: 'abs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'plank', name: 'Plank', muscleGroupId: 'abs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'leg-raise', name: 'Leg Raise', muscleGroupId: 'abs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroupId: 'abs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'side-plank', name: 'Side Plank', muscleGroupId: 'abs', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'woodchop', name: 'Cable Woodchop', muscleGroupId: 'abs', equipment: 'Cable', difficulty: 'intermediate' },
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroupId: 'biceps', equipment: 'Barbell', difficulty: 'beginner' },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', muscleGroupId: 'biceps', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroupId: 'biceps', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroupId: 'biceps', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', muscleGroupId: 'triceps', equipment: 'Cable', difficulty: 'beginner' },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroupId: 'triceps', equipment: 'Barbell', difficulty: 'intermediate' },
  { id: 'diamond-pushup', name: 'Diamond Push Up', muscleGroupId: 'triceps', equipment: 'Bodyweight', difficulty: 'intermediate' },
  { id: 'overhead-triceps', name: 'Overhead Triceps Extension', muscleGroupId: 'triceps', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'wrist-curl', name: 'Wrist Curl', muscleGroupId: 'forearms', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'farmer-walk', name: 'Farmer Walk', muscleGroupId: 'forearms', equipment: 'Dumbbell', difficulty: 'beginner' },
  { id: 'reverse-curl', name: 'Reverse Curl', muscleGroupId: 'forearms', equipment: 'Barbell', difficulty: 'beginner' },
  { id: 'neck-curl', name: 'Neck Curl', muscleGroupId: 'neck', equipment: 'Bodyweight', difficulty: 'beginner' },
  { id: 'neck-harness', name: 'Neck Harness', muscleGroupId: 'neck', equipment: 'Plate', difficulty: 'advanced' },
]

const OLD_MUSCLE_GROUP_IDS = [
  'traps', 'front-delts', 'side-delts', 'rear-delts',
  'rhomboids', 'teres-major', 'upper-chest', 'serratus',
  'obliques', 'hip-flexors', 'adductors', 'tibialis',
  'middle-back', 'lats', 'lower-back', 'glutes',
  'quadriceps', 'hamstrings', 'calves',
]

const MUSCLE_GROUP_REMAP: Record<string, string> = {
  'upper-chest': 'chest',
  'serratus': 'chest',
  'front-delts': 'shoulders',
  'side-delts': 'shoulders',
  'rear-delts': 'shoulders',
  'traps': 'back',
  'rhomboids': 'back',
  'teres-major': 'back',
  'middle-back': 'back',
  'lats': 'back',
  'lower-back': 'back',
  'obliques': 'abs',
  'hip-flexors': 'legs',
  'adductors': 'legs',
  'tibialis': 'legs',
  'glutes': 'legs',
  'quadriceps': 'legs',
  'hamstrings': 'legs',
  'calves': 'legs',
}

const SHOULDER_EXERCISE_IDS = [
  'overhead-press', 'seated-barbell-press', 'dumbbell-shoulder-press', 'arnold-press',
  'machine-shoulder-press', 'shoulder-press-machine',
  'lateral-raise', 'cable-lateral-raise', 'front-raise',
  'reverse-fly', 'rear-delt-fly', 'reverse-pec-deck',
  'upright-row', 'landmine-press', 'bent-over-rear-delt',
]

async function migrateExercisesById() {
  for (const exId of SHOULDER_EXERCISE_IDS) {
    const ex = await db.exercises.get(exId)
    if (ex && ex.muscleGroupId !== 'shoulders') {
      await db.exercises.update(exId, { muscleGroupId: 'shoulders' })
    }
  }
}

export async function initializeDatabase() {
  await seedDatabase()
  await migrateMuscleGroups()
}

async function seedDatabase() {
  const existing = await db.exercises.count()
  if (existing === 0) {
    await db.muscleGroups.bulkAdd(defaultMuscleGroups)
    await db.exercises.bulkAdd(defaultExercises)
  }

  const settings = await db.settings.get('default')
  if (!settings) {
    await db.settings.put({ id: 'default', theme: 'system', unit: 'kg', soundEnabled: true, restTimer: 90 })
  }
}

async function migrateMuscleGroups() {
  for (const [oldId, newId] of Object.entries(MUSCLE_GROUP_REMAP)) {
    const exercises = await db.exercises.where('muscleGroupId').equals(oldId).toArray()
    for (const ex of exercises) {
      await db.exercises.update(ex.id, { muscleGroupId: newId })
    }
  }

  await migrateExercisesById()

  await db.muscleGroups.bulkDelete(OLD_MUSCLE_GROUP_IDS)

  for (const mg of defaultMuscleGroups) {
    const exists = await db.muscleGroups.get(mg.id)
    if (!exists) {
      await db.muscleGroups.add(mg)
    }
  }

  for (const ex of defaultExercises) {
    const exists = await db.exercises.get(ex.id)
    if (!exists) {
      await db.exercises.add(ex)
    }
  }
}
