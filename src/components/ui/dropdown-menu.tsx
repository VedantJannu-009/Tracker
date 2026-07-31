import { useState, useRef, useEffect, createContext, useContext, type ReactNode, type KeyboardEvent, type RefObject, type ButtonHTMLAttributes } from 'react'

interface DropdownContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
  contentRef: RefObject<HTMLDivElement | null>
}

const DropdownContext = createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  contentRef: { current: null },
})

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

type DropdownMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>

export function DropdownMenuTrigger({ children, className = '', ...props }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useContext(DropdownContext)
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
        if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          e.preventDefault()
          setOpen(true)
        }
      }}
      className={`p-1 rounded hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${className}`}
      {...props}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ children, className = '', align = 'right' }: { children: ReactNode; className?: string; align?: 'left' | 'right' }) {
  const { open, setOpen, triggerRef, contentRef } = useContext(DropdownContext)

  useEffect(() => {
    if (!open) return
    const first = contentRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    first?.focus()
  }, [open, contentRef])

  if (!open) return null

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        items[(currentIndex + 1) % items.length].focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        items[(currentIndex - 1 + items.length) % items.length].focus()
        break
      case 'Home':
        e.preventDefault()
        items[0].focus()
        break
      case 'End':
        e.preventDefault()
        items[items.length - 1].focus()
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <div
      ref={contentRef}
      role="menu"
      onKeyDown={handleKeyDown}
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
  const { setOpen } = useContext(DropdownContext)
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={(e) => { e.stopPropagation(); onClick?.(); setOpen(false) }}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:bg-muted/50 ${className}`}
    >
      {children}
    </button>
  )
}
