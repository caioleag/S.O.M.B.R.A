export type Badge = {
  type: string
  name: string
  description?: string
  operation_id?: string
  earned_at?: string
}

export type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  total_missions_completed: number
  total_operations: number
  badges_earned: Array<Badge | string>
  rank: string
  created_at: string
}

export type Operation = {
  id: string
  name: string
  creator_id: string
  duration_days: 7 | 14 | 30
  daily_reset_hour: number
  status: 'inactive' | 'active' | 'completed'
  invite_code: string
  started_at: string | null
  ends_at: string | null
  created_at: string
}

export type OperationMember = {
  operation_id: string
  user_id: string
  role: 'creator' | 'member'
  total_points: number
  joined_at: string
  profiles?: Profile
}

export type Mission = {
  id: string
  category: 'vigilancia' | 'coleta' | 'infiltracao' | 'disfarce' | 'reconhecimento'
  title: string
  objective: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: 10 | 20 | 30
}

export type AssignedMission = {
  id: string
  operation_id: string
  user_id: string
  mission_id: string
  day_number: number
  category_assigned: string
  status: 'available' | 'selected' | 'completed' | 'failed' | 'rejected'
  photo_url: string | null
  caption: string | null
  selected_at: string | null
  submitted_at: string | null
  completed_at: string | null
  scored_at?: string | null
  decision?: 'approved' | 'rejected' | null
  created_at: string
  missions?: Mission
  profiles?: Profile
}

export type Vote = {
  assigned_mission_id: string
  voter_id: string
  vote: 'approve' | 'reject'
  created_at: string
}

export type Reaction = {
  assigned_mission_id: string
  user_id: string
  reaction_type: 'funny' | 'creative' | 'precise' | 'bold' | 'gross'
  created_at: string
}

export type DailyMissionPool = {
  id: string
  operation_id: string
  day_number: number
  mission_ids: string[]
  created_at: string
}

