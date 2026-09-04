'use client'

import React from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Users, ChevronDown } from 'lucide-react'
import type { ParentChildInfo } from '@/types'

interface ChildSwitcherProps {
  childrenList: ParentChildInfo[]
  selectedChildId: string
}

export function ChildSwitcher({ childrenList, selectedChildId }: ChildSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  if (childrenList.length <= 1) {
    const onlyChild = childrenList[0]
    if (!onlyChild) return null
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900">
        <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
        <span className="font-semibold">{onlyChild.full_name}</span>
        {onlyChild.class_name && (
          <span className="text-indigo-500 font-normal">({onlyChild.class_name})</span>
        )}
      </div>
    )
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newChildId = e.target.value
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('child', newChildId)
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`${pathname}${query}`)
    router.refresh()
  }

  return (
    <div className="relative inline-flex items-center">
      <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-600 pointer-events-none" />
      <select
        value={selectedChildId}
        onChange={handleChange}
        className="appearance-none pl-8 pr-7 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 hover:bg-indigo-100/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer min-h-[36px]"
      >
        {childrenList.map((c) => (
          <option key={c.student_id} value={c.student_id}>
            {c.full_name} {c.class_name ? `(${c.class_name})` : ''}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500 pointer-events-none" />
    </div>
  )
}
