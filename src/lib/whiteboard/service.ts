'use server'

// ==============================================================================
// TUTORPULSE PHASE 4: WHITEBOARD DATA SERVICE & SERVER ACTIONS
// Server-side authorization, persistence, and strict offline isolation
// ==============================================================================

import { createClient } from '@/lib/supabase/server'
import { verifySessionAccess } from '@/lib/classroom/auth'
import type { ClassroomRole } from '@/lib/classroom/types'
import type {
  WhiteboardElement,
  WhiteboardPageData,
  WhiteboardSessionState,
} from './types'

export interface WhiteboardLoadResult {
  success: boolean
  error?: string
  state?: WhiteboardSessionState
  canDraw?: boolean
  role?: ClassroomRole
}

/**
 * Get or initialize the digital whiteboard for an authorized online class session.
 * Enforces:
 * 1. Authentication & IDOR verification
 * 2. Strict ONLINE class_mode check
 * 3. Strict ONLINE workspace check
 * 4. Automatic creation of Page 1 if first time loading
 */
export async function getOrCreateWhiteboardAction(
  sessionId: string
): Promise<WhiteboardLoadResult> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session || !authResult.user) {
      return { success: false, error: authResult.error || 'Access denied to classroom whiteboard.' }
    }

    const { session, role, user } = authResult

    // Strict Offline Guard: Whiteboards are forbidden for offline sessions
    if (session.class_mode === 'offline') {
      return { success: false, error: 'Whiteboards are not available for Offline physical classes.' }
    }

    const supabase = await createClient()

    // Workspace check
    if (session.workspace_id) {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id, type')
        .eq('id', session.workspace_id)
        .maybeSingle()

      if (ws && ws.type === 'offline') {
        return { success: false, error: 'Whiteboards are not available in Offline teaching workspaces.' }
      }
    }

    // 1. Check if whiteboard already exists for this session
    let { data: whiteboard } = await supabase
      .from('whiteboards')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle()

    // 2. If no whiteboard exists yet:
    // Only tutor can create a new whiteboard row
    if (!whiteboard) {
      if (role !== 'host') {
        return {
          success: true,
          canDraw: false,
          role: 'participant',
          state: {
            whiteboardId: '',
            sessionId,
            workspaceId: session.workspace_id || '',
            tutorId: session.tutor_id,
            studentsCanDraw: false,
            activePageNumber: 1,
            pages: [
              {
                pageNumber: 1,
                title: 'Page 1',
                elements: [],
              },
            ],
          },
        }
      }

      // Tutor initiates whiteboard
      const { data: newBoard, error: insertError } = await supabase
        .from('whiteboards')
        .insert({
          session_id: sessionId,
          workspace_id: session.workspace_id!,
          tutor_id: session.tutor_id,
          students_can_draw: false,
          active_page_number: 1,
        })
        .select()
        .single()

      if (insertError || !newBoard) {
        console.error('[WhiteboardService] Insert error:', insertError)
        return { success: false, error: 'Failed to initialize session whiteboard.' }
      }

      whiteboard = newBoard

      // Create initial Page 1
      await supabase.from('whiteboard_pages').insert({
        whiteboard_id: whiteboard.id,
        page_number: 1,
        title: 'Page 1',
        elements: [],
      })
    }

    // 3. Fetch all pages for this whiteboard
    const { data: rawPages } = await supabase
      .from('whiteboard_pages')
      .select('*')
      .eq('whiteboard_id', whiteboard.id)
      .order('page_number', { ascending: true })

    const pages: WhiteboardPageData[] =
      rawPages && rawPages.length > 0
        ? rawPages.map((p) => ({
            id: p.id,
            pageNumber: p.page_number,
            title: p.title,
            elements: (p.elements as WhiteboardElement[]) || [],
          }))
        : [
            {
              pageNumber: 1,
              title: 'Page 1',
              elements: [],
            },
          ]

    const canDraw = role === 'host' || Boolean(whiteboard.students_can_draw)

    return {
      success: true,
      role,
      canDraw,
      state: {
        whiteboardId: whiteboard.id,
        sessionId,
        workspaceId: whiteboard.workspace_id,
        tutorId: whiteboard.tutor_id,
        studentsCanDraw: whiteboard.students_can_draw,
        activePageNumber: whiteboard.active_page_number || 1,
        pages,
      },
    }
  } catch (err: any) {
    console.error('[WhiteboardService] Unexpected error:', err)
    return { success: false, error: err?.message || 'Server error loading whiteboard.' }
  }
}

