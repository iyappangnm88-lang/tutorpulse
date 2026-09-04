'use client'

import React from 'react'
import Link from 'next/link'
import { CreditCard, Plus, ArrowRight } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { FeeStatusBadge } from './fee-status-badge'
import { formatCurrency } from '@/lib/fee-utils'
import type { FeeWithDetails } from '@/types'

interface StudentFeesSectionProps {
  studentId: string
  fees: FeeWithDetails[]
  balanceInfo: {
    total_fees: number
    total_paid: number
    balance: number
  }
}

export function StudentFeesSection({
  studentId,
  fees,
  balanceInfo,
}: StudentFeesSectionProps) {
  const recentFees = fees.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">Fees & Payments</h3>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/fees/new`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Fee</span>
          </Link>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Metric Overview Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-gray-50 text-center text-xs">
          <div>
            <p className="text-gray-400 text-[10px]">Total Billed</p>
            <p className="font-bold text-gray-900 mt-0.5">{formatCurrency(balanceInfo.total_fees)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px]">Total Paid</p>
            <p className="font-bold text-green-700 mt-0.5">{formatCurrency(balanceInfo.total_paid)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px]">Pending Due</p>
            <p className={`font-bold mt-0.5 ${balanceInfo.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(balanceInfo.balance)}
            </p>
          </div>
        </div>

        {recentFees.length === 0 ? (
          <p className="text-center py-4 text-xs text-gray-500">
            No fee schedules recorded for this student yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentFees.map((f) => (
              <div
                key={f.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <Link
                    href={`/dashboard/fees/${f.id}`}
                    className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                  >
                    {f.title}
                  </Link>
                  <p className="text-gray-400 mt-0.5">
                    Due {new Date(f.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(f.amount)}</p>
                    {f.balance > 0 ? (
                      <p className="text-[10px] text-red-600">Bal: {formatCurrency(f.balance)}</p>
                    ) : (
                      <p className="text-[10px] text-green-600">Cleared</p>
                    )}
                  </div>
                  <FeeStatusBadge status={f.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {fees.length > 0 && (
          <div className="pt-1 text-right">
            <Link
              href={`/dashboard/fees?student=${studentId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
            >
              <span>View all student fees</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
