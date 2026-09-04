import React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { FeeStatusBadge } from '@/components/fees/fee-status-badge'
import { formatCurrency } from '@/lib/fee-utils'
import { getParentFees } from '@/lib/parent-portal'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fees & Payments — Parent Portal',
}

export const dynamic = 'force-dynamic'

interface ParentFeesPageProps {
  searchParams: Promise<{ child?: string }>
}

export default async function ParentFeesPage({ searchParams }: ParentFeesPageProps) {
  const { child: childId } = await searchParams
  const res = await getParentFees(childId)

  if (res.error || !res.data) {
    return <div className="p-6 text-center text-red-600">{res.error}</div>
  }

  const { child, fees, stats } = res.data

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/parent?child=${child.student_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-xs text-gray-500">Showing fee charges and payment receipts for {child.full_name}.</p>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Total Billed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total_billed)}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Total Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.total_paid)}</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-xs text-gray-500 font-medium">Remaining Balance</p>
          <p className={`text-2xl font-bold mt-1 ${stats.remaining_balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(stats.remaining_balance)}
          </p>
        </Card>
      </div>

      {/* Fee Ledger */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Fee Charges & Payment Receipts</h2>
        </CardHeader>
        <CardBody className="p-0">
          {fees.length === 0 ? (
            <p className="p-8 text-center text-xs text-gray-400">No fee records available.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {fees.map((f) => {
                const dueDateStr = new Date(f.due_date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <div key={f.id} className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                        <p className="text-gray-500 mt-0.5">Due Date: {dueDateStr}</p>
                        {f.description && <p className="text-gray-600 mt-1">{f.description}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-gray-900">{formatCurrency(f.amount)}</p>
                        <div className="mt-1">
                          <FeeStatusBadge status={f.status} />
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex items-center justify-between text-[11px] bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <div>
                        <span className="text-gray-500">Paid:</span>{' '}
                        <span className="font-bold text-green-700">{formatCurrency(f.total_paid)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Balance:</span>{' '}
                        <span className={`font-bold ${f.balance > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                          {formatCurrency(f.balance)}
                        </span>
                      </div>
                    </div>

                    {/* Receipts */}
                    {f.payments && f.payments.length > 0 && (
                      <div className="pl-3 border-l-2 border-green-200 space-y-1.5 pt-1">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          Payment Receipts
                        </p>
                        {f.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-[11px] text-gray-600">
                            <span>
                              {new Date(p.payment_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • {p.payment_method}
                              {p.reference_number ? ` (Ref: ${p.reference_number})` : ''}
                            </span>
                            <span className="font-semibold text-green-700">+{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
