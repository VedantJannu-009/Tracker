import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useExerciseStats } from '@/hooks/useExerciseStats'
import { deleteExercise, renameExercise, duplicateExercise } from '@/services/exerciseUtils'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowLeft, Dumbbell, TrendingUp, Clock, MoreVertical, Pencil, Copy, Trash2, Layers, Activity, Gauge, ChevronDown, ChevronRight } from 'lucide-react'
import { formatRelative, formatDate } from '@/lib/utils'

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b']

export function ExercisePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const stats = useExerciseStats(id ?? '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedWorkouts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    await deleteExercise(id)
    navigate('/', { replace: true })
  }

  const handleRenameOpen = () => {
    if (!stats.exercise) return
    setRenameValue(stats.exercise.name)
    setShowRename(true)
  }

  const handleRename = async () => {
    if (!id || !renameValue.trim()) return
    setRenaming(true)
    await renameExercise(id, renameValue.trim())
    setShowRename(false)
    setRenameValue('')
    setRenaming(false)
  }

  const handleDuplicate = async () => {
    if (!id) return
    await duplicateExercise(id)
  }

  const pieData = useMemo(() => {
    if (stats.totalSets === 0) return []
    const totalVolume = stats.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
    const values = [
      { label: 'Sets', value: stats.totalSets, icon: Layers },
      { label: 'Reps', value: stats.totalReps, icon: Activity },
      { label: 'Volume', value: totalVolume, icon: Gauge },
    ]
    const total = values.reduce((s, v) => s + v.value, 0)
    if (total === 0) return []
    return values.map(v => ({ ...v, pct: Math.round((v.value / total) * 100) }))
  }, [stats.totalSets, stats.totalReps, stats.sets])

  const workoutsWithSets = useMemo(() => {
    if (!stats.workoutExercises || !stats.sets) return []

    // Build workoutId → sets map via workoutExerciseId
    const weWorkoutMap = new Map<string, string>()
    for (const we of stats.workoutExercises) {
      weWorkoutMap.set(we.id, we.workoutId)
    }

    const sessionMap = new Map<string, typeof stats.sets>()
    for (const s of stats.sets) {
      const wid = weWorkoutMap.get(s.workoutExerciseId)
      if (!wid) continue
      if (!sessionMap.has(wid)) sessionMap.set(wid, [])
      sessionMap.get(wid)!.push(s)
    }

    const workoutMap = new Map((stats.workouts ?? []).map(w => [w.id, w]))

    return [...sessionMap.entries()]
      .map(([wid, sets]) => {
        const w = workoutMap.get(wid)
        if (!w) return null
        return {
          id: wid,
          date: w.date,
          name: w.name,
          sets: sets.sort((a, b) => a.order - b.order),
        }
      })
      .filter((w): w is NonNullable<typeof w> => w !== null && w.sets.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [stats.workouts, stats.workoutExercises, stats.sets])

  if (!stats.exercise) return null

  const backPath = stats.muscle ? `/muscles/${stats.muscle.id}` : '/'

  return (
    <PageContainer>
      <div className="flex items-center gap-2 sm:gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{stats.exercise.name}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {stats.muscle?.name} &middot; {stats.exercise.equipment}
          </p>
        </div>
        <Badge className="shrink-0">{stats.exercise.difficulty}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1">
            <MoreVertical size={16} className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleRenameOpen}>
              <Pencil size={14} /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy size={14} /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive">
              <Trash2 size={14} /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
        <Card className="p-3 sm:p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp size={14} />
            <span className="text-xs">Best Weight</span>
          </div>
          <div className="text-lg sm:text-xl font-bold">{stats.maxWeight} kg</div>
        </Card>
        <Card className="p-3 sm:p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock size={14} />
            <span className="text-xs">Last Workout</span>
          </div>
          <div className="text-sm font-medium">
            {stats.lastWorkoutDate ? formatRelative(stats.lastWorkoutDate) : 'Never'}
          </div>
        </Card>
        <Card className="p-3 sm:p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Dumbbell size={14} />
            <span className="text-xs">Total Sessions</span>
          </div>
          <div className="text-lg sm:text-xl font-bold">{stats.workouts.length}</div>
        </Card>
      </div>

      {pieData.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workload Breakdown</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-full max-w-[180px] sm:w-40 aspect-square shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={pieData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--chart-tooltip-bg, #1a1a1a)', border: '1px solid var(--chart-tooltip-border, #2a2a2a)', borderRadius: 8, fontSize: 12 }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex sm:flex-col gap-3 sm:gap-2.5 flex-wrap justify-center">
                {pieData.map((d, i) => (
                  <div key={d.label} className="flex items-center gap-1.5 sm:gap-2.5">
                    <d.icon size={16} style={{ color: PIE_COLORS[i] }} />
                    <span className="text-xs sm:text-sm text-muted-foreground">{d.label}</span>
                    <span className="text-xs sm:text-sm font-medium text-right">{d.pct}%</span>
                    <span className="text-xs text-muted-foreground">({d.value.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {workoutsWithSets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Workout History</h3>
          <div className="space-y-2">
            {workoutsWithSets.map(w => {
              const totalReps = w.sets.reduce((s, set) => s + set.reps, 0)
              const totalSets = w.sets.length
              const bestWeight = w.sets.reduce((best, set) => Math.max(best, set.weight), 0)
              const isExpanded = expandedWorkouts.has(w.id)
              return (
                <Card
                  key={w.id}
                  className="cursor-pointer transition-colors hover:bg-muted/20"
                  onClick={() => toggleExpanded(w.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
                        <span className="text-sm font-semibold shrink-0">{formatDate(w.date)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate text-right">{w.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mb-1 flex-wrap">
                      <span>{totalSets} {totalSets === 1 ? 'set' : 'sets'}</span>
                      <span>{totalReps} {totalReps === 1 ? 'rep' : 'reps'}</span>
                      {bestWeight > 0 && <span>Best {bestWeight} kg</span>}
                    </div>
                    {isExpanded && (
                      <>
                        <div className="space-y-1.5 mt-3 pt-3 border-t border-border/30">
                          {w.sets.map((set, si) => (
                            <div key={set.id} className="flex items-center gap-3 text-sm pl-3">
                              <span className="text-[11px] text-muted-foreground w-10 shrink-0">Set {si + 1}</span>
                              <span className="font-medium">
                                {set.weight > 0 ? `${set.weight} kg` : 'Bodyweight'} &times; {set.reps}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {workoutsWithSets.length === 0 && stats.exercise && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏋️</div>
          <h3 className="text-lg font-semibold mb-1">No workouts yet</h3>
          <p className="text-sm text-muted-foreground">Start logging {stats.exercise.name} to see your progress</p>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Exercise?</h3>
            <p className="text-sm text-muted-foreground mb-1">
              This will permanently delete <strong>{stats.exercise.name}</strong>.
            </p>
            {stats.totalSets > 0 && (
              <p className="text-sm text-destructive mb-4">
                All associated sets, reps, history, personal records, and analytics will also be deleted.
              </p>
            )}
            {stats.totalSets === 0 && (
              <p className="text-sm text-muted-foreground mb-4">This exercise has no workout history.</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Rename Exercise</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Enter a new name for <strong>{stats.exercise?.name}</strong>.
            </p>
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && renameValue.trim()) handleRename() }}
              placeholder="Exercise name"
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowRename(false); setRenameValue('') }} disabled={renaming}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleRename} disabled={renaming || !renameValue.trim()}>
                {renaming ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
