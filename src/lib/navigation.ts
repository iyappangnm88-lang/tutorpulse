import React from 'react'
import {
  LayoutDashboard,
  Target,
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
  GraduationCap,
  Users2,
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
  { label: 'Marketplace', href: '/dashboard/marketplace', icon: Compass },
  { label: 'Batches', href: '/dashboard/batches', icon: Layers },
  { label: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { label: 'Classroom', href: '/dashboard/classroom', icon: Video },
  { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Messages', href: '/dashboard/communication', icon: MessageSquare },
]

/**
 * Secondary: Administration, analytics, and settings.
 */
export const TUTOR_SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: 'Parent Portal', href: '/dashboard/parents', icon: HeartHandshake },
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
 * 1. Focus
 * 2. Your Tutor (conditional on isEnrolled)
 * 3. Find Tutor
 * 4. Study Groups
 */
export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: 'Focus', href: '/student', icon: Target },
  { label: 'Your Tutor', href: '/student/tutors', icon: GraduationCap },
  { label: 'Find Tutor', href: '/student/marketplace', icon: Compass },
  { label: 'Study Groups', href: '/student/study-groups', icon: Users },
]

export function getStudentNavItems(isEnrolled: boolean = false): NavItem[] {
  if (isEnrolled) {
    return STUDENT_NAV_ITEMS
  }
  return STUDENT_NAV_ITEMS.filter((item) => item.href !== '/student/tutors')
}

export function getStudentNavGroups(isEnrolled: boolean = false): {
  items: NavItem[]
} {
  return {
    items: getStudentNavItems(isEnrolled),
  }
}
