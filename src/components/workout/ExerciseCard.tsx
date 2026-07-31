import { useEffect, useRef, useState, type ReactNode, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react'
import { formatWeight } from '@/lib/units'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Unit } from '@/lib/units'
import type { WorkoutSet } from '@/types'

const ACTION_WIDTH = 112
const OPEN_THRESHOLD = ACTION_WIDTH / 2

interface SwipeToDeleteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  children: ReactNode
}

function SwipeToDelete({ open, onOpenChange, onDelete, children }: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const suppressClick = useRef(false)
  const gesture = useRef<{ startX: number; startY: number; startOffset: number; dx: number; horizontal: boolean } | null>(null)

  useEffect(() => {
    if (!open && !isDragging) setOffset(0)
  }, [open, isDragging])

  useEffect(() => {
    if (!open) return
    const closeIfOutside = (e: TouchEvent | MouseEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('touchstart', closeIfOutside)
    document.addEventListener('mousedown', closeIfOutside)
    return () => {
      document.removeEventListener('touchstart', closeIfOutside)
      document.removeEventListener('mousedown', closeIfOutside)
    }
  }, [open, onOpenChange])

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    suppressClick.current = false
    gesture.current = {
      startX: t.clientX,
      startY: t.clientY,
      startOffset: offset,
      dx: 0,
      horizontal: false,
    }
    setIsDragging(true)
  }

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g) return
    const t = e.touches[0]
    const dx = t.clientX - g.startX
    const dy = t.clientY - g.startY
    if (!g.horizontal) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) g.horizontal = true
      else return
    }
    g.dx = dx
    setOffset(Math.max(-ACTION_WIDTH, Math.min(0, g.startOffset + dx)))
  }

  const handleTouchEnd = () => {
    const g = gesture.current
    gesture.current = null
    setIsDragging(false)
    if (!g) {
      setOffset(open ? -ACTION_WIDTH : 0)
      return
    }
    if (!g.horizontal) {
      if (open) {
        setOffset(0)
        onOpenChange(false)
      }
      return
    }
    suppressClick.current = Math.abs(g.dx) > 8
    const target = Math.max(-ACTION_WIDTH, Math.min(0, g.startOffset + g.dx))
    if (target <= -OPEN_THRESHOLD) {
      setOffset(-ACTION_WIDTH)
      onOpenChange(true)
    } else {
      setOffset(0)
      onOpenChange(false)
    }
  }

  const handleClickCapture = (e: ReactMouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClick.current = false
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="absolute inset-y-0 right-0" style={{ width: ACTION_WIDTH }}>
        <button
          type="button"
          aria-label="Delete exercise"
          onClick={onDelete}
          className="w-full h-full flex flex-col items-center justify-center gap-1 bg-destructive text-white hover:brightness-110 active:brightness-110 transition-[filter]"
        >
          <Trash2 size={18} />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>
      <div
        data-testid="swipe-surface"
        onClickCapture={handleClickCapture}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          touchAction: 'pan-y',
        }}
        className="relative will-change-transform"
      >
        {children}
      </div>
    </div>
  )
}

interface ExerciseCardProps {
  name: string
  sets: WorkoutSet[]
  unit: Unit
  weight: string
  reps: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onWeightChange: (value: string) => void
  onRepsChange: (value: string) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onDelete: () => void
  onEdit: () => void
}

export function ExerciseCard({
  name,
  sets,
  unit,
  weight,
  reps,
  isOpen,
  onOpenChange,
  onWeightChange,
  onRepsChange,
  onAddSet,
  onRemoveSet,
  onDelete,
  onEdit,
}: ExerciseCardProps) {
  const isMobile = useIsMobile()

  const card = (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm truncate pr-2">{name}</h3>
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger aria-label={`Actions for ${name}`} className="-mr-1 shrink-0">
                <MoreVertical size={16} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil size={14} /> Edit Exercise
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 size={14} /> Delete Exercise
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {sets.length > 0 && (
          <div className="space-y-1 mb-3">
            <div className="hidden sm:flex items-center text-xs text-muted-foreground px-2 py-1">
              <span className="w-8">Set</span>
              <span className="flex-1 text-right">Weight ({unit})</span>
              <span className="w-16 text-right">Reps</span>
              <span className="w-16 text-right">Volume</span>
              <span className="w-8" />
            </div>
            {sets.map((set, i) => (
              <div key={set.id} className="flex items-center px-2 py-1.5 rounded-lg bg-muted/30 gap-1">
                <span className="w-6 sm:w-8 text-xs sm:text-sm text-muted-foreground shrink-0">{i + 1}</span>
                <span className="flex-1 text-right text-xs sm:text-sm font-medium">{formatWeight(set.weight, unit)}</span>
                <span className="text-xs text-muted-foreground mx-1">x</span>
                <span className="w-10 sm:w-16 text-right text-xs sm:text-sm font-medium">{set.reps}</span>
                <span className="hidden sm:block w-16 text-right text-xs text-muted-foreground">{formatWeight(set.weight * set.reps, unit)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-6 sm:w-6 shrink-0" onClick={() => onRemoveSet(set.id)}>
                  <X size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Input
            type="number"
            placeholder={`Wt (${unit})`}
            value={weight}
            onChange={e => onWeightChange(e.target.value)}
            className="h-9 text-xs sm:text-sm w-16 sm:w-20"
          />
          <Input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={e => onRepsChange(e.target.value)}
            className="h-9 text-xs sm:text-sm w-14 sm:w-20"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={onAddSet}
            disabled={!weight || !reps}
            className="h-9 text-xs sm:text-sm whitespace-nowrap"
          >
            <Check size={14} className="mr-1" /> Set
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return isMobile ? (
    <SwipeToDelete open={isOpen} onOpenChange={onOpenChange} onDelete={onDelete}>
      {card}
    </SwipeToDelete>
  ) : (
    card
  )
}
