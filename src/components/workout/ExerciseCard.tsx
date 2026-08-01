import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, X, Check, Trophy, History } from 'lucide-react'
import { formatWeight, formatWeightValue } from '@/lib/units'
import { cn, formatDate } from '@/lib/utils'
import type { Unit } from '@/lib/units'
import type { Exercise, WorkoutSet } from '@/types'

interface ExerciseCardProps {
  name: string
  sets: WorkoutSet[]
  unit: Unit
  weight: string
  reps: string
  onWeightChange: (value: string) => void
  onRepsChange: (value: string) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onDelete: () => void
  onEdit: () => void
  equipment?: string
  difficulty?: Exercise['difficulty']
  lastWorkout?: string | null
  pr?: { weight: number; reps: number; volume: number } | null
  active?: boolean
}

const difficultyVariant: Record<Exercise['difficulty'], 'default' | 'success' | 'warning'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'default',
}

function shortRelative(date: string | number): string {
  const d = new Date(date)
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startToday - startDay) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return formatDate(d.toISOString())
}

export function ExerciseCard({
  name,
  sets,
  unit,
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  onAddSet,
  onRemoveSet,
  onDelete,
  onEdit,
  equipment,
  difficulty,
  lastWorkout,
  pr,
  active,
}: ExerciseCardProps) {
  const prWeight = pr?.weight ? formatWeightValue(pr.weight, unit) : null

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        active && 'border-primary/40 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
      )}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" aria-hidden="true" />}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate pr-2">{name}</h3>
            {(equipment || difficulty) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {equipment && <Badge variant="default">{equipment}</Badge>}
                {difficulty && <Badge variant={difficultyVariant[difficulty]} className="capitalize">{difficulty}</Badge>}
              </div>
            )}
          </div>
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
        </div>

        <div className="flex items-center justify-between gap-2 mb-3 text-[11px]">
          <span className="flex items-center gap-1 text-muted-foreground min-w-0">
            {lastWorkout ? (
              <>
                <History size={11} className="shrink-0" />
                <span className="truncate">Last {shortRelative(lastWorkout)}</span>
              </>
            ) : (
              <span className="truncate">No previous workout</span>
            )}
          </span>
          {prWeight && (
            <span className="flex items-center gap-1 font-semibold text-primary shrink-0">
              <Trophy size={11} /> PR {prWeight} {unit}
            </span>
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
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-6 sm:w-6 shrink-0" onClick={() => onRemoveSet(set.id)} aria-label={`Remove set ${i + 1}`}>
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
}
