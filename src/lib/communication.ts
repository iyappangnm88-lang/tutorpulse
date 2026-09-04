import { createClient } from '@/lib/supabase/server'
import { roundCurrency, deriveFeeStatus } from '@/lib/fee-utils'
import type {
  AnnouncementWithTarget,
  Notification,
  CommunicationSummary,
  FeeReminderItem,
} from '@/types'

/**
 * Normalizes an Indian / international phone number for WhatsApp deep-linking
 */
export { normalizePhoneForWhatsApp, constructWhatsAppReminderUrl } from './communication-utils'

/**
 * Synchronizes background system notifications (idempotent, deduplicated via event_key)
 */
export async function syncSystemAlerts(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const todayStr = new Date().toISOString().split('T')[0]

  try {
    // 1. Check overdue fees
    const { data: overdueFees } = await supabase
      .from('fees')
      .select(`
        id,
        title,
        amount,
        due_date,
        student_id,
        students:student_id (full_name),
        payments (amount)
      `)
      .eq('tutor_id', user.id)
      .lt('due_date', todayStr)

    interface RawOverdue {
      id: string
      title: string
      amount: number
      due_date: string
      student_id: string
      students: { full_name: string } | null
      payments: Array<{ amount: number }>
    }

    const rawFees = (overdueFees as unknown as RawOverdue[]) || []
    for (const f of rawFees) {
      const paidSum = (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
      const balance = Math.max(0, roundCurrency(f.amount - paidSum))
      if (balance > 0) {
        const studentName = f.students?.full_name || 'Student'
        await supabase
          .from('notifications')
          .upsert(
            {
              user_id: user.id,
              type: 'fee_overdue',
              title: `Overdue Fee: ${studentName}`,
              message: `₹${balance.toLocaleString('en-IN')} is overdue for ${f.title}.`,
              action_url: `/dashboard/fees/${f.id}`,
              event_key: `fee_overdue:${f.id}`,
            },
            { onConflict: 'user_id,event_key' }
          )
      }
    }

    // 2. Check overdue incomplete homework
    const { data: missingHw } = await supabase
      .from('homework_students')
      .select(`
        id,
        status,
        student_id,
        students:student_id (full_name),
        homework:homework_id (id, title, due_date)
      `)
      .eq('tutor_id', user.id)
      .eq('status', 'Pending')

    interface RawMissingHw {
      id: string
      status: string
      student_id: string
      students: { full_name: string } | null
      homework: { id: string; title: string; due_date: string | null } | null
    }

    const rawHw = (missingHw as unknown as RawMissingHw[]) || []
    for (const h of rawHw) {
      if (h.homework?.due_date && h.homework.due_date < todayStr) {
        const studentName = h.students?.full_name || 'Student'
        await supabase
          .from('notifications')
          .upsert(
            {
              user_id: user.id,
              type: 'homework_missing',
              title: `Missing Homework: ${studentName}`,
              message: `Overdue assignment '${h.homework.title}' has not been completed.`,
              action_url: `/dashboard/homework/${h.homework.id}`,
              event_key: `hw_missing:${h.id}`,
            },
            { onConflict: 'user_id,event_key' }
          )
      }
    }
  } catch {
    // Silently ignore background sync errors when tables are not yet created
  }
}

/**
 * Loads communication overview metrics
 */
export async function getCommunicationSummary(): Promise<CommunicationSummary> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { total_announcements: 0, unread_notifications: 0, pending_fee_reminders: 0 }
  }

  // Trigger sync on dashboard load
  await syncSystemAlerts()

  const [announcementsRes, notificationsRes, feeReminders] = await Promise.all([
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', user.id),

    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),

    getPendingFeeReminders(),
  ])

  return {
    total_announcements: announcementsRes.count || 0,
    unread_notifications: notificationsRes.count || 0,
    pending_fee_reminders: feeReminders.length,
  }
}

/**
 * Loads all tutor announcements with joined target names
 */
export async function getTutorAnnouncements(): Promise<AnnouncementWithTarget[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      batches (name),
      students (full_name)
    `)
    .eq('tutor_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  interface RawAnn {
    id: string
    tutor_id: string
    batch_id: string | null
    student_id: string | null
    target_type: 'all' | 'batch' | 'student'
    title: string
    message: string
    created_at: string
    updated_at: string
    batches: { name: string } | null
    students: { full_name: string } | null
  }

  return (data as unknown as RawAnn[]).map((a) => ({
    ...a,
    batch_name: a.batches?.name || null,
    student_name: a.students?.full_name || null,
  }))
}

/**
 * Loads tutor notifications
 */
export async function getTutorNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data as Notification[]
}

/**
 * Loads fees with outstanding balances and primary parent contact details
 */
export async function getPendingFeeReminders(): Promise<FeeReminderItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('fees')
    .select(`
      id,
      title,
      amount,
      due_date,
      student_id,
      students:student_id (
        id,
        full_name,
        class_name,
        parent_students (
          is_primary,
          parents (
            id,
            full_name,
            phone
          )
        )
      ),
      payments (amount)
    `)
    .eq('tutor_id', user.id)
    .order('due_date', { ascending: true })

  if (error || !data) return []

  interface RawFeeReminder {
    id: string
    title: string
    amount: number
    due_date: string
    student_id: string
    students: {
      id: string
      full_name: string
      class_name: string | null
      parent_students: Array<{
        is_primary: boolean
        parents: { id: string; full_name: string; phone: string | null } | null
      }>
    } | null
    payments: Array<{ amount: number }>
  }

  const result: FeeReminderItem[] = []
  const rawList = data as unknown as RawFeeReminder[]

  for (const f of rawList) {
    const paidSum = (f.payments || []).reduce((acc, p) => acc + p.amount, 0)
    const balance = Math.max(0, roundCurrency(f.amount - paidSum))

    if (balance > 0 && f.students) {
      // Find primary parent or first linked parent
      const parentLink =
        f.students.parent_students?.find((ps) => ps.is_primary && ps.parents) ||
        f.students.parent_students?.find((ps) => ps.parents)

      const status = deriveFeeStatus(f.amount, paidSum, f.due_date)

      result.push({
        fee_id: f.id,
        title: f.title,
        due_date: f.due_date,
        amount: f.amount,
        total_paid: paidSum,
        balance,
        status,
        student_id: f.student_id,
        student_name: f.students.full_name,
        class_name: f.students.class_name,
        parent_name: parentLink?.parents?.full_name || null,
        parent_phone: parentLink?.parents?.phone || null,
      })
    }
  }

  return result
}
