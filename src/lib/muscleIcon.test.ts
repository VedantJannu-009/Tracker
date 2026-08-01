import { describe, expect, it } from 'vitest'
import {
  Activity,
  CircleDot,
  Dumbbell,
  Footprints,
  Grip,
  Mountain,
  Shield,
  Target,
  UserRound,
} from 'lucide-react'
import { getMuscleIcon } from '@/lib/muscleIcon'

describe('getMuscleIcon', () => {
  it('maps every seeded muscle group to a distinct professional icon', () => {
    expect(getMuscleIcon('neck')).toBe(UserRound)
    expect(getMuscleIcon('chest')).toBe(Shield)
    expect(getMuscleIcon('shoulders')).toBe(CircleDot)
    expect(getMuscleIcon('back')).toBe(Mountain)
    expect(getMuscleIcon('legs')).toBe(Footprints)
    expect(getMuscleIcon('abs')).toBe(Target)
    expect(getMuscleIcon('biceps')).toBe(Dumbbell)
    expect(getMuscleIcon('triceps')).toBe(Dumbbell)
    expect(getMuscleIcon('forearms')).toBe(Grip)
  })

  it('maps a full-body id to a whole-body icon', () => {
    expect(getMuscleIcon('full-body')).toBe(Activity)
  })

  it('falls back to a neutral activity icon for unknown ids', () => {
    expect(getMuscleIcon('lats')).toBe(Activity)
    expect(getMuscleIcon('')).toBe(Activity)
    expect(getMuscleIcon('unknown')).toBe(Activity)
  })

  it('is case sensitive to the canonical lowercase ids', () => {
    expect(getMuscleIcon('Chest')).toBe(Activity)
  })
})
