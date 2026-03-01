'use client'

import { ReactFlowProvider } from '@xyflow/react'
import { useUIStore } from '@/stores/ui-store'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import LeftSidebar from '@/components/workflow/sidebar-left'
import RightSidebar from '@/components/workflow/sidebar-right'
import '@xyflow/react/dist/style.css'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebar } = useUIStore()

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-krea-background" suppressHydrationWarning>
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          {sidebar.left && (
            <aside 
              className="flex-shrink-0 bg-krea-surface border-r border-krea-border"
              style={{ width: `${sidebar.width.left}px` }}
            >
              <LeftSidebar />
            </aside>
          )}
          
          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
          
          {/* Right Sidebar */}
          {sidebar.right && (
            <aside 
              className="flex-shrink-0 bg-krea-surface border-l border-krea-border"
              style={{ width: `${sidebar.width.right}px` }}
            >
              <RightSidebar />
            </aside>
          )}
        </div>
        
        <Footer />
      </div>
    </ReactFlowProvider>
  )
}