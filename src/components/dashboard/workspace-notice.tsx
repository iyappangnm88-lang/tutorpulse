'use client'

import React from 'react'
import { Video, ArrowRight, School } from 'lucide-react'
import { useWorkspace } from '@/contexts/workspace-context'
import { Button } from '@/components/ui/button'

interface WorkspaceNoticeProps {
  requiredWorkspace: 'online' | 'offline'
  title: string
  description: string
}

export function WorkspaceNotice({
  requiredWorkspace,
  title,
  description,
}: WorkspaceNoticeProps) {
  const { switchWorkspace, isPending } = useWorkspace()

  return (
    <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/20 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-4">
        {requiredWorkspace === 'online' ? (
          <Video className="h-7 w-7" />
        ) : (
          <School className="h-7 w-7" />
        )}
      </div>

      <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
      <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          size="lg"
          disabled={isPending}
          onClick={() => switchWorkspace(requiredWorkspace)}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
        >
          <span>
            {requiredWorkspace === 'online'
              ? 'Switch to Online Teaching Workspace'
              : 'Switch to Offline Teaching Workspace'}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-[11px] text-gray-400 mt-4">
        Your current data remains completely safe and isolated in your active workspace.
      </p>
    </div>
  )
}
