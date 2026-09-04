'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/contexts/toast-context'
import { recordPaymentAction } from '@/app/(dashboard)/dashboard/fees/actions'
import { formatCurrency } from '@/lib/fee-utils'
import type { FeeWithDetails, PaymentMethod } from '@/types'

interface RecordPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  fee: FeeWithDetails
  onSuccess: () => void
}

export function RecordPaymentDialog({
  isOpen,
  onClose,
  fee,
  onSuccess,
}: RecordPaymentDialogProps) {
  const { toast } = useToast()
  const todayStr = new Date().toISOString().split('T')[0]

  const [amount, setAmount] = useState(String(fee.balance > 0 ? fee.balance : ''))
  const [paymentDate, setPaymentDate] = useState(todayStr)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) {
      errs.amount = 'Amount must be greater than ₹0.'
    } else if (val > fee.balance) {
      errs.amount = `Amount cannot exceed remaining balance of ${formatCurrency(fee.balance)}.`
    }
    if (!paymentDate) {
      errs.paymentDate = 'Payment date is required.'
    }
    return errs
  }

  async function handleRecord() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await recordPaymentAction({
        fee_id: fee.id,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
      })

      if (!res.success) {
        toast('error', 'Error', res.error || 'Failed to record payment.')
        return
      }

      toast('success', 'Payment Recorded', `Received ${formatCurrency(parseFloat(amount))} via ${paymentMethod}.`)
      onSuccess()
      onClose()
    } catch {
      toast('error', 'Unexpected Error', 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description={`Record a payment for "${fee.title}" (${fee.student?.full_name || 'Student'}).`}
      confirmLabel="Save Payment"
      isLoading={loading}
      onConfirm={handleRecord}
    >
      <div className="space-y-4 pt-1 text-sm">
        {/* Remaining Balance Reminder */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/80 border border-indigo-100 text-xs">
          <span className="text-gray-600 font-medium">Remaining Balance:</span>
          <span className="font-bold text-indigo-700 text-sm">{formatCurrency(fee.balance)}</span>
        </div>

        <div>
          <Label htmlFor="pay-amount" required>
            Payment Amount (₹)
          </Label>
          <Input
            id="pay-amount"
            type="number"
            step="0.01"
            min="1"
            max={fee.balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            placeholder="e.g. 1000"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pay-method" required>
              Payment Method
            </Label>
            <Select
              id="pay-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="pay-date" required>
              Payment Date
            </Label>
            <Input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              error={errors.paymentDate}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="pay-ref">Transaction / Reference ID (Optional)</Label>
          <Input
            id="pay-ref"
            placeholder="e.g. UPI Ref, Cheque No, Bank Txn ID"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="pay-notes">Notes (Optional)</Label>
          <Textarea
            id="pay-notes"
            placeholder="Additional details regarding this receipt..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Dialog>
  )
}
