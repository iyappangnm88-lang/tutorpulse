'use client'

import React from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { FeeStatusBadge } from '@/components/fees/fee-status-badge'
import { formatCurrency } from '@/lib/fee-utils'
import type { StudentFeeReportRow } from '@/types'

export function FeeReportTable({
  rows,
  onSelectStudent,
}: {
  rows: StudentFeeReportRow[]
  onSelectStudent: (id: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-gray-900">Fee Collection & Dues</h2>
        <p className="text-xs text-gray-500 mt-0.5">Student-level fee billing and collection status.</p>
      </CardHeader>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-400">No fee records found for this selection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 font-semibold text-gray-600">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-4 py-3.5 text-right">Billed</th>
                  <th className="px-4 py-3.5 text-right">Paid</th>
                  <th className="px-4 py-3.5 text-right">Outstanding</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.student_id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      <button
                        onClick={() => onSelectStudent(row.student_id)}
                        className="hover:text-indigo-600 hover:underline text-left cursor-pointer"
                      >
                        {row.student_name}
                      </button>
                      {row.class_name && (
                        <p className="text-[11px] text-gray-400 font-normal">{row.class_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-gray-900">
                      {formatCurrency(row.total_billed)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-green-700 font-medium">
                      {formatCurrency(row.total_paid)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-bold ${row.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(row.balance)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <FeeStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
