export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'tutor' | 'parent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: 'tutor' | 'parent'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'tutor' | 'parent'
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          tutor_id: string
          full_name: string
          phone: string | null
          email: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other' | null
          class_name: string | null
          school_name: string | null
          address: string | null
          notes: string | null
          status: 'active' | 'inactive' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          full_name: string
          phone?: string | null
          email?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          class_name?: string | null
          school_name?: string | null
          address?: string | null
          notes?: string | null
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other' | null
          class_name?: string | null
          school_name?: string | null
          address?: string | null
          notes?: string | null
          status?: 'active' | 'inactive' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      batches: {
        Row: {
          id: string
          tutor_id: string
          name: string
          subject: string | null
          class_name: string | null
          schedule: string | null
          working_days: string[] | null
          start_time: string | null
          end_time: string | null
          class_mode: 'offline' | 'online' | 'hybrid'
          location: string | null
          description: string | null
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          name: string
          subject?: string | null
          class_name?: string | null
          schedule?: string | null
          working_days?: string[] | null
          start_time?: string | null
          end_time?: string | null
          class_mode?: 'offline' | 'online' | 'hybrid'
          location?: string | null
          description?: string | null
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          name?: string
          subject?: string | null
          class_name?: string | null
          schedule?: string | null
          working_days?: string[] | null
          start_time?: string | null
          end_time?: string | null
          class_mode?: 'offline' | 'online' | 'hybrid'
          location?: string | null
          description?: string | null
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      batch_students: {
        Row: {
          id: string
          batch_id: string
          student_id: string
          joined_at: string
          status: 'active' | 'inactive'
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          student_id: string
          joined_at?: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          student_id?: string
          joined_at?: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          tutor_id: string
          batch_id: string
          student_id: string
          attendance_date: string
          status: 'present' | 'absent' | 'late'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          batch_id: string
          student_id: string
          attendance_date: string
          status: 'present' | 'absent' | 'late'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          batch_id?: string
          student_id?: string
          attendance_date?: string
          status?: 'present' | 'absent' | 'late'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parents: {
        Row: {
          id: string
          tutor_id: string
          user_id: string | null
          portal_enabled: boolean
          full_name: string
          phone: string | null
          email: string | null
          alternate_phone: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          user_id?: string | null
          portal_enabled?: boolean
          full_name: string
          phone?: string | null
          email?: string | null
          alternate_phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          user_id?: string | null
          portal_enabled?: boolean
          full_name?: string
          phone?: string | null
          email?: string | null
          alternate_phone?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parent_students: {
        Row: {
          id: string
          parent_id: string
          student_id: string
          relationship: string
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          student_id: string
          relationship?: string
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          student_id?: string
          relationship?: string
          is_primary?: boolean
          created_at?: string
        }
      }
      fees: {
        Row: {
          id: string
          tutor_id: string
          student_id: string
          title: string
          description: string | null
          amount: number
          due_date: string
          status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          student_id: string
          title: string
          description?: string | null
          amount: number
          due_date: string
          status?: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          student_id?: string
          title?: string
          description?: string | null
          amount?: number
          due_date?: string
          status?: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tutor_id: string
          fee_id: string
          student_id: string
          amount: number
          payment_date: string
          payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other'
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          fee_id: string
          student_id: string
          amount: number
          payment_date?: string
          payment_method?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other'
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          fee_id?: string
          student_id?: string
          amount?: number
          payment_date?: string
          payment_method?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other'
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      homework: {
        Row: {
          id: string
          tutor_id: string
          batch_id: string
          title: string
          description: string | null
          instructions: string | null
          assigned_date: string
          due_date: string | null
          status: 'Draft' | 'Assigned' | 'Completed' | 'Archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          batch_id: string
          title: string
          description?: string | null
          instructions?: string | null
          assigned_date?: string
          due_date?: string | null
          status?: 'Draft' | 'Assigned' | 'Completed' | 'Archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          batch_id?: string
          title?: string
          description?: string | null
          instructions?: string | null
          assigned_date?: string
          due_date?: string | null
          status?: 'Draft' | 'Assigned' | 'Completed' | 'Archived'
          created_at?: string
          updated_at?: string
        }
      }
      homework_students: {
        Row: {
          id: string
          tutor_id: string
          homework_id: string
          student_id: string
          status: 'Pending' | 'Completed' | 'Excused'
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          homework_id: string
          student_id: string
          status?: 'Pending' | 'Completed' | 'Excused'
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          homework_id?: string
          student_id?: string
          status?: 'Pending' | 'Completed' | 'Excused'
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          tutor_id: string
          batch_id: string
          title: string
          description: string | null
          test_date: string
          max_marks: number
          status: 'Draft' | 'Published' | 'Completed' | 'Archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          batch_id: string
          title: string
          description?: string | null
          test_date: string
          max_marks: number
          status?: 'Draft' | 'Published' | 'Completed' | 'Archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          batch_id?: string
          title?: string
          description?: string | null
          test_date?: string
          max_marks?: number
          status?: 'Draft' | 'Published' | 'Completed' | 'Archived'
          created_at?: string
          updated_at?: string
        }
      }
      test_marks: {
        Row: {
          id: string
          tutor_id: string
          test_id: string
          student_id: string
          marks: number | null
          status: 'Not Graded' | 'Graded' | 'Absent' | 'Excused'
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          test_id: string
          student_id: string
          marks?: number | null
          status?: 'Not Graded' | 'Graded' | 'Absent' | 'Excused'
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          test_id?: string
          student_id?: string
          marks?: number | null
          status?: 'Not Graded' | 'Graded' | 'Absent' | 'Excused'
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      announcements: {
        Row: {
          id: string
          tutor_id: string
          batch_id: string | null
          student_id: string | null
          target_type: 'all' | 'batch' | 'student'
          title: string
          message: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          batch_id?: string | null
          student_id?: string | null
          target_type?: 'all' | 'batch' | 'student'
          title: string
          message: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          batch_id?: string | null
          student_id?: string | null
          target_type?: 'all' | 'batch' | 'student'
          title?: string
          message?: string
          created_at?: string
          updated_at?: string
        }
      },
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'fee_overdue' | 'fee_pending' | 'attendance_alert' | 'homework_missing' | 'announcement' | 'general'
          title: string
          message: string
          action_url: string | null
          read: boolean
          event_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'fee_overdue' | 'fee_pending' | 'attendance_alert' | 'homework_missing' | 'announcement' | 'general'
          title: string
          message: string
          action_url?: string | null
          read?: boolean
          event_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'fee_overdue' | 'fee_pending' | 'attendance_alert' | 'homework_missing' | 'announcement' | 'general'
          title?: string
          message?: string
          action_url?: string | null
          read?: boolean
          event_key?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type StudentUpdate = Database['public']['Tables']['students']['Update']

export type Batch = Database['public']['Tables']['batches']['Row']
export type BatchInsert = Database['public']['Tables']['batches']['Insert']
export type BatchUpdate = Database['public']['Tables']['batches']['Update']

export type BatchStudent = Database['public']['Tables']['batch_students']['Row']
export type BatchStudentInsert = Database['public']['Tables']['batch_students']['Insert']
export type BatchStudentUpdate = Database['public']['Tables']['batch_students']['Update']

export type Attendance = Database['public']['Tables']['attendance']['Row']
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update']

export type Parent = Database['public']['Tables']['parents']['Row']
export type ParentInsert = Database['public']['Tables']['parents']['Insert']
export type ParentUpdate = Database['public']['Tables']['parents']['Update']

export type ParentStudent = Database['public']['Tables']['parent_students']['Row']
export type ParentStudentInsert = Database['public']['Tables']['parent_students']['Insert']
export type ParentStudentUpdate = Database['public']['Tables']['parent_students']['Update']

export type Fee = Database['public']['Tables']['fees']['Row']
export type FeeInsert = Database['public']['Tables']['fees']['Insert']
export type FeeUpdate = Database['public']['Tables']['fees']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type Homework = Database['public']['Tables']['homework']['Row']
export type HomeworkInsert = Database['public']['Tables']['homework']['Insert']
export type HomeworkUpdate = Database['public']['Tables']['homework']['Update']

export type HomeworkStudent = Database['public']['Tables']['homework_students']['Row']
export type HomeworkStudentInsert = Database['public']['Tables']['homework_students']['Insert']
export type HomeworkStudentUpdate = Database['public']['Tables']['homework_students']['Update']

export type Test = Database['public']['Tables']['tests']['Row']
export type TestInsert = Database['public']['Tables']['tests']['Insert']
export type TestUpdate = Database['public']['Tables']['tests']['Update']

export type TestMark = Database['public']['Tables']['test_marks']['Row']
export type TestMarkInsert = Database['public']['Tables']['test_marks']['Insert']
export type TestMarkUpdate = Database['public']['Tables']['test_marks']['Update']

export type Profile = Database['public']['Tables']['profiles']['Row']

export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert']
export type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