/**
 * Save whiteboard page elements to PostgreSQL (debounced persistence).
 */
export async function saveWhiteboardPageStateAction(
  sessionId: string,
  pageNumber: number,
  elements: WhiteboardElement[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || !authResult.session) {
      return { success: false, error: 'Unauthorized.' }
    }

    const { session, role } = authResult
    if (session.class_mode === 'offline') {
      return { success: false, error: 'Forbidden on offline class.' }
    }

    const supabase = await createClient()

    const { data: whiteboard } = await supabase
      .from('whiteboards')
      .select('id, students_can_draw')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (!whiteboard) {
      return { success: false, error: 'Whiteboard not found.' }
    }

    if (role !== 'host' && !whiteboard.students_can_draw) {
      return { success: false, error: 'Drawing permission denied.' }
    }

    // Upsert into whiteboard_pages
    const { error: upsertError } = await supabase
      .from('whiteboard_pages')
      .upsert(
        {
          whiteboard_id: whiteboard.id,
          page_number: pageNumber,
          elements: elements as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'whiteboard_id,page_number' }
      )

    if (upsertError) {
      console.error('[WhiteboardService] Save error:', upsertError)
      return { success: false, error: 'Failed to persist whiteboard state.' }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save page.' }
  }
}

/**
 * Create a new page for this whiteboard session.
 */
export async function createWhiteboardPageAction(
  sessionId: string,
  title?: string
): Promise<{ success: boolean; newPage?: WhiteboardPageData; error?: string }> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || authResult.role !== 'host') {
      return { success: false, error: 'Only the host tutor can create new pages.' }
    }

    const supabase = await createClient()

    const { data: whiteboard } = await supabase
      .from('whiteboards')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (!whiteboard) {
      return { success: false, error: 'Whiteboard not found.' }
    }

    // Find highest page_number
    const { data: highestPage } = await supabase
      .from('whiteboard_pages')
      .select('page_number')
      .eq('whiteboard_id', whiteboard.id)
      .order('page_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextPageNumber = (highestPage?.page_number || 0) + 1
    const pageTitle = title || `Page ${nextPageNumber}`

    const { data: newPage, error: insertError } = await supabase
      .from('whiteboard_pages')
      .insert({
        whiteboard_id: whiteboard.id,
        page_number: nextPageNumber,
        title: pageTitle,
        elements: [],
      })
      .select()
      .single()

    if (insertError || !newPage) {
      return { success: false, error: 'Failed to create new page.' }
    }

    return {
      success: true,
      newPage: {
        id: newPage.id,
        pageNumber: newPage.page_number,
        title: newPage.title,
        elements: [],
      },
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creating page.' }
  }
}

/**
 * Delete a whiteboard page (cannot delete if it's the only page).
 */
export async function deleteWhiteboardPageAction(
  sessionId: string,
  pageNumber: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const authResult = await verifySessionAccess(sessionId)
    if (!authResult.authorized || authResult.role !== 'host') {
      return { success: false, error: 'Only the host tutor can delete pages.' }
    }

    const supabase = await createClient()

    const { data: whiteboard } = await supabase
      .from('whiteboards')
      .select('id')
      .eq('session_id', sessionId)
      .single()

    if (!whiteboard) return { success: false, error: 'Whiteboard not found.' }

    const { count } = await supabase
      .from('whiteboard_pages')
      .select('*', { count: 'exact', head: true })
      .eq('whiteboard_id', whiteboard.id)

    if ((count || 0) <= 1) {
      return { success: false, error: 'Cannot delete the only remaining page.' }
    }

    const { error: delError } = await supabase
      .from('whiteboard_pages')
      .delete()
      .eq('whiteboard_id', whiteboard.id)
      .eq('page_number', pageNumber)

    if (delError) return { success: false, error: 'Failed to delete page.' }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error deleting page.' }
  }
}
