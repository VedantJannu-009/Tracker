import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, CheckCircle, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { generateId } from '@/lib/utils'
import type { Goal } from '@/types'

export function GoalsPage() {
  const navigate = useNavigate()
  const goals = useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', targetValue: '', currentValue: '0', unit: '' })

  const handleAdd = async () => {
    const goal: Goal = {
      id: generateId(),
      title: form.title,
      targetValue: parseFloat(form.targetValue),
      currentValue: parseFloat(form.currentValue || '0'),
      unit: form.unit,
      createdAt: Date.now(),
      completed: false,
    }
    await db.goals.add(goal)
    setForm({ title: '', targetValue: '', currentValue: '0', unit: '' })
    setShowForm(false)
  }

  const handleToggleComplete = async (goal: Goal) => {
    await db.goals.update(goal.id, { completed: !goal.completed })
  }

  const handleDelete = async (id: string) => {
    await db.goals.delete(id)
  }

  const handleUpdateProgress = async (id: string, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    await db.goals.update(id, { currentValue: num })
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Goals</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Track your fitness goals</p>
          </div>
        </div>
        <Button size="icon" onClick={() => setShowForm(!showForm)} className="shrink-0">
          <Plus size={20} />
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">New Goal</h3>
            <Input placeholder="Goal title (e.g., Bench 100kg)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Target" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} />
              <Input placeholder="Unit (kg, reps, etc)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <Button className="w-full" disabled={!form.title || !form.targetValue} onClick={handleAdd}>
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {goals?.map(goal => {
          const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
          return (
            <Card key={goal.id} className={goal.completed ? 'border-success/30' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target size={16} className={goal.completed ? 'text-success' : 'text-primary'} />
                    <h3 className={`font-semibold text-sm ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.title}
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleComplete(goal)} aria-label={goal.completed ? `Mark ${goal.title} as not complete` : `Mark ${goal.title} as complete`}>
                      <CheckCircle size={14} className={goal.completed ? 'text-success' : 'text-muted-foreground'} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(goal.id)} aria-label={`Delete ${goal.title}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Input
                    type="number"
                    value={goal.currentValue}
                    onChange={e => handleUpdateProgress(goal.id, e.target.value)}
                    className="h-8 w-20 text-sm"
                    aria-label={`Current value for ${goal.title}`}
                  />
                  <span className="text-sm text-muted-foreground">/ {goal.targetValue} {goal.unit}</span>
                  <Badge variant={progress >= 100 ? 'success' : 'default'} className="ml-auto">
                    {Math.round(progress)}%
                  </Badge>
                </div>
                <Progress value={Math.min(100, progress)} />
              </CardContent>
            </Card>
          )
        })}

        {(!goals || goals.length === 0) && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold mb-1">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Set your fitness goals and track progress</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Create Goal
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
