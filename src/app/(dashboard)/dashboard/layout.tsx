import React from 'react'
import { getActiveWorkspace } from '@/lib/workspace'
import { WorkspaceProvider } from '@/contexts/workspace-context'
import { DashboardShell } from './dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
