'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/helpers'

interface SelectOption {
  value: string
  children: React.ReactNode
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'bg-krea-surface border-krea-node-border text-krea-text-primary focus-visible:ring-krea-primary',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

const SelectOption: React.FC<SelectOption> = ({ value, children }) => {
  return <option value={value}>{children}</option>
}

export { Select, SelectOption }