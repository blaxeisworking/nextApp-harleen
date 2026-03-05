/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react'
import { CustomNodeData } from '@/types/node.types'
import { Workflow, WorkflowExecution } from '@/types/workflow.types'
import { generateId, deepClone } from '@/lib/utils/helpers'
import { validateConnection, wouldCreateCycle, getConnectionColor } from '@/lib/utils/connections'

interface WorkflowState {
  workflow: Workflow | null
  nodes: Node<CustomNodeData>[]
  edges: Edge[]

  selectedNodes: string[]
  selectedEdges: string[]

  isExecuting: boolean
  executionHistory: WorkflowExecution[]
  currentExecution: WorkflowExecution | null

  zoom: number
  // Undo/Redo history
  history: { nodes: Node<CustomNodeData>[]; edges: Edge[] }[]
  historyIndex: number
  center: { x: number; y: number }
  snapToGrid: boolean
  gridSize: number
  showGrid: boolean
  showMinimap: boolean
  showControls: boolean

  setWorkflow: (workflow: Workflow | null) => void
  setNodes: (nodes: Node<CustomNodeData>[]) => void
  setEdges: (edges: Edge[]) => void

  addNode: (node: Node<CustomNodeData>) => void
  removeNode: (nodeId: string) => void
  updateNode: (nodeId: string, data: Partial<CustomNodeData>) => void

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  removeEdge: (edgeId: string) => void

  selectNode: (nodeId: string, multiSelect?: boolean) => void
  deselectNode: (nodeId: string) => void
  selectAll: () => void
  deselectAll: () => void
  deleteSelected: () => void

  startExecution: (execution: WorkflowExecution) => void
  updateExecution: (execution: WorkflowExecution) => void
  endExecution: () => void

  setZoom: (zoom: number) => void
  setCenter: (center: { x: number; y: number }) => void
  setSnapToGrid: (snap: boolean) => void
  setGridSize: (size: number) => void
  setShowGrid: (show: boolean) => void
  setShowMinimap: (show: boolean) => void
  setShowControls: (show: boolean) => void

  saveWorkflow: () => Promise<void>
  loadWorkflow: (id: string) => Promise<void>
  newWorkflow: () => void
  duplicateWorkflow: () => void
  exportWorkflow: () => string
  importWorkflow: (data: string) => void

  executeWorkflow: () => Promise<void>
  executeNode: (nodeId: string) => Promise<void>
  executeSelected: () => Promise<void>
  stopExecution: () => void

