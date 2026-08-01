import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react'
import { toLocalDateKey } from '@/lib/dates'

function getDateKey(dateStr: string): string {
  return toLocalDateKey(dateStr)
}

function buildMonthDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days: (number | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  return days
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WorkoutCalendar() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()), [today])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const allWorkouts = useLiveQuery(() => db.workouts.toArray())

  const monthDays = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth])

  const workoutMap = useMemo(() => {
    const map = new Map<string, typeof allWorkouts>()
    if (!allWorkouts) return map
    for (const w of allWorkouts) {
      const key = getDateKey(w.date)
      const list = map.get(key) ?? []
      list.push(w)
      map.set(key, list)
    }
    return map
  }, [allWorkouts])

  const selectedWorkouts = useMemo(() => {
    if (!selectedDate || !allWorkouts) return []
    return allWorkouts.filter(w => getDateKey(w.date) === selectedDate)
  }, [selectedDate, allWorkouts])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
    setSelectedDate(null)
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Calendar</h2>
        <div className="rounded-xl bg-muted/30 border border-border/30 p-2 sm:p-3">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <button onClick={prevMonth} aria-label="Previous month" className="p-1.5 rounded hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <span className="text-xs sm:text-sm font-medium">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} aria-label="Next month" className="p-1.5 rounded hover:bg-muted/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px sm:gap-0.5 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9px] sm:text-[10px] text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px sm:gap-0.5">
          {monthDays.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />
            const dateKey = formatDateKey(viewYear, viewMonth, day)
            const count = workoutMap.get(dateKey)?.length ?? 0
            const isToday = dateKey === todayKey
            const isSelected = dateKey === selectedDate
            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                className={`relative text-center text-[11px] sm:text-xs py-1 sm:py-1.5 rounded-lg transition-colors min-h-[32px] sm:min-h-[36px] ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                      ? 'bg-primary/15 text-foreground font-semibold'
                      : count > 0
                        ? 'bg-muted text-foreground hover:bg-muted/70'
                        : 'text-muted-foreground hover:bg-muted/30'
                }`}
              >
                {day}
                {count > 0 && (
                  <span className={`hidden sm:block text-[8px] leading-none mt-px ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {selectedWorkouts.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
            <p className="text-[11px] text-muted-foreground font-medium">
              {selectedDate} &middot; {selectedWorkouts.length} {selectedWorkouts.length === 1 ? 'workout' : 'workouts'}
            </p>
            {selectedWorkouts.map(w => (
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
        )}
      </div>
    </div>
  )
}
