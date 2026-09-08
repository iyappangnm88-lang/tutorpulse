'use client'

// ==============================================================================
// TUTORPULSE PHASE 4: INTERACTIVE WHITEBOARD CANVAS
// Native Pointer Events, Retina DPI, smooth curve drawing, shapes, and text
// ==============================================================================

import React, { useRef, useEffect, useState, useCallback } from 'react'
import type {
  WhiteboardElement,
  WhiteboardTool,
  WhiteboardColor,
  WhiteboardPoint,
  StrokeElement,
  ShapeElement,
  TextElement,
} from '@/lib/whiteboard/types'
import {
  setupCanvasDPI,
  renderWhiteboardElements,
  renderElement,
  isPointHittingElement,
} from '@/lib/whiteboard/canvas-engine'

interface WhiteboardCanvasProps {
  elements: WhiteboardElement[]
  currentTool: WhiteboardTool
  currentColor: WhiteboardColor
  currentStrokeWidth: number
  canDraw: boolean
  onElementComplete: (element: WhiteboardElement) => void
  onElementDelete: (elementId: string) => void
  onLivePoint?: (elementId: string, point: WhiteboardPoint) => void
}

export function WhiteboardCanvas({
  elements,
  currentTool,
  currentColor,
  currentStrokeWidth,
  canDraw,
  onElementComplete,
  onElementDelete,
  onLivePoint,
}: WhiteboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // In-progress active drawing state
  const isInteractingRef = useRef<boolean>(false)
  const activeElementRef = useRef<WhiteboardElement | null>(null)
  const activeStrokePointsRef = useRef<WhiteboardPoint[]>([])

  // Text input placement state
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null)
  const [textValue, setTextValue] = useState<string>('')

  // Dimensions
  const dimensionsRef = useRef<{ width: number; height: number }>({ width: 800, height: 600 })

  /**
   * Redraw the canvas with all committed elements + current in-progress element
   */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensionsRef.current

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Render committed elements
    renderWhiteboardElements(ctx, elements)

    // Render active drawing preview
    if (activeElementRef.current) {
      renderElement(ctx, activeElementRef.current)
    }
  }, [elements])

  /**
   * ResizeObserver to keep canvas resolution crisp and perfectly aligned with container
   */
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const handleResize = () => {
      const rect = container.getBoundingClientRect()
      const width = Math.max(300, Math.floor(rect.width))
      const height = Math.max(300, Math.floor(rect.height))
      dimensionsRef.current = { width, height }

      setupCanvasDPI(canvas, width, height)
      redraw()
    }

    handleResize()
    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    return () => {
      ro.disconnect()
    }
  }, [redraw])

  // Re-draw when elements change
  useEffect(() => {
    redraw()
  }, [elements, redraw])

  /**
   * Helper to compute canvas-relative coordinates from pointer event
   */
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): WhiteboardPoint => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
      pressure: e.pressure || 0.5,
    }
  }

  // ============================================================================
  // POINTER DOWN
  // ============================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return

    // Dismiss any active text input if clicking outside
    if (textInputPos) {
      finalizeText()
      return
    }

    const point = getCanvasPoint(e)
    isInteractingRef.current = true

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Some mobile browsers ignore pointer capture gracefully
    }

    const elementId = `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    if (currentTool === 'eraser') {
      // Find element under pointer
      const hit = elements.slice().reverse().find((el) => isPointHittingElement(point, el))
      if (hit) {
        onElementDelete(hit.id)
      }
      return
    }

    if (currentTool === 'text') {
      setTextInputPos({ x: point.x, y: point.y })
      setTextValue('')
      isInteractingRef.current = false
      return
    }

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      activeStrokePointsRef.current = [point]
      const stroke: StrokeElement = {
        id: elementId,
        type: currentTool === 'highlighter' ? 'highlighter' : 'stroke',
        color: currentColor,
        strokeWidth: currentStrokeWidth,
        points: [point],
        createdAt: Date.now(),
      }
      activeElementRef.current = stroke
      redraw()
      return
    }

    if (
      currentTool === 'line' ||
      currentTool === 'rectangle' ||
      currentTool === 'ellipse' ||
      currentTool === 'arrow'
    ) {
      const shape: ShapeElement = {
        id: elementId,
        type: currentTool,
        color: currentColor,
        strokeWidth: currentStrokeWidth,
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
        createdAt: Date.now(),
      }
      activeElementRef.current = shape
      redraw()
    }
  }

  // ============================================================================
  // POINTER MOVE
  // ============================================================================
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !isInteractingRef.current) return

    const point = getCanvasPoint(e)

    if (currentTool === 'eraser') {
      const hit = elements.slice().reverse().find((el) => isPointHittingElement(point, el))
      if (hit) {
        onElementDelete(hit.id)
      }
      return
    }

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      activeStrokePointsRef.current.push(point)
      if (activeElementRef.current && (activeElementRef.current.type === 'stroke' || activeElementRef.current.type === 'highlighter')) {
        activeElementRef.current.points = activeStrokePointsRef.current
      }
      redraw()

      if (onLivePoint && activeElementRef.current) {
        onLivePoint(activeElementRef.current.id, point)
      }
      return
    }

    if (
      currentTool === 'line' ||
      currentTool === 'rectangle' ||
      currentTool === 'ellipse' ||
      currentTool === 'arrow'
    ) {
      if (activeElementRef.current && 'startX' in activeElementRef.current) {
        activeElementRef.current.endX = point.x
        activeElementRef.current.endY = point.y
      }
      redraw()
    }
  }

  // ============================================================================
  // POINTER UP / CANCEL
  // ============================================================================
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw || !isInteractingRef.current) return
    isInteractingRef.current = false

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch {
      // Ignore
    }

    if (activeElementRef.current) {
      const finishedEl = activeElementRef.current
      activeElementRef.current = null
      activeStrokePointsRef.current = []

      // Don't commit zero-length shapes or empty strokes
      if (finishedEl.type === 'stroke' || finishedEl.type === 'highlighter') {
        if (finishedEl.points.length > 0) {
          onElementComplete(finishedEl)
        }
      } else if ('startX' in finishedEl) {
        const dx = Math.abs(finishedEl.endX - finishedEl.startX)
        const dy = Math.abs(finishedEl.endY - finishedEl.startY)
        if (dx > 2 || dy > 2) {
          onElementComplete(finishedEl)
        }
      }
      redraw()
    }
  }

  // ============================================================================
  // TEXT PLACEMENT
  // ============================================================================
  const finalizeText = () => {
    if (textInputPos && textValue.trim()) {
      const textEl: TextElement = {
        id: `el_text_${Date.now()}`,
        type: 'text',
        color: currentColor,
        strokeWidth: 1,
        x: textInputPos.x,
        y: textInputPos.y,
        text: textValue.trim(),
        fontSize: Math.max(16, currentStrokeWidth * 6),
        createdAt: Date.now(),
      }
      onElementComplete(textEl)
    }
    setTextInputPos(null)
    setTextValue('')
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, #64748b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Primary Canvas */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive digital whiteboard canvas"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 w-full h-full ${
          !canDraw
            ? 'cursor-default'
            : currentTool === 'eraser'
            ? 'cursor-crosshair'
            : currentTool === 'text'
            ? 'cursor-text'
            : currentTool === 'select'
            ? 'cursor-grab'
            : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
      />

      {/* Inline Text Input Popover */}
      {textInputPos && (
        <div
          className="absolute z-30 flex items-center gap-1.5 p-1.5 bg-gray-900 border border-indigo-500/80 rounded-xl shadow-2xl animate-scale-in"
          style={{
            left: `${Math.min(textInputPos.x, dimensionsRef.current.width - 240)}px`,
            top: `${Math.min(textInputPos.y, dimensionsRef.current.height - 60)}px`,
          }}
        >
          <input
            type="text"
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                finalizeText()
              } else if (e.key === 'Escape') {
                setTextInputPos(null)
                setTextValue('')
              }
            }}
            placeholder="Type notes..."
            className="w-48 bg-gray-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={finalizeText}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
