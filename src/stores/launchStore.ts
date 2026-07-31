import { create } from 'zustand'

export type LaunchPhase = 'splash' | 'enter' | 'done'

interface LaunchState {
  phase: LaunchPhase
  ready: boolean
  welcomeShown: boolean
  isFirstLaunch: boolean
  setReady: () => void
  beginEnter: () => void
  finishSplash: () => void
}

const LAUNCH_FLAG_KEY = 'tracker.hasLaunched'

function getHasLaunched(): boolean {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem(LAUNCH_FLAG_KEY) === '1'
}

export const useLaunchStore = create<LaunchState>((set) => ({
  phase: 'splash',
  ready: false,
  welcomeShown: false,
  isFirstLaunch: !getHasLaunched(),

  setReady: () => set({ ready: true }),

  beginEnter: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAUNCH_FLAG_KEY, '1')
    }
    set({ phase: 'enter', welcomeShown: true })
  },

  finishSplash: () => set({ phase: 'done' }),
}))
