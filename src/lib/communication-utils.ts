/**
 * Pure utility functions for communication & WhatsApp reminders.
 * Client-safe (no server or database imports).
 */

/**
 * Normalizes an Indian / international phone number for WhatsApp deep-linking
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return '91' + digits // Default to India (+91) if 10 digits
  }
  return digits
}

/**
 * Builds the pre-filled, URL-encoded WhatsApp click-to-chat message
 */
export function constructWhatsAppReminderUrl(params: {
  parentPhone: string
  parentName: string
  studentName: string
  feeTitle: string
  amount: number
  paid: number
  balance: number
}): string {
  const cleanPhone = normalizePhoneForWhatsApp(params.parentPhone)

  let message = `Hello ${params.parentName || 'Parent'},\n\nThis is a friendly reminder regarding ${params.studentName}'s tuition fee for ${params.feeTitle}.\n\n`
  message += `Amount due: ₹${params.amount.toLocaleString('en-IN')}\n`
  if (params.paid > 0) {
    message += `Amount paid: ₹${params.paid.toLocaleString('en-IN')}\n`
  }
  message += `Amount pending: ₹${params.balance.toLocaleString('en-IN')}\n\nThank you.\n— TutorPulse`

  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}
