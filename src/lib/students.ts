import { createClient } from '@/lib/supabase/server'
import type { Student } from '@/types'

export async function getStudents(): Promise<{ data: Student[]; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // If table is not created yet in Supabase (PGRST205) or permission error, return empty array cleanly
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    return { data: (data as Student[]) || [], error: null }
  } catch {
    return { data: [], error: null }
  }
}

export async function getStudentById(id: string): Promise<{ data: Student | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: null, error: null }
      }
      return { data: null, error: error.message }
    }

    return { data: (data as Student) || null, error: null }
  } catch {
    return { data: null, error: 'Failed to load student details' }
  }
}
