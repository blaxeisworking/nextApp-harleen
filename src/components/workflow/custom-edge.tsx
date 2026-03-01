'use client'

import { memo } from 'react'
import {
  EdgeProps,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'all',
            }}
            className="flex items-center gap-1"
          >
            <div
              className="px-2 py-0.5 text-xs font-semibold rounded bg-krea-surface border border-krea-border text-krea-text-primary whitespace-nowrap"
              style={{ backgroundColor: style.stroke }}
            >
              {label}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-krea-error hover:text-white"
              onClick={() => {
                // Delete edge logic will be handled by React Flow
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(CustomEdge)