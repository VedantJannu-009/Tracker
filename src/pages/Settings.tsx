import { useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { useThemeStore } from '@/stores/themeStore'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Moon, Sun, Monitor, Weight, Download, Upload, Trash2, Check
} from 'lucide-react'
import type { AppSettings } from '@/types'
import { exportBackup, downloadBackup, importBackup } from '@/services/backup'
import { toast } from '@/stores/toastStore'

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore()
  const settings = useLiveQuery(() => db.settings.get('default'))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const current = settings ?? { id: 'default', theme: 'system', unit: 'kg', soundEnabled: true, restTimer: 90 }
    await db.settings.put({ ...current, ...partial })
    toast('Saved')
  }

  const handleExport = async () => {
    const data = await exportBackup()
    downloadBackup(data)
    toast('Backup exported')
  }

  const handleImport = async () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!confirm('Importing a backup will replace ALL current data. Continue?')) {
        return
      }
      await importBackup(data)
      toast('Data imported successfully')
    } catch (err) {
      console.error('Import failed', err)
      toast('Import failed: invalid backup file', 'error')
    } finally {
      e.target.value = ''
    }
  }

  const handleReset = async () => {
    if (confirm('Are you sure? This will delete all your data.')) {
      await db.workouts.clear()
      await db.workoutExercises.clear()
      await db.workoutSets.clear()
      await db.goals.clear()
      await db.weeklyGoals.clear()
      await db.personalRecords.clear()
      await db.bodyMeasurements.clear()
      await db.customCards.clear()
      toast('All data reset')
    }
  }

  const themeOptions = [
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ]

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Customize your experience</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value)
                    updateSettings({ theme: value })
                  }}
                  className={`flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl transition-all min-h-[60px] ${
                    theme === value ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{label}</span>
                  {theme === value && <Check size={12} className="mt-0.5" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Units</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['kg', 'lbs'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => updateSettings({ unit: u })}
                  className={`flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-xl transition-all min-h-[44px] ${
                    (settings?.unit ?? 'kg') === u ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <Weight size={16} />
                  <span className="text-sm font-medium">{u.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Rest Timer (seconds)</h3>
            <Input
              type="number"
              value={settings?.restTimer ?? 90}
              onChange={e => updateSettings({ restTimer: parseInt(e.target.value) || 90 })}
              className="w-24"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Backup & Restore</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleExport}>
                <Download size={16} className="mr-1" /> Export
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleImport}>
                <Upload size={16} className="mr-1" /> Import
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-destructive">Danger Zone</h3>
            <Button variant="destructive" className="w-full" onClick={handleReset}>
              <Trash2 size={16} className="mr-1" /> Reset All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
