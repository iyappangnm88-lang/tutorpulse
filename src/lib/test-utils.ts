import type { TestDisplayStatus } from '@/types'

/**
 * Calculates percentage from marks and max marks rounded to 1 decimal place
 */
export function calculatePercentage(marks: number | null | undefined, maxMarks: number): number | null {
  if (marks === null || marks === undefined || maxMarks <= 0) {
    return null
  }
  return Math.round(((marks / maxMarks) * 100 + Number.EPSILON) * 10) / 10
}

/**
 * Calculates letter grade based on standard grading scale:
 * 90–100 -> A+
 * 80–89.9 -> A
 * 70–79.9 -> B
 * 60–69.9 -> C
 * 50–59.9 -> D
 * Below 50 -> F
 */
export function calculateGrade(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) {
    return '—'
  }
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

/**
 * Calculates test statistics from list of marks
 */
export function calculateTestStats(
  marksList: Array<{ marks: number | null; status: string }>,
  maxMarks: number
) {
  let gradedCount = 0
  let ungradedCount = 0
  let absentCount = 0
  let excusedCount = 0
  let totalMarksSum = 0
  let highestMarks: number | null = null
  let lowestMarks: number | null = null

  for (const item of marksList) {
    if (item.status === 'Graded' && item.marks !== null) {
      gradedCount++
      totalMarksSum += item.marks
      if (highestMarks === null || item.marks > highestMarks) {
        highestMarks = item.marks
      }
      if (lowestMarks === null || item.marks < lowestMarks) {
        lowestMarks = item.marks
      }
    } else if (item.status === 'Absent') {
      absentCount++
    } else if (item.status === 'Excused') {
      excusedCount++
    } else {
      ungradedCount++
    }
  }

  const averageMarks =
    gradedCount > 0 ? Math.round(((totalMarksSum / gradedCount) + Number.EPSILON) * 10) / 10 : null

  const averagePercentage =
    averageMarks !== null && maxMarks > 0
      ? calculatePercentage(averageMarks, maxMarks)
      : null

  return {
    total_students: marksList.length,
    graded_count: gradedCount,
    ungraded_count: ungradedCount,
    absent_count: absentCount,
    excused_count: excusedCount,
    average_marks: averageMarks,
    average_percentage: averagePercentage,
    highest_marks: highestMarks,
    lowest_marks: lowestMarks,
  }
}

/**
 * Derives user-facing test status
 */
export function deriveTestDisplayStatus(
  status: string,
  testDateStr: string,
  gradedCount: number,
  totalStudents: number
): TestDisplayStatus {
  if (status === 'Draft') {
    return 'Draft'
  }

  if (totalStudents > 0 && gradedCount >= totalStudents) {
    return 'Completed'
  }

  const todayStr = new Date().toISOString().split('T')[0]
  if (testDateStr > todayStr) {
    return 'Upcoming'
  }

  return 'Awaiting Marks'
}
