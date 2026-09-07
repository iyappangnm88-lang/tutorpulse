'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { WorkspaceType } from '@/types'

export async function switchWorkspaceAction(type: WorkspaceType) {
  const targetType: WorkspaceType = type === 'online' ? 'online' : 'offline'
  const cookieStore = await cookies()

  cookieStore.set('tp_active_workspace', targetType, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    httpOnly: false, // Accessible from client-side if needed
  })

  // Invalidate all dashboard paths so server components refresh their data queries
  revalidatePath('/dashboard', 'layout')

  return { success: true, workspace: targetType }
}