  loadExecutionHistory: () => Promise<void>
  clearExecutionHistory: () => Promise<void>
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    persist(
      (set, get) => ({
        workflow: null,
        nodes: [],
        edges: [],
        selectedNodes: [],
        selectedEdges: [],
        isExecuting: false,
        executionHistory: [],
        currentExecution: null,

        zoom: 1,
        history: [],
        historyIndex: -1,
        center: { x: 0, y: 0 },
        snapToGrid: true,
        gridSize: 20,
        showGrid: true,
        showMinimap: true,
        showControls: true,

        setWorkflow: (workflow) => set({ workflow }),
        setNodes: (nodes) => set({ nodes }),
        setEdges: (edges) => set({ edges }),

        addNode: (node) =>
          set((s) => ({ nodes: [...s.nodes, node] })),

        removeNode: (nodeId) =>
          set((s) => ({
            nodes: s.nodes.filter((n) => n.id !== nodeId),
            edges: s.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            ),
            selectedNodes: s.selectedNodes.filter((id) => id !== nodeId),
          })),

        updateNode: (nodeId, data) =>
          set((s) => ({
            nodes: s.nodes.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...(n.data as any), ...(data as any) } as any }
                : n
            ) as any,
          })),

        onNodesChange: (changes) =>
          set((s) => ({
            nodes: applyNodeChanges(changes, s.nodes as any) as any,
          })),

        onEdgesChange: (changes) =>
          set((s) => ({
            edges: applyEdgeChanges(changes, s.edges as any) as any,
            selectedEdges: changes
              .filter((c) => c.type === 'select' && (c as any).selected)
              .map((c) => (c as any).id as string | undefined)
              .filter((id): id is string => Boolean(id)),
          })),

        onConnect: (connection) =>
          set((s) => {
            const source = s.nodes.find((n) => n.id === connection.source)
            const target = s.nodes.find((n) => n.id === connection.target)

            if (!source || !target) return s
            if (!source.type || !target.type) return s
            if (!connection.sourceHandle || !connection.targetHandle) return s

            const validation = validateConnection(
              source.type,
              target.type,
              connection.sourceHandle,
              connection.targetHandle
            )

            if (!validation.isValid) return s
            if (wouldCreateCycle(source.id, target.id, s.nodes, s.edges)) return s

            const stroke = getConnectionColor(validation.rule?.type ?? 'text')
            const nextEdges = addEdge(
              {
                ...connection,
                type: 'custom',
                animated: true,
                style: {
                  stroke,
                  strokeWidth: 2,
                },
              },
              s.edges
            )

            return {
              ...s,
              edges: nextEdges,
            }
          }),

        removeEdge: (edgeId) =>
          set((s) => ({
            edges: s.edges.filter((e) => e.id !== edgeId),
          })),

        selectNode: (nodeId, multi = false) =>
          set((s) => ({
            selectedNodes: multi
              ? Array.from(new Set([...s.selectedNodes, nodeId]))
              : [nodeId],
          })),

        deselectNode: (nodeId) =>
          set((s) => ({
            selectedNodes: s.selectedNodes.filter((id) => id !== nodeId),
          })),

        selectAll: () =>
          set((s) => ({ selectedNodes: s.nodes.map((n) => n.id) })),

        deselectAll: () =>
          set({ selectedNodes: [], selectedEdges: [] }),

        deleteSelected: () =>
          set((s) => ({
            nodes: s.nodes.filter((n) => !s.selectedNodes.includes(n.id)),
            edges: s.edges.filter(
              (e) =>
                !s.selectedNodes.includes(e.source) &&
                !s.selectedNodes.includes(e.target) &&
                !s.selectedEdges.includes(e.id)
            ),
            selectedNodes: [],
            selectedEdges: [],
          })),

        startExecution: (execution) =>
          set({ currentExecution: execution, isExecuting: true }),

        updateExecution: (execution) =>
          set({ currentExecution: execution }),

        endExecution: () =>
          set((s) =>
            s.currentExecution
              ? {
                  isExecuting: false,
                  executionHistory: [
                    s.currentExecution,
                    ...s.executionHistory,
                  ],
                  currentExecution: null,
                }
              : { isExecuting: false }
          ),

        setZoom: (zoom) => set({ zoom }),
        setCenter: (center) => set({ center }),
        setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
        setGridSize: (gridSize) => set({ gridSize }),
        setShowGrid: (showGrid) => set({ showGrid }),
        setShowMinimap: (showMinimap) => set({ showMinimap }),
        setShowControls: (showControls) => set({ showControls }),

        newWorkflow: () =>
          set({
            workflow: {
              id: generateId('workflow'),
              name: 'New Workflow',
              description: '',
              nodes: [],
              edges: [],
              userId: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: [],
            },
            nodes: [],
            edges: [],
            selectedNodes: [],
            selectedEdges: [],
            executionHistory: [],
          }),

        duplicateWorkflow: () => {
          const { workflow, nodes, edges } = get()
          if (!workflow) return

          const nodeIdMap = new Map<string, string>()

          const newNodes = nodes.map((n) => {
            const id = generateId(n.type)
            nodeIdMap.set(n.id, id)
            return { ...deepClone(n), id }
          })

          const newEdges = edges.map((e) => ({
            ...deepClone(e),
            id: generateId('edge'),
            source: nodeIdMap.get(e.source)!,
            target: nodeIdMap.get(e.target)!,
          }))

          set({
            workflow: {
              ...deepClone(workflow),
              id: generateId('workflow'),
              name: `${workflow.name} (Copy)`,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            nodes: newNodes,
            edges: newEdges,
            selectedNodes: [],
            selectedEdges: [],
          })
        },

        exportWorkflow: () =>
          JSON.stringify(
            {
              version: '1.0.0',
              workflow: { ...get().workflow, nodes: get().nodes, edges: get().edges },
              exportedAt: new Date(),
            },
            null,
            2
          ),

        importWorkflow: (data) => {
          try {
            const parsed = JSON.parse(data)
            if (!parsed?.workflow) return
            set({
              workflow: {
                ...parsed.workflow,
                id: generateId('workflow'),
                name: `${parsed.workflow.name} (Imported)`,
              },
              nodes: parsed.workflow.nodes ?? [],
              edges: parsed.workflow.edges ?? [],
              selectedNodes: [],
              selectedEdges: [],
            })
          } catch (e) {
            console.error('Invalid workflow import', e)
          }
        },

        saveWorkflow: async () => {
          const { workflow, nodes, edges } = get()
          if (!workflow) return

          const payload = {
            name: workflow.name,
            description: workflow.description,
            tags: workflow.tags ?? [],
            nodes,
            edges,
          }

          const updateRes = await fetch(`/api/workflows/${workflow.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (updateRes.status === 404) {
            const createRes = await fetch('/api/workflows', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

            if (!createRes.ok) {
              const text = await createRes.text().catch(() => '')
              throw new Error(text || 'Failed to create workflow')
            }

            const createdJson = await createRes.json().catch(() => null)
            if (createdJson?.success && createdJson?.data) {
              // Replace the local workflow with the DB workflow (real id)
              set({ workflow: createdJson.data })
            }
            return
          }

          if (!updateRes.ok) {
            const text = await updateRes.text().catch(() => '')
            throw new Error(text || 'Failed to save workflow')
          }

          const json = await updateRes.json().catch(() => null)
          if (json?.success && json?.data) {
            set({ workflow: json.data })
          }
        },

        loadWorkflow: async (id: string) => {
          const res = await fetch(`/api/workflows/${id}`, { method: 'GET' })
          if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(text || 'Failed to load workflow')
          }

          const json = await res.json().catch(() => null)
          if (!json?.success || !json?.data) return

          const wf: Workflow = json.data
          set({
            workflow: wf,
            nodes: (wf.nodes as any) ?? [],
            edges: (wf.edges as any) ?? [],
            selectedNodes: [],
            selectedEdges: [],
          })
        },

        executeWorkflow: async () => {
          const { workflow } = get()
          if (!workflow) return

          // Best-effort persist first (gives us a DB workflow id), but allow local/dev
          // execution even when DB isn't configured.
          try {
            await get().saveWorkflow()
          } catch (err) {
            console.warn('saveWorkflow failed; executing without persistence', err)
          }

          const wf = get().workflow
          if (!wf) return

          let execError: Error | null = null
          let execJson: any = null

          set({ isExecuting: true })

          try {
            const res = await fetch(`/api/workflows/${wf.id}/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                workflow: { id: wf.id, name: wf.name, description: wf.description },
                nodes: get().nodes,
                edges: get().edges,
              }),
            })

            if (!res.ok) {
              const text = await res.text().catch(() => '')
              throw new Error(text || 'Failed to execute workflow')
            }

            execJson = await res.json().catch(() => null)

            // Apply outputs to nodes so results appear on the canvas.
            const results = execJson?.data?.results
            if (results && typeof results === 'object') {
              const nodesById = new Map(get().nodes.map((n) => [n.id, n]))
              for (const [nodeId, result] of Object.entries(results)) {
                const node = nodesById.get(nodeId)
                const nodeType = node?.type
                if (!node || !nodeType) continue

                if (nodeType === 'llm') {
                  const text =
                    typeof result === 'string'
                      ? result
                      : (result as any)?.text ??
                        (result as any)?.output?.text ??
                        (result as any)?.content ??
                        ''

                  if (text) {
                    get().updateNode(nodeId, {
                      outputs: { text: String(text) },
                      isExecuting: false,
                      error: undefined,
                    } as any)
                  }
                }

                if (nodeType === 'crop' || nodeType === 'extract-frame') {
                  const imageUrl =
                    (result as any)?.imageUrl ??
                    (result as any)?.url ??
                    (result as any)?.output?.imageUrl ??
                    (result as any)?.output?.url

                  if (imageUrl) {
                    get().updateNode(nodeId, {
                      outputs: { imageUrl: String(imageUrl) },
                      isExecuting: false,
                      error: undefined,
                    } as any)
                  }
                }

                // Clear executing flag for any node that produced a result.
                if ((node.data as any)?.isExecuting) {
                  get().updateNode(nodeId, { isExecuting: false } as any)
                }
              }
            }

            // Apply per-node errors so failures are visible on the canvas.
            const errors = execJson?.data?.errors
            if (errors && typeof errors === 'object') {
              for (const [nodeId, message] of Object.entries(errors)) {
                if (!message) continue
                get().updateNode(nodeId, {
                  isExecuting: false,
                  error: String(message),
                } as any)
              }
            }

            if (execJson && execJson.success === false) {
              throw new Error(execJson.error || 'Execution failed')
            }

            if (execJson?.data?.status === 'failed') {
              const firstError =
                errors && typeof errors === 'object'
                  ? String(Object.values(errors)[0] ?? 'Execution failed')
                  : 'Execution failed'
              throw new Error(firstError)
            }
          } catch (err) {
            execError = err instanceof Error ? err : new Error(String(err))
          } finally {
            // Refresh history so the right sidebar updates even if the run failed.
            // (The API creates an ExecutionHistory row up-front and then marks it failed.)
            await get().loadExecutionHistory().catch(() => {
              // Ignore history refresh errors (e.g. not signed in, DB not configured).
            })

            set({ isExecuting: false })
          }

          if (execError) {
            // Avoid silent failures (header doesn't currently surface errors).
            if (typeof window !== 'undefined') {
              alert(execError.message)
            }
            throw execError
          }
        },
        executeNode: async () => {},
        executeSelected: async () => {},
        stopExecution: () => {},

        loadExecutionHistory: async () => {
          const res = await fetch('/api/history', { method: 'GET' })
          if (!res.ok) {
            // Don't wipe local entries if the DB request fails
            return
          }

          const json = await res.json().catch(() => null)
          if (!json?.success || !Array.isArray(json.data)) return

          // Map ExecutionHistory rows into the WorkflowExecution shape expected by UI.
          const mapped: WorkflowExecution[] = json.data.map((row: any) => ({
            id: row.executionId ?? row.id,
            workflowId: row.workflowId ?? '',
            userId: row.userId,
            name: row.name,
            description: row.description,
            status: row.status,
            nodes: row.nodes ?? {},
            results: row.results ?? undefined,
            createdAt: new Date(row.createdAt),
            completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
            executionTime: row.executionTime ?? undefined,
            trigger: row.trigger,
            scope: row.scope,
            nodeIds: row.nodeIds ?? undefined,
          }))

          // Merge DB results with any local-only entries (e.g. from single-node runs)
          // so local entries don't disappear when DB refresh fires.
          set((s) => {
            const dbIds = new Set(mapped.map((e) => e.id))
            const localOnly = s.executionHistory.filter((e) => !dbIds.has(e.id))
            return { executionHistory: [...localOnly, ...mapped] }
          })
        },
        clearExecutionHistory: async () => {
          try {
            await fetch('/api/history', { method: 'DELETE' })
          } catch {
            // DB may not be configured; still clear locally
          }
          set({ executionHistory: [] })
        },
      }),
      {
        name: 'workflow-store',
        partialize: (s) => ({
          zoom: s.zoom,
          center: s.center,
          snapToGrid: s.snapToGrid,
          gridSize: s.gridSize,
          showGrid: s.showGrid,
          showMinimap: s.showMinimap,
          showControls: s.showControls,
        }),
      }
    )
  )
)

export const useWorkflowNodes = () => useWorkflowStore((s) => s.nodes)
export const useWorkflowEdges = () => useWorkflowStore((s) => s.edges)
export const useSelectedNodes = () => useWorkflowStore((s) => s.selectedNodes)
export const useIsExecuting = () => useWorkflowStore((s) => s.isExecuting)
export const useCurrentWorkflow = () => useWorkflowStore((s) => s.workflow)