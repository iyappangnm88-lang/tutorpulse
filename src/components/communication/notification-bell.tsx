'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/app/(dashboard)/dashboard/communication/actions'
import type { Notification } from '@/types'

export function NotificationBell({ initialNotifications = [] }: { initialNotifications?: Notification[] }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleMarkRead(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    await markNotificationReadAction(id)
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await markAllNotificationsReadAction()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-30 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  You&apos;re all caught up! 🎉
                </div>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 text-xs transition-colors hover:bg-gray-50 ${
                      !n.read ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-red-600 shrink-0" />
                          )}
                          <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                            {n.title}
                          </p>
                        </div>
                        <p className="text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                          <span>
                            {new Date(n.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {n.action_url && (
                            <Link
                              href={n.action_url}
                              onClick={() => setOpen(false)}
                              className="text-indigo-600 font-semibold hover:underline flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {!n.read && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 p-2.5 bg-gray-50/50 text-center">
              <Link
                href="/dashboard/communication"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all in Communication Center →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
