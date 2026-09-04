'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  User,
  PlusCircle,
  Trash2,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { FeeStatusBadge } from './fee-status-badge'
import { RecordPaymentDialog } from './record-payment-dialog'
import { formatCurrency } from '@/lib/fee-utils'
import { useToast } from '@/contexts/toast-context'
import { deletePaymentAction, deleteFeeAction } from '@/app/(dashboard)/dashboard/fees/actions'
import type { FeeWithDetails, Payment } from '@/types'

interface FeeDetailsClientProps {
  fee: FeeWithDetails
}

export function FeeDetailsClient({ fee }: FeeDetailsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [isDeletingPay, setIsDeletingPay] = useState(false)
  const [isDeleteFeeOpen, setIsDeleteFeeOpen] = useState(false)
  const [isDeletingFee, setIsDeletingFee] = useState(false)

  const formattedDueDate = new Date(fee.due_date).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  async function handleConfirmDeletePayment() {
    if (!paymentToDelete) return
    setIsDeletingPay(true)
    try {
      const res = await deletePaymentAction(paymentToDelete.id)
      if (!res.success) {
        toast('error', 'Failed', res.error || 'Could not delete payment receipt.')
        return
      }
      toast('success', 'Deleted', 'Payment receipt removed and fee balance recalculated.')
      setPaymentToDelete(null)
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsDeletingPay(false)
    }
  }

  async function handleConfirmDeleteFee() {
    setIsDeletingFee(true)
    try {
      const res = await deleteFeeAction(fee.id)
      if (!res.success) {
        toast('error', 'Failed', res.error || 'Could not delete fee charge.')
        return
      }
      toast('success', 'Fee Deleted', 'Fee charge and associated ledger removed.')
      router.push('/dashboard/fees')
      router.refresh()
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setIsDeletingFee(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards for Fee Amount, Paid, Balance */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Billed Amount</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(fee.amount)}
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 text-center">
          <p className="text-xs text-green-700 font-medium">Total Paid</p>
          <p className="text-xl sm:text-2xl font-bold text-green-800 mt-1">
            {formatCurrency(fee.total_paid)}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-center">
          <p className="text-xs text-red-700 font-medium">Remaining Balance</p>
          <p className="text-xl sm:text-2xl font-bold text-red-800 mt-1">
            {formatCurrency(fee.balance)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Fee Info Card */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{fee.title}</h2>
                <FeeStatusBadge status={fee.status} />
              </div>
            </CardHeader>
            <CardBody className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Student</p>
                  <Link
                    href={`/dashboard/students/${fee.student_id}`}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    {fee.student?.full_name}
                  </Link>
                  {fee.student?.class_name && (
                    <p className="text-xs text-gray-400">{fee.student.class_name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-800">{formattedDueDate}</p>
                </div>
              </div>

              {fee.description && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{fee.description}</p>
                </div>
              )}

              {fee.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Internal Notes</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {fee.notes}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Dangerous Action */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteFeeOpen(true)}
              className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete This Fee</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Payment History Receipts */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Payment Receipts</h3>
                <p className="text-xs text-gray-500">Chronological history of recorded collections.</p>
              </div>
              {fee.balance > 0 && (
                <Button size="sm" onClick={() => setIsPayOpen(true)} className="gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Record Payment</span>
                </Button>
              )}
            </CardHeader>
            <CardBody className="p-0">
              {(!fee.payments || fee.payments.length === 0) ? (
                <div className="p-8 text-center">
                  <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No payments recorded yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    Record full or partial collections received via Cash, UPI, or Bank Transfer.
                  </p>
                  {fee.balance > 0 && (
                    <Button
                      size="sm"
                      onClick={() => setIsPayOpen(true)}
                      className="mt-4 gap-1.5 mx-auto"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Record First Payment</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {fee.payments.map((p, idx) => {
                    const payDate = new Date(p.payment_date).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })

                    return (
                      <div
                        key={p.id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/75 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(p.amount)}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                                {p.payment_method}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span>Paid on {payDate}</span>
                              {p.reference_number && (
                                <span>• Ref: {p.reference_number}</span>
                              )}
                            </div>
                            {p.notes && (
                              <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setPaymentToDelete(p)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                          title="Delete Receipt"
                          aria-label="Delete receipt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        fee={fee}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Delete Payment Confirmation Dialog */}
      <Dialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        title="Delete Payment Receipt?"
        description={`Are you sure you want to remove the receipt of ${paymentToDelete ? formatCurrency(paymentToDelete.amount) : ''}? The fee balance will automatically increase.`}
        confirmLabel="Delete Receipt"
        confirmVariant="danger"
        isLoading={isDeletingPay}
        onConfirm={handleConfirmDeletePayment}
      />

      {/* Delete Fee Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteFeeOpen}
        onClose={() => setIsDeleteFeeOpen(false)}
        title="Delete Fee Record?"
        description={`Are you sure you want to delete "${fee.title}"? All associated payment receipts will be permanently removed.`}
        confirmLabel="Delete Fee"
        confirmVariant="danger"
        isLoading={isDeletingFee}
        onConfirm={handleConfirmDeleteFee}
      />
    </div>
  )
}
