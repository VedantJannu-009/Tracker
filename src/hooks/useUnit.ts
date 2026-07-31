import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import type { Unit } from '@/lib/units'

export function useUnit(): Unit {
  const settings = useLiveQuery(() => db.settings.get('default'))
  return settings?.unit ?? 'kg'
}
