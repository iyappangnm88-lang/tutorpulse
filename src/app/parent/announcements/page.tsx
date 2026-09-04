import React from 'react'
import Link from 'next/link'
import { ChevronLeft, Bell } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { getParentAnnouncements } from '@/lib/parent-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Announcements — Parent Portal',
}

export const dynamic = 'force-dynamic'

interface ParentAnnouncementsPageProps {
  searchParams: Promise<{ child?: string }>
}

export default async function ParentAnnouncementsPage({ searchParams }: ParentAnnouncementsPageProps) {
  const { child: childId } = await searchParams
  const res = await getParentAnnouncements(childId)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/parent${childId ? `?child=${childId}` : ''}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Tutor Announcements</h1>
        <p className="text-xs text-gray-500">Notices and class schedules sent by your tutor.</p>
      </div>

      <Card>
        <CardBody className="p-0">
          {res.data.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-600">No announcements yet</p>
              <p className="mt-0.5">Important updates regarding classes and schedules will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {res.data.map((a) => {
                const dateStr = new Date(a.created_at).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div key={a.id} className="p-5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                      <span className="text-[10px] text-gray-400">{dateStr}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                      {a.message}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
