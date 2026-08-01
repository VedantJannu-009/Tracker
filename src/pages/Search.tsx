import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { deleteExercise, renameExercise, duplicateExercise } from '@/services/exerciseUtils'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { PageContainer } from '@/components/layout/PageContainer'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, SearchX, Pencil, Copy, Trash2, MoreVertical } from 'lucide-react'
import { ExerciseIcon } from '@/components/exercise/ExerciseIcon'
import { MuscleIcon } from '@/components/muscle/MuscleIcon'
import { EmptyState } from '@/components/ui/empty-state'

export function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)

  const exercises = useLiveQuery(() => db.exercises.toArray())
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())

  const deleteTargetExercise = useMemo(() => {
    if (!deleteTarget || !exercises) return null
    return exercises.find(e => e.id === deleteTarget) ?? null
  }, [deleteTarget, exercises])

  const renameTargetExercise = useMemo(() => {
    if (!renameTarget || !exercises) return null
    return exercises.find(e => e.id === renameTarget) ?? null
  }, [renameTarget, exercises])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteExercise(deleteTarget)
    setDeleteTarget(null)
    setDeleting(false)
  }

  const handleRenameOpen = (id: string, currentName: string) => {
    setRenameTarget(id)
    setRenameValue(currentName)
  }

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return
    setRenaming(true)
    await renameExercise(renameTarget, renameValue.trim())
    setRenameTarget(null)
    setRenameValue('')
    setRenaming(false)
  }

  const handleDuplicate = async (id: string) => {
    await duplicateExercise(id)
  }

  const filtered = useMemo(() => {
    if (!exercises) return []
    return exercises.filter(ex => {
      if (query && !ex.name.toLowerCase().includes(query.toLowerCase())) return false
      if (muscleFilter && ex.muscleGroupId !== muscleFilter) return false
      if (difficultyFilter && ex.difficulty !== difficultyFilter) return false
      return true
    })
  }, [exercises, query, muscleFilter, difficultyFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const ex of filtered) {
      const group = map.get(ex.muscleGroupId) ?? []
      group.push(ex)
      map.set(ex.muscleGroupId, group)
    }
    return map
  }, [filtered])

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-1">Search</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Find exercises instantly</p>
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setMuscleFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !muscleFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          All Muscles
        </button>
        {muscleGroups?.map(m => (
          <button
            key={m.id}
            onClick={() => setMuscleFilter(m.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              muscleFilter === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <MuscleIcon muscleId={m.id} size={12} />
            {m.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {['', 'beginner', 'intermediate', 'advanced'].map(d => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              difficultyFilter === d ? 'bg-muted text-foreground' : 'text-muted-foreground'
            }`}
          >
            {d || 'All Levels'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([groupId, exs]) => {
          const mg = muscleGroups?.find(m => m.id === groupId)
          return (
            <div key={groupId}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                {mg && <MuscleIcon muscleId={mg.id} size={14} />}
                {mg?.name}
              </h3>
              <div className="space-y-1">
                {exs.map(ex => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-muted/30 group"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/exercise/${ex.id}`)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/exercise/${ex.id}`) } }}
                    aria-label={`Open ${ex.name}`}
                    className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <ExerciseIcon name={ex.name} equipment={ex.equipment} size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{ex.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 sm:ml-2">
                    <Badge className="text-[10px]">{ex.difficulty}</Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline">{ex.equipment}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity">
                        <MoreVertical size={14} className="text-muted-foreground" />
                      </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleRenameOpen(ex.id, ex.name)}>
                            <Pencil size={14} /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(ex.id)}>
                            <Copy size={14} /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(ex.id)} className="text-destructive">
                            <Trash2 size={14} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {query && filtered.length === 0 && (
          <EmptyState icon={SearchX} title="No results" description="Try a different search term" />
        )}
      </div>

      {deleteTarget && deleteTargetExercise && (
        <DeleteConfirmModal
          exercise={deleteTargetExercise}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {renameTarget && renameTargetExercise && (
        <RenameModal
          exercise={renameTargetExercise}
          value={renameValue}
          onChange={setRenameValue}
          onConfirm={handleRename}
          onCancel={() => { setRenameTarget(null); setRenameValue('') }}
          renaming={renaming}
        />
      )}
    </PageContainer>
  )
}

function DeleteConfirmModal({ exercise, onConfirm, onCancel, deleting }: {
  exercise: { id: string; name: string }
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}) {
  const hasHistory = useLiveQuery(
    () => db.workoutExercises.where('exerciseId').equals(exercise.id).count(),
    [exercise.id]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Delete Exercise?</h3>
        <p className="text-sm text-muted-foreground mb-1">
          This will permanently delete <strong>{exercise.name}</strong>.
        </p>
        {(hasHistory ?? 0) > 0 ? (
          <p className="text-sm text-destructive mb-4">
            All associated sets, reps, history, personal records, and analytics will also be deleted.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">This exercise has no workout history.</p>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function RenameModal({ exercise, value, onChange, onConfirm, onCancel, renaming }: {
  exercise: { id: string; name: string }
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  renaming: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Rename Exercise</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Enter a new name for <strong>{exercise.name}</strong>.
        </p>
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) onConfirm() }}
          placeholder="Exercise name"
          className="mb-4"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={renaming}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={renaming || !value.trim()}>
            {renaming ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
