'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Workflow, History, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/helpers'

const navItems = [
  { href: '/workflows', label: 'Workflows', icon: Workflow },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href)
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "hover:bg-krea-accent",
              isActive 
                ? "bg-krea-primary text-white" 
                : "text-krea-text-secondary hover:text-krea-text-primary"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}