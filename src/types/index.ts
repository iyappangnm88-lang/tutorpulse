// ==================================================
// TutorPulse Shared Types
// ==================================================

import type { Batch, Student, Parent, Fee, Payment, Homework, HomeworkStudent, Test, TestMark, Announcement } from './database'
export * from './database'

export type UserRole = 'tutor' | 'parent'

export interface TutorProfile {
  id: string
  user_id: string
  name: string
  business_name?: string
  phone?: string
  email: string
  photo_url?: string
  timezone: string
  currency: string
  created_at: string
  updated_at: string
}

// Student & Batch Statuses
export type StudentStatus = 'active' | 'inactive' | 'archived'
export type BatchStatus = 'active' | 'archived'
export type Gender = 'male' | 'female' | 'other'

// Attendance status
export type AttendanceStatus = 'present' | 'absent' | 'late'

// Fee & Payment types
export type FeeStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue'
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other'

export interface FeeWithDetails extends Fee {
  student: Student
  total_paid: number
  balance: number
  payments?: Payment[]
}

export interface FeeSummary {
  total_outstanding: number
  due_this_month: number
  overdue: number
  total_collected: number
}

// Homework types
export type HomeworkStatus = 'Draft' | 'Assigned' | 'Completed' | 'Archived'
export type HomeworkDisplayStatus = 'Draft' | 'Active' | 'Completed' | 'Overdue'
export type HomeworkStudentStatus = 'Pending' | 'Completed' | 'Excused'

export interface HomeworkStudentWithDetails extends HomeworkStudent {
  student: Student
}

export interface HomeworkWithDetails extends Homework {
  batch: Batch
  total_assigned: number
  completed_count: number
  pending_count: number
  excused_count: number
  completion_rate: number
  display_status: HomeworkDisplayStatus
  students?: HomeworkStudentWithDetails[]
}

export interface HomeworkSummary {
  total_assignments: number
  active: number
  pending_submissions: number
  overdue: number
}

// Test types
export type TestStatus = 'Draft' | 'Published' | 'Completed' | 'Archived'
export type TestDisplayStatus = 'Draft' | 'Upcoming' | 'Awaiting Marks' | 'Completed'
export type TestMarkStatus = 'Not Graded' | 'Graded' | 'Absent' | 'Excused'

export interface TestMarkWithDetails extends TestMark {
  student: Student
  percentage: number | null
  grade: string
}

export interface TestWithDetails extends Test {
  batch: Batch
  total_students: number
  graded_count: number
  ungraded_count: number
  absent_count: number
  average_marks: number | null
  average_percentage: number | null
  highest_marks: number | null
  lowest_marks: number | null
  display_status: TestDisplayStatus
  marks?: TestMarkWithDetails[]
}

export interface TestSummary {
  total_tests: number
  completed: number
  upcoming: number
  average_performance: number | null
}

export interface StudentTestPerformance {
  total_tests: number
  graded_tests: number
  average_percentage: number | null
  highest_percentage: number | null
  lowest_percentage: number | null
  latest_result?: {
    test_title: string
    marks: number
    max_marks: number
    percentage: number
    grade: string
  }
}

// Extended Batch info with student count
export interface BatchWithCount extends Batch {
  student_count: number
}

// Enrolled student in batch
export interface EnrolledStudent {
  membership_id: string
  joined_at: string
  student: Student
}

// Extended Parent info with linked students count & names
export interface ParentWithStudents extends Parent {
  student_count: number
  primary_student_names: string[]
}

// Linked student on parent profile
export interface LinkedStudent {
  link_id: string
  relationship: string
  is_primary: boolean
  created_at: string
  student: Student
}

// Linked parent on student profile
export interface LinkedParent {
  link_id: string
  relationship: string
  is_primary: boolean
  created_at: string
  parent: Parent
}

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Navigation
export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: string | number
  disabled?: boolean
}

// ==================================================
// Parent Portal Types
// ==================================================
export type AnnouncementTargetType = 'all' | 'batch' | 'student'

export interface ParentChildInfo {
  student_id: string
  full_name: string
  class_name: string | null
  school_name: string | null
  relationship: string
  is_primary: boolean
  batch?: Batch | null
}

