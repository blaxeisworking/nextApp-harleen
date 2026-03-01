'use client'

import { useState } from 'react'
import { Clock, Play, CheckCircle, XCircle, AlertCircle, ChevronRight, Trash2, Download, X } from 'lucide-react'
import { useWorkflowStore } from '@/stores/workflow-store'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDate } from '@/lib/utils/formatting'

export default function RightSidebar() {
  const { executionHistory, toggleSidebar } = useUIStore()
  const { workflow } = useWorkflowStore()
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-krea-success" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-krea-error" />
      case 'running':
        return <Clock className="w-4 h-4 text-krea-warning animate-spin" />
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-krea-warning" />
      default:
        return <Play className="w-4 h-4 text-krea-text-muted" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-krea-success/20 text-krea-success border-krea-success/30',
      failed: 'bg-krea-error/20 text-krea-error border-krea-error/30',
      running: 'bg-krea-warning/20 text-krea-warning border-krea-warning/30',
      partial: 'bg-krea-warning/20 text-krea-warning border-krea-warning/30',
      pending: 'bg-krea-text-muted/20 text-krea-text-muted border-krea-text-muted/30',
    }
    
    return (
      <Badge className={`border ${variants[status as keyof typeof variants] || variants.pending}`}>
        {status}
      </Badge>
    )
  }

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'full':
        return 'Full Workflow'
      case 'partial':
        return 'Selected Nodes'
      case 'single':
        return 'Single Node'
      default:
        return scope
    }
  }

  return (
    <div className="flex flex-col h-full bg-krea-surface border-l border-krea-border">
      {/* Header */}
      <div className="p-4 border-b border-krea-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-krea-text-primary">Workflow History</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSidebar('right')}
            className="h-8 w-8 hover:bg-krea-accent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs">
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {executionHistory && executionHistory.length > 0 ? (
            <div className="space-y-2">
              {executionHistory.map((run, index) => (
                <div
                  key={run.id || index}
                  className="border border-krea-node-border rounded-lg overflow-hidden"
                >
                  {/* Run Header */}
                  <div
                    className="p-3 bg-krea-node hover:bg-krea-node-hover cursor-pointer transition-colors"
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`w-4 h-4 text-krea-text-muted transition-transform ${
                          expandedRun === run.id ? 'rotate-90' : ''
                        }`}
                      />
                      {getStatusIcon(run.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-krea-text-primary truncate">
                          {run.name || `Run #${index + 1}`}
                        </div>
                        <div className="text-xs text-krea-text-muted">
                          {formatDate.ago(run.createdAt || new Date())}
                        </div>
                      </div>
                      {getStatusBadge(run.status)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-krea-text-muted">
                      <span>{getScopeLabel(run.scope)}</span>
                      {run.executionTime && (
                        <>
                          <span>•</span>
                          <span>{formatDate.formatDuration(run.executionTime)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRun === run.id && (
                    <div className="p-3 bg-krea-surface border-t border-krea-node-border">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-krea-text-muted uppercase tracking-wider">
                          Node Execution Details
                        </div>
                        {run.nodes && Object.entries(run.nodes).map(([nodeId, nodeData]: [string, any]) => (
                          <div
                            key={nodeId}
                            className="p-2 bg-krea-node rounded border border-krea-node-border"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-krea-text-primary">{nodeData.label || nodeId}</span>
                              {getStatusIcon(nodeData.status)}
                            </div>
                            {nodeData.output && (
                              <div className="text-xs text-krea-text-muted mt-1">
                                Output: {String(nodeData.output).slice(0, 100)}...
                              </div>
                            )}
                            {nodeData.error && (
                              <div className="text-xs text-krea-error mt-1">
                                Error: {nodeData.error}
                              </div>
                            )}
                            {nodeData.executionTime && (
                              <div className="text-xs text-krea-text-muted mt-1">
                                Duration: {formatDate.formatDuration(nodeData.executionTime)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Play className="w-12 h-12 text-krea-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-krea-text-muted text-sm">No workflow history yet</p>
              <p className="text-krea-text-muted text-xs mt-1">
                Run a workflow to see history here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-4 border-t border-krea-border">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-krea-success">
              {executionHistory?.filter(r => r.status === 'completed').length || 0}
            </div>
            <div className="text-xs text-krea-text-muted">Success</div>
          </div>
          <div>
            <div className="text-lg font-bold text-krea-error">
              {executionHistory?.filter(r => r.status === 'failed').length || 0}
            </div>
            <div className="text-xs text-krea-text-muted">Failed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-krea-text-primary">
              {executionHistory?.length || 0}
            </div>
            <div className="text-xs text-krea-text-muted">Total</div>
          </div>
        </div>
      </div>
    </div>
  )
}