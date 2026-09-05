'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, X, Settings, HelpCircle } from 'lucide-react'
import { NotificationBell } from '@/components/communication/notification-bell'
import { GlobalHelpButton } from '@/components/help/global-help-button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  onMenuToggle?: () => void
  mobileMenuOpen?: boolean
}

export function Header({ onMenuToggle, mobileMenuOpen }: HeaderProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Tutor'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleLogout() {
    setLoggingOut(true)
    setProfileMenuOpen(false)
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
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-6">
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden mr-3 flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        onClick={onMenuToggle}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Page title area slot */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2.5">
        {/* Global In-App Help Button */}
        <GlobalHelpButton />

        {/* Notifications Bell */}
        <NotificationBell />

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setProfileMenuOpen((p) => !p)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Account menu"
            aria-expanded={profileMenuOpen}
          >
            {initials}
          </button>

          {profileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileMenuOpen(false)}
                aria-hidden="true"
              />
              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/help"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                  <span>Help Center & Guides</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span>Settings & Preferences</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-gray-50',
                    'focus-visible:outline-none focus-visible:bg-rose-50'
                  )}
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  <span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
