import React from 'react'
import { redirect } from 'next/navigation'
import { ParentSidebar } from '@/components/parent/parent-sidebar'
import { ParentMobileNav } from '@/components/parent/parent-mobile-nav'
import { ParentHeader } from '@/components/parent/parent-header'
import { getAuthorizedChild } from '@/lib/parent-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parent Portal — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { child, allChildren, parent, error } = await getAuthorizedChild()

  if (error || !parent) {
    // If user is not authenticated or not a parent
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Sidebar */}
      <ParentSidebar
        parentName={parent.full_name}
        childQueryString={child ? `child=${child.student_id}` : ''}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col">
        <ParentHeader
          parentName={parent.full_name}
          childrenList={allChildren}
          selectedChildId={child?.student_id || ''}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <ParentMobileNav />
    </div>
  )
}
