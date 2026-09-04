'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Megaphone,
  Bell,
  MessageSquare,
  Plus,
  Trash2,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AnnouncementModal } from './announcement-modal'
import { WhatsAppReminderModal } from './whatsapp-reminder-modal'
import { formatCurrency } from '@/lib/fee-utils'
import {
  deleteAnnouncementAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/app/(dashboard)/dashboard/communication/actions'
import { useToast } from '@/contexts/toast-context'
import type {
  AnnouncementWithTarget,
  Notification,
  FeeReminderItem,
  Batch,
  Student,
} from '@/types'

interface CommunicationClientProps {
  initialAnnouncements: AnnouncementWithTarget[]
  initialNotifications: Notification[]
  feeReminders: FeeReminderItem[]
  batches: Batch[]
  students: Student[]
}

export function CommunicationClient({
  initialAnnouncements,
  initialNotifications,
  feeReminders,
  batches,
  students,
}: CommunicationClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications' | 'reminders'>('announcements')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [reminderModalItem, setReminderModalItem] = useState<FeeReminderItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const unreadNotifications = initialNotifications.filter((n) => !n.read)

  async function handleDeleteAnnouncement(id: string) {
    if (!confirm('Are you sure you want to delete this announcement? It will no longer appear in the parent portal.')) {
      return
    }
    setDeletingId(id)
    try {
      const res = await deleteAnnouncementAction(id)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to delete announcement.')
        return
      }
      toast('success', 'Deleted', 'Announcement removed.')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id)
    router.refresh()
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction()
    router.refresh()
  }

  // Filtered Announcements
  const filteredAnnouncements = initialAnnouncements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.batch_name && a.batch_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.student_name && a.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Filtered Fee Reminders
  const filteredReminders = feeReminders.filter(
    (r) =>
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.parent_name && r.parent_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'announcements' ? 'border-indigo-500 bg-indigo-50/20' : 'hover:border-gray-300'}`}
          onClick={() => setActiveTab('announcements')}
        >
          <CardBody className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">Announcements</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{initialAnnouncements.length}</p>
              <p className="text-xs text-indigo-600 mt-0.5">Parent portal notices</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardBody>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'notifications' ? 'border-indigo-500 bg-indigo-50/20' : 'hover:border-gray-300'}`}
          onClick={() => setActiveTab('notifications')}
        >
          <CardBody className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">Notifications</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{unreadNotifications.length}</p>
              <p className="text-xs text-red-600 mt-0.5">Unread alerts requiring attention</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Bell className="h-5 w-5" />
            </div>
          </CardBody>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'reminders' ? 'border-indigo-500 bg-indigo-50/20' : 'hover:border-gray-300'}`}
          onClick={() => setActiveTab('reminders')}
        >
          <CardBody className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500">Fee Reminders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{feeReminders.length}</p>
              <p className="text-xs text-green-700 mt-0.5">Pending WhatsApp notices</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200 self-start">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'announcements'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Announcements ({initialAnnouncements.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'notifications'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Notification Center ({unreadNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'reminders'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            WhatsApp Reminders ({feeReminders.length})
          </button>
        </div>

        {activeTab === 'announcements' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>New Announcement</span>
          </Button>
        )}

        {activeTab === 'notifications' && unreadNotifications.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto text-xs"
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Search Input for lists */}
      {activeTab !== 'notifications' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder={activeTab === 'announcements' ? 'Search announcements...' : 'Search student or fee...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* TAB 1: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Sent Announcements</h2>
          </CardHeader>
          <CardBody className="p-0">
            {filteredAnnouncements.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                <Megaphone className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700 text-sm">No announcements found</p>
                <p>Send updates and schedules directly to your students&apos; parents.</p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-2"
                >
                  Create Announcement
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAnnouncements.map((a) => {
                  const targetLabel =
                    a.target_type === 'all'
                      ? 'All Parents'
                      : a.target_type === 'batch'
                      ? `Batch: ${a.batch_name || 'Class'}`
                      : `Student: ${a.student_name || 'Student'}`

                  const dateStr = new Date(a.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })

                  return (
                    <div key={a.id} className="p-4 sm:p-5 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                            <Badge
                              variant={
                                a.target_type === 'all'
                                  ? 'info'
                                  : a.target_type === 'batch'
                                  ? 'default'
                                  : 'warning'
                              }
                            >
                              {targetLabel}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">Published on {dateStr}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          disabled={deletingId === a.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete announcement"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm bg-gray-50/75 p-3 rounded-xl border border-gray-100">
                        {a.message}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 2: NOTIFICATION CENTER */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">System Alerts & Notifications</h2>
          </CardHeader>
          <CardBody className="p-0">
            {initialNotifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                <Bell className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700 text-sm">You&apos;re all caught up! 🎉</p>
                <p>No actionable fee, attendance, or homework alerts right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {initialNotifications.map((n) => {
                  const dateStr = new Date(n.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })

                  return (
                    <div
                      key={n.id}
                      className={`p-4 sm:p-5 flex items-start justify-between gap-4 text-xs transition-colors ${
                        !n.read ? 'bg-indigo-50/25' : ''
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-red-600 shrink-0" />
                          )}
                          <h3 className="font-bold text-gray-900 text-sm">{n.title}</h3>
                          <Badge variant={n.type === 'fee_overdue' ? 'danger' : 'warning'}>
                            {n.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm">{n.message}</p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-400">
                          <span>{dateStr}</span>
                          {n.action_url && (
                            <Link
                              href={n.action_url}
                              className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <span>Review Item</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {!n.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-gray-500 hover:text-indigo-600 gap-1 shrink-0"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Mark Read</span>
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 3: FEE REMINDERS */}
      {activeTab === 'reminders' && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Pending Fee Reminders</h2>
          </CardHeader>
          <CardBody className="p-0">
            {filteredReminders.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 space-y-2">
                <MessageSquare className="h-8 w-8 text-gray-300 mx-auto" />
                <p className="font-semibold text-gray-700 text-sm">No pending reminders</p>
                <p>All student fees are currently up to date.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                  <thead className="bg-gray-50 font-semibold text-gray-600">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-4 py-3.5">Parent Contact</th>
                      <th className="px-4 py-3.5">Fee Title</th>
                      <th className="px-4 py-3.5 text-right">Balance</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredReminders.map((item) => (
                      <tr key={item.fee_id} className="hover:bg-gray-50/75 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900">{item.student_name}</p>
                          {item.class_name && (
                            <p className="text-[11px] text-gray-400">{item.class_name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-gray-900 font-medium">{item.parent_name || '—'}</p>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {item.parent_phone || 'Missing phone'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-700">{item.title}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-bold text-red-600 text-sm">
                            {formatCurrency(item.balance)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setReminderModalItem(item)}
                            className="gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2.5"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Send Reminder</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Creation Modal */}
      <AnnouncementModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        batches={batches}
        students={students}
        onSuccess={() => router.refresh()}
      />

      {/* WhatsApp Modal */}
      <WhatsAppReminderModal
        isOpen={!!reminderModalItem}
        onClose={() => setReminderModalItem(null)}
        item={reminderModalItem}
      />
    </div>
  )
}
