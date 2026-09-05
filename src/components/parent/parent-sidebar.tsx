'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LogOut,
  Activity,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { PARENT_NAV_ITEMS } from '@/lib/navigation'

export interface ParentSidebarProps {
  parentName: string
  childQueryString?: string
  mobile?: boolean
  onClose?: () => void
}

export function ParentSidebar({
  parentName,
  childQueryString = '',
  mobile = false,
  onClose,
}: ParentSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    if (onClose) onClose()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        mobile
          ? 'flex flex-col h-full w-full bg-white select-none'
          : 'hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 bg-white border-r border-gray-200/80'
      )}
      aria-label={mobile ? 'Parent mobile navigation' : 'Parent navigation'}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-6">
        <Link
          href="/parent"
          onClick={mobile ? onClose : undefined}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">TutorPulse</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
            Parent
          </span>
          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close parent navigation menu"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto py-4 space-y-0.5 overscroll-contain"
        aria-label="Parent navigation links"
      >
        {PARENT_NAV_ITEMS.map((item) => {
          const fullHref = childQueryString ? `${item.href}?${childQueryString}` : item.href
          const isActive =
            item.href === '/parent'
              ? pathname === '/parent'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={fullHref}
              onClick={mobile ? onClose : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 mx-2.5 min-h-[40px]',
                isActive
                  ? 'bg-indigo-50/80 text-indigo-700 shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                )}
                aria-hidden="true"
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" aria-hidden="true" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Parent account strip */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-gray-900 truncate">{parentName}</p>
            <p className="text-[10px] text-gray-400">Parent Account</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
