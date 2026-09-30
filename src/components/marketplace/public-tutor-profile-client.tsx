'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequestJoinDialog } from './request-join-dialog'
import { TemplateModern } from './templates/template-modern'
import { TemplateElegant } from './templates/template-elegant'
import { TemplateAcademic } from './templates/template-academic'
import { TemplateMinimal } from './templates/template-minimal'
import { TemplateCreative } from './templates/template-creative'
import type { PublicTutorDetail, PublicTeachingOffering } from '@/lib/marketplace-utils'

interface PublicTutorProfileClientProps {
  tutorDetail: PublicTutorDetail
  currentUser: {
    id: string
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
  isOwner: boolean
  existingRequests: Array<{ batchId: string; status: string }>
  selectedOfferingId: string | null
}

export function PublicTutorProfileClient({
  tutorDetail,
  currentUser,
  isOwner,
  existingRequests,
  selectedOfferingId,
}: PublicTutorProfileClientProps) {
  const router = useRouter()
  const { profile, offerings } = tutorDetail

  const initialOffering =
    offerings.find((o) => o.id === selectedOfferingId) || null
  const [activeOffering, setActiveOffering] = useState<PublicTeachingOffering | null>(
    initialOffering
  )
  const [dialogOpen, setDialogOpen] = useState(Boolean(initialOffering))

  const requestMap = new Map(existingRequests.map((r) => [r.batchId, r.status]))

  const portalHref =
    currentUser?.role === 'tutor'
      ? '/dashboard'
      : currentUser?.role === 'student'
      ? '/student'
      : currentUser?.role === 'parent'
      ? '/parent'
      : '/dashboard'

  const handleRequestJoin = (offering: PublicTeachingOffering) => {
    setActiveOffering(offering)
    setDialogOpen(true)
  }

  // Template Selection
  const templateKey = (profile.profileTemplate || 'modern').toLowerCase()

  const renderTemplate = () => {
    const props = {
      tutorDetail,
      currentUser,
      isOwner,
      requestMap,
      portalHref,
      onRequestJoin: handleRequestJoin,
    }

    switch (templateKey) {
      case 'elegant':
        return <TemplateElegant {...props} />
      case 'academic':
        return <TemplateAcademic {...props} />
      case 'minimal':
        return <TemplateMinimal {...props} />
      case 'creative':
        return <TemplateCreative {...props} />
      case 'modern':
      default:
        return <TemplateModern {...props} />
    }
  }

  // Background styling customized to chosen template
  const bgClass =
    templateKey === 'elegant'
      ? 'bg-[#FDFBF7]'
      : templateKey === 'minimal'
      ? 'bg-white'
      : templateKey === 'academic'
      ? 'bg-slate-100/70'
      : templateKey === 'creative'
      ? 'bg-amber-50/30'
      : 'bg-slate-50'

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/tutors"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link href={portalHref}>
                <Button size="sm" variant="outline" className="text-xs">
                  My Portal
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#55C832] hover:bg-[#318A25] text-xs font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Owner Notice Banner */}
      {isOwner && (
        <div className="bg-[#55C832] text-white text-xs py-2.5 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-xs">
          <span>This is your live public profile visible to students & parents.</span>
          <Link
            href="/dashboard/settings"
            className="underline underline-offset-2 font-bold inline-flex items-center gap-1 hover:text-white"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Customize Style & Profile</span>
          </Link>
        </div>
      )}

      {/* Main Profile Body Rendered By Selected Template */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {renderTemplate()}
      </main>

      {/* Shared Join Request Dialog */}
      <RequestJoinDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setActiveOffering(null)
        }}
        tutor={profile}
        offering={activeOffering}
        currentUser={currentUser}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
