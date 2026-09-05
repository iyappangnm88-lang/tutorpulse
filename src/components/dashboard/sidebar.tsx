'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Activity,
  X,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarInstallButton } from '@/components/pwa/install-prompt'
import { TUTOR_NAV_ITEMS, NavItem } from '@/lib/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { createClient } from '@/lib/supabase/client'

export interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

// Re-export nav items for compatibility (includes /dashboard/help)
export { TUTOR_NAV_ITEMS as navItems }

function NavLink({
  item,
  onItemClick,
}: {
  item: NavItem
  onItemClick?: () => void
}) {
  const pathname = usePathname()
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
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
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Tutor'

  async function handleLogout() {
    setLoggingOut(true)
    if (onClose) onClose()
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast('success', 'Signed out', 'See you next time!')
      router.push('/login')
    } catch {
      toast('error', 'Sign-out failed', 'Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <aside
      className={cn(
        mobile
          ? 'flex flex-col h-full w-full bg-white select-none'
          : 'hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 bg-white border-r border-gray-200/80'
      )}
      aria-label={mobile ? 'Mobile navigation' : 'Sidebar navigation'}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
        <Link
          href="/dashboard"
          onClick={mobile ? onClose : undefined}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs group-hover:shadow-indigo-500/25 transition-all">
            <Activity className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-1">
              TutorPulse
              <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1 rounded">V1</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Modern Tutor SaaS</span>
          </div>
        </Link>

        {mobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto py-4 space-y-0.5 overscroll-contain"
        aria-label="Sidebar navigation links"
      >
        {TUTOR_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            onItemClick={mobile ? onClose : undefined}
          />
        ))}
      </nav>

      {/* Footer Status & Actions */}
      <div className="border-t border-gray-100 p-4 space-y-2.5 bg-gray-50/40">
        <SidebarInstallButton />

        <div className="rounded-xl bg-white border border-gray-100 p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">Tutor Workspace</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">v1.0.0</span>
        </div>

        {mobile && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate pr-2">
              <div className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-gray-800 truncate">{displayName}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
