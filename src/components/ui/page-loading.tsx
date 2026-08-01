import { Loader2 } from 'lucide-react'

export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={20} className="mr-2 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
