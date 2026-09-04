'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FeeStatusBadge } from './fee-status-badge'
import { RecordPaymentDialog } from './record-payment-dialog'
import { formatCurrency } from '@/lib/fee-utils'
import { Calendar, User, Eye, PlusCircle } from 'lucide-react'
import type { FeeWithDetails } from '@/types'

interface FeeCardProps {
  fee: FeeWithDetails
}

export function FeeCard({ fee }: FeeCardProps) {
  const router = useRouter()
  const [isPayOpen, setIsPayOpen] = useState(false)

  const formattedDueDate = new Date(fee.due_date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <Card className="hover:border-indigo-200 transition-colors flex flex-col justify-between">
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/dashboard/fees/${fee.id}`}
                className="font-bold text-gray-900 hover:text-indigo-600 line-clamp-1 text-base"
              >
                {fee.title}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <Link
                  href={`/dashboard/students/${fee.student_id}`}
                  className="hover:underline hover:text-indigo-600 font-medium"
                >
                  {fee.student?.full_name}
                </Link>
                {fee.student?.class_name && (
                  <span>• {fee.student.class_name}</span>
                )}
              </div>
            </div>
            <FeeStatusBadge status={fee.status} />
          </div>

          {/* Financial Overview Grid */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-gray-50 text-center text-xs">
            <div>
              <p className="text-gray-400 text-[10px]">Total</p>
              <p className="font-semibold text-gray-900">{formatCurrency(fee.amount)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px]">Paid</p>
              <p className="font-semibold text-green-700">{formatCurrency(fee.total_paid)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px]">Balance</p>
              <p className={`font-bold ${fee.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatCurrency(fee.balance)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>Due: {formattedDueDate}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            {fee.balance > 0 && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsPayOpen(true)}
                className="gap-1.5 text-xs flex-1 sm:flex-initial"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Record Pay</span>
              </Button>
            )}
            <Link
              href={`/dashboard/fees/${fee.id}`}
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 min-h-[36px]"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Details</span>
            </Link>
          </div>
        </CardBody>
      </Card>

      <RecordPaymentDialog
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        fee={fee}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </>
  )
}
