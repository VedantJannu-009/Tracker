import { describe, expect, it } from 'vitest'
import {
  Bike,
  Cable,
  Cog,
  Disc3,
  Dumbbell,
  Footprints,
  Grip,
  Hand,
  PersonStanding,
  Ship,
  Torus,
  Weight,
} from 'lucide-react'
import { getExerciseIcon } from '@/lib/exerciseIcon'

describe('getExerciseIcon', () => {
  it('maps barbell and dumbbell equipment to a weight icon', () => {
    expect(getExerciseIcon('Bench Press', 'Barbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Incline Bench Press', 'Barbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Deadlift', 'Barbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Squat', 'Barbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Shoulder Press', 'Dumbbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Lateral Raise', 'Dumbbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Front Raise', 'Dumbbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Overhead Triceps Extension', 'Dumbbell')).toBe(Dumbbell)
  })

  it('maps bodyweight calisthenics to hand and grip icons', () => {
    expect(getExerciseIcon('Push Up', 'Bodyweight')).toBe(Hand)
    expect(getExerciseIcon('Diamond Pushup', 'Bodyweight')).toBe(Hand)
    expect(getExerciseIcon('Pull Up', 'Bodyweight')).toBe(Grip)
  })

  it('maps cable work to the cable icon', () => {
    expect(getExerciseIcon('Face Pull', 'Cable')).toBe(Cable)
    expect(getExerciseIcon('Triceps Pushdown', 'Cable')).toBe(Cable)
    expect(getExerciseIcon('Lat Pulldown', 'Cable')).toBe(Cable)
    expect(getExerciseIcon('Seated Row', 'Cable')).toBe(Cable)
  })

  it('maps arm curls to a flexed-arm icon', () => {
    expect(getExerciseIcon('Bicep Curl', 'Barbell')).toBe(Hand)
    expect(getExerciseIcon('Hammer Curl', 'Dumbbell')).toBe(Hand)
    expect(getExerciseIcon('Preacher Curl', 'Barbell')).toBe(Hand)
  })

  it('maps leg machines and lower-body work to leg or plate icons', () => {
    expect(getExerciseIcon('Leg Press', 'Machine')).toBe(Disc3)
    expect(getExerciseIcon('Leg Extension', 'Machine')).toBe(Footprints)
    expect(getExerciseIcon('Leg Curl', 'Machine')).toBe(Footprints)
    expect(getExerciseIcon('Calf Raise', 'Bodyweight')).toBe(Footprints)
    expect(getExerciseIcon('Lunge', 'Dumbbell')).toBe(Footprints)
  })

  it('maps core work to a core icon', () => {
    expect(getExerciseIcon('Crunch', 'Bodyweight')).toBe(PersonStanding)
    expect(getExerciseIcon('Leg Raise', 'Bodyweight')).toBe(PersonStanding)
    expect(getExerciseIcon('Plank', 'Bodyweight')).toBe(PersonStanding)
    expect(getExerciseIcon('Russian Twist', 'Bodyweight')).toBe(PersonStanding)
  })

  it('maps carry, neck and miscellaneous work', () => {
    expect(getExerciseIcon('Farmer Walk', 'Dumbbell')).toBe(Weight)
    expect(getExerciseIcon('Barbell Shrug', 'Barbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Neck Curl', 'Bodyweight')).toBe(PersonStanding)
  })

  it('maps cardio exercises', () => {
    expect(getExerciseIcon('Running', 'Bodyweight')).toBe(PersonStanding)
    expect(getExerciseIcon('Cycling', 'Machine')).toBe(Bike)
    expect(getExerciseIcon('Walking', 'Bodyweight')).toBe(Footprints)
    expect(getExerciseIcon('Rowing', 'Machine')).toBe(Ship)
  })

  it('keeps barbell rows on the weight icon rather than the rowing icon', () => {
    expect(getExerciseIcon('Bent Over Row', 'Barbell')).toBe(Dumbbell)
    expect(getExerciseIcon('T-Bar Row', 'Barbell')).toBe(Dumbbell)
    expect(getExerciseIcon('Upright Row', 'Barbell')).toBe(Dumbbell)
  })

  it('maps machine work to a machine icon', () => {
    expect(getExerciseIcon('Reverse Pec Deck', 'Machine')).toBe(Cog)
    expect(getExerciseIcon('Adductor Machine', 'Machine')).toBe(Cog)
  })

  it('maps plate and band equipment', () => {
    expect(getExerciseIcon('Neck Harness', 'Plate')).toBe(PersonStanding)
    expect(getExerciseIcon('Band Pull Apart', 'Band')).toBe(Torus)
    expect(getExerciseIcon('Kettlebell Swing', 'Kettlebell')).toBe(Weight)
  })

  it('falls back to the dumbbell icon for unknown exercises', () => {
    expect(getExerciseIcon('Something Bizarre', 'Unknown')).toBe(Dumbbell)
    expect(getExerciseIcon('', '')).toBe(Dumbbell)
  })

  it('uses a body icon for unknown bodyweight work', () => {
    expect(getExerciseIcon('Hip Thrust', 'Bodyweight')).toBe(PersonStanding)
    expect(getExerciseIcon('Glute Bridge', 'Bodyweight')).toBe(PersonStanding)
  })
})
