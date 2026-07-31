import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767.98px)'

function supportsMatchMedia() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    supportsMatchMedia() ? window.matchMedia(QUERY).matches : false
  )

  useEffect(() => {
    if (!supportsMatchMedia()) return
    const mql = window.matchMedia(QUERY)
    const update = (matches: boolean) => setIsMobile(matches)
    update(mql.matches)
    const onChange = (e: MediaQueryListEvent) => update(e.matches)
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return isMobile
}
