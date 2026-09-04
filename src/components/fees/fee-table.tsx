'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Edit2, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeeStatusBadge } from './fee-status-badge'
import { RecordPaymentDialog } from './record-payment-dialog'
import { WhatsAppReminderModal } from '@/components/communication/whatsapp-reminder-modal'
import { MessageSquare } from 'lucide-react'
import { formatCurrency } from '@/lib/fee-utils'
import type { FeeWithDetails } from '@/types'

interface FeeTableProps {
  fees: FeeWithDetails[]
}

export function FeeTable({ fees }: FeeTableProps) {
  const router = useRouter()
  const [payingFee, setPayingFee] = useState<FeeWithDetails | null>(null)
  const [reminderFee, setReminderFee] = useState<FeeWithDetails | null>(null)

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 font-medium text-gray-600">
            <tr>
              <th scope="col" className="px-5 py-3.5">Student</th>
              <th scope="col" className="px-4 py-3.5">Fee Title</th>
              <th scope="col" className="px-4 py-3.5 text-right">Amount</th>
              <th scope="col" className="px-4 py-3.5 text-right">Paid</th>
              <th scope="col" className="px-4 py-3.5 text-right">Balance</th>
              <th scope="col" className="px-4 py-3.5">Due Date</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {fees.map((fee) => {
              const formattedDate = new Date(fee.due_date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })

              return (
                <tr key={fee.id} className="hover:bg-gray-50/75 transition-colors">
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/students/${fee.student_id}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                    >
                      {fee.student?.full_name}
                    </Link>
                    {fee.student?.class_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{fee.student.class_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/dashboard/fees/${fee.id}`}
                      className="font-medium text-indigo-600 hover:underline line-clamp-1"
                    >
                      {fee.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(fee.amount)}
                  </td>
                  <td className="px-4 py-4 text-right text-green-700 font-medium">
                    {formatCurrency(fee.total_paid)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`font-bold ${fee.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(fee.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <FeeStatusBadge status={fee.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {fee.balance > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPayingFee(fee)}
                          className="text-xs gap-1 py-1 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          title="Record Payment"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>Pay</span>
                        </Button>
                      )}
                      {fee.balance > 0 && (
                        <button
                          onClick={() => setReminderFee(fee)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Send WhatsApp Reminder"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/fees/${fee.id}`}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="View Ledger Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/dashboard/fees/${fee.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Edit Fee"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {reminderFee && (
        <WhatsAppReminderModal
          isOpen={!!reminderFee}
          onClose={() => setReminderFee(null)}
          item={{
            fee_id: reminderFee.id,
            title: reminderFee.title,
            due_date: reminderFee.due_date,
            amount: reminderFee.amount,
            total_paid: reminderFee.total_paid,
            balance: reminderFee.balance,
            status: reminderFee.status,
            student_id: reminderFee.student_id,
            student_name: reminderFee.student?.full_name || 'Student',
            class_name: reminderFee.student?.class_name || null,
            parent_name: null,
            parent_phone: null,
          }}
        />
      )}

      {payingFee && (
        <RecordPaymentDialog
          isOpen={!!payingFee}
          onClose={() => setPayingFee(null)}
          fee={payingFee}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </>
  )
}
