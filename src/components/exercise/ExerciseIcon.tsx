import { createElement } from 'react'
import { getExerciseIcon } from '@/lib/exerciseIcon'

interface ExerciseIconProps {
  name: string
  equipment: string
  size?: number
  strokeWidth?: number
  className?: string
}

export function ExerciseIcon({ name, equipment, size = 14, strokeWidth = 2, className }: ExerciseIconProps) {
  return createElement(getExerciseIcon(name, equipment), { size, strokeWidth, className })
}
