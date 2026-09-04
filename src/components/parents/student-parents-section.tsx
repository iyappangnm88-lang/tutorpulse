'use client'

import React from 'react'
import Link from 'next/link'
import { HeartHandshake, Phone, Mail, ShieldCheck } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LinkedParent } from '@/types'

interface StudentParentsSectionProps {
  linkedParents: LinkedParent[]
}

export function StudentParentsSection({ linkedParents }: StudentParentsSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">Parents & Guardians</h3>
        </div>
        <Link
          href="/dashboard/parents"
          className="text-xs font-semibold text-indigo-600 hover:underline"
        >
          Manage Parents
        </Link>
      </CardHeader>
      <CardBody className="p-0">
        {linkedParents.length === 0 ? (
          <div className="p-5 text-center text-xs text-gray-500">
            No parent or guardian linked to this student yet.{' '}
            <Link href="/dashboard/parents" className="text-indigo-600 font-medium hover:underline">
              Link from Parents directory
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {linkedParents.map((item) => (
              <div
                key={item.parent.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/75 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/parents/${item.parent.id}`}
                      className="font-semibold text-gray-900 text-sm hover:text-indigo-600 hover:underline"
                    >
                      {item.parent.full_name}
                    </Link>
                    <Badge variant="default" className="text-[10px] py-0 px-1.5">
                      {item.relationship}
                    </Badge>
                    {item.is_primary && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3" />
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                    {item.parent.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <a href={`tel:${item.parent.phone}`} className="text-indigo-600 hover:underline font-medium">
                          {item.parent.phone}
                        </a>
                      </div>
                    )}
                    {item.parent.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[150px]">{item.parent.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href={`/dashboard/parents/${item.parent.id}`}
                  className="text-xs font-medium text-indigo-600 hover:underline self-start sm:self-auto"
                >
                  Guardian Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
