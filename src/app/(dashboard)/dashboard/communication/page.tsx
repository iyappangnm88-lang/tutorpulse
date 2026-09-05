import React from 'react'
import {
  getTutorAnnouncements,
  getTutorNotifications,
  getPendingFeeReminders,
} from '@/lib/communication'
import { getBatches } from '@/lib/batches'
import { getStudents } from '@/lib/students'
import { CommunicationClient } from '@/components/communication/communication-client'
import { PageGuide } from '@/components/help/page-guide'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Communication & Notification Center — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function CommunicationPage() {
  const [announcements, notifications, feeReminders, batchesRes, studentsRes] = await Promise.all([
    getTutorAnnouncements(),
    getTutorNotifications(),
    getPendingFeeReminders(),
    getBatches(),
    getStudents(),
  ])

  const batches = batchesRes.data || []
  const students = studentsRes.data || []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageGuide topicId="communication" defaultCollapsed={announcements.length > 0} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Communication Center</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Send announcements to parents, monitor actionable alerts, and send 1-click WhatsApp fee reminders.
        </p>
      </div>

      <CommunicationClient
        initialAnnouncements={announcements}
        initialNotifications={notifications}
        feeReminders={feeReminders}
        batches={batches}
        students={students}
      />
    </div>
  )
}
