import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variant === 'default' && 'bg-muted text-muted-foreground',
        variant === 'success' && 'bg-success/10 text-success',
        variant === 'warning' && 'bg-yellow-500/10 text-yellow-500',
        variant === 'destructive' && 'bg-destructive/10 text-destructive',
        className
      )}
      {...props}
    />
  )
}
