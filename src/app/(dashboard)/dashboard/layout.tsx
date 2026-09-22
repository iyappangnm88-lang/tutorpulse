import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/workspace'
import { WorkspaceProvider } from '@/contexts/workspace-context'
import { DashboardShell } from './dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  // Strict server-side role boundary check
  if (profile?.role === 'student') {
    redirect('/student')
  } else if (profile?.role === 'parent') {
    redirect('/parent')
  } else if (profile && !profile.onboarding_completed) {
    redirect('/onboarding/role')
  }

  const { activeWorkspace, workspaceType, workspaces } = await getActiveWorkspace()

  return (
    <WorkspaceProvider
      initialWorkspace={activeWorkspace}
      initialWorkspaceType={workspaceType}
      workspaces={workspaces}
    >
      <DashboardShell>
        {children}
      </DashboardShell>
    </WorkspaceProvider>
  )
}
