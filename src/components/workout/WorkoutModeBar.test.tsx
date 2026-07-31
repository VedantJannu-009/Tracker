import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useWorkoutStore } from '@/stores/workoutStore'
import { WorkoutModeBar } from './WorkoutModeBar'

const baseWorkout = { id: 'w1', name: 'Chest Day', date: '2026-01-01T00:00:00.000Z', createdAt: Date.now() }

function activeExercises() {
  return [
    {
      id: 'we1',
      workoutId: 'w1',
      exerciseId: 'bench-press',
      order: 0,
      sets: [
        { id: 's1', workoutExerciseId: 'we1', weight: 60, reps: 10, order: 0 },
        { id: 's2', workoutExerciseId: 'we1', weight: 60, reps: 8, order: 1 },
      ],
    },
  ]
}

describe('WorkoutModeBar', () => {
  afterEach(() => {
    useWorkoutStore.getState().reset()
    vi.useRealTimers()
  })

  it('renders nothing when no sets are logged', () => {
    useWorkoutStore.setState({ currentWorkout: baseWorkout, currentExercises: [] })
    const { container } = render(<WorkoutModeBar unit="kg" currentExerciseName={null} onFinish={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows live stats, the current exercise and the finish button', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    useWorkoutStore.setState({
      currentWorkout: { ...baseWorkout, createdAt: Date.now() },
      currentExercises: activeExercises(),
    })
    const onFinish = vi.fn()
    render(<WorkoutModeBar unit="kg" currentExerciseName="Bench Press" onFinish={onFinish} />)

    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('1080')).toBeInTheDocument()
    expect(screen.getByText('00:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Finish Workout/i }))
    expect(onFinish).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(65000)
    })
    expect(screen.getByText('01:05')).toBeInTheDocument()
  })
})
