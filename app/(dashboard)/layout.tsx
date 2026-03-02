'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { useUIStore } from '@/stores/ui-store'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import LeftSidebar from '@/components/workflow/sidebar-left'
import RightSidebar from '@/components/workflow/sidebar-right'
import { useEffect } from 'react'
import { cn } from '@/lib/utils/helpers'
import '@xyflow/react/dist/style.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebar, toggleSidebar } = useUIStore()

  // Keyboard shortcuts for sidebar toggles
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'b') {
          e.preventDefault()
          toggleSidebar('left')
        } else if (e.key === 'e') {
          e.preventDefault()
          toggleSidebar('right')
        }
      }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [toggleSidebar])

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-krea-background" suppressHydrationWarning>
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <aside 
            className={cn(
              "flex-shrink-0 bg-krea-surface border-r border-krea-border transition-all duration-300",
              sidebar.left ? "translate-x-0" : "-translate-x-full w-0 overflow-hidden"
            )}
            style={{ 
              width: sidebar.left ? `${sidebar.width.left}px` : 0,
            }}
          >
            {sidebar.left && <LeftSidebar />}
          </aside>

          {/* Main Content */}
          <main className="flex-1 relative overflow-hidden">
            {children}
          </main>

          {/* Right Sidebar */}
          <aside 
            className={cn(
              "flex-shrink-0 bg-krea-surface border-l border-krea-border transition-all duration-300",
              sidebar.right ? "translate-x-0" : "translate-x-full w-0 overflow-hidden"
            )}
            style={{ 
              width: sidebar.right ? `${sidebar.width.right}px` : 0,
            }}
          >
            {sidebar.right && <RightSidebar />}
          </aside>
        </div>
        
        <Footer />
      </div>
    </ReactFlowProvider>
  )
}