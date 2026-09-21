'use client'

// ==============================================================================
// TUTORPULSE PHASE 4: DIGITAL WHITEBOARD COMPONENT
// Top-level controller connecting Canvas, Toolbar, PageBar, Realtime, and DB
// ==============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/toast-context'
import {
  getOrCreateWhiteboardAction,
  saveWhiteboardPageStateAction,
  createWhiteboardPageAction,
  deleteWhiteboardPageAction,
} from '@/lib/whiteboard/service'
import { exportWhiteboardToPNG } from '@/lib/whiteboard/export'
import type { ClassroomRole } from '@/lib/classroom/types'
import type {
  WhiteboardElement,
  WhiteboardPageData,
  WhiteboardTool,
  WhiteboardColor,
  WhiteboardRealtimeEvent,
} from '@/lib/whiteboard/types'
import { WhiteboardToolbar } from './whiteboard-toolbar'
import { WhiteboardCanvas } from './whiteboard-canvas'
import { WhiteboardPageBar } from './whiteboard-page-bar'
import { ClearConfirmModal } from './clear-confirm-modal'

interface DigitalWhiteboardProps {
  sessionId: string
  portalType: 'tutor' | 'parent' | 'student'
  currentUserId?: string
  currentUserName: string
}

export function DigitalWhiteboard({
  sessionId,
  portalType,
  currentUserId,
  currentUserName,
}: DigitalWhiteboardProps) {
  const { toast } = useToast()

  // Whiteboard session state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canDraw, setCanDraw] = useState(false)
  const [role, setRole] = useState<ClassroomRole>('participant')

  // Multi-page state
  const [pages, setPages] = useState<WhiteboardPageData[]>([
    { pageNumber: 1, title: 'Page 1', elements: [] },
  ])
  const [activePageNumber, setActivePageNumber] = useState<number>(1)

  // Active drawing tools
  const [currentTool, setCurrentTool] = useState<WhiteboardTool>('pen')
  const [currentColor, setCurrentColor] = useState<WhiteboardColor>('#4f46e5')
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState<number>(4)

  // Clear modal
  const [showClearModal, setShowClearModal] = useState(false)

  // History for Undo / Redo (per page)
  const [undoStack, setUndoStack] = useState<WhiteboardElement[][]>([])
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([])

  // Debounced auto-save timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Supabase Realtime channel
  const channelRef = useRef<any>(null)

  const activePage = pages.find((p) => p.pageNumber === activePageNumber) || pages[0]
  const currentElements = activePage?.elements || []

  // ============================================================================
  // 1. LOAD WHITEBOARD STATE
  // ============================================================================
  useEffect(() => {
    let isMounted = true

    async function loadWhiteboard() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await getOrCreateWhiteboardAction(sessionId)
        if (!isMounted) return

        if (!res.success || !res.state) {
          setError(res.error || 'Failed to load whiteboard session.')
          setIsLoading(false)
          return
        }

        setCanDraw(Boolean(res.canDraw))
        setRole(res.role || 'participant')
        if (res.state.pages && res.state.pages.length > 0) {
          setPages(res.state.pages)
          setActivePageNumber(res.state.activePageNumber || 1)
        }
      } catch (err: any) {
        if (!isMounted) return
        setError(err?.message || 'Error loading whiteboard.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadWhiteboard()

    return () => {
      isMounted = false
    }
  }, [sessionId])

  // ============================================================================
  // 2. SUPABASE REALTIME SUBSCRIPTION
  // ============================================================================
  useEffect(() => {
    const supabase = createClient()
    const channelName = `classroom:${sessionId}:whiteboard`
    const channel = supabase.channel(channelName)

    channel
      .on('broadcast', { event: 'wb_event' }, ({ payload }: { payload: WhiteboardRealtimeEvent }) => {
        if (!payload || !payload.type) return

        switch (payload.type) {
          case 'ADD_ELEMENT':
          case 'DRAW_STROKE': {
            const { pageNumber, element, stroke } = payload.payload as any
            const newEl = element || stroke
            if (!newEl) return

            setPages((prev) =>
              prev.map((p) => {
                if (p.pageNumber !== pageNumber) return p
                // Avoid duplicating if already present
                if (p.elements.some((e) => e.id === newEl.id)) return p
                return { ...p, elements: [...p.elements, newEl] }
              })
            )
            break
          }

          case 'DELETE_ELEMENT': {
            const { pageNumber, elementId } = payload.payload
            setPages((prev) =>
              prev.map((p) => {
                if (p.pageNumber !== pageNumber) return p
                return { ...p, elements: p.elements.filter((e) => e.id !== elementId) }
              })
            )
            break
          }

          case 'CLEAR_PAGE': {
            const { pageNumber } = payload.payload
            setPages((prev) =>
              prev.map((p) => {
                if (p.pageNumber !== pageNumber) return p
                return { ...p, elements: [] }
              })
            )
            break
          }

          case 'PAGE_CREATE': {
            const { page } = payload.payload
            setPages((prev) => {
              if (prev.some((p) => p.pageNumber === page.pageNumber)) return prev
              return [...prev, page]
            })
            break
          }

          case 'PAGE_DELETE': {
            const { pageNumber } = payload.payload
            setPages((prev) => {
              const remaining = prev.filter((p) => p.pageNumber !== pageNumber)
              return remaining.length > 0 ? remaining : prev
            })
            setActivePageNumber((current) => (current === pageNumber ? 1 : current))
            break
          }

          case 'PAGE_CHANGE': {
            const { pageNumber } = payload.payload
            // For students, follow tutor's page changes automatically
            if (role === 'participant') {
              setActivePageNumber(pageNumber)
            }
            break
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel
        }
      })

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [sessionId, role])

  // ============================================================================
  // 3. BROADCAST HELPER
  // ============================================================================
  const broadcastEvent = useCallback((event: WhiteboardRealtimeEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wb_event',
        payload: event,
      })
    }
  }, [])

  // ============================================================================
  // 4. PERSISTENCE HELPER (DEBOUNCED)
  // ============================================================================
  const scheduleSave = useCallback(
    (pageNumber: number, elements: WhiteboardElement[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(async () => {
        await saveWhiteboardPageStateAction(sessionId, pageNumber, elements)
      }, 1000)
    },
    [sessionId]
  )

  // ============================================================================
  // 5. DRAWING ACTIONS & HISTORY
  // ============================================================================
  const handleElementComplete = (element: WhiteboardElement) => {
    // 1. Push current state to undo stack
    setUndoStack((prev) => [...prev.slice(-20), currentElements])
    setRedoStack([]) // Clear redo on new action

    // 2. Commit element to active page
    const updatedElements = [...currentElements, element]
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === activePageNumber ? { ...p, elements: updatedElements } : p))
    )

    // 3. Broadcast to peers
    broadcastEvent({
      type: 'ADD_ELEMENT',
      payload: { pageNumber: activePageNumber, element },
    })

    // 4. Schedule debounced DB save
    scheduleSave(activePageNumber, updatedElements)
  }

  const handleElementDelete = (elementId: string) => {
    setUndoStack((prev) => [...prev.slice(-20), currentElements])
    setRedoStack([])

    const updatedElements = currentElements.filter((e) => e.id !== elementId)
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === activePageNumber ? { ...p, elements: updatedElements } : p))
    )

    broadcastEvent({
      type: 'DELETE_ELEMENT',
      payload: { pageNumber: activePageNumber, elementId },
    })

    scheduleSave(activePageNumber, updatedElements)
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return

    const previousElements = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, currentElements])

    setPages((prev) =>
      prev.map((p) => (p.pageNumber === activePageNumber ? { ...p, elements: previousElements } : p))
    )

    // Re-sync page via DB save
    scheduleSave(activePageNumber, previousElements)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return

    const nextElements = redoStack[redoStack.length - 1]
    setRedoStack((prev) => prev.slice(0, -1))
    setUndoStack((prev) => [...prev, currentElements])

    setPages((prev) =>
      prev.map((p) => (p.pageNumber === activePageNumber ? { ...p, elements: nextElements } : p))
    )

    scheduleSave(activePageNumber, nextElements)
  }

  const handleConfirmClearPage = () => {
    setUndoStack((prev) => [...prev.slice(-20), currentElements])
    setRedoStack([])

    setPages((prev) =>
      prev.map((p) => (p.pageNumber === activePageNumber ? { ...p, elements: [] } : p))
    )

    broadcastEvent({
      type: 'CLEAR_PAGE',
      payload: { pageNumber: activePageNumber },
    })

    scheduleSave(activePageNumber, [])
    toast('info', 'Page cleared')
  }

  // ============================================================================
  // 6. MULTI-PAGE ACTIONS
  // ============================================================================
  const handleSelectPage = (pageNum: number) => {
    setActivePageNumber(pageNum)
    setUndoStack([])
    setRedoStack([])

    if (role === 'host') {
      broadcastEvent({
        type: 'PAGE_CHANGE',
        payload: { pageNumber: pageNum },
      })
    }
  }

  const handleAddPage = async () => {
    const res = await createWhiteboardPageAction(sessionId)
    if (res.success && res.newPage) {
      const newPage = res.newPage
      setPages((prev) => [...prev, newPage])
      setActivePageNumber(newPage.pageNumber)
      setUndoStack([])
      setRedoStack([])

      broadcastEvent({
        type: 'PAGE_CREATE',
        payload: { page: newPage },
      })
      broadcastEvent({
        type: 'PAGE_CHANGE',
        payload: { pageNumber: newPage.pageNumber },
      })
      toast('success', `Added ${newPage.title}`)
    } else {
      toast('error', res.error || 'Failed to add page')
    }
  }

  const handleDeletePage = async (pageNum: number) => {
    const res = await deleteWhiteboardPageAction(sessionId, pageNum)
    if (res.success) {
      setPages((prev) => {
        const remaining = prev.filter((p) => p.pageNumber !== pageNum)
        return remaining
      })
      setActivePageNumber(1)
      setUndoStack([])
      setRedoStack([])

      broadcastEvent({
        type: 'PAGE_DELETE',
        payload: { pageNumber: pageNum },
      })
      toast('info', 'Page deleted')
    } else {
      toast('error', res.error || 'Failed to delete page')
    }
  }

  // ============================================================================
  // 7. EXPORT PNG ACTION
  // ============================================================================
  const handleExportPNG = async () => {
    try {
      const success = await exportWhiteboardToPNG(currentElements, {
        pageNumber: activePageNumber,
        title: activePage.title,
      })
      if (success) {
        toast('success', 'Whiteboard PNG exported successfully')
      }
    } catch {
      toast('error', 'Export failed')
    }
  }

  // ============================================================================
  // RENDER STATES
  // ============================================================================
  if (isLoading) {
    return (
      <div className="flex-1 w-full h-full min-h-[350px] flex flex-col items-center justify-center bg-gray-950 p-6 space-y-3">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
        <p className="text-xs text-gray-400">Loading interactive digital whiteboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 w-full h-full min-h-[350px] flex flex-col items-center justify-center bg-gray-950 p-6 text-center space-y-3">
        <div className="h-10 w-10 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-bold text-white">Whiteboard Unavailable</h3>
        <p className="text-xs text-gray-400 max-w-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-gray-950 relative">
      {/* 1. Whiteboard Toolbar */}
      <WhiteboardToolbar
        currentTool={currentTool}
        currentColor={currentColor}
        currentStrokeWidth={currentStrokeWidth}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        canDraw={canDraw}
        isTutor={role === 'host'}
        onSelectTool={setCurrentTool}
        onSelectColor={setCurrentColor}
        onSelectStrokeWidth={setCurrentStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearPage={() => setShowClearModal(true)}
        onExportPNG={handleExportPNG}
      />

      {/* 2. Interactive Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <WhiteboardCanvas
          elements={currentElements}
          currentTool={currentTool}
          currentColor={currentColor}
          currentStrokeWidth={currentStrokeWidth}
          canDraw={canDraw}
          onElementComplete={handleElementComplete}
          onElementDelete={handleElementDelete}
        />
      </div>

      {/* 3. Multi-Page Navigation Bar */}
      <WhiteboardPageBar
        pages={pages}
        activePageNumber={activePageNumber}
        isTutor={role === 'host'}
        canDraw={canDraw}
        onSelectPage={handleSelectPage}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
      />

      {/* 4. Clear Page Modal */}
      <ClearConfirmModal
        isOpen={showClearModal}
        pageNumber={activePageNumber}
        pageTitle={activePage?.title}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleConfirmClearPage}
      />
    </div>
  )
}
