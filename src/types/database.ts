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
          role: 'tutor' | 'student' | 'parent'
          onboarding_completed: boolean
          bio: string | null
          primary_subjects: string[] | null
          target_classes: string[] | null
          teaching_languages: string[] | null
          teaching_mode: 'online' | 'offline' | 'both' | null
          experience_years: number | null
          avatar_url: string | null
          is_public_marketplace: boolean
          headline: string | null
          teaching_approach: string | null
          profile_slug: string | null
          location_region: string | null
          public_contact_preference: 'platform' | 'email' | 'none' | null
          availability_hours: any[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: 'tutor' | 'student' | 'parent'
          onboarding_completed?: boolean
          bio?: string | null
          primary_subjects?: string[] | null
          target_classes?: string[] | null
          teaching_languages?: string[] | null
          teaching_mode?: 'online' | 'offline' | 'both' | null
          experience_years?: number | null
          avatar_url?: string | null
          is_public_marketplace?: boolean
          headline?: string | null
          teaching_approach?: string | null
          profile_slug?: string | null
          location_region?: string | null
          public_contact_preference?: 'platform' | 'email' | 'none' | null
          availability_hours?: any[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'tutor' | 'student' | 'parent'
          onboarding_completed?: boolean
          bio?: string | null
          primary_subjects?: string[] | null
          target_classes?: string[] | null
          teaching_languages?: string[] | null
          teaching_mode?: 'online' | 'offline' | 'both' | null
          experience_years?: number | null
          avatar_url?: string | null
          is_public_marketplace?: boolean
          headline?: string | null
          teaching_approach?: string | null
          profile_slug?: string | null
          location_region?: string | null
          public_contact_preference?: 'platform' | 'email' | 'none' | null
          availability_hours?: any[] | null
          created_at?: string
          updated_at?: string
        }
      }
      student_profiles: {
        Row: {
          id: string
          full_name: string
          grade_level: string | null
          school_name: string | null
          interests: string[]
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          grade_level?: string | null
          school_name?: string | null
          interests?: string[]
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          grade_level?: string | null
          school_name?: string | null
          interests?: string[]
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_tutor_connections: {
        Row: {
          id: string
          student_user_id: string
          tutor_id: string
          student_record_id: string | null
          status: 'active' | 'pending' | 'inactive'
          joined_via: 'invite' | 'direct' | 'marketplace'
          invite_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_user_id: string
          tutor_id: string
          student_record_id?: string | null
          status?: 'active' | 'pending' | 'inactive'
          joined_via?: 'invite' | 'direct' | 'marketplace'
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_user_id?: string
          tutor_id?: string
          student_record_id?: string | null
          status?: 'active' | 'pending' | 'inactive'
          joined_via?: 'invite' | 'direct' | 'marketplace'
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      workspaces: {
        Row: {
          id: string
          tutor_id: string
          type: 'offline' | 'online'
          name: string
          invite_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          type: 'offline' | 'online'
          name: string
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          type?: 'offline' | 'online'
          name?: string
          invite_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
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
          workspace_id: string | null
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
          is_public: boolean
          public_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          workspace_id?: string | null
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
          is_public?: boolean
          public_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          workspace_id?: string | null
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
          is_public?: boolean
          public_description?: string | null
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
      class_sessions: {
        Row: {
          id: string
          tutor_id: string
          workspace_id: string | null
          batch_id: string
          session_date: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          class_mode: 'offline' | 'online' | 'hybrid'
          location: string | null
          meeting_link: string | null
          meeting_provider: string | null
          meeting_room_id: string | null
          started_at: string | null
          ended_at: string | null
          notes: string | null
          is_overridden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          workspace_id?: string | null
          batch_id: string
          session_date: string
          start_time: string
          end_time: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          class_mode?: 'offline' | 'online' | 'hybrid'
          location?: string | null
          meeting_link?: string | null
          meeting_provider?: string | null
          meeting_room_id?: string | null
          started_at?: string | null
          ended_at?: string | null
          notes?: string | null
          is_overridden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          workspace_id?: string | null
          batch_id?: string
          session_date?: string
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          class_mode?: 'offline' | 'online' | 'hybrid'
          location?: string | null
          meeting_link?: string | null
          meeting_provider?: string | null
          meeting_room_id?: string | null
          started_at?: string | null
          ended_at?: string | null
          notes?: string | null
          is_overridden?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      classroom_participants: {
        Row: {
          id: string
          session_id: string
          user_id: string
          user_name: string
          role: 'host' | 'participant' | 'spectator'
          joined_at: string
          left_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          user_name: string
          role?: 'host' | 'participant' | 'spectator'
          joined_at?: string
          left_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          user_name?: string
          role?: 'host' | 'participant' | 'spectator'
          joined_at?: string
          left_at?: string | null
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          tutor_id: string
          workspace_id: string | null
          batch_id: string
          student_id: string
          session_id: string | null
          attendance_date: string
          status: 'present' | 'absent' | 'late'
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          workspace_id?: string | null
          batch_id: string
          student_id: string
          session_id?: string | null
          attendance_date: string
          status: 'present' | 'absent' | 'late'
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          workspace_id?: string | null
          batch_id?: string
          student_id?: string
          session_id?: string | null
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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
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
      },
      whiteboards: {
        Row: {
          id: string
          session_id: string
          workspace_id: string
          tutor_id: string
          students_can_draw: boolean
          active_page_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          workspace_id: string
          tutor_id: string
          students_can_draw?: boolean
          active_page_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          workspace_id?: string
          tutor_id?: string
          students_can_draw?: boolean
          active_page_number?: number
          created_at?: string
          updated_at?: string
        }
      },
      whiteboard_pages: {
        Row: {
          id: string
          whiteboard_id: string
          page_number: number
          title: string
          elements: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          whiteboard_id: string
          page_number?: number
          title?: string
          elements?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          whiteboard_id?: string
          page_number?: number
          title?: string
          elements?: any
          created_at?: string
          updated_at?: string
        }
      },
      classroom_messages: {
        Row: {
          id: string
          workspace_id: string
          class_session_id: string
          sender_user_id: string
          sender_role: 'tutor' | 'student' | 'parent'
          sender_name: string
          message: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          class_session_id: string
          sender_user_id: string
          sender_role: 'tutor' | 'student' | 'parent'
          sender_name: string
          message: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          class_session_id?: string
          sender_user_id?: string
          sender_role?: 'tutor' | 'student' | 'parent'
          sender_name?: string
          message?: string
          created_at?: string
          updated_at?: string
        }
      },
      classroom_polls: {
        Row: {
          id: string
          workspace_id: string
          class_session_id: string
          tutor_id: string
          question: string
          options: any
          status: 'draft' | 'active' | 'closed'
          results_revealed: boolean
          created_at: string
          started_at: string | null
          closed_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          class_session_id: string
          tutor_id: string
          question: string
          options: any
          status?: 'draft' | 'active' | 'closed'
          results_revealed?: boolean
          created_at?: string
          started_at?: string | null
          closed_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          class_session_id?: string
          tutor_id?: string
          question?: string
          options?: any
          status?: 'draft' | 'active' | 'closed'
          results_revealed?: boolean
          created_at?: string
          started_at?: string | null
          closed_at?: string | null
        }
      },
      classroom_poll_responses: {
        Row: {
          id: string
          poll_id: string
          class_session_id: string
          user_id: string
          student_id: string | null
          option_index: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          class_session_id: string
          user_id: string
          student_id?: string | null
          option_index: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          class_session_id?: string
          user_id?: string
          student_id?: string | null
          option_index?: number
          created_at?: string
        }
      }
      join_requests: {
        Row: {
          id: string
          student_user_id: string
          tutor_id: string
          batch_id: string
          workspace_id: string | null
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          student_notes: string | null
          created_at: string
          updated_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          student_user_id: string
          tutor_id: string
          batch_id: string
          workspace_id?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          student_notes?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          student_user_id?: string
          tutor_id?: string
          batch_id?: string
          workspace_id?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled'
          student_notes?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
      }
    }
    Functions: {
      link_parent_account_by_verified_email: {
        Args: Record<PropertyKey, never>
        Returns: {
          success: boolean
          is_parent?: boolean
          is_tutor?: boolean
          linked_count?: number
          error?: string
        }
      }
    }
  }
}

export type WhiteboardRow = Database['public']['Tables']['whiteboards']['Row']
export type WhiteboardInsert = Database['public']['Tables']['whiteboards']['Insert']
export type WhiteboardUpdate = Database['public']['Tables']['whiteboards']['Update']

export type WhiteboardPageRow = Database['public']['Tables']['whiteboard_pages']['Row']
export type WhiteboardPageInsert = Database['public']['Tables']['whiteboard_pages']['Insert']
export type WhiteboardPageUpdate = Database['public']['Tables']['whiteboard_pages']['Update']

export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type WorkspaceInsert = Database['public']['Tables']['workspaces']['Insert']
export type WorkspaceUpdate = Database['public']['Tables']['workspaces']['Update']

export type Student = Database['public']['Tables']['students']['Row']
export type StudentInsert = Database['public']['Tables']['students']['Insert']
export type StudentUpdate = Database['public']['Tables']['students']['Update']

export type Batch = Database['public']['Tables']['batches']['Row']
export type BatchInsert = Database['public']['Tables']['batches']['Insert']
export type BatchUpdate = Database['public']['Tables']['batches']['Update']

export type BatchStudent = Database['public']['Tables']['batch_students']['Row']
export type BatchStudentInsert = Database['public']['Tables']['batch_students']['Insert']
export type BatchStudentUpdate = Database['public']['Tables']['batch_students']['Update']

export type ClassSession = Database['public']['Tables']['class_sessions']['Row']
export type ClassSessionInsert = Database['public']['Tables']['class_sessions']['Insert']
export type ClassSessionUpdate = Database['public']['Tables']['class_sessions']['Update']

export type ClassroomParticipantRow = Database['public']['Tables']['classroom_participants']['Row']
export type ClassroomParticipantInsert = Database['public']['Tables']['classroom_participants']['Insert']
export type ClassroomParticipantUpdate = Database['public']['Tables']['classroom_participants']['Update']

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
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type StudentProfile = Database['public']['Tables']['student_profiles']['Row']
export type StudentProfileInsert = Database['public']['Tables']['student_profiles']['Insert']
export type StudentProfileUpdate = Database['public']['Tables']['student_profiles']['Update']

export type StudentTutorConnection = Database['public']['Tables']['student_tutor_connections']['Row']
export type StudentTutorConnectionInsert = Database['public']['Tables']['student_tutor_connections']['Insert']
export type StudentTutorConnectionUpdate = Database['public']['Tables']['student_tutor_connections']['Update']

export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AnnouncementInsert = Database['public']['Tables']['announcements']['Insert']
export type AnnouncementUpdate = Database['public']['Tables']['announcements']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type ClassroomMessageRow = Database['public']['Tables']['classroom_messages']['Row']
export type ClassroomMessageInsert = Database['public']['Tables']['classroom_messages']['Insert']
export type ClassroomMessageUpdate = Database['public']['Tables']['classroom_messages']['Update']

export type ClassroomPollRow = Database['public']['Tables']['classroom_polls']['Row']
export type ClassroomPollInsert = Database['public']['Tables']['classroom_polls']['Insert']
export type ClassroomPollUpdate = Database['public']['Tables']['classroom_polls']['Update']

export type ClassroomPollResponseRow = Database['public']['Tables']['classroom_poll_responses']['Row']
export type ClassroomPollResponseInsert = Database['public']['Tables']['classroom_poll_responses']['Insert']
export type ClassroomPollResponseUpdate = Database['public']['Tables']['classroom_poll_responses']['Update']

export type JoinRequest = Database['public']['Tables']['join_requests']['Row']
export type JoinRequestInsert = Database['public']['Tables']['join_requests']['Insert']
export type JoinRequestUpdate = Database['public']['Tables']['join_requests']['Update']

