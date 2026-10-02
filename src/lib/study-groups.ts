import { createClient } from '@/lib/supabase/server'

import {
  type StudyGroup,
  type StudyGroupMember,
  type StudyGroupMessage,
  type StudyGroupLiveUser,
  type StudyGroupJoinRequest,
  type GroupLeaderboardTier,
  getStartOfWeek,
  getStartOfDay,
  formatDuration,
  calculateLeaderboardTiers,
} from '@/lib/types/study-groups'

export type {
  StudyGroup,
  StudyGroupMember,
  StudyGroupMessage,
  StudyGroupLiveUser,
  StudyGroupJoinRequest,
  GroupLeaderboardTier,
}

export {
  getStartOfWeek,
  getStartOfDay,
  formatDuration,
  calculateLeaderboardTiers,
}

/**
 * Fetches groups that the user is currently a member of.
 */
export async function getMyStudyGroups(userId: string): Promise<StudyGroup[]> {
  try {
    const supabase = await createClient()

    // 1. Get user memberships
    const { data: memberships, error: mError } = await supabase
      .from('study_group_members')
      .select('group_id, role')
      .eq('user_id', userId)

    if (mError || !memberships || memberships.length === 0) {
      return []
    }

    const groupIds = memberships.map((m) => m.group_id)
    const roleMap = new Map<string, 'owner' | 'admin' | 'member'>()
    memberships.forEach((m) => roleMap.set(m.group_id, m.role as 'owner' | 'admin' | 'member'))

    // 2. Fetch group details
    const { data: groups, error: gError } = await supabase
      .from('study_groups')
      .select('*')
      .in('id', groupIds)
      .order('created_at', { ascending: false })

    if (gError || !groups) return []

    const startOfWeekIso = getStartOfWeek().toISOString()

    // 3. Fetch weekly focus time, member counts, and live focus counts
    const [memberCountsRes, focusStatsRes, liveCountsRes] = await Promise.all([
      supabase
        .from('study_group_members')
        .select('group_id')
        .in('group_id', groupIds),
      supabase
        .from('focus_sessions')
        .select('group_id, actual_duration_sec')
        .in('group_id', groupIds)
        .gte('started_at', startOfWeekIso),
      supabase
        .from('study_group_live_focus')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('is_paused', false)
        .gte('last_heartbeat', new Date(Date.now() - 2 * 60 * 1000).toISOString()),
    ])

    const memberCountMap = new Map<string, number>()
    ;(memberCountsRes.data || []).forEach((row: { group_id: string }) => {
      memberCountMap.set(row.group_id, (memberCountMap.get(row.group_id) || 0) + 1)
    })

    const weeklyFocusMap = new Map<string, number>()
    ;(focusStatsRes.data || []).forEach((row: { group_id: string | null; actual_duration_sec: number | null }) => {
      if (row.group_id) {
        weeklyFocusMap.set(
          row.group_id,
          (weeklyFocusMap.get(row.group_id) || 0) + (row.actual_duration_sec || 0)
        )
      }
    })

    const liveCountMap = new Map<string, number>()
    ;(liveCountsRes.data || []).forEach((row: { group_id: string }) => {
      liveCountMap.set(row.group_id, (liveCountMap.get(row.group_id) || 0) + 1)
    })

    return groups.map((g) => ({
      ...g,
      my_role: roleMap.get(g.id) || null,
      member_count: memberCountMap.get(g.id) || 0,
      weekly_focus_seconds: weeklyFocusMap.get(g.id) || 0,
      live_focus_count: liveCountMap.get(g.id) || 0,
    }))
  } catch (err) {
    console.error('Error fetching my study groups:', err)
    return []
  }
}

/**
 * Fetches discoverable study groups with filtering and search.
 */
