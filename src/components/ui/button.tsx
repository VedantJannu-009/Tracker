import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive'
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
          variant === 'default' && 'bg-primary text-primary-foreground hover:brightness-110',
          variant === 'ghost' && 'hover:bg-accent text-muted-foreground hover:text-foreground',
          variant === 'outline' && 'border border-border bg-transparent hover:bg-accent hover:text-foreground',
          variant === 'secondary' && 'bg-muted text-foreground hover:brightness-110',
          variant === 'destructive' && 'bg-destructive text-white hover:brightness-110',
          size === 'sm' && 'h-9 sm:h-8 px-3 text-xs min-h-[36px]',
          size === 'default' && 'h-11 sm:h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          size === 'icon' && 'h-11 w-11 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
