import { create } from 'zustand'

interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: string) {
  const root = document.documentElement
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
  const isLight = resolvedTheme === 'light'

  root.classList.toggle('light', isLight)
  root.style.colorScheme = isLight ? 'light' : 'dark'

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isLight ? '#fafafa' : '#0a0a0a')
  }
}

const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
const initialTheme: 'light' | 'dark' | 'system' = saved || 'dark'

let mediaQuery: MediaQueryList | null = null

function handleSystemChange() {
  if (localStorage.getItem('theme') === 'system') {
    applyTheme('system')
  }
}

function listenSystemTheme() {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleSystemChange)
  }
  const currentTheme = localStorage.getItem('theme')
  if (currentTheme !== 'system') return

  mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
  mediaQuery.addEventListener('change', handleSystemChange)
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    if (theme === 'system') {
      listenSystemTheme()
    } else {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleSystemChange)
        mediaQuery = null
      }
    }
  },
}))

applyTheme(initialTheme)
if (initialTheme === 'system') {
  setTimeout(listenSystemTheme, 0)
}
