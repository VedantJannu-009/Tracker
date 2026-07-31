import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { ExerciseCard } from './ExerciseCard'

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

interface HarnessProps {
  isOpen?: boolean
  onDelete?: () => void
  onEdit?: () => void
  onOpenChange?: (open: boolean) => void
}

function Harness({ isOpen: initialOpen, onDelete, onEdit, onOpenChange }: HarnessProps) {
  const [isOpen, setIsOpen] = useState(initialOpen ?? false)
  return (
    <ExerciseCard
      name="Bench Press"
      sets={[]}
      unit="kg"
      weight=""
      reps=""
      isOpen={isOpen}
      onOpenChange={open => { onOpenChange?.(open); setIsOpen(open) }}
      onWeightChange={() => {}}
      onRepsChange={() => {}}
      onAddSet={() => {}}
      onRemoveSet={() => {}}
      onDelete={onDelete ?? (() => {})}
      onEdit={onEdit ?? (() => {})}
    />
  )
}

function swipe(surface: HTMLElement, fromX: number, toX: number, y = 100) {
  fireEvent.touchStart(surface, { touches: [{ clientX: fromX, clientY: y }] })
  fireEvent.touchMove(surface, { touches: [{ clientX: toX, clientY: y }] })
  fireEvent.touchEnd(surface)
}

beforeEach(() => mockMatchMedia(false))

describe('ExerciseCard — desktop/tablet', () => {
  it('renders the three-dot overflow menu instead of swipe', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: /Actions for Bench Press/i })).toBeInTheDocument()
    expect(screen.queryByTestId('swipe-surface')).not.toBeInTheDocument()
  })

  it('opens a menu with Edit and Delete, and triggers callbacks', () => {
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    render(<Harness onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /Actions for Bench Press/i }))
    expect(screen.getByRole('menuitem', { name: /Edit Exercise/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Delete Exercise/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitem', { name: /Edit Exercise/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /Actions for Bench Press/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete Exercise/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

describe('ExerciseCard — mobile', () => {
  beforeEach(() => mockMatchMedia(true))

  it('renders swipe surface and no overflow menu', () => {
    render(<Harness />)
    expect(screen.queryByRole('button', { name: /Actions for Bench Press/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('swipe-surface')).toBeInTheDocument()
  })

  it('requires a clear swipe distance before opening', () => {
    render(<Harness />)
    const surface = screen.getByTestId('swipe-surface')
    swipe(surface, 200, 190)
    expect(surface.style.transform).toBe('translateX(0px)')
  })

  it('reveals the delete action after a full swipe left', () => {
    render(<Harness />)
    const surface = screen.getByTestId('swipe-surface')
    swipe(surface, 200, 50)
    expect(surface.style.transform).toBe('translateX(-112px)')
  })

  it('does not treat vertical scrolling as a swipe', () => {
    render(<Harness />)
    const surface = screen.getByTestId('swipe-surface')
    fireEvent.touchStart(surface, { touches: [{ clientX: 200, clientY: 100 }] })
    fireEvent.touchMove(surface, { touches: [{ clientX: 180, clientY: 300 }] })
    fireEvent.touchEnd(surface)
    expect(surface.style.transform).toBe('translateX(0px)')
  })

  it('tapping the delete action triggers onDelete', () => {
    const onDelete = vi.fn()
    render(<Harness onDelete={onDelete} />)
    swipe(screen.getByTestId('swipe-surface'), 200, 50)
    fireEvent.click(screen.getByRole('button', { name: 'Delete exercise' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('tapping an open card closes it', () => {
    const onOpenChange = vi.fn()
    render(<Harness onOpenChange={onOpenChange} />)
    swipe(screen.getByTestId('swipe-surface'), 200, 50)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    const surface = screen.getByTestId('swipe-surface')
    fireEvent.touchStart(surface, { touches: [{ clientX: 150, clientY: 100 }] })
    fireEvent.touchEnd(surface)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('closes when tapping anywhere else on the page', () => {
    const onOpenChange = vi.fn()
    render(<Harness onOpenChange={onOpenChange} />)
    swipe(screen.getByTestId('swipe-surface'), 200, 50)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    fireEvent.touchStart(document.body, { touches: [{ clientX: 300, clientY: 300 }] })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})
