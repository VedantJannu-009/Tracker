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
  type LucideIcon,
} from 'lucide-react'

export const MUSCLE_ICON_MAP: Record<string, LucideIcon> = {
  neck: UserRound,
  chest: Shield,
  shoulders: CircleDot,
  back: Mountain,
  legs: Footprints,
  abs: Target,
  biceps: Dumbbell,
  triceps: Dumbbell,
  forearms: Grip,
  'full-body': Activity,
}

export function getMuscleIcon(muscleId: string): LucideIcon {
  return MUSCLE_ICON_MAP[muscleId] ?? Activity
}
