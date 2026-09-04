'use client'

import React, { useState } from 'react'
import { Globe, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'
import { toggleParentPortalAccessAction } from '@/app/parent/actions'

interface ParentPortalAccessCardProps {
  parentId: string
  portalEnabled: boolean
  hasLinkedAccount: boolean
  parentEmail: string | null
}

export function ParentPortalAccessCard({
  parentId,
  portalEnabled: initialEnabled,
  hasLinkedAccount,
  parentEmail,
}: ParentPortalAccessCardProps) {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const nextState = !enabled
      const res = await toggleParentPortalAccessAction(parentId, nextState)
      if (!res.success) {
        toast('error', 'Error', res.error || 'Could not update portal access.')
        return
      }

      setEnabled(nextState)
      toast('success', 'Updated', `Parent portal access ${nextState ? 'enabled' : 'disabled'}.`)
    } catch {
      toast('error', 'Error', 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-600" />
          <h3 className="text-base font-semibold text-gray-900">Parent Portal Access</h3>
        </div>
        <Badge variant={enabled ? 'success' : 'default'}>
          {enabled ? 'Portal Enabled' : 'Portal Disabled'}
        </Badge>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
          {hasLinkedAccount ? (
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold text-gray-900">
              {hasLinkedAccount ? 'Parent Account Connected' : 'No Account Linked Yet'}
            </p>
            <p className="text-gray-500 mt-0.5">
              {hasLinkedAccount
                ? 'This parent can log in to view their child\'s attendance, marks, and fees.'
                : parentEmail
                ? `When the parent signs up with ${parentEmail}, their account will auto-link.`
                : 'Add an email address to this parent record so they can sign up and access the portal.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">
            {enabled ? 'Access is currently active.' : 'Access is blocked.'}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggle}
            loading={loading}
            className={enabled ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-700 border-green-200 hover:bg-green-50'}
          >
            {enabled ? 'Disable Portal' : 'Enable Portal'}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
