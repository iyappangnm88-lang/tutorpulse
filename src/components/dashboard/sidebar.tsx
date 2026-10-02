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
import { TUTOR_NAV_ITEMS, getTutorNavGroups, NavItem } from '@/lib/navigation'
import { WorkspaceSwitcher } from '@/components/dashboard/workspace-switcher'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'
import { useWorkspace } from '@/contexts/workspace-context'
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
          ? 'bg-[#55C832]/12 dark:bg-[#6BEA45]/15 text-[#318A25] dark:text-[#6BEA45] font-bold shadow-2xs border border-[#55C832]/25 dark:border-[#6BEA45]/30'
          : 'text-gray-600 dark:text-[#A8B3A5] hover:bg-gray-100/70 dark:hover:bg-[#1C261C] hover:text-[#172B4D] dark:hover:text-[#F4F7F2]'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <item.icon
        className={cn(
          'h-4 w-4 flex-shrink-0 transition-colors',
          isActive ? 'text-[#55C832] dark:text-[#6BEA45]' : 'text-gray-400 dark:text-[#6C7A6A] group-hover:text-gray-600 dark:group-hover:text-[#A8B3A5]'
        )}
        aria-hidden="true"
      />
      <span className="flex-1">{item.label}</span>
      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#55C832]" aria-hidden="true" />
      )}
    </Link>
  )
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { workspaceType } = useWorkspace()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const isOffline = workspaceType === 'offline'
  const { main, secondary } = getTutorNavGroups(workspaceType)

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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#55C832] border-b-2 border-[#318A25] text-white shadow-xs font-black text-base">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#172B4D] tracking-tight flex items-center gap-1.5">
              Nuzigo
              <span className="text-[10px] font-bold text-[#318A25] bg-[#55C832]/15 px-1.5 py-0.5 rounded border border-[#55C832]/30">
                Pro
              </span>
            </span>
            <span className="text-[10px] text-gray-500 dark:text-[#A8B3A5] font-medium">Learning that feels alive</span>
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

      {/* Prominent Workspace Switcher in Sidebar */}
      <WorkspaceSwitcher variant="sidebar" onSwitch={mobile ? onClose : undefined} />

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto py-2 space-y-3 overscroll-contain"
        aria-label="Sidebar navigation links"
      >
        <div className="space-y-0.5">
          {main.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onItemClick={mobile ? onClose : undefined}
            />
          ))}
        </div>

        <div className="pt-2.5 border-t border-gray-100">
          <p className="px-5 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Management & Settings
          </p>
          <div className="space-y-0.5">
            {secondary.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                onItemClick={mobile ? onClose : undefined}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer Status & Actions */}
      <div className="border-t border-gray-100 p-4 space-y-2.5 bg-gray-50/40">
        <SidebarInstallButton />

        <div className="rounded-xl bg-white border border-gray-100 p-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isOffline ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              )}
            />
            <span className="text-xs font-semibold text-gray-700">
              {isOffline ? 'Offline Teaching' : 'Online Teaching'}
            </span>
          </div>
          <span
            className={cn(
              'text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
              isOffline ? 'bg-amber-50 text-amber-700' : 'bg-[#FAFBEF] text-[#318A25]'
            )}
          >
            {isOffline ? 'Physical' : 'Virtual'}
          </span>
        </div>

        {/* User Account / Sign Out for Both Desktop & Mobile */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate pr-2">
            <div className="h-7 w-7 rounded-full bg-[#55C832]/20 border border-[#55C832]/30 flex items-center justify-center text-[#318A25] text-[11px] font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-gray-800 truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50 shrink-0"
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
