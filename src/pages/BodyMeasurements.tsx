import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AreaChart } from '@/components/charts/AreaChart'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { formatDate, generateId } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { BodyMeasurement } from '@/types'
import { useUnit } from '@/hooks/useUnit'
import { kgToUnit, unitToKg } from '@/lib/units'

export function BodyMeasurementsPage() {
  const navigate = useNavigate()
  const unit = useUnit()
  const measurements = useLiveQuery(
    () => db.bodyMeasurements.orderBy('date').toArray()
  )

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    weight: '', bodyFat: '', chest: '', waist: '', arms: '', thighs: '', neck: '',
  })

  const handleAdd = async () => {
    const entry: BodyMeasurement = {
      id: generateId(),
      date: new Date().toISOString(),
      weight: form.weight ? unitToKg(parseFloat(form.weight), unit) : undefined,
      bodyFat: form.bodyFat ? parseFloat(form.bodyFat) : undefined,
      chest: form.chest ? parseFloat(form.chest) : undefined,
      waist: form.waist ? parseFloat(form.waist) : undefined,
      arms: form.arms ? parseFloat(form.arms) : undefined,
      thighs: form.thighs ? parseFloat(form.thighs) : undefined,
      neck: form.neck ? parseFloat(form.neck) : undefined,
    }
    await db.bodyMeasurements.add(entry)
    setForm({ weight: '', bodyFat: '', chest: '', waist: '', arms: '', thighs: '', neck: '' })
    setShowForm(false)
  }

  const fields = [
    { key: 'weight', label: `Weight (${unit})`, icon: '⚖️' },
    { key: 'bodyFat', label: 'Body Fat (%)', icon: '📊' },
    { key: 'chest', label: 'Chest (cm)', icon: '📏' },
    { key: 'waist', label: 'Waist (cm)', icon: '📏' },
    { key: 'arms', label: 'Arms (cm)', icon: '📏' },
    { key: 'thighs', label: 'Thighs (cm)', icon: '📏' },
    { key: 'neck', label: 'Neck (cm)', icon: '📏' },
  ] as const

  type FieldKey = typeof fields[number]['key']

  const chartData = (key: FieldKey) =>
    (measurements ?? [])
      .filter(m => m[key as keyof BodyMeasurement] != null)
      .map(m => {
        const value = m[key as keyof BodyMeasurement] as number
        return { label: formatDate(m.date), value: key === 'weight' ? kgToUnit(value, unit) : value }
      })

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Body Measurements</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Track your body stats</p>
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
              <h3 className="text-sm font-semibold">New Measurement</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)} aria-label="Close measurement form">
                <X size={14} />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground">{f.label}</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="h-9"
                    aria-label={f.label}
                  />
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleAdd}>Save Measurement</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {fields.map(field => {
          const data = chartData(field.key)
          if (data.length === 0) return null
          return (
            <Card key={field.key}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span>{field.icon}</span>
                  <CardTitle className="text-sm">{field.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AreaChart data={data} height={160} />
              </CardContent>
            </Card>
          )
        })}

        {(!measurements || measurements.length === 0) && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📏</div>
            <h3 className="text-lg font-semibold mb-1">No measurements yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start tracking your body measurements</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Add Measurement
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
