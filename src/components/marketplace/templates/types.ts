import type { PublicTutorDetail, PublicTeachingOffering } from '@/lib/marketplace-utils'

export interface ProfileTemplateProps {
  tutorDetail: PublicTutorDetail
  currentUser: {
    id: string
    email: string
    role: 'tutor' | 'student' | 'parent' | null
  } | null
  isOwner: boolean
  requestMap: Map<string, string>
  portalHref: string
  onRequestJoin: (offering: PublicTeachingOffering) => void
}
