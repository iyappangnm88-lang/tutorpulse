-- Migration 028: High Performance Composite & Lookup Indexes for Nuzigo
-- All indexes are non-destructive (CREATE INDEX IF NOT EXISTS)

-- 1. Class Sessions (for fast schedule lookup, live badge, and calendar)
CREATE INDEX IF NOT EXISTS idx_class_sessions_tutor_date 
  ON class_sessions (tutor_id, session_date, start_time);

CREATE INDEX IF NOT EXISTS idx_class_sessions_batch_status 
  ON class_sessions (batch_id, status);

CREATE INDEX IF NOT EXISTS idx_class_sessions_status 
  ON class_sessions (status);

-- 2. Attendance (for monthly KPI, session attendance, and streak calculation)
CREATE INDEX IF NOT EXISTS idx_attendance_tutor_date 
  ON attendance (tutor_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_batch_date 
  ON attendance (batch_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_attendance_student 
  ON attendance (student_id);

-- 3. Fees (for batch-scoped fees, workspace fees, and payment reconciliations)
CREATE INDEX IF NOT EXISTS idx_fees_workspace_due 
  ON fees (workspace_id, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_fees_student 
  ON fees (student_id);

CREATE INDEX IF NOT EXISTS idx_fees_status 
  ON fees (status);

-- 4. Batch Students (for membership count, enrolled rosters, and parent/student lookups)
CREATE INDEX IF NOT EXISTS idx_batch_students_batch_status 
  ON batch_students (batch_id, status);

CREATE INDEX IF NOT EXISTS idx_batch_students_student_status 
  ON batch_students (student_id, status);

-- 5. Homework & Submissions (for attention center grading and student portal)
CREATE INDEX IF NOT EXISTS idx_homework_batch 
  ON homework (batch_id);

CREATE INDEX IF NOT EXISTS idx_homework_students_student 
  ON homework_students (student_id, status);

-- 6. Tests & Marks (for test marks entry and performance tracking)
CREATE INDEX IF NOT EXISTS idx_tests_batch 
  ON tests (batch_id);

CREATE INDEX IF NOT EXISTS idx_test_marks_student 
  ON test_marks (student_id);
