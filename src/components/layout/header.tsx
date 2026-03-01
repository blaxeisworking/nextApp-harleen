'use client'

import { useState, useEffect } from 'react'
import { Menu, Plus, Save, Play, Settings, Bell, Search, Moon, Sun, User } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useWorkflowStore } from '@/stores/workflow-store'
import { cn } from '@/lib/utils/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function Header() {
  const { theme, setTheme, sidebar, toggleSidebar } = useUIStore()
  const { workflow, saveWorkflow, isExecuting } = useWorkflowStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Only run on client after mount
  useEffect(() => {
    setMounted(true)
    setIsDark(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }, [theme])

  const handleSave = async () => {
    if (workflow) {
      await saveWorkflow()
    }
  }

  const handleExecute = async () => {
    await saveWorkflow()
    console.log('Execute workflow - coming soon')
  }

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
    setIsDark(!isDark)
  }

  return (
    <header className="h-16 bg-krea-surface border-b border-krea-border flex items-center px-4 gap-4">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleSidebar('left')}
          className="hover:bg-krea-accent"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-krea-primary to-krea-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NF</span>
          </div>
          <span className="font-semibold text-lg">NextFlow</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-krea-text-muted" />
          <Input
            type="text"
            placeholder="Search workflows, nodes, templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-krea-node border-krea-node-border rounded-lg text-sm focus:ring-2 focus:ring-krea-primary"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Workflow Info */}
        {workflow && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-krea-node border border-krea-node-border rounded-lg">
            <span className="text-sm font-medium truncate max-w-48">{workflow.name}</span>
            {workflow.isPublic && (
              <Badge variant="secondary" className="text-xs">Public</Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={!workflow || isExecuting}
            className="hover:bg-krea-accent"
            title="Save Workflow"
          >
            <Save className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExecute}
            disabled={!workflow || isExecuting}
            className="hover:bg-krea-accent"
            title="Execute Workflow"
          >
            <Play className="w-4 h-4" />
          </Button>
          
          {/* Theme Toggle - Fixed for hydration */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:bg-krea-accent"
            title="Toggle Theme"
            suppressHydrationWarning
          >
            {mounted ? (
              isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )
            ) : (
              // Render nothing or a placeholder during SSR to avoid mismatch
              <Moon className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-krea-accent"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* User Menu - Simplified for now */}
        <div className="flex items-center gap-2 pl-2 border-l border-krea-border">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-krea-accent"
            title="User Profile"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}