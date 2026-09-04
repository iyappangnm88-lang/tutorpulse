'use server'

import { getConsolidatedStudentReport } from '@/lib/reports'
import type { ConsolidatedStudentReport } from '@/types'

export async function fetchStudentReportAction(studentId: string): Promise<ConsolidatedStudentReport | null> {
  return await getConsolidatedStudentReport(studentId)
}
