import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkoutCompleteModal, type WorkoutSummary } from './WorkoutCompleteModal'

const summary: WorkoutSummary = {
  workoutName: 'Chest Day',
  durationSec: 3000,
  exerciseCount: 3,
  setCount: 15,
  volume: 5000,
  best: { weight: 100, exerciseName: 'Bench Press' },
}

describe('WorkoutCompleteModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <WorkoutCompleteModal open={false} summary={summary} unit="kg" onDone={() => {}} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows the summary and calls onDone', () => {
    const onDone = vi.fn()
    render(<WorkoutCompleteModal open summary={summary} unit="kg" onDone={onDone} />)

    expect(screen.getByRole('dialog', { name: /Workout Complete/i })).toBeInTheDocument()
    expect(screen.getByText('Chest Day')).toBeInTheDocument()
    expect(screen.getByText('50m')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('5000 kg')).toBeInTheDocument()
    expect(screen.getByText(/Bench Press/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Done$/ }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onDone = vi.fn()
    render(<WorkoutCompleteModal open summary={summary} unit="kg" onDone={onDone} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
