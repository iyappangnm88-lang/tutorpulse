'use client'

import React, { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldHelpProps {
  description: string
  example?: string
  tip?: string
  className?: string
  mode?: 'popover' | 'inline' | 'expandable'
}

export function FieldHelp({
  description,
  example,
  tip,
  className,
  mode = 'expandable',
}: FieldHelpProps) {
  const [expanded, setExpanded] = useState(false)

  if (mode === 'inline') {
    return (
      <div className={cn('mt-1 text-xs text-gray-500 leading-normal', className)}>
        <span>{description}</span>
        {example && <span className="block text-[11px] text-gray-400 mt-0.5">Example: {example}</span>}
        {tip && <span className="block text-[11px] text-[#318A25] mt-0.5">💡 {tip}</span>}
      </div>
    )
  }

  return (
    <div className={cn('inline-block text-xs', className)}>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-[#318A25] transition-colors py-0.5"
        aria-expanded={expanded}
      >
        <Info className="h-3 w-3" />
        <span>What is this?</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-1.5 p-2.5 rounded-xl bg-[#FAFBEF]/70 border border-[#55C832]/20 text-gray-700 text-xs space-y-1 animate-in fade-in-0 duration-150">
          <p className="leading-relaxed">{description}</p>
          {example && (
            <p className="text-[11px] text-gray-500">
              <span className="font-semibold text-gray-700">Example:</span> {example}
            </p>
          )}
          {tip && (
            <p className="text-[11px] text-[#318A25] font-medium">
              💡 {tip}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
