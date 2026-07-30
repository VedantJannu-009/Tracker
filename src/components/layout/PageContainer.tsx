import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn('w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pb-28 pt-6', className)}>
      {children}
    </main>
  )
}
