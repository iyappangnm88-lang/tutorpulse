'use client'

import React from 'react'
import { Card, CardBody } from '@/components/ui/card'
import { CreditCard, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/fee-utils'
import type { FeeSummary } from '@/types'

interface FeeSummaryCardsProps {
  summary: FeeSummary
}

export function FeeSummaryCards({ summary }: FeeSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Total Outstanding */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Outstanding
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">
            {formatCurrency(summary.total_outstanding)}
          </p>
          <p className="mt-1 text-xs text-gray-400">All pending dues</p>
        </CardBody>
      </Card>

      {/* Due This Month */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Due This Month
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-indigo-600">
            {formatCurrency(summary.due_this_month)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Current calendar month</p>
        </CardBody>
      </Card>

      {/* Overdue */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Overdue
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-red-600">
            {formatCurrency(summary.overdue)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Past due date</p>
        </CardBody>
      </Card>

      {/* Total Collected */}
      <Card>
        <CardBody className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Collected
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-green-700">
            {formatCurrency(summary.total_collected)}
          </p>
          <p className="mt-1 text-xs text-gray-400">Total receipts recorded</p>
        </CardBody>
      </Card>
    </div>
  )
}
