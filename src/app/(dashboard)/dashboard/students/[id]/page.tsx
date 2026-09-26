import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronLeft,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  ClipboardCheck,
  FileText,
  BookOpen,
  CreditCard,
  User,
  Layers,
  Video,
  School,
  Clock,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StudentStatusBadge } from '@/components/students/student-status-badge'
import { StudentParentsSection } from '@/components/parents/student-parents-section'
import { StudentFeesSection } from '@/components/fees/student-fees-section'
import { StudentHomeworkSection } from '@/components/homework/student-homework-section'
import { StudentTestsSection } from '@/components/tests/student-tests-section'
import { getStudentById } from '@/lib/students'
import { getStudentLinkedParents } from '@/lib/parents'
import { getFees, getStudentBalance } from '@/lib/fees'
import { formatCurrency } from '@/lib/fee-utils'
import { getStudentHomework, getStudentHomeworkMetrics } from '@/lib/homework'
import { getStudentTests, getStudentPerformance } from '@/lib/tests'
import { getStudentEnrolledBatches } from '@/lib/batches'
import type { Metadata } from 'next'

interface StudentDetailPageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: StudentDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { data: student } = await getStudentById(id)
  return {
    title: student ? `${student.full_name} — Nuzilo` : 'Student Details — Nuzilo',
  }
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params
  const [
    studentRes,
    parentsRes,
    feesRes,
    balanceInfo,
    hwRes,
    hwMetrics,
    testRes,
    testPerformance,
    batchesRes,
  ] = await Promise.all([
    getStudentById(id),
    getStudentLinkedParents(id),
    getFees({ studentId: id }),
    getStudentBalance(id),
    getStudentHomework(id),
    getStudentHomeworkMetrics(id),
    getStudentTests(id),
    getStudentPerformance(id),
    getStudentEnrolledBatches(id),
  ])

  const student = studentRes.data

  if (studentRes.error || !student) {
    notFound()
  }

  const enrolledBatches = batchesRes.data || []

  const formattedDob = student.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const joinedDate = new Date(student.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div>
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Students</span>
        </Link>
        <PageHeader title={student.full_name}>
          <div className="flex items-center gap-3">
            <StudentStatusBadge status={student.status} />
            <Link href={`/dashboard/students/${student.id}/edit`}>
              <Button size="md" variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            </Link>
          </div>
        </PageHeader>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Student Details & Batches */}
        <div className="space-y-6 md:col-span-1">
          {/* Student Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg">
                {student.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-tight">{student.full_name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enrolled on {joinedDate}</p>
              </div>
            </CardHeader>
            <CardBody className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <GraduationCap className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Class / Grade</p>
                  <p className="font-medium text-gray-800">{student.class_name || 'Not specified'}</p>
                </div>
              </div>

              {student.school_name && (
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">School / College</p>
                    <p className="font-medium text-gray-800">{student.school_name}</p>
                  </div>
                </div>
              )}

              {student.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <a href={`tel:${student.phone}`} className="font-medium text-indigo-600 hover:underline">
                      {student.phone}
                    </a>
                  </div>
                </div>
              )}

              {student.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <a href={`mailto:${student.email}`} className="font-medium text-indigo-600 hover:underline break-all">
                      {student.email}
                    </a>
                  </div>
                </div>
              )}

              {formattedDob && (
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-800">{formattedDob}</p>
                  </div>
                </div>
              )}

              {student.gender && (
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="font-medium text-gray-800 capitalize">{student.gender}</p>
                  </div>
                </div>
              )}

              {student.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="font-medium text-gray-800 whitespace-pre-wrap">{student.address}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Enrolled Batches Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Enrolled Batches</h3>
              </div>
              <Badge variant="default">{enrolledBatches.length}</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {enrolledBatches.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  Not enrolled in any batches yet.
                  <div className="mt-2">
                    <Link
                      href="/dashboard/batches"
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Browse Batches →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {enrolledBatches.map((b) => (
                    <Link
                      key={b.id}
                      href={`/dashboard/batches/${b.id}`}
                      className="p-3.5 flex items-center justify-between hover:bg-gray-50/70 transition-colors group block"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {b.class_mode === 'online' ? (
                            <Video className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <School className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          )}
                          <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 truncate">
                            {b.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                          {b.subject || 'General'}
                          {b.schedule ? ` • ${b.schedule}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-indigo-600">→</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Tutor Private Notes */}
          {student.notes && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Private Notes</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {student.notes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column: Modules Activity */}
        <div className="space-y-6 md:col-span-2">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardBody className="p-4 text-center">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Attendance</p>
                <p className="text-lg font-bold text-gray-900">—</p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 text-center">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                  <CreditCard className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Pending Fees</p>
                <p className={`text-lg font-bold ${balanceInfo.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(balanceInfo.balance)}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 text-center">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Homework</p>
                <p className={`text-lg font-bold ${hwMetrics.pending > 0 ? 'text-purple-700' : 'text-gray-900'}`}>
                  {hwMetrics.total_assigned === 0 ? '—' : `${hwMetrics.completed}/${hwMetrics.total_assigned}`}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4 text-center">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="text-xs text-gray-500">Test Avg</p>
                <p className="text-lg font-bold text-gray-900">
                  {testPerformance.average_percentage !== null ? `${testPerformance.average_percentage}%` : '—'}
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Linked Parents Section */}
          <StudentParentsSection linkedParents={parentsRes.data} />

          {/* Fees & Payments Section */}
          <StudentFeesSection
            studentId={student.id}
            fees={feesRes.data}
            balanceInfo={balanceInfo}
          />

          {/* Homework & Assignments Section */}
          <StudentHomeworkSection
            assignments={hwRes.data}
            metrics={hwMetrics}
          />

          {/* Tests & Examinations Section */}
          <StudentTestsSection
            tests={testRes.data}
            performance={testPerformance}
          />
        </div>
      </div>
    </div>
  )
}
