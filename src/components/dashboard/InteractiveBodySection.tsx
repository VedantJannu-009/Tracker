import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { db } from '@/db/schema'
import { Anatomy } from '@/components/anatomy/Anatomy'
import { Card, CardContent } from '@/components/ui/card'
import { useAllRecovery } from '@/hooks/useRecovery'

export function InteractiveBodySection() {
  const navigate = useNavigate()
  const [view, setView] = useState<'front' | 'back'>('front')
  const muscleGroups = useLiveQuery(() => db.muscleGroups.toArray())
  const recoveryMap = useAllRecovery()

  if (!muscleGroups || muscleGroups.length === 0) return null

  const handleSelect = (id: string) => {
    const muscle = muscleGroups.find(m => m.id === id)
    if (muscle) navigate(`/muscles/${muscle.id}`)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Interactive Body</h2>
        <div className="flex rounded-xl bg-muted p-0.5 shrink-0">
          <button
            onClick={() => setView('front')}
            aria-pressed={view === 'front'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px] ${
              view === 'front' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setView('back')}
            aria-pressed={view === 'back'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px] ${
              view === 'back' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-2 sm:p-4">
          <Anatomy view={view} onMuscleClick={handleSelect} colorMode="recovery" recoveryMap={recoveryMap} />
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex items-center justify-center gap-3 mt-3 flex-wrap"
      >
        <span className="flex items-center gap-1.5 text-[10px] text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70 animate-pulse" /> Recovering
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-green-400">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" /> Ready
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" /> Inactive
        </span>
      </motion.div>
    </div>
  )
}
