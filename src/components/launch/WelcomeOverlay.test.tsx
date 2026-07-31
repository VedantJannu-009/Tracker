import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useLaunchStore } from '@/stores/launchStore'
import { WelcomeOverlay } from './WelcomeOverlay'

describe('WelcomeOverlay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing before the welcome is shown', () => {
    useLaunchStore.setState({ welcomeShown: false })
    const { container } = render(<WelcomeOverlay />)
    expect(container.firstChild).toBeNull()
  })

  it('welcomes a first-time user with the onboarding copy', () => {
    useLaunchStore.setState({ welcomeShown: true, isFirstLaunch: true })
    render(<WelcomeOverlay />)
    expect(screen.getByText('Welcome to My Tracker')).toBeInTheDocument()
    expect(screen.getByText("Let's build your best physique.")).toBeInTheDocument()
  })

  it('greets a returning user by time of day and fades after ~2s', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T04:30:00.000Z'))
    useLaunchStore.setState({ welcomeShown: true, isFirstLaunch: false })
    render(<WelcomeOverlay />)

    expect(screen.getByText('Good Morning')).toBeInTheDocument()
    expect(screen.getByText('Ready to train?')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByText('Good Morning')).toBeInTheDocument()

    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.queryByText('Good Morning')).not.toBeInTheDocument()
    expect(screen.queryByText('Ready to train?')).not.toBeInTheDocument()
  })
})
