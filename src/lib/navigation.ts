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
  Video,
  UserCheck,
  Compass,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
}

/**
 * Source of Truth for Tutor navigation.
 * Main: Core daily teaching workflows.
 */
export const TUTOR_MAIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Batches', href: '/dashboard/batches', icon: Layers },
  { label: 'Students', href: '/dashboard/students', icon: Users },
  { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { label: 'Classroom', href: '/dashboard/classroom', icon: Video },
  { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { label: 'Homework', href: '/dashboard/homework', icon: BookOpen },
  { label: 'Tests', href: '/dashboard/tests', icon: FileText },
  { label: 'Fees', href: '/dashboard/fees', icon: CreditCard },
  { label: 'Messages', href: '/dashboard/communication', icon: MessageSquare },
]

/**
 * Secondary: Administration, analytics, and settings.
 */
export const TUTOR_SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: 'Requests', href: '/dashboard/requests', icon: UserCheck },
  { label: 'Parent Portal', href: '/dashboard/parents', icon: HeartHandshake },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Help & Guides', href: '/dashboard/help', icon: HelpCircle },
]

export const TUTOR_NAV_ITEMS: NavItem[] = [
  ...TUTOR_MAIN_NAV_ITEMS,
  ...TUTOR_SECONDARY_NAV_ITEMS,
]

export function getTutorNavGroups(workspaceType: 'offline' | 'online' = 'offline'): {
  main: NavItem[]
  secondary: NavItem[]
} {
  let main = TUTOR_MAIN_NAV_ITEMS
  if (workspaceType === 'offline') {
    main = main.filter(
      (item) => item.href !== '/dashboard/calendar' && item.href !== '/dashboard/classroom'
    )
  }
  return {
    main,
    secondary: TUTOR_SECONDARY_NAV_ITEMS,
  }
}

export function getTutorNavItems(workspaceType: 'offline' | 'online' = 'offline'): NavItem[] {
  const { main, secondary } = getTutorNavGroups(workspaceType)
  return [...main, ...secondary]
}

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

/**
 * Source of Truth for Student Portal navigation.
 */
export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/student', icon: Home },
  { label: 'My Tutors', href: '/student/tutors', icon: Users },
  { label: 'Live Classes', href: '/student/classes', icon: Video },
  { label: 'Homework', href: '/student/homework', icon: BookOpen },
  { label: 'Tests & Marks', href: '/student/tests', icon: Award },
  { label: 'My Progress', href: '/student/progress', icon: BarChart3 },
  { label: 'Messages', href: '/student/messages', icon: MessageSquare },
  { label: 'Settings', href: '/student/settings', icon: Settings },
  { label: 'Find a Tutor', href: '/student/marketplace', icon: Compass },
]
