import { beforeEach, describe, expect, it } from 'vitest'
import { useLaunchStore } from '@/stores/launchStore'

describe('launchStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useLaunchStore.setState({ phase: 'splash', ready: false, welcomeShown: false })
  })

  it('starts in the splash phase and not ready', () => {
    const s = useLaunchStore.getState()
    expect(s.phase).toBe('splash')
    expect(s.ready).toBe(false)
    expect(s.welcomeShown).toBe(false)
  })

  it('setReady flags initialization as complete', () => {
    useLaunchStore.getState().setReady()
    expect(useLaunchStore.getState().ready).toBe(true)
  })

  it('beginEnter moves to enter phase, shows the welcome and records the launch', () => {
    useLaunchStore.getState().beginEnter()
    const s = useLaunchStore.getState()
    expect(s.phase).toBe('enter')
    expect(s.welcomeShown).toBe(true)
    expect(localStorage.getItem('tracker.hasLaunched')).toBe('1')
  })

  it('finishSplash moves to done', () => {
    useLaunchStore.getState().beginEnter()
    useLaunchStore.getState().finishSplash()
    expect(useLaunchStore.getState().phase).toBe('done')
  })
})
