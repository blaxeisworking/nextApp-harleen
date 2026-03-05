'use client'

import { useEffect } from 'react'
import { useWorkflowStore } from '@/stores/workflow-store'

export function useKeyboardShortcuts() {
  const { deleteSelected, deselectAll, selectAll } = useWorkflowStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete selected nodes/edges
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Don't delete if typing in an input
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return
        }
        
        deleteSelected()
      }

      // Select all (Cmd/Ctrl + A)
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault()
        selectAll()
      }

      // Deselect all (Escape)
      if (event.key === 'Escape') {
        deselectAll()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteSelected, deselectAll, selectAll])
}