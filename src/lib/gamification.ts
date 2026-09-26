import { createClient } from '@/lib/supabase/server'
import type {
  ClassroomQuestionRow,
  ClassroomAnswerRow,
  GoldCoinTransactionRow,
  BadgeRow,
  StudentBadgeRow,
  StudentLearningNodeRow,
} from '@/types/database'

export interface StudentGamificationOverview {
  xp: number
  streakCount: number
  longestStreak: number
  goldCoins: number
  badges: Array<StudentBadgeRow & { badge: BadgeRow }>
  recentTransactions: GoldCoinTransactionRow[]
  learningNodes: StudentLearningNodeRow[]
}

/**
 * Retrieves the complete gamification profile for a student:
 * XP, Streak, Gold Coins, Badges, and Learning Path.
 */
export async function getStudentGamificationOverview(
  studentUserId: string
): Promise<StudentGamificationOverview> {
  const supabase = await createClient()

  // 1. Fetch student_profiles stats
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('xp, streak_count, longest_streak, gold_coins_balance')
    .eq('id', studentUserId)
    .single()

  // 2. Fetch earned badges with badge metadata
  const { data: badgesData } = await supabase
    .from('student_badges')
    .select('*, badge:badges(*)')
    .eq('student_user_id', studentUserId)
    .order('earned_at', { ascending: false })

  // 3. Fetch recent Gold Coin ledger transactions
  const { data: transactions } = await supabase
    .from('gold_coin_transactions')
    .select('*')
    .eq('student_user_id', studentUserId)
    .order('created_at', { ascending: false })
    .limit(10)

  // 4. Fetch learning path nodes
  let { data: nodes } = await supabase
    .from('student_learning_nodes')
    .select('*')
    .eq('student_user_id', studentUserId)
    .order('order_index', { ascending: true })

  // Auto-provision initial Nuzilo Path nodes if student has none
  if (!nodes || nodes.length === 0) {
    nodes = await seedDefaultLearningPath(studentUserId)
  }

  return {
    xp: profile?.xp || 0,
    streakCount: profile?.streak_count || 1,
    longestStreak: profile?.longest_streak || 1,
    goldCoins: profile?.gold_coins_balance || 0,
    badges: (badgesData as any) || [],
    recentTransactions: transactions || [],
    learningNodes: nodes || [],
  }
}

/**
 * Seeds a default 5-node Nuzilo Path for a new or existing student
 */
export async function seedDefaultLearningPath(
  studentUserId: string
): Promise<StudentLearningNodeRow[]> {
  const supabase = await createClient()

  const defaultNodes = [
    {
      student_user_id: studentUserId,
      title: 'Welcome to Nuzilo',
      description: 'Explore your interactive learning hub and join your first live classroom',
      node_type: 'live_class' as const,
      status: 'current' as const,
      order_index: 0,
      xp_reward: 50,
      coins_reward: 10,
    },
    {
      student_user_id: studentUserId,
      title: 'Quick Concept Warm-up',
      description: 'Test your foundational knowledge with a 3-minute quiz',
      node_type: 'quiz' as const,
      status: 'available' as const,
      order_index: 1,
      xp_reward: 40,
      coins_reward: 5,
    },
    {
      student_user_id: studentUserId,
      title: 'Speed Challenge #1',
      description: 'Answer fast under time pressure to unlock speed bonuses',
      node_type: 'challenge' as const,
      status: 'locked' as const,
      order_index: 2,
      xp_reward: 75,
      coins_reward: 15,
    },
    {
      student_user_id: studentUserId,
      title: 'Interactive Practice Session',
      description: 'Solve guided problems and sharpen your problem-solving rhythm',
      node_type: 'practice' as const,
      status: 'locked' as const,
      order_index: 3,
      xp_reward: 60,
      coins_reward: 10,
    },
    {
      student_user_id: studentUserId,
      title: 'Unit Mastery Assessment',
      description: 'Comprehensive milestone test with gold medal achievement',
      node_type: 'test' as const,
      status: 'special_challenge' as const,
      order_index: 4,
      xp_reward: 150,
      coins_reward: 30,
    },
  ]

  const { data, error } = await supabase
    .from('student_learning_nodes')
    .insert(defaultNodes)
    .select()
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Failed to seed default learning path:', error)
    return []
  }

  return data || []
}

/**
 * Fetches all interactive questions for a class session
 */
export async function getSessionQuestions(
  sessionId: string
): Promise<ClassroomQuestionRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classroom_questions')
    .select('*')
    .eq('class_session_id', sessionId)
    .order('order_index', { ascending: true })

  if (error) {
    console.error('getSessionQuestions error:', error)
    return []
  }

  return data || []
}

/**
 * Fetches all answers for a specific question (ordered by correctness and fastest response time)
 */
export async function getQuestionAnswers(
  questionId: string
): Promise<Array<ClassroomAnswerRow & { user_name?: string }>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classroom_answers')
    .select('*')
    .eq('question_id', questionId)
    .order('is_correct', { ascending: false })
    .order('answer_time_ms', { ascending: true })

  if (error) {
    console.error('getQuestionAnswers error:', error)
    return []
  }

  return (data as any) || []
}
