import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { ExerciseCard } from './ExerciseCard'

interface HarnessProps {
  onDelete?: () => void
  onEdit?: () => void
  equipment?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  lastWorkout?: string | null
  pr?: { weight: number; reps: number; volume: number } | null
  active?: boolean
}

function Harness({ onDelete, onEdit, ...rest }: HarnessProps) {
  return (
    <ExerciseCard
      name="Bench Press"
      sets={[]}
      unit="kg"
      weight=""
      reps=""
      onWeightChange={() => {}}
      onRepsChange={() => {}}
      onAddSet={() => {}}
      onRemoveSet={() => {}}
      onDelete={onDelete ?? (() => {})}
      onEdit={onEdit ?? (() => {})}
      {...rest}
    />
  )
}

describe('ExerciseCard', () => {
  it('renders the exercise name and the three-dot overflow menu', () => {
    render(<Harness />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Actions for Bench Press/i })).toBeInTheDocument()
  })

  it('opens a menu with Edit and Delete, and triggers callbacks', () => {
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    render(<Harness onDelete={onDelete} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /Actions for Bench Press/i }))
    expect(screen.getByRole('menuitem', { name: /Edit Exercise/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Delete Exercise/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: /Edit Exercise/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /Actions for Bench Press/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete Exercise/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('shows equipment, difficulty, last workout and PR info', () => {
    render(
      <Harness
        equipment="Barbell"
        difficulty="intermediate"
        lastWorkout={new Date().toISOString()}
        pr={{ weight: 100, reps: 10, volume: 1000 }}
      />
    )
    expect(screen.getByText('Barbell')).toBeInTheDocument()
    expect(screen.getByText('intermediate')).toBeInTheDocument()
    expect(screen.getByText(/Last Today/i)).toBeInTheDocument()
    expect(screen.getByText('PR 100 kg')).toBeInTheDocument()
  })

  it('shows "No previous workout" when there is no history', () => {
    render(<Harness />)
    expect(screen.getByText('No previous workout')).toBeInTheDocument()
  })

  it('highlights the active exercise with an accent bar', () => {
    const { container } = render(<Harness active />)
    expect(container.querySelector('div.bg-primary')).not.toBeNull()
  })
})
