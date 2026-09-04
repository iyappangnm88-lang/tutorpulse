import { createClient } from '@/lib/supabase/server'
import type { Batch, BatchWithCount, EnrolledStudent, Student } from '@/types'

export async function getBatches(): Promise<{ data: BatchWithCount[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Fetch batches
    const { data: batchesData, error: batchesError } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (batchesError) {
      if (batchesError.code === 'PGRST205' || batchesError.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: batchesError.message }
    }

    if (!batchesData || batchesData.length === 0) {
      return { data: [], error: null }
    }

    // Fetch batch student memberships for count
    const batchIds = batchesData.map((b) => b.id)
    const { data: membersData, error: membersError } = await supabase
      .from('batch_students')
      .select('batch_id, status')
      .in('batch_id', batchIds)
      .eq('status', 'active')

    const countMap: Record<string, number> = {}
    if (membersData && !membersError) {
      for (const m of membersData) {
        countMap[m.batch_id] = (countMap[m.batch_id] || 0) + 1
      }
    }

    const batchesWithCount: BatchWithCount[] = batchesData.map((b) => ({
      ...b,
      student_count: countMap[b.id] || 0,
    }))

    return { data: batchesWithCount, error: null }
  } catch {
    return { data: [], error: null }
  }
}

export async function getBatchById(id: string): Promise<{ data: BatchWithCount | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: batch, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !batch) {
      return { data: null, error: error?.message || 'Batch not found' }
    }

    const { count } = await supabase
      .from('batch_students')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', id)
      .eq('status', 'active')

    return {
      data: {
        ...(batch as Batch),
        student_count: count || 0,
      },
      error: null,
    }
  } catch (err: unknown) {
    console.error('getBatchById exception:', err)
    return { data: null, error: 'Failed to load batch details.' }
  }
}

export async function getBatchEnrolledStudents(batchId: string): Promise<{ data: EnrolledStudent[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('batch_students')
      .select(`
        id,
        joined_at,
        status,
        students:student_id (*)
      `)
      .eq('batch_id', batchId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    interface RawEnrolledRow {
      id: string
      joined_at: string
      status: string
      students: Student
    }

    const rows = (data as unknown as RawEnrolledRow[]) || []
    const enrolled: EnrolledStudent[] = rows.map((item) => ({
      membership_id: item.id,
      joined_at: item.joined_at,
      student: item.students,
    }))

    return { data: enrolled, error: null }
  } catch {
    return { data: [], error: 'Failed to load batch students.' }
  }
}

export async function getAvailableStudentsForBatch(batchId: string): Promise<{ data: Student[]; error: string | null }> {
  try {
    const supabase = await createClient()

    // 1. Get IDs of students already actively in this batch
    const { data: enrolled } = await supabase
      .from('batch_students')
      .select('student_id')
      .eq('batch_id', batchId)
      .eq('status', 'active')

    const enrolledIds = new Set((enrolled || []).map((e) => e.student_id))

    // 2. Fetch all active students
    const { data: allStudents, error } = await supabase
      .from('students')
      .select('*')
      .neq('status', 'archived')
      .order('full_name', { ascending: true })

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    // 3. Filter out those already in batch
    const available = (allStudents as Student[]).filter((s) => !enrolledIds.has(s.id))
    return { data: available, error: null }
  } catch {
    return { data: [], error: 'Failed to load available students.' }
  }
}
