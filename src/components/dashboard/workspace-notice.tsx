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
    <div className="rounded-3xl border border-gray-200 dark:border-[#303A32] bg-gradient-to-br from-[#FAFBEF] via-white to-white dark:from-[#1D241F] dark:via-[#1D241F] dark:to-[#171C18] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#55C832] text-white shadow-md shadow-emerald-500/20 mb-4">
        {requiredWorkspace === 'online' ? (
          <Video className="h-7 w-7" />
        ) : (
          <School className="h-7 w-7" />
        )}
      </div>

      <h2 className="text-xl font-extrabold text-gray-900 dark:text-[#F2F5F2] tracking-tight">{title}</h2>
      <p className="text-sm text-gray-600 dark:text-[#B3BDB5] mt-2 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          size="lg"
          disabled={isPending}
          onClick={() => switchWorkspace(requiredWorkspace)}
          className="gap-2 bg-[#55C832] hover:bg-[#318A25] text-white font-bold shadow-xs"
        >
          <span>
            {requiredWorkspace === 'online'
              ? 'Switch to Online Teaching Workspace'
              : 'Switch to Offline Teaching Workspace'}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-[#89958C] mt-4">
        Your current data remains completely safe and isolated in your active workspace.
      </p>
    </div>
  )
}
