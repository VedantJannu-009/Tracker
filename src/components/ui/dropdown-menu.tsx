import { useState, useRef, useEffect, createContext, useContext, type ReactNode } from 'react'

interface DropdownContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextType>({ open: false, setOpen: () => {} })

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useContext(DropdownContext)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
      className={`p-1 rounded hover:bg-muted/50 transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, className = '', align = 'right' }: { children: ReactNode; className?: string; align?: 'left' | 'right' }) {
  const { open, setOpen } = useContext(DropdownContext)
  if (!open) return null
  return (
    <div
      className={`absolute z-50 mt-1 min-w-[140px] rounded-xl bg-background border border-border shadow-lg py-1 ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${className}`}
      onClick={() => setOpen(false)}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}
