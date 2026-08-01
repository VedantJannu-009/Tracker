import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { db } from '@/db/schema'
import { Card, CardContent } from '@/components/ui/card'
import { Dumbbell, Flame } from 'lucide-react'
import { format } from 'date-fns'
import { toLocalDateKey } from '@/lib/dates'
import type { Workout } from '@/types'

const WEEKS = 20
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const LEVEL_OPACITY = [0, 0.22, 0.42, 0.68, 1]

interface DayCell {
  dateKey: string
  date: Date
}

interface HeatmapCalendarProps {
  className?: string
}

export function HeatmapCalendar({ className }: HeatmapCalendarProps) {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => toLocalDateKey(today), [today])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const allWorkouts = useLiveQuery(() => db.workouts.toArray())
  const allWorkoutExercises = useLiveQuery(() => db.workoutExercises.toArray())
  const allSets = useLiveQuery(() => db.workoutSets.toArray())

  const weeks = useMemo<DayCell[][]>(() => {
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - today.getDay())
    const start = new Date(sunday)
    start.setDate(start.getDate() - (WEEKS - 1) * 7)
    const cols: DayCell[][] = []
    for (let w = 0; w < WEEKS; w++) {
      const week: DayCell[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        week.push({ dateKey: toLocalDateKey(date), date })
      }
      cols.push(week)
    }
    return cols
  }, [today])

  const dateStats = useMemo(() => {
    const map = new Map<string, { sets: number; workouts: Workout[] }>()
    if (!allWorkouts || !allWorkoutExercises || !allSets) return map

    const weById = new Map(allWorkoutExercises.map(we => [we.id, we]))
    const workoutDate = new Map(allWorkouts.map(w => [w.id, toLocalDateKey(w.date)]))
    const setsByWorkout = new Map<string, number>()
    for (const s of allSets) {
      const we = weById.get(s.workoutExerciseId)
      if (!we) continue
      setsByWorkout.set(we.workoutId, (setsByWorkout.get(we.workoutId) ?? 0) + 1)
    }
    for (const w of allWorkouts) {
      const key = workoutDate.get(w.id)
      if (!key) continue
      const cur = map.get(key) ?? { sets: 0, workouts: [] }
      cur.sets += setsByWorkout.get(w.id) ?? 0
      cur.workouts.push(w)
      map.set(key, cur)
    }
    return map
  }, [allWorkouts, allWorkoutExercises, allSets])

  const maxSets = useMemo(() => {
    let max = 0
    for (const week of weeks) {
      for (const day of week) {
        max = Math.max(max, dateStats.get(day.dateKey)?.sets ?? 0)
      }
    }
    return max
  }, [weeks, dateStats])

  const monthLabels = useMemo(() => {
    const labels: string[] = []
    let prevMonth = -1
    weeks.forEach((week, i) => {
      const m = week[0].date.getMonth()
      labels.push(i === 0 || m !== prevMonth ? MONTHS_SHORT[m] : '')
      prevMonth = m
    })
    return labels
  }, [weeks])

  const selected = selectedDate ? dateStats.get(selectedDate) ?? null : null

  const level = (sets: number): number => {
    if (sets <= 0 || maxSets <= 0) return 0
    const ratio = sets / maxSets
    if (ratio >= 0.9) return 4
    if (ratio >= 0.6) return 3
    if (ratio >= 0.3) return 2
    return 1
  }

  return (
    <div className={className}>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Calendar</h2>
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
            <div className="min-w-fit">
              <div className="flex items-center mb-1.5">
                <div className="w-[14px] shrink-0" />
                {monthLabels.map((label, i) => (
                  <div key={i} className="w-[10px] shrink-0 text-[8px] leading-none text-muted-foreground truncate overflow-visible">
                    {label}
                  </div>
                ))}
              </div>
              <div className="flex items-center" style={{ gap: 3 }}>
                <div className="w-[14px] shrink-0 flex flex-col items-center" style={{ gap: 3 }}>
                  {DAYS.map((d, i) => (
                    <div key={i} className="h-[10px] flex items-center text-[8px] leading-none text-muted-foreground">{d}</div>
                  ))}
                </div>
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col shrink-0" style={{ gap: 3 }}>
                    {week.map(day => {
                      const stats = dateStats.get(day.dateKey)
                      const sets = stats?.sets ?? 0
                      const isToday = day.dateKey === todayKey
                      const isSelected = day.dateKey === selectedDate
                      const lvl = level(sets)
                      return (
                        <button
                          key={day.dateKey}
                          onClick={() => setSelectedDate(isSelected ? null : day.dateKey)}
                          aria-label={`${format(day.date, 'MMM d, yyyy')}${sets > 0 ? `, ${sets} sets` : ''}`}
                          title={`${format(day.date, 'MMM d, yyyy')}${sets > 0 ? ` · ${sets} sets` : ''}`}
                          className="heatmap-cell rounded-[2px]"
                          style={{
                            width: 10,
                            height: 10,
                            backgroundColor: sets > 0
                              ? `rgba(59, 130, 246, ${LEVEL_OPACITY[lvl]})`
                              : 'var(--color-muted)',
                            boxShadow: isSelected
                              ? 'inset 0 0 0 2px var(--color-primary)'
                              : isToday
                                ? 'inset 0 0 0 1.5px var(--color-foreground)'
                                : undefined,
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-0.5">
            <span className="text-[10px] text-muted-foreground">Last {WEEKS} weeks</span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              Less
              <span className="w-2.5 h-2.5 rounded-[2px] bg-muted" />
              <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: 'rgba(59,130,246,0.22)' }} />
              <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: 'rgba(59,130,246,0.42)' }} />
              <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: 'rgba(59,130,246,0.68)' }} />
              <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: '#3b82f6' }} />
              More
            </div>
          </div>

          <AnimatePresence initial={false}>
            {selectedDate && (
              <motion.div
                key={selectedDate}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-3 border-t border-border/30 pt-3">
                  <p className="text-[11px] text-muted-foreground font-medium mb-2">
                    {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMM d')}
                    {selected && ` · ${selected.sets} sets`}
                  </p>
                  {selected && selected.workouts.length > 0 ? (
                    <div className="space-y-1.5">
                      {selected.workouts.map(w => (
                        <div
                          key={w.id}
                          onClick={() => navigate(`/workout/${w.id}`)}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                        >
                          <Dumbbell size={12} className="text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium truncate">{w.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Flame size={12} className="shrink-0" /> Rest day — no workouts logged
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
