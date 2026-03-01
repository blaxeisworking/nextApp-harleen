'use client'
import * as React from 'react'
import { cn } from '@/lib/utils/helpers'

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'border-transparent bg-krea-primary text-white',
      secondary: 'border-transparent bg-krea-secondary text-white',
      destructive: 'border-transparent bg-destructive text-destructive-foreground',
      outline: 'text-foreground',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variantClasses[variant],
          'bg-krea-accent border-krea-border text-krea-text-primary',
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }