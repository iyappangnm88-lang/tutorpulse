'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Test } from '@/types'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createTestAction(input: {
  batch_id: string
  title: string
  description?: string | null
  test_date: string
  max_marks: number
  status?: 'Draft' | 'Published'
}): Promise<ActionResult<Test>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.batch_id) {
      return { success: false, error: 'Please select a batch.' }
    }

    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: 'Test title is required.' }
    }

    if (!input.test_date) {
      return { success: false, error: 'Test date is required.' }
    }

    if (!input.max_marks || input.max_marks <= 0) {
      return { success: false, error: 'Maximum marks must be greater than zero.' }
    }

    // Verify batch belongs to tutor
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, name')
      .eq('id', input.batch_id)
      .eq('tutor_id', user.id)
      .single()

    if (batchError || !batch) {
      return { success: false, error: 'Batch not found or unauthorized.' }
    }

    // 1. Insert test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        tutor_id: user.id,
        batch_id: input.batch_id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        test_date: input.test_date,
        max_marks: input.max_marks,
        status: input.status || 'Published',
      })
      .select()
      .single()

    if (testError || !test) {
      console.error('createTestAction insert error:', testError)
      return { success: false, error: testError?.message || 'Failed to create test.' }
    }

    // 2. Fetch all active students currently in this batch
    const { data: enrolledStudents, error: enrolledError } = await supabase
      .from('batch_students')
      .select('student_id')
      .eq('batch_id', input.batch_id)
      .eq('status', 'active')

    if (!enrolledError && enrolledStudents && enrolledStudents.length > 0) {
      const studentRecords = enrolledStudents.map((item) => ({
        tutor_id: user.id,
        test_id: test.id,
        student_id: item.student_id,
        marks: null,
        status: 'Not Graded' as const,
      }))

      const { error: marksInsertError } = await supabase
        .from('test_marks')
        .insert(studentRecords)

      if (marksInsertError) {
        console.error('Failed to auto-assign students to test:', marksInsertError)
      }
    }

    revalidatePath('/dashboard/tests')
    revalidatePath(`/dashboard/batches/${input.batch_id}`)
    return { success: true, data: test as Test }
  } catch (err: unknown) {
    console.error('createTestAction exception:', err)
    return { success: false, error: 'Failed to create test.' }
  }
}

export async function updateTestAction(
  id: string,
  input: {
    batch_id: string
    title: string
    description?: string | null
    test_date: string
    max_marks: number
  }
): Promise<ActionResult<Test>> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    if (!input.max_marks || input.max_marks <= 0) {
      return { success: false, error: 'Maximum marks must be greater than zero.' }
    }

    const { data, error } = await supabase
      .from('tests')
      .update({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        test_date: input.test_date,
        max_marks: input.max_marks,
      })
      .eq('id', id)
      .eq('tutor_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('updateTestAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/tests')
    revalidatePath(`/dashboard/tests/${id}`)
    revalidatePath(`/dashboard/batches/${input.batch_id}`)
    return { success: true, data: data as Test }
  } catch (err: unknown) {
    console.error('updateTestAction exception:', err)
    return { success: false, error: 'Failed to update test.' }
  }
}

export async function deleteTestAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)
      .eq('tutor_id', user.id)

    if (error) {
      console.error('deleteTestAction error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/tests')
    return { success: true }
  } catch (err: unknown) {
    console.error('deleteTestAction exception:', err)
    return { success: false, error: 'Failed to delete test.' }
  }
}

export async function saveTestMarksAction(
  testId: string,
  marksData: Array<{
    id: string
    marks: number | null
    status: 'Not Graded' | 'Graded' | 'Absent' | 'Excused'
    remarks?: string | null
  }>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized. Please sign in.' }
    }

    // Verify test belongs to tutor
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('id, max_marks')
      .eq('id', testId)
      .eq('tutor_id', user.id)
      .single()

    if (testError || !test) {
      return { success: false, error: 'Test not found or unauthorized.' }
    }

    // Validate marks values
    for (const item of marksData) {
      if (item.marks !== null) {
        if (item.marks < 0) {
          return { success: false, error: 'Marks cannot be negative.' }
        }
        if (item.marks > test.max_marks) {
          return {
            success: false,
            error: `Marks cannot exceed maximum marks (${test.max_marks}).`,
          }
        }
      }
    }

    // Update each mark record in parallel
    const updatePromises = marksData.map((item) =>
      supabase
        .from('test_marks')
        .update({
          marks: item.status === 'Graded' ? item.marks : null,
          status: item.status,
          remarks: item.remarks || null,
        })
        .eq('id', item.id)
        .eq('tutor_id', user.id)
    )

    await Promise.all(updatePromises)

    // Check if all students are graded to optionally mark test as Completed
    const allGradedOrExcused = marksData.every(
      (m) => m.status === 'Graded' || m.status === 'Absent' || m.status === 'Excused'
    )

    if (allGradedOrExcused && marksData.length > 0) {
      await supabase
        .from('tests')
        .update({ status: 'Completed' })
        .eq('id', testId)
        .eq('tutor_id', user.id)
    }

    revalidatePath('/dashboard/tests')
    revalidatePath(`/dashboard/tests/${testId}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('saveTestMarksAction exception:', err)
    return { success: false, error: 'Failed to save student marks.' }
  }
}
