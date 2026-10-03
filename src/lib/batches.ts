import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/workspace'
import type { Batch, BatchWithCount, EnrolledStudent, Student } from '@/types'

export interface BatchPricingMeta {
  rate?: number | null
  unit?: string | null
  currency?: string | null
  description?: string | null
  max_students?: number | null
}

export function cleanBatchDescription(raw?: string | null): string {
  if (!raw) return ''
  return raw.replace(/<!-- NUZIGO_PRICING:.*? -->/g, '').trim()
}

export function extractBatchPricingMetadata(batch: any): BatchPricingMeta {
  if (!batch) return {}
  // If native column has rate, use it
  if (batch.pricing_rate != null && !isNaN(Number(batch.pricing_rate)) && Number(batch.pricing_rate) > 0) {
    return {
      rate: Number(batch.pricing_rate),
      unit: batch.pricing_unit || 'per_month',
      currency: batch.pricing_currency || 'INR',
      description: batch.pricing_description || null,
      max_students: batch.max_students != null && !isNaN(Number(batch.max_students)) ? Number(batch.max_students) : null,
    }
  }

  // Check description or public_description for embedded pricing tag
  const searchStr = `${batch.description || ''} ${batch.public_description || ''}`
  const match = searchStr.match(/<!-- NUZIGO_PRICING:(.*?) -->/)
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1])
      if (parsed.rate != null && !isNaN(Number(parsed.rate)) && Number(parsed.rate) > 0) {
        return {
          rate: Number(parsed.rate),
          unit: parsed.unit || 'per_month',
          currency: parsed.currency || 'INR',
          description: parsed.description || null,
          max_students: parsed.max_students != null && !isNaN(Number(parsed.max_students)) ? Number(parsed.max_students) : null,
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return {}
}

export function injectBatchPricingMetadata(
  desc?: string | null,
  pricing?: BatchPricingMeta
): string | null {
  const clean = cleanBatchDescription(desc)
  if (!pricing || (pricing.rate == null && pricing.max_students == null)) {
    return clean || null
  }
  const payload = {
    rate: pricing.rate != null ? Number(pricing.rate) : null,
    unit: pricing.unit || 'per_month',
    currency: pricing.currency || 'INR',
    description: pricing.description || null,
    max_students: pricing.max_students != null ? Number(pricing.max_students) : null,
  }
  const tag = `<!-- NUZIGO_PRICING:${JSON.stringify(payload)} -->`
  return clean ? `${clean} ${tag}` : tag
}

export async function getBatches(workspaceId?: string): Promise<{ data: BatchWithCount[]; error: string | null }> {
  try {
    const supabase = await createClient()

    let wsId = workspaceId
    if (!wsId) {
      const activeWs = await getActiveWorkspace()
      wsId = activeWs.activeWorkspace?.id
    }

    // Fetch batches scoped by workspace
    let query = supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false })

    if (wsId) {
      query = query.eq('workspace_id', wsId)
    }

    const { data: batchesData, error: batchesError } = await query

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

    // Resolve tutor default profile pricing fallback for batches without explicit pricing
    const tutorIdsNeedingPricing = Array.from(
      new Set(
        batchesData
          .filter((b) => {
            const meta = extractBatchPricingMetadata(b)
            const rate = (b as any).pricing_rate != null && Number((b as any).pricing_rate) > 0
              ? Number((b as any).pricing_rate)
              : (meta.rate ?? null)
            return rate == null || rate <= 0
          })
          .map((b) => b.tutor_id)
          .filter(Boolean)
      )
    )

    let tutorProfilePricingMap = new Map<string, { pricing_rate?: number | null; pricing_unit?: string | null; pricing_currency?: string | null; pricing_description?: string | null }>()

    if (tutorIdsNeedingPricing.length > 0) {
      const { data: tutorProfiles } = await supabase
        .from('profiles')
        .select('id, pricing_rate, pricing_unit, pricing_currency, pricing_description')
        .in('id', tutorIdsNeedingPricing)

      if (tutorProfiles) {
        tutorProfilePricingMap = new Map(
          tutorProfiles.map((p) => [
            p.id,
            {
              pricing_rate: p.pricing_rate != null && Number(p.pricing_rate) > 0 ? Number(p.pricing_rate) : null,
              pricing_unit: p.pricing_unit || 'per_month',
              pricing_currency: p.pricing_currency || 'INR',
              pricing_description: p.pricing_description || null,
            },
          ])
        )
      }
    }

    const batchesWithCount: BatchWithCount[] = batchesData.map((b) => {
      const meta = extractBatchPricingMetadata(b)
      const profPricing = tutorProfilePricingMap.get(b.tutor_id)

      const resolvedRate =
        (b as any).pricing_rate != null && Number((b as any).pricing_rate) > 0
          ? Number((b as any).pricing_rate)
          : (meta.rate != null && Number(meta.rate) > 0
              ? Number(meta.rate)
              : (profPricing?.pricing_rate ?? null))

      const resolvedUnit = (b as any).pricing_unit || meta.unit || profPricing?.pricing_unit || 'per_month'
      const resolvedCurrency = (b as any).pricing_currency || meta.currency || profPricing?.pricing_currency || 'INR'
      const resolvedDescription = (b as any).pricing_description || meta.description || profPricing?.pricing_description || null

      return {
        ...b,
        description: cleanBatchDescription(b.description),
        pricing_rate: resolvedRate,
        pricing_unit: resolvedUnit,
        pricing_currency: resolvedCurrency,
        pricing_description: resolvedDescription,
        max_students: (b as any).max_students != null && !isNaN(Number((b as any).max_students)) ? Number((b as any).max_students) : (meta.max_students ?? null),
        student_count: countMap[b.id] || 0,
      }
    })

    return { data: batchesWithCount, error: null }
  } catch {
    return { data: [], error: null }
  }
}

