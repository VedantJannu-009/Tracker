import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomCard } from '@/components/muscle-card/CustomCard'
import { ArrowLeft, Plus, Trash2, Pin, X } from 'lucide-react'
import { generateId } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { CustomCard as CustomCardType } from '@/types'

const ICONS = ['💪', '🏋️', '🔥', '🎯', '⚡', '🌟', '📈', '💯', '🔱', '🛡️']
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export function CustomCardsPage() {
  const navigate = useNavigate()
  const cards = useLiveQuery(() => db.customCards.orderBy('order').toArray())
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    icon: '💪',
    accentColor: '#3b82f6',
    muscleGroupIds: [] as string[],
  })

  const handleAdd = async () => {
    if (!form.title) return
    const card: CustomCardType = {
      id: generateId(),
      title: form.title,
      icon: form.icon,
      accentColor: form.accentColor,
      muscleGroupIds: form.muscleGroupIds,
      pinned: false,
      collapsed: false,
      order: cards?.length ?? 0,
    }
    await db.customCards.add(card)
    setForm({ title: '', icon: '💪', accentColor: '#3b82f6', muscleGroupIds: [] })
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    await db.customCards.delete(id)
  }

  const handleTogglePin = async (card: CustomCardType) => {
    await db.customCards.update(card.id, { pinned: !card.pinned })
  }

  const toggleMuscle = (id: string) => {
    setForm(f => ({
      ...f,
      muscleGroupIds: f.muscleGroupIds.includes(id)
        ? f.muscleGroupIds.filter(m => m !== id)
        : [...f.muscleGroupIds, id],
    }))
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Custom Cards</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Create custom dashboard cards</p>
          </div>
        </div>
        <Button size="icon" onClick={() => setShowForm(!showForm)} className="shrink-0">
          <Plus size={20} />
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">New Card</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)}>
                <X size={14} />
              </Button>
            </div>
            <Input
              placeholder="Card title (e.g., Push Day)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setForm(f => ({ ...f, icon }))}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                      form.icon === icon ? 'bg-muted ring-2 ring-ring' : 'bg-muted/30'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Accent Color</label>
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setForm(f => ({ ...f, accentColor: color }))}
                    className={`w-8 h-8 rounded-lg transition-all ${form.accentColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-background' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Muscle Groups</label>
              <div className="flex gap-1 flex-wrap">
                {muscleGroups?.map(m => (
                  <button
                    key={m.id}
                    onClick={() => toggleMuscle(m.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      form.muscleGroupIds.includes(m.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {m.icon} {m.name}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" disabled={!form.title} onClick={handleAdd}>
              Create Card
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards?.map(card => (
          <div key={card.id} className="relative group">
            <CustomCard card={card} />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-card/80 backdrop-blur"
                onClick={() => handleTogglePin(card)}
              >
                <Pin size={14} className={card.pinned ? 'text-primary' : ''} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-card/80 backdrop-blur text-destructive"
                onClick={() => handleDelete(card.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}

        {(!cards || cards.length === 0) && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold mb-1">No custom cards</h3>
            <p className="text-sm text-muted-foreground mb-4">Create custom dashboard cards to group muscles</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Create Card
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
