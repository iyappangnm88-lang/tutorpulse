'use client'

// ==============================================================================
// TUTORPULSE PHASE 4: WHITEBOARD MULTI-PAGE TAB BAR
// Page navigation, page addition, and page deletion controls
// ==============================================================================

import React from 'react'
import { Plus, Trash2, FileText } from 'lucide-react'
import type { WhiteboardPageData } from '@/lib/whiteboard/types'

interface WhiteboardPageBarProps {
  pages: WhiteboardPageData[]
  activePageNumber: number
  isTutor: boolean
  canDraw: boolean
  onSelectPage: (pageNumber: number) => void
  onAddPage: () => void
  onDeletePage: (pageNumber: number) => void
}

export function WhiteboardPageBar({
  pages,
  activePageNumber,
  isTutor,
  canDraw,
  onSelectPage,
  onAddPage,
  onDeletePage,
}: WhiteboardPageBarProps) {
  return (
    <div className="h-10 bg-gray-900/90 border-t border-gray-800/80 px-3 flex items-center justify-between gap-2 shrink-0 z-20 backdrop-blur-md">
      {/* Scrollable Page Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[70vw] sm:max-w-[80vw] no-scrollbar">
        {pages.map((p) => {
          const isActive = p.pageNumber === activePageNumber
          return (
            <button
              key={p.pageNumber}
              type="button"
              onClick={() => onSelectPage(p.pageNumber)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-800/70 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
              title={`Switch to ${p.title || `Page ${p.pageNumber}`}`}
            >
              <FileText className="h-3 w-3" />
              <span>{p.title || `Page ${p.pageNumber}`}</span>
            </button>
          )
        })}

        {/* Add Page Button (Tutor only) */}
        {isTutor && (
          <button
            type="button"
            onClick={onAddPage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-800/60 hover:bg-indigo-600/30 hover:text-indigo-300 text-gray-400 border border-dashed border-gray-700 transition-all cursor-pointer whitespace-nowrap"
            title="Create new page"
            aria-label="Add whiteboard page"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Page</span>
          </button>
        )}
      </div>

      {/* Page Actions (Delete current page if > 1) */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[11px] text-gray-500 font-medium mr-1 hidden md:inline">
          Page {activePageNumber} of {pages.length}
        </span>
        {isTutor && pages.length > 1 && (
          <button
            type="button"
            onClick={() => onDeletePage(activePageNumber)}
            className="h-7 w-7 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Delete this page"
            aria-label="Delete page"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