export interface ParentDashboardData {
  parent: Parent
  children: ParentChildInfo[]
  selectedChild: ParentChildInfo
  attendance: {
    percentage: number
    total_classes: number
    present: number
    absent: number
    late: number
  }
  tests: {
    average_percentage: number | null
    grade: string
    tests_taken: number
    highest_percentage: number | null
    lowest_percentage: number | null
  }
  homework: {
    completion_rate: number
    total_assigned: number
    completed: number
    pending: number
  }
  fees: {
    total_billed: number
    total_paid: number
    balance: number
    status: FeeStatus
  }
  upcoming_class?: {
    batch_name: string
    subject: string | null
    schedule: string | null
  } | null
  recent_activity: Array<{
    id: string
    type: 'attendance' | 'test' | 'homework' | 'payment'
    date: string
    title: string
    subtitle: string
    status: string
    statusVariant?: 'success' | 'danger' | 'warning' | 'info' | 'default'
  }>
  announcements: Announcement[]
}

// ==================================================
// Communication & Notification Types
// ==================================================
export type NotificationType =
  | 'fee_overdue'
  | 'fee_pending'
  | 'attendance_alert'
  | 'homework_missing'
  | 'announcement'
  | 'general'

export interface AnnouncementWithTarget extends Announcement {
  batch_name?: string | null
  student_name?: string | null
}

export interface FeeReminderItem {
  fee_id: string
  title: string
  due_date: string
  amount: number
  total_paid: number
  balance: number
  status: FeeStatus
  student_id: string
  student_name: string
  class_name: string | null
  parent_name: string | null
  parent_phone: string | null
}

export interface CommunicationSummary {
  total_announcements: number
  unread_notifications: number
  pending_fee_reminders: number
}

// ==================================================
// Reports & Data Export Types
// ==================================================
export type ReportDateRange = 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom'

export interface ReportFilters {
  range: ReportDateRange
  startDate?: string
  endDate?: string
  batchId?: string
  studentId?: string
}

export interface ReportOverviewKPIs {
  total_students: number
  active_students: number
  overall_attendance_pct: number
  tests_conducted: number
  test_average_pct: number | null
  test_grade: string
  homework_assigned: number
  homework_completion_rate: number
  fees_total_billed: number
  fees_total_collected: number
  fees_outstanding: number
  collection_rate: number
}

export interface StudentAttendanceReportRow {
  student_id: string
  student_name: string
  class_name: string | null
  batch_name: string | null
  total_sessions: number
  present: number
  absent: number
  late: number
  percentage: number
  status: 'Excellent' | 'Good' | 'Needs Attention'
}

export interface StudentPerformanceReportRow {
  student_id: string
  student_name: string
  class_name: string | null
  tests_taken: number
  average_percentage: number | null
  highest_percentage: number | null
  grade: string
}

export interface BatchPerformanceReportRow {
  batch_id: string
  batch_name: string
  subject: string | null
  student_count: number
  attendance_pct: number
  test_avg_pct: number | null
  homework_completion_rate: number
  outstanding_fees: number
}

export interface StudentHomeworkReportRow {
  student_id: string
  student_name: string
  class_name: string | null
  total_assigned: number
  completed: number
  pending: number
  completion_rate: number
}

export interface StudentFeeReportRow {
  student_id: string
  student_name: string
  class_name: string | null
  total_billed: number
  total_paid: number
  balance: number
  status: FeeStatus
}

export interface ConsolidatedStudentReport {
  student: Student
  batch: Batch | null
  attendance: {
    total: number
    present: number
    absent: number
    late: number
    percentage: number
  }
  tests: {
    taken: number
    average_pct: number | null
    highest_pct: number | null
    grade: string
    recent_marks: Array<{
      title: string
      test_date: string
      marks: number | null
      max_marks: number
      percentage: number | null
      grade: string
    }>
  }
  homework: {
    assigned: number
    completed: number
    pending: number
    completion_rate: number
  }
  fees: {
    billed: number
    paid: number
    balance: number
    status: FeeStatus
  }
}

export interface ReportAggregatedData {
  kpis: ReportOverviewKPIs
  attendanceRows: StudentAttendanceReportRow[]
  performanceRows: StudentPerformanceReportRow[]
  batchRows: BatchPerformanceReportRow[]
  homeworkRows: StudentHomeworkReportRow[]
  feeRows: StudentFeeReportRow[]
}
