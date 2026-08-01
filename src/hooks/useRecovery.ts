import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import type { RecoverySnapshot, RecoveryStatus } from '@/types'

export interface RecoveryView {
  id: string
  status: RecoveryStatus
  pct: number
  lastWorkoutAt: number | null
  readyAt: number | null
  estimatedHours: number
  remainingMs: number
  remainingLabel: string
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Ready'
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m left`
  if (minutes === 0) return `${hours}h left`
  return `${hours}h ${minutes}m left`
}

function toView(snapshot: RecoverySnapshot, now: number): RecoveryView {
  if (snapshot.status === 'inactive' || snapshot.readyAt === null || snapshot.lastWorkoutAt === null) {
    return {
      id: snapshot.id,
      status: 'inactive',
      pct: 0,
      lastWorkoutAt: snapshot.lastWorkoutAt,
      readyAt: snapshot.readyAt,
      estimatedHours: snapshot.estimatedHours,
      remainingMs: 0,
      remainingLabel: '—',
    }
  }

  const totalMs = Math.max(1, snapshot.readyAt - snapshot.lastWorkoutAt)
  const elapsedMs = now - snapshot.lastWorkoutAt
  const pct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))
  const status: RecoveryStatus = pct >= 100 ? 'ready' : 'recovering'
  const remainingMs = Math.max(0, snapshot.readyAt - now)

  return {
    id: snapshot.id,
    status,
    pct,
    lastWorkoutAt: snapshot.lastWorkoutAt,
    readyAt: snapshot.readyAt,
    estimatedHours: snapshot.estimatedHours,
    remainingMs,
    remainingLabel: formatRemaining(remainingMs),
  }
}

function useNowTicker(intervalMs = 60000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

export function useAllRecovery(): Map<string, RecoveryView> {
  const now = useNowTicker()
  const snapshots = useLiveQuery<RecoverySnapshot[]>(() => db.recovery.toArray())

  return useMemo(() => {
    const map = new Map<string, RecoveryView>()
    for (const snapshot of snapshots ?? []) {
      map.set(snapshot.id, toView(snapshot, now))
    }
    return map
  }, [snapshots, now])
}

export function useRecovery(muscleId: string | undefined): RecoveryView | undefined {
  const now = useNowTicker()
  const snapshot = useLiveQuery<RecoverySnapshot | undefined>(
    () => (muscleId ? db.recovery.get(muscleId) : Promise.resolve(undefined)),
    [muscleId]
  )

  return useMemo(() => (snapshot ? toView(snapshot, now) : undefined), [snapshot, now])
}