export async function getBatchById(id: string, workspaceId?: string): Promise<{ data: BatchWithCount | null; error: string | null }> {
  try {
    const supabase = await createClient()

    let wsId = workspaceId
    if (!wsId) {
      const activeWs = await getActiveWorkspace()
      wsId = activeWs.activeWorkspace?.id
    }

    let query = supabase
      .from('batches')
      .select('*')
      .eq('id', id)

    if (wsId) {
      query = query.eq('workspace_id', wsId)
    }

    const { data: batch, error } = await query.maybeSingle()

    if (error || !batch) {
      return { data: null, error: error?.message || 'Batch not found' }
    }

    const { count } = await supabase
      .from('batch_students')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', id)
      .eq('status', 'active')

    const meta = extractBatchPricingMetadata(batch)
    let finalPricingRate =
      (batch as any).pricing_rate != null && Number((batch as any).pricing_rate) > 0
        ? Number((batch as any).pricing_rate)
        : (meta.rate != null && Number(meta.rate) > 0 ? Number(meta.rate) : null)
    let finalPricingUnit = (batch as any).pricing_unit || meta.unit || null
    let finalPricingCurrency = (batch as any).pricing_currency || meta.currency || null
    let finalPricingDescription = (batch as any).pricing_description || meta.description || null

    // Authoritative fallback: If fee is not set directly on batch row, fetch tutor's profile pricing
    if ((finalPricingRate == null || finalPricingRate <= 0) && batch.tutor_id) {
      const { data: tutorProf } = await supabase
        .from('profiles')
        .select('pricing_rate, pricing_unit, pricing_currency, pricing_description')
        .eq('id', batch.tutor_id)
        .maybeSingle()

      if (tutorProf?.pricing_rate != null && Number(tutorProf.pricing_rate) > 0) {
        finalPricingRate = Number(tutorProf.pricing_rate)
        if (!finalPricingUnit) finalPricingUnit = tutorProf.pricing_unit
        if (!finalPricingCurrency) finalPricingCurrency = tutorProf.pricing_currency
        if (!finalPricingDescription) finalPricingDescription = tutorProf.pricing_description
      }
    }

    const cleanBatch: BatchWithCount = {
      ...(batch as Batch),
      description: cleanBatchDescription(batch.description),
      pricing_rate: finalPricingRate,
      pricing_unit: finalPricingUnit || 'per_month',
      pricing_currency: finalPricingCurrency || 'INR',
      pricing_description: finalPricingDescription || null,
      max_students: (batch as any).max_students != null && !isNaN(Number((batch as any).max_students)) ? Number((batch as any).max_students) : (meta.max_students ?? null),
      student_count: count || 0,
    }

    return {
      data: cleanBatch,
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

    // 1. Fetch the batch to know its workspace_id
    const { data: batch } = await supabase
      .from('batches')
      .select('workspace_id')
      .eq('id', batchId)
      .maybeSingle()

    // 2. Get IDs of students already actively in this batch
    const { data: enrolled } = await supabase
      .from('batch_students')
      .select('student_id')
      .eq('batch_id', batchId)
      .eq('status', 'active')

    const enrolledIds = new Set((enrolled || []).map((e) => e.student_id))

    // 3. Fetch all active students strictly from the batch's workspace
    let query = supabase
      .from('students')
      .select('*')
      .neq('status', 'archived')
      .order('full_name', { ascending: true })

    if (batch?.workspace_id) {
      query = query.eq('workspace_id', batch.workspace_id)
    }

    const { data: allStudents, error } = await query

    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { data: [], error: null }
      }
      return { data: [], error: error.message }
    }

    // 4. Filter out those already in batch
    const available = (allStudents as Student[]).filter((s) => !enrolledIds.has(s.id))
    return { data: available, error: null }
  } catch {
    return { data: [], error: 'Failed to load available students.' }
  }
}

export async function getStudentEnrolledBatches(studentId: string): Promise<{
  data: Batch[]
  error: string | null
}> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('batch_students')
      .select('batch:batches(*)')
      .eq('student_id', studentId)

    if (error) {
      return { data: [], error: error.message }
    }

    const batches = (data || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: any) => row.batch as Batch)
      .filter(Boolean)

    return { data: batches, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load student batches.'
    return { data: [], error: message }
  }
}
