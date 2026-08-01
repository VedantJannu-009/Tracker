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
  type LucideIcon,
} from 'lucide-react'

const KEYWORD_RULES: { pattern: RegExp; icon: LucideIcon }[] = [
  { pattern: /\bpush[\s-]?ups?\b/i, icon: Hand },
  { pattern: /\bpull[\s-]?ups?\b/i, icon: Grip },
  { pattern: /\bleg[\s-]press\b/i, icon: Disc3 },
  { pattern: /\bleg[\s-](curl|extension)\b/i, icon: Footprints },
  { pattern: /\bcalf\b/i, icon: Footprints },
  { pattern: /\blunge/i, icon: Footprints },
  { pattern: /\bfarmer\b/i, icon: Weight },
  { pattern: /\bplank\b/i, icon: PersonStanding },
  { pattern: /\b(crunch|twist)\b/i, icon: PersonStanding },
  { pattern: /\bleg[\s-]raise\b/i, icon: PersonStanding },
  { pattern: /\bneck\b/i, icon: PersonStanding },
  { pattern: /\bcurl\b/i, icon: Hand },
  { pattern: /\b(run|running|jog)\b/i, icon: PersonStanding },
  { pattern: /\b(walk|walking)\b/i, icon: Footprints },
  { pattern: /\b(cycle|cycling|bike|spinning)\b/i, icon: Bike },
  { pattern: /\b(rowing|ergometer|row[\s-]machine)\b/i, icon: Ship },
]

const EQUIPMENT_MAP: Record<string, LucideIcon> = {
  Cable: Cable,
  Dumbbell: Dumbbell,
  Barbell: Dumbbell,
  Machine: Cog,
  Plate: Disc3,
  Band: Torus,
  Kettlebell: Weight,
}

export function getExerciseIcon(name: string, equipment: string): LucideIcon {
  const exerciseName = name ?? ''
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(exerciseName)) return rule.icon
  }
  const equipmentIcon = EQUIPMENT_MAP[equipment]
  if (equipmentIcon) return equipmentIcon
  if (equipment === 'Bodyweight') return PersonStanding
  return Dumbbell
}
