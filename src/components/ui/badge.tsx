import * as React from 'react'
import { cn } from '@/lib/utils'

const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)]',
      success: 'bg-green-500/15 text-green-400 border border-green-500/30',
      warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
      destructive: 'bg-red-500/15 text-red-400 border border-red-500/30',
      outline: 'border border-[hsl(var(--border))] text-[hsl(var(--foreground))]',
    }
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
