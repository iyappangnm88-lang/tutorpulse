import React from 'react'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Layers,
  HeartHandshake,
  ClipboardCheck,
  CreditCard,
  BookOpen,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Home,
  CalendarCheck,
  Award,
  Bell,
  User,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
}

/**
 * Source of Truth for Tutor navigation.
 * Both the desktop sidebar and mobile navigation drawer consume this exact array.
 */
export const TUTOR_NAV_ITEMS: NavItem[] = [
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

/**
 * Source of Truth for Parent Portal navigation.
 */
export const PARENT_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/parent', icon: Home },
  { label: 'Attendance', href: '/parent/attendance', icon: CalendarCheck },
  { label: 'Tests & Marks', href: '/parent/tests', icon: Award },
  { label: 'Homework', href: '/parent/homework', icon: BookOpen },
  { label: 'Fees & Dues', href: '/parent/fees', icon: CreditCard },
  { label: 'Announcements', href: '/parent/announcements', icon: Bell },
  { label: 'My Profile', href: '/parent/profile', icon: User },
]
