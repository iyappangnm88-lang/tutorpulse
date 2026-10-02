export interface StudyGroup {
  id: string
  name: string
  description: string
  subject: string
  class_or_exam: string
  visibility: 'public' | 'private'
  max_members: number
  group_goal: string
  group_image_url?: string | null
  created_by: string
  created_at: string
  updated_at: string
  member_count: number
  weekly_focus_seconds: number
  live_focus_count: number
  my_role?: 'owner' | 'admin' | 'member' | null
  my_request_status?: 'pending' | 'approved' | 'rejected' | null
}

export interface StudyGroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
  weekly_focus_seconds: number
  rank?: number
  tier?: 'gold' | 'silver' | 'bronze'
}

export interface StudyGroupMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
  is_me?: boolean
}

export interface StudyGroupLiveUser {
  id: string
  group_id: string
  user_id: string
  session_id?: string | null
  subject: string
  started_at: string
  last_heartbeat: string
  is_paused: boolean
  duration_seconds: number
  user: {
    id: string
    full_name: string
    avatar_url?: string | null
  }
}

export interface StudyGroupJoinRequest {
  id: string
  group_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string | null
    grade_level?: string | null
  }
}

export interface GroupLeaderboardTier {
  tier: 'gold' | 'silver' | 'bronze'
  label: string
  badge: string
  color: string
  bgLight: string
  bgDark: string
  borderLight: string
  borderDark: string
  members: StudyGroupMember[]
}

/**
 * Calculates start of the current week (Monday 00:00:00 UTC).
 */
export function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1)
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0))
}

/**
 * Calculates start of current day (00:00:00 UTC).
 */
export function getStartOfDay(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

/**
 * Formats seconds into human-readable duration e.g. '12h 42m', '45m', '0m'.
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Assigns Gold, Silver, and Bronze tiers dynamically.
 * Gold: Top 20%
 * Silver: Next 30%
 * Bronze: Remaining 50%
 */
export function calculateLeaderboardTiers(members: StudyGroupMember[]): {
  rankedMembers: StudyGroupMember[]
  tiers: GroupLeaderboardTier[]
} {
  const sorted = [...members].sort(
    (a, b) => b.weekly_focus_seconds - a.weekly_focus_seconds || a.joined_at.localeCompare(b.joined_at)
  )

  const N = sorted.length
  let goldCount = Math.max(1, Math.round(N * 0.2))
  let silverCount = Math.max(1, Math.round(N * 0.3))

  if (N === 1) {
    goldCount = 1
    silverCount = 0
  } else if (N === 2) {
    goldCount = 1
    silverCount = 1
  }

  const bronzeCount = Math.max(0, N - goldCount - silverCount)

  const rankedMembers: StudyGroupMember[] = sorted.map((m, idx) => {
    let tier: 'gold' | 'silver' | 'bronze' = 'bronze'
    if (idx < goldCount) {
      tier = 'gold'
    } else if (idx < goldCount + silverCount) {
      tier = 'silver'
    }
    return {
      ...m,
      rank: idx + 1,
      tier,
    }
  })

  const goldMembers = rankedMembers.filter((m) => m.tier === 'gold')
  const silverMembers = rankedMembers.filter((m) => m.tier === 'silver')
  const bronzeMembers = rankedMembers.filter((m) => m.tier === 'bronze')

  const tiers: GroupLeaderboardTier[] = [
    {
      tier: 'gold' as const,
      label: 'Gold Tier (Top 20%)',
      badge: '🥇',
      color: 'text-amber-500 dark:text-amber-400',
      bgLight: 'bg-amber-500/10',
      bgDark: 'dark:bg-amber-500/10',
      borderLight: 'border-amber-200',
      borderDark: 'dark:border-amber-500/30',
      members: goldMembers,
    },
    {
      tier: 'silver' as const,
      label: 'Silver Tier (Next 30%)',
      badge: '🥈',
      color: 'text-slate-400 dark:text-slate-300',
      bgLight: 'bg-slate-500/10',
      bgDark: 'dark:bg-slate-500/10',
      borderLight: 'border-slate-200',
      borderDark: 'dark:border-slate-500/30',
      members: silverMembers,
    },
    {
      tier: 'bronze' as const,
      label: 'Bronze Tier (Remaining 50%)',
      badge: '🥉',
      color: 'text-amber-700 dark:text-amber-600',
      bgLight: 'bg-amber-700/10',
      bgDark: 'dark:bg-amber-700/10',
      borderLight: 'border-amber-700/20',
      borderDark: 'dark:border-amber-700/30',
      members: bronzeMembers,
    },
  ].filter((t) => t.members.length > 0)

  return { rankedMembers, tiers }
}
