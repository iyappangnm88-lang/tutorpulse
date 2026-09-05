import React from 'react'
import type { Metadata } from 'next'
import { HelpCenterView } from '@/components/help/help-center-view'

export const metadata: Metadata = {
  title: 'Help Center & Guides — TutorPulse',
  description: 'In-depth, plain-English guidance and documentation for managing your tutoring batches, students, attendance, fees, and parent communication.',
}

export default function HelpCenterPage() {
  return <HelpCenterView />
}
