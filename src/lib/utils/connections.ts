import { CONNECTION_RULES } from './constants'
import type { Edge, Node } from '@xyflow/react'

interface ConnectionValidation {
  isValid: boolean
  error?: string
  rule?: (typeof CONNECTION_RULES)[number]
}

/**
 * Validate if a connection between two nodes is allowed
 */
export function validateConnection(
  sourceNodeType: string,
  targetNodeType: string,
  sourceHandle: string,
  targetHandle: string
): ConnectionValidation {
  // Find matching rule
  const rule = CONNECTION_RULES.find(
    (r) =>
      r.from === sourceNodeType &&
      r.to === targetNodeType &&
      (r.handles as readonly string[]).includes(targetHandle)
  )

  if (!rule) {
    return {
      isValid: false,
      error: `Cannot connect ${sourceNodeType} to ${targetNodeType}`,
    }
  }

  return {
    isValid: true,
    rule,
  }
}

/**
 * Check if connection would create a cycle
 */
export function wouldCreateCycle(
  sourceNodeId: string,
  targetNodeId: string,
  nodes: Array<Pick<Node, 'id'>>,
  edges: Array<Pick<Edge, 'source' | 'target'>>
): boolean {
  // Build adjacency list
  const adjacency: Record<string, string[]> = {}
  
  nodes.forEach((node) => {
    adjacency[node.id] = []
  })

  edges.forEach((edge) => {
    adjacency[edge.source].push(edge.target)
  })

  // Add proposed connection
  adjacency[sourceNodeId].push(targetNodeId)

  // DFS to detect cycle
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true
    }

    if (visited.has(nodeId)) {
      return false
    }

    visited.add(nodeId)
    recursionStack.add(nodeId)

    for (const neighbor of adjacency[nodeId]) {
      if (hasCycle(neighbor)) {
        return true
      }
    }

    recursionStack.delete(nodeId)
    return false
  }

  // Check from target node (would it reach back to source?)
  return hasCycle(targetNodeId)
}

/**
 * Get compatible target handles for a source handle
 */
export function getCompatibleHandles(
  sourceNodeType: string
): Array<{ nodeType: string; handle: string }> {
  const compatible: Array<{ nodeType: string; handle: string }> = []

  CONNECTION_RULES.filter((r) => r.from === sourceNodeType).forEach((rule) => {
    rule.handles.forEach((handle) => {
      compatible.push({
        nodeType: rule.to,
        handle,
      })
    })
  })

  return compatible
}

/**
 * Get connection color based on data type
 */
export function getConnectionColor(dataType: string): string {
  const colors: Record<string, string> = {
    text: '#3b82f6',
    image: '#8b5cf6',
    video: '#ec4899',
    number: '#f59e0b',
  }

  return colors[dataType] || '#6366f1'
}