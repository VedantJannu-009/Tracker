import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { generateId } from '@/lib/utils'
import type { WeeklyGoal } from '@/types'

const DEFAULT_TARGET = 12

const GROUP_ORDER = ['Chest', 'Back', 'Shoulders', 'Legs', 'Abs', 'Biceps', 'Triceps', 'Forearms', 'Neck']

export function WeeklyGoalsPage() {
  const navigate = useNavigate()
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const existingGoals = useLiveQuery(() => db.weeklyGoals.toArray())
  const [targets, setTargets] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimeoutRef = useRef<number | null>(null)

  useEffect(() => () => {
    if (savedTimeoutRef.current !== null) window.clearTimeout(savedTimeoutRef.current)
  }, [])

  useEffect(() => {
    if (!existingGoals || !muscleGroups) return
    const map: Record<string, number> = {}
    for (const mg of muscleGroups) {
      const goal = existingGoals.find(g => g.muscleGroupId === mg.id)
      map[mg.id] = goal?.targetSets ?? DEFAULT_TARGET
    }
    setTargets(map)
  }, [existingGoals, muscleGroups])

  const orderedMuscles = muscleGroups
    ? [...muscleGroups].sort((a, b) => {
        const ai = GROUP_ORDER.indexOf(a.name)
        const bi = GROUP_ORDER.indexOf(b.name)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })
    : []

  const handleSave = async () => {
    setSaving(true)
    const batch = muscleGroups?.map(async mg => {
      const target = targets[mg.id] ?? DEFAULT_TARGET
      const existing = existingGoals?.find(g => g.muscleGroupId === mg.id)
      if (existing) {
        await db.weeklyGoals.update(existing.id, { targetSets: target })
      } else {
        const goal: WeeklyGoal = { id: generateId(), muscleGroupId: mg.id, targetSets: target }
        await db.weeklyGoals.add(goal)
      }
    }) ?? []
    await Promise.all(batch)
    setSaving(false)
    setSaved(true)
    if (savedTimeoutRef.current !== null) window.clearTimeout(savedTimeoutRef.current)
    savedTimeoutRef.current = window.setTimeout(() => setSaved(false), 2000)
  }

  if (!muscleGroups) return null

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0" aria-label="Back">
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Weekly Goals</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Set weekly set targets per muscle group</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 space-y-4">
          {orderedMuscles.map(mg => (
            <div key={mg.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium">{mg.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={targets[mg.id] ?? DEFAULT_TARGET}
                    onChange={e => setTargets(prev => ({ ...prev, [mg.id]: parseInt(e.target.value) || 0 }))}
                    className="w-14 sm:w-16 h-8 text-center text-xs sm:text-sm"
                    aria-label={`Weekly set target for ${mg.name}`}
                  />
                  <span className="text-xs text-muted-foreground shrink-0">sets</span>
                </div>
              </div>
              {mg !== orderedMuscles[orderedMuscles.length - 1] && (
                <div className="border-t border-border/20 mt-3" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave} disabled={saving}>
        {saved ? <><Save size={16} className="mr-1" /> Saved</> : <><Save size={16} className="mr-1" /> Save Targets</>}
      </Button>
    </PageContainer>
  )
}