'use client'

// ==============================================================================
// TUTORPULSE PHASE 4: DIGITAL WHITEBOARD TOOLBAR
// Touch-friendly 44px+ controls for pen, highlighter, eraser, shapes, undo/redo
// ==============================================================================

import React, { useState } from 'react'
import {
  MousePointer,
  Pencil,
  Highlighter,
  Eraser,
  Type,
  Minus,
  Square,
  Circle,
  ArrowUpRight,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Eye,
  ChevronDown,
} from 'lucide-react'
import {
  WHITEBOARD_PALETTE,
  STROKE_WIDTHS,
  type WhiteboardTool,
  type WhiteboardColor,
} from '@/lib/whiteboard/types'

interface WhiteboardToolbarProps {
  currentTool: WhiteboardTool
  currentColor: WhiteboardColor
  currentStrokeWidth: number
  canUndo: boolean
  canRedo: boolean
  canDraw: boolean
  isTutor: boolean
  onSelectTool: (tool: WhiteboardTool) => void
  onSelectColor: (color: WhiteboardColor) => void
  onSelectStrokeWidth: (width: number) => void
  onUndo: () => void
  onRedo: () => void
  onClearPage: () => void
  onExportPNG: () => void
}

export function WhiteboardToolbar({
  currentTool,
  currentColor,
  currentStrokeWidth,
  canUndo,
  canRedo,
  canDraw,
  isTutor,
  onSelectTool,
  onSelectColor,
  onSelectStrokeWidth,
  onUndo,
  onRedo,
  onClearPage,
  onExportPNG,
}: WhiteboardToolbarProps) {
  const [showColorPopover, setShowColorPopover] = useState(false)
  const [showWidthPopover, setShowWidthPopover] = useState(false)

  // View-Only toolbar for students without draw permission
  if (!canDraw) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-900/95 border-b border-gray-800/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-semibold">
            <Eye className="h-3.5 w-3.5" />
            <span>Viewing Mode</span>
          </div>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            Tutor is teaching live on this board.
          </span>
        </div>

        <button
          type="button"
          onClick={onExportPNG}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors cursor-pointer"
          title="Save this board page as PNG"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export PNG</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900/95 border-b border-gray-800/80 backdrop-blur-md z-20 overflow-x-auto no-scrollbar">
      {/* 1. Drawing Tools Group */}
      <div className="flex items-center gap-1 bg-gray-950/80 p-1 rounded-xl border border-gray-800 shrink-0">
        {/* Select */}
        <button
          type="button"
          onClick={() => onSelectTool('select')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'select'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Select / Hand Tool"
          aria-label="Select tool"
        >
          <MousePointer className="h-4 w-4" />
        </button>

        {/* Pen */}
        <button
          type="button"
          onClick={() => onSelectTool('pen')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'pen'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Pen (Freehand drawing)"
          aria-label="Pen tool"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => onSelectTool('highlighter')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'highlighter'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Highlighter (Semi-transparent)"
          aria-label="Highlighter tool"
        >
          <Highlighter className="h-4 w-4" />
        </button>

        {/* Eraser */}
        <button
          type="button"
          onClick={() => onSelectTool('eraser')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'eraser'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Eraser (Erase strokes & objects)"
          aria-label="Eraser tool"
        >
          <Eraser className="h-4 w-4" />
        </button>

        {/* Text */}
        <button
          type="button"
          onClick={() => onSelectTool('text')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'text'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Text (Add notes or labels)"
          aria-label="Text tool"
        >
          <Type className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-gray-800 mx-0.5" />

        {/* Shapes: Line */}
        <button
          type="button"
          onClick={() => onSelectTool('line')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'line'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Straight Line"
          aria-label="Line tool"
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Shapes: Rectangle */}
        <button
          type="button"
          onClick={() => onSelectTool('rectangle')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'rectangle'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Rectangle"
          aria-label="Rectangle tool"
        >
          <Square className="h-4 w-4" />
        </button>

        {/* Shapes: Circle / Ellipse */}
        <button
          type="button"
          onClick={() => onSelectTool('ellipse')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'ellipse'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Circle / Ellipse"
          aria-label="Circle tool"
        >
          <Circle className="h-4 w-4" />
        </button>

        {/* Shapes: Arrow */}
        <button
          type="button"
          onClick={() => onSelectTool('arrow')}
          className={`h-9 w-9 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            currentTool === 'arrow'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Arrow"
          aria-label="Arrow tool"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Color & Stroke Width Settings */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Color Picker Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPopover(!showColorPopover)
              setShowWidthPopover(false)
            }}
            className="h-9 px-2 rounded-xl bg-gray-950/80 border border-gray-800 flex items-center gap-1.5 hover:border-gray-700 transition-colors cursor-pointer"
            title="Choose drawing color"
            aria-label="Select color"
          >
            <span
              className="h-4 w-4 rounded-full shadow-xs border border-white/20"
              style={{ backgroundColor: currentColor }}
            />
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>

          {showColorPopover && (
            <div className="absolute top-full mt-1.5 left-0 p-2 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl z-30 grid grid-cols-4 gap-1.5 min-w-[130px]">
              {WHITEBOARD_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    onSelectColor(c.value)
                    setShowColorPopover(false)
                  }}
                  className={`h-6 w-6 rounded-full transition-transform hover:scale-110 cursor-pointer ${c.bgClass} ${
                    currentColor === c.value ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900' : ''
                  }`}
                  title={c.label}
                  aria-label={c.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stroke Width Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowWidthPopover(!showWidthPopover)
              setShowColorPopover(false)
            }}
            className="h-9 px-2 rounded-xl bg-gray-950/80 border border-gray-800 flex items-center gap-1.5 hover:border-gray-700 transition-colors cursor-pointer"
            title="Stroke thickness"
            aria-label="Select stroke width"
          >
            <span
              className="rounded-full bg-gray-200"
              style={{ width: currentStrokeWidth * 2, height: currentStrokeWidth * 2 }}
            />
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>

          {showWidthPopover && (
            <div className="absolute top-full mt-1.5 left-0 p-1.5 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl z-30 flex flex-col gap-1 min-w-[120px]">
              {STROKE_WIDTHS.map((sw) => (
                <button
                  key={sw.value}
                  type="button"
                  onClick={() => {
                    onSelectStrokeWidth(sw.value)
                    setShowWidthPopover(false)
                  }}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    currentStrokeWidth === sw.value
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span>{sw.label}</span>
                  <span
                    className="rounded-full bg-current"
                    style={{ width: sw.value * 2, height: sw.value * 2 }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. History & Document Actions Group */}
      <div className="flex items-center gap-1 bg-gray-950/80 p-1 rounded-xl border border-gray-800 shrink-0">
        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Undo last action"
          aria-label="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Redo action"
          aria-label="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-gray-800 mx-0.5" />

        {/* Clear Page */}
        <button
          type="button"
          onClick={onClearPage}
          className="h-9 w-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          title="Clear current page"
          aria-label="Clear page"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Export PNG */}
        <button
          type="button"
          onClick={onExportPNG}
          className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          title="Export current page as PNG image"
          aria-label="Export PNG"
        >
          <Download className="h-4 w-4 text-indigo-400" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  )
}