export async function getDiscoverStudyGroups(
  userId: string,
  filter: 'popular' | 'recommended' | 'new' = 'popular',
  searchQuery: string = ''
): Promise<StudyGroup[]> {
  try {
    const supabase = await createClient()

    let query = supabase.from('study_groups').select('*').eq('visibility', 'public')

    if (searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`
      query = query.or(`name.ilike.${term},description.ilike.${term},subject.ilike.${term},class_or_exam.ilike.${term}`)
    }

    if (filter === 'new') {
      query = query.order('created_at', { ascending: false })
    }

    const { data: groups, error: gError } = await query.limit(40)
    if (gError || !groups) return []

    const groupIds = groups.map((g) => g.id)
    if (groupIds.length === 0) return []

    const startOfWeekIso = getStartOfWeek().toISOString()

    const [membershipsRes, myMembershipsRes, myRequestsRes, focusStatsRes, liveCountsRes] = await Promise.all([
      supabase.from('study_group_members').select('group_id').in('group_id', groupIds),
      supabase.from('study_group_members').select('group_id, role').eq('user_id', userId).in('group_id', groupIds),
      supabase.from('study_group_join_requests').select('group_id, status').eq('user_id', userId).in('group_id', groupIds),
      supabase
        .from('focus_sessions')
        .select('group_id, actual_duration_sec')
        .in('group_id', groupIds)
        .gte('started_at', startOfWeekIso),
      supabase
        .from('study_group_live_focus')
        .select('group_id')
        .in('group_id', groupIds)
        .eq('is_paused', false)
        .gte('last_heartbeat', new Date(Date.now() - 2 * 60 * 1000).toISOString()),
    ])

    const memberCountMap = new Map<string, number>()
    ;(membershipsRes.data || []).forEach((row: { group_id: string }) => {
      memberCountMap.set(row.group_id, (memberCountMap.get(row.group_id) || 0) + 1)
    })

    const myRoleMap = new Map<string, 'owner' | 'admin' | 'member'>()
    ;(myMembershipsRes.data || []).forEach((row: { group_id: string; role: string }) => {
      myRoleMap.set(row.group_id, row.role as 'owner' | 'admin' | 'member')
    })

    const myRequestMap = new Map<string, 'pending' | 'approved' | 'rejected'>()
    ;(myRequestsRes.data || []).forEach((row: { group_id: string; status: string }) => {
      myRequestMap.set(row.group_id, row.status as 'pending' | 'approved' | 'rejected')
    })

    const weeklyFocusMap = new Map<string, number>()
    ;(focusStatsRes.data || []).forEach((row: { group_id: string | null; actual_duration_sec: number | null }) => {
      if (row.group_id) {
        weeklyFocusMap.set(
          row.group_id,
          (weeklyFocusMap.get(row.group_id) || 0) + (row.actual_duration_sec || 0)
        )
      }
    })

    const liveCountMap = new Map<string, number>()
    ;(liveCountsRes.data || []).forEach((row: { group_id: string }) => {
      liveCountMap.set(row.group_id, (liveCountMap.get(row.group_id) || 0) + 1)
    })

    const list: StudyGroup[] = groups.map((g) => ({
      ...g,
      my_role: myRoleMap.get(g.id) || null,
      my_request_status: myRequestMap.get(g.id) || null,
      member_count: memberCountMap.get(g.id) || 0,
      weekly_focus_seconds: weeklyFocusMap.get(g.id) || 0,
      live_focus_count: liveCountMap.get(g.id) || 0,
    }))

    if (filter === 'popular') {
      list.sort((a, b) => b.member_count - a.member_count || b.weekly_focus_seconds - a.weekly_focus_seconds)
    } else if (filter === 'recommended') {
      list.sort((a, b) => b.weekly_focus_seconds - a.weekly_focus_seconds || b.member_count - a.member_count)
    }

    return list
  } catch (err) {
    console.error('Error fetching discover study groups:', err)
    return []
  }
}

/**
 * Fetches complete details of a single study group.
 */
interface ResolvedProfile {
  id: string
  full_name: string
  avatar_url: string | null
  grade_level?: string | null
}

/**
 * Resolves full names and avatars across profiles, student_profiles, and auth metadata.
 */
async function resolveUserProfiles(
  supabase: any,
  userIds: string[],
  currentUserId?: string
): Promise<Map<string, ResolvedProfile>> {
  const profileMap = new Map<string, ResolvedProfile>()
  const cleanIds = Array.from(new Set((userIds || []).filter(Boolean)))
  if (cleanIds.length === 0) return profileMap

  // 1. Attempt secure RPC batch resolution
  try {
    const { data: rpcProfiles, error: rpcError } = await supabase.rpc('get_study_group_user_profiles', {
      p_user_ids: cleanIds,
    })

    if (!rpcError && Array.isArray(rpcProfiles)) {
      for (const p of rpcProfiles) {
        if (p?.id && p?.full_name && p.full_name !== 'Study Partner') {
          profileMap.set(p.id, {
            id: p.id,
            full_name: p.full_name,
            avatar_url: p.avatar_url || null,
            grade_level: p.grade_level || null,
          })
        }
      }
    }
  } catch {
    // RPC may not be migrated yet or unavailable in some environments
  }

  // 2. Query profiles and student_profiles for any unresolved user IDs
  const missingIds = cleanIds.filter((id) => !profileMap.has(id))
  if (missingIds.length > 0) {
    try {
      const [pRes, spRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url').in('id', missingIds),
        supabase.from('student_profiles').select('id, full_name, avatar_url, grade_level').in('id', missingIds),
      ])

      const pData: Array<{ id: string; full_name?: string | null; avatar_url?: string | null }> = pRes.data || []
      const spData: Array<{ id: string; full_name?: string | null; avatar_url?: string | null; grade_level?: string | null }> = spRes.data || []

      const pLookup = new Map(pData.map((p) => [p.id, p]))
      const spLookup = new Map(spData.map((sp) => [sp.id, sp]))

      for (const id of missingIds) {
        const p = pLookup.get(id)
        const sp = spLookup.get(id)

        const rawName = p?.full_name?.trim() || sp?.full_name?.trim()
        const avatarUrl = p?.avatar_url || sp?.avatar_url || null
        const gradeLevel = sp?.grade_level || null

        if (rawName) {
          profileMap.set(id, {
            id,
            full_name: rawName,
            avatar_url: avatarUrl,
            grade_level: gradeLevel,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching fallback profiles:', err)
    }
  }

  // 3. Fallback for any still-unresolved IDs
  for (const id of cleanIds) {
    if (!profileMap.has(id)) {
      const isCurrent = id === currentUserId
      profileMap.set(id, {
        id,
        full_name: isCurrent ? 'You' : 'Student',
        avatar_url: null,
      })
    }
  }

  return profileMap
}

/**
 * Fetches complete details of a single study group.
 */
export async function getStudyGroupDetails(
  groupId: string,
  userId: string
): Promise<{
  group: StudyGroup | null
  members: StudyGroupMember[]
  rankedMembers: StudyGroupMember[]
  tiers: GroupLeaderboardTier[]
  myMemberRecord: StudyGroupMember | null
  myRole: 'owner' | 'admin' | 'member' | null
  myRequestStatus: 'pending' | 'approved' | 'rejected' | null
  liveUsers: StudyGroupLiveUser[]
  messages: StudyGroupMessage[]
  messageCountToday: number
  messageDailyLimit: number
  joinRequests: StudyGroupJoinRequest[]
}> {
  const emptyResult = {
    group: null,
    members: [],
    rankedMembers: [],
    tiers: [],
    myMemberRecord: null,
    myRole: null,
    myRequestStatus: null,
    liveUsers: [],
    messages: [],
    messageCountToday: 0,
    messageDailyLimit: 20,
    joinRequests: [],
  }

  try {
    const supabase = await createClient()

    // 1. Fetch group
    const { data: groupData, error: groupError } = await supabase
      .from('study_groups')
      .select('*')
      .eq('id', groupId)
      .maybeSingle()

    if (groupError || !groupData) {
      return emptyResult
    }

    const startOfWeekIso = getStartOfWeek().toISOString()
    const startOfDayIso = getStartOfDay().toISOString()

    // 2. Fetch all members
    const { data: membersRaw } = await supabase
      .from('study_group_members')
      .select('id, group_id, user_id, role, joined_at')
      .eq('group_id', groupId)

    const rawMembers = membersRaw || []

    // 3. Determine my role & request status
    const myRawMember = rawMembers.find((m) => m.user_id === userId)
    const myRole = (myRawMember?.role as 'owner' | 'admin' | 'member') || (groupData.created_by === userId ? 'owner' : null)

    let myRequestStatus: 'pending' | 'approved' | 'rejected' | null = null
    if (!myRawMember) {
      const { data: req } = await supabase
        .from('study_group_join_requests')
        .select('status')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle()
      if (req) {
        myRequestStatus = req.status as 'pending' | 'approved' | 'rejected'
      }
    }

    // 4. Fetch Live Users
    const activeHeartbeatThreshold = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: liveRaw } = await supabase
      .from('study_group_live_focus')
      .select('id, group_id, user_id, session_id, subject, started_at, last_heartbeat, is_paused')
      .eq('group_id', groupId)
      .eq('is_paused', false)
      .gte('last_heartbeat', activeHeartbeatThreshold)

    const rawLive = liveRaw || []

    // 5. Fetch Messages (last 50)
    const { data: msgsRaw } = await supabase
      .from('study_group_messages')
      .select('id, group_id, user_id, content, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50)

    const rawMsgs = msgsRaw || []

    // 6. Fetch pending requests if owner or admin
    let rawReqs: Array<{ id: string; group_id: string; user_id: string; status: string; created_at: string }> = []
    if (myRole === 'owner' || myRole === 'admin') {
      const { data: reqsData } = await supabase
        .from('study_group_join_requests')
        .select('id, group_id, user_id, status, created_at')
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      rawReqs = reqsData || []
    }

    // 7. Collect all unique user IDs for complete batch identity resolution
    const allUserIds = [
      groupData.created_by,
      userId,
      ...rawMembers.map((m) => m.user_id),
      ...rawLive.map((l) => l.user_id),
      ...rawMsgs.map((m) => m.user_id),
      ...rawReqs.map((r) => r.user_id),
    ]

    const profilesMap = await resolveUserProfiles(supabase, allUserIds, userId)

    // 8. Fetch weekly focus stats per user in this group
    const { data: weeklyFocusData } = await supabase
      .from('focus_sessions')
      .select('student_user_id, actual_duration_sec')
      .eq('group_id', groupId)
      .gte('started_at', startOfWeekIso)

    const userFocusMap = new Map<string, number>()
    let groupTotalFocusSec = 0
    ;(weeklyFocusData || []).forEach((row: { student_user_id: string; actual_duration_sec: number | null }) => {
      const sec = row.actual_duration_sec || 0
      groupTotalFocusSec += sec
      userFocusMap.set(row.student_user_id, (userFocusMap.get(row.student_user_id) || 0) + sec)
    })

    // 9. Format members
    const members: StudyGroupMember[] = rawMembers.map((m) => {
      const p = profilesMap.get(m.user_id)
      return {
        id: m.id,
        group_id: m.group_id,
        user_id: m.user_id,
        role: m.role as 'owner' | 'admin' | 'member',
        joined_at: m.joined_at,
        user: {
          id: m.user_id,
          full_name: p?.full_name || (m.user_id === userId ? 'You' : 'Student'),
          avatar_url: p?.avatar_url || null,
        },
        weekly_focus_seconds: userFocusMap.get(m.user_id) || 0,
      }
    })

    const { rankedMembers, tiers } = calculateLeaderboardTiers(members)
    const myMemberRecord = rankedMembers.find((m) => m.user_id === userId) || null

    // 10. Format live users
    const liveUsers: StudyGroupLiveUser[] = rawLive.map((l) => {
      const p = profilesMap.get(l.user_id)
      const start = new Date(l.started_at).getTime()
      const now = Date.now()
      const dur = Math.max(0, Math.floor((now - start) / 1000))
      return {
        id: l.id,
        group_id: l.group_id,
        user_id: l.user_id,
        session_id: l.session_id,
        subject: l.subject,
        started_at: l.started_at,
        last_heartbeat: l.last_heartbeat,
        is_paused: l.is_paused,
        duration_seconds: dur,
        user: {
          id: l.user_id,
          full_name: p?.full_name || (l.user_id === userId ? 'You' : 'Student'),
          avatar_url: p?.avatar_url || null,
        },
      }
    })

    // 11. Format messages
    const messages: StudyGroupMessage[] = rawMsgs.map((msg) => {
      const p = profilesMap.get(msg.user_id)
      return {
        id: msg.id,
        group_id: msg.group_id,
        user_id: msg.user_id,
        content: msg.content,
        created_at: msg.created_at,
        is_me: msg.user_id === userId,
        user: {
          id: msg.user_id,
          full_name: msg.user_id === userId ? 'You' : p?.full_name || 'Study Partner',
          avatar_url: p?.avatar_url || null,
        },
      }
    })

    // 12. Count messages sent by user today for 20 limit
    const { count: msgCount } = await supabase
      .from('study_group_messages')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .gte('created_at', startOfDayIso)

    // 13. Format join requests
    const joinRequests: StudyGroupJoinRequest[] = rawReqs.map((r) => {
      const p = profilesMap.get(r.user_id)
      return {
        id: r.id,
        group_id: r.group_id,
        user_id: r.user_id,
        status: r.status as 'pending' | 'approved' | 'rejected',
        created_at: r.created_at,
        user: {
          id: r.user_id,
          full_name: p?.full_name || 'Applicant',
          avatar_url: p?.avatar_url || null,
          grade_level: p?.grade_level || null,
        },
      }
    })

    const group: StudyGroup = {
      ...groupData,
      member_count: members.length,
      weekly_focus_seconds: groupTotalFocusSec,
      live_focus_count: liveUsers.length,
      my_role: myRole,
      my_request_status: myRequestStatus,
    }

    return {
      group,
      members,
      rankedMembers,
      tiers,
      myMemberRecord,
      myRole,
      myRequestStatus,
      liveUsers,
      messages,
      messageCountToday: msgCount || 0,
      messageDailyLimit: 20,
      joinRequests,
    }
  } catch (err) {
    console.error('Error fetching study group details:', err)
    return emptyResult
  }
}

