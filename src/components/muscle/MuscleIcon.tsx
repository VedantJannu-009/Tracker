import { createElement } from 'react'
import { getMuscleIcon } from '@/lib/muscleIcon'

interface MuscleIconProps {
  muscleId: string
  size?: number
  strokeWidth?: number
  className?: string
}

export function MuscleIcon({ muscleId, size = 14, strokeWidth = 2, className }: MuscleIconProps) {
  return createElement(getMuscleIcon(muscleId), { size, strokeWidth, className })
}
