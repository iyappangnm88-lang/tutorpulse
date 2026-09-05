'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Layers,
  HeartHandshake,
  ClipboardCheck,
  BookOpen,
  FileText,
  CreditCard,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarInstallButton } from '@/components/pwa/install-prompt'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { label: 'Students', href: '/dashboard/students', icon: Users },
  { label: 'Batches', href: '/dashboard/batches', icon: Layers },
  { label: 'Parents', href: '/dashboard/parents', icon: HeartHandshake },
  { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { label: 'Fees', href: '/dashboard/fees', icon: CreditCard },
  { label: 'Homework', href: '/dashboard/homework', icon: BookOpen },
  { label: 'Tests', href: '/dashboard/tests', icon: FileText },
  { label: 'Communication', href: '/dashboard/communication', icon: MessageSquare },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Help & Guides', href: '/dashboard/help', icon: HelpCircle },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
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

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 bg-white border-r border-gray-200/80">
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
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
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5" aria-label="Sidebar navigation">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Clean Footer Status */}
      <div className="border-t border-gray-100 p-4 space-y-2">
        <SidebarInstallButton />
        <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">Tutor Workspace</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}
