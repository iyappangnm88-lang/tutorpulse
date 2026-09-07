'use client'

import React, { createContext, useContext, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Workspace, WorkspaceType } from '@/types'
import { switchWorkspaceAction } from '@/app/(dashboard)/dashboard/workspace-actions'
import { useToast } from './toast-context'

interface WorkspaceContextValue {
  workspaceType: WorkspaceType
  activeWorkspace: Workspace | null
  workspaces: {
    offline: Workspace | null
    online: Workspace | null
  }
  isPending: boolean
  switchWorkspace: (type: WorkspaceType) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceType: 'offline',
  activeWorkspace: null,
  workspaces: { offline: null, online: null },
  isPending: false,
  switchWorkspace: async () => {},
})

interface WorkspaceProviderProps {
  children: React.ReactNode
  initialWorkspace: Workspace | null
  initialWorkspaceType: WorkspaceType
  workspaces: {
    offline: Workspace | null
    online: Workspace | null
  }
}

export function WorkspaceProvider({
  children,
  initialWorkspace,
  initialWorkspaceType,
  workspaces,
}: WorkspaceProviderProps) {
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>(initialWorkspaceType)
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(initialWorkspace)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  const switchWorkspace = async (targetType: WorkspaceType) => {
    if (targetType === workspaceType) return

    setWorkspaceType(targetType)
    setActiveWorkspace(targetType === 'online' ? workspaces.online : workspaces.offline)

    startTransition(async () => {
      try {
        await switchWorkspaceAction(targetType)
        router.refresh()
        toast(
          'info',
          `Switched to ${targetType === 'online' ? 'Online' : 'Offline'} Teaching`,
          targetType === 'online'
            ? 'Accessing virtual classrooms, calendar & digital sessions'
            : 'Accessing physical tuition, physical attendance & in-person batches'
        )
      } catch (err) {
        console.error('Failed to switch workspace:', err)
        toast('error', 'Switch failed', 'Could not switch workspace. Please try again.')
      }
    })
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceType,
        activeWorkspace,
        workspaces,
        isPending,
        switchWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
