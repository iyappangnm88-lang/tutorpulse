import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/settings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — TutorPulse',
}

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const userMetadata = {
    tuition_center_name: user.user_metadata?.tuition_center_name,
    phone: user.user_metadata?.phone,
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your tutor profile, tuition center configurations, and security preferences.
        </p>
      </div>

      <SettingsClient initialProfile={profile} userMetadata={userMetadata} />
    </div>
  )
}
