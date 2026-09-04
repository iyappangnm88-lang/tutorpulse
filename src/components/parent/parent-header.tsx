'use client'

import React from 'react'
import { ChildSwitcher } from './child-switcher'
import type { ParentChildInfo } from '@/types'

interface ParentHeaderProps {
  parentName: string
  childrenList: ParentChildInfo[]
  selectedChildId: string
}

export function ParentHeader({
  parentName,
  childrenList,
  selectedChildId,
}: ParentHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs font-bold text-gray-900">Hello, {parentName}</p>
          <p className="text-[11px] text-gray-500">Student Progress Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {childrenList.length > 0 && (
          <ChildSwitcher
            childrenList={childrenList}
            selectedChildId={selectedChildId}
          />
        )}
      </div>
    </header>
  )
}
