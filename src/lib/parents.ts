import { createClient } from '@/lib/supabase/server'
import type { Parent, ParentWithStudents, LinkedStudent, LinkedParent, Student } from '@/types'

export async function getParents(): Promise<{ data: ParentWithStudents[]; error: string | null }> {
  try {
    const supabase = await createClient()

    // 1. Fetch parents
    const { data: parentsData, error: parentsError } = await supabase
      .from('parents')
      .select('*')
      .order('created_at', { ascending: false })

    if (parentsError) {
      if (parentsError.code === 'PGRST205' || parentsError.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: parentsError.message }
    }

    if (!parentsData || parentsData.length === 0) {
      return { data: [], error: null }
    }

    // 2. Fetch linked student memberships for names & counts
    const parentIds = parentsData.map((p) => p.id)
    const { data: linksData, error: linksError } = await supabase
      .from('parent_students')
      .select(`
        parent_id,
        relationship,
        is_primary,
        students:student_id (full_name)
      `)
      .in('parent_id', parentIds)

    if (linksError) {
      console.error('getParents links error:', linksError)
    }

    const countMap: Record<string, number> = {}
    const namesMap: Record<string, string[]> = {}

    if (linksData) {
      interface RawLinkRow {
        parent_id: string
        relationship: string
        is_primary: boolean
        students: { full_name: string } | null
      }

      const rows = (linksData as unknown as RawLinkRow[]) || []
      for (const row of rows) {
        countMap[row.parent_id] = (countMap[row.parent_id] || 0) + 1
        if (row.students?.full_name) {
          if (!namesMap[row.parent_id]) namesMap[row.parent_id] = []
          namesMap[row.parent_id].push(row.students.full_name)
        }
      }
    }

    const parentsWithStudents: ParentWithStudents[] = parentsData.map((p) => ({
      ...p,
      student_count: countMap[p.id] || 0,
      primary_student_names: namesMap[p.id] || [],
    }))

    return { data: parentsWithStudents, error: null }
  } catch (err: unknown) {
    console.error('getParents exception:', err)
    return { data: [], error: 'Failed to load parents.' }
  }
}

export async function getParentById(id: string): Promise<{ data: Parent | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: parent, error } = await supabase
      .from('parents')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !parent) {
      return { data: null, error: error?.message || 'Parent not found' }
    }

    return { data: parent as Parent, error: null }
  } catch (err: unknown) {
    console.error('getParentById exception:', err)
    return { data: null, error: 'Failed to load parent details.' }
  }
}

export async function getParentLinkedStudents(parentId: string): Promise<{ data: LinkedStudent[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('parent_students')
      .select(`
        id,
        relationship,
        is_primary,
        created_at,
        students:student_id (*)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('getParentLinkedStudents error:', error)
      return { data: [], error: error.message }
    }

    interface RawStudentLinkRow {
      id: string
      relationship: string
      is_primary: boolean
      created_at: string
      students: Student
    }

    const rows = (data as unknown as RawStudentLinkRow[]) || []
    const linked: LinkedStudent[] = rows.map((item) => ({
      link_id: item.id,
      relationship: item.relationship,
      is_primary: item.is_primary,
      created_at: item.created_at,
      student: item.students,
    }))

    return { data: linked, error: null }
  } catch (err: unknown) {
    console.error('getParentLinkedStudents exception:', err)
    return { data: [], error: 'Failed to load linked students.' }
  }
}

export async function getAvailableStudentsForParent(parentId: string): Promise<{ data: Student[]; error: string | null }> {
  try {
    const supabase = await createClient()

    // 1. Get student IDs already linked to this parent
    const { data: linked } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', parentId)

    const linkedIds = new Set((linked || []).map((l) => l.student_id))

    // 2. Fetch all non-archived students
    const { data: allStudents, error } = await supabase
      .from('students')
      .select('*')
      .neq('status', 'archived')
      .order('full_name', { ascending: true })

    if (error) {
      return { data: [], error: error.message }
    }

    const available = (allStudents as Student[]).filter((s) => !linkedIds.has(s.id))
    return { data: available, error: null }
  } catch (err: unknown) {
    console.error('getAvailableStudentsForParent exception:', err)
    return { data: [], error: 'Failed to load available students.' }
  }
}

export async function getStudentLinkedParents(studentId: string): Promise<{ data: LinkedParent[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('parent_students')
      .select(`
        id,
        relationship,
        is_primary,
        created_at,
        parents:parent_id (*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('getStudentLinkedParents error:', error)
      return { data: [], error: error.message }
    }

    interface RawParentLinkRow {
      id: string
      relationship: string
      is_primary: boolean
      created_at: string
      parents: Parent
    }

    const rows = (data as unknown as RawParentLinkRow[]) || []
    const linked: LinkedParent[] = rows.map((item) => ({
      link_id: item.id,
      relationship: item.relationship,
      is_primary: item.is_primary,
      created_at: item.created_at,
      parent: item.parents,
    }))

    return { data: linked, error: null }
  } catch (err: unknown) {
    console.error('getStudentLinkedParents exception:', err)
    return { data: [], error: 'Failed to load student parents.' }
  }
}
