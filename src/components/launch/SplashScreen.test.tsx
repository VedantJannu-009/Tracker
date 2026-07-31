import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useLaunchStore } from '@/stores/launchStore'
import { SplashScreen } from './SplashScreen'

describe('SplashScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T04:30:00.000Z'))
    useLaunchStore.setState({ phase: 'splash', ready: false, welcomeShown: false })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('follows the timed reveal: tagline at 1.3s, then preparing at 2.0s', () => {
    render(<SplashScreen />)

    expect(screen.queryByText('Train. Track. Progress.')).not.toBeInTheDocument()
    expect(screen.queryByText(/Preparing your workout/i)).not.toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(1300) })
    expect(screen.getByText('Train. Track. Progress.')).toBeInTheDocument()
    expect(screen.queryByText(/Preparing your workout/i)).not.toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(700) })
    expect(screen.queryByText('Train. Track. Progress.')).not.toBeInTheDocument()
    expect(screen.getByText(/Preparing your workout/i)).toBeInTheDocument()
  })

  it('stays on the splash until initialization completes', () => {
    render(<SplashScreen />)

    act(() => { vi.advanceTimersByTime(2800) })
    expect(useLaunchStore.getState().phase).toBe('splash')

    act(() => { useLaunchStore.getState().setReady() })
    act(() => { vi.advanceTimersByTime(50) })
    expect(useLaunchStore.getState().phase).toBe('enter')
  })

  it('begins the entrance only after the full timeline has played', () => {
    useLaunchStore.getState().setReady()
    render(<SplashScreen />)

    act(() => { vi.advanceTimersByTime(2000) })
    expect(useLaunchStore.getState().phase).toBe('splash')

    act(() => { vi.advanceTimersByTime(800) })
    expect(useLaunchStore.getState().phase).toBe('enter')
  })

  it('unmounts once the fade-out completes', () => {
    useLaunchStore.getState().setReady()
    render(<SplashScreen />)

    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { vi.advanceTimersByTime(800) })
    expect(useLaunchStore.getState().phase).toBe('enter')

    act(() => { vi.advanceTimersByTime(500) })
    expect(useLaunchStore.getState().phase).toBe('done')
  })
})
