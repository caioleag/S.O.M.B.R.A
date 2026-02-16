import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/push-server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { id: operationId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assigned_mission_id, vote } = await request.json()
  if (!assigned_mission_id || !['approve', 'reject'].includes(vote)) {
    return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('operation_members')
    .select('user_id')
    .eq('operation_id', operationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: 'Nao autorizado.' }, { status: 403 })

  const { data: assigned } = await supabase
    .from('assigned_missions')
    .select('*')
    .eq('id', assigned_mission_id)
    .eq('operation_id', operationId)
    .single()

  if (!assigned) return NextResponse.json({ error: 'Missao nao encontrada.' }, { status: 404 })
  if (assigned.user_id === user.id) return NextResponse.json({ error: 'Nao pode votar na propria missao.' }, { status: 400 })

  const { error: voteError } = await supabase.from('votes').upsert(
    {
      assigned_mission_id,
      voter_id: user.id,
      vote,
    },
    { onConflict: 'assigned_mission_id,voter_id' }
  )

  if (voteError) return NextResponse.json({ error: voteError.message }, { status: 500 })

  const { count: memberCount } = await supabase
    .from('operation_members')
    .select('*', { count: 'exact', head: true })
    .eq('operation_id', operationId)

  const { data: votes } = await supabase.from('votes').select('*').eq('assigned_mission_id', assigned_mission_id)

  const approves = votes?.filter((item) => item.vote === 'approve').length || 0
  const rejects = votes?.filter((item) => item.vote === 'reject').length || 0
  const majority = Math.ceil((memberCount || 1) / 2)
  const nowIso = new Date().toISOString()

  if (assigned.status === 'completed' && approves >= majority) {
    const { data: scoringLock } = await supabase
      .from('assigned_missions')
      .update({ scored_at: nowIso, decision: 'approved' })
      .eq('id', assigned_mission_id)
      .eq('status', 'completed')
      .is('scored_at', null)
      .select('id')
      .maybeSingle()

    if (!scoringLock) {
      return NextResponse.json({ success: true })
    }

    const { data: mission } = await supabase.from('missions').select('points,title').eq('id', assigned.mission_id).single()

    if (mission) {
      await supabase.rpc('add_points_to_member', {
        p_operation_id: operationId,
        p_user_id: assigned.user_id,
        p_points: mission.points,
      })

      await supabase.rpc('increment_profile_stat', {
        uid: assigned.user_id,
        stat: 'total_missions_completed',
      })

      await sendPushNotification({
        userIds: [assigned.user_id],
        title: 'Missao aprovada',
        body: `Sua evidencia foi aprovada: ${mission.title}`,
        data: { operationId, assignedMissionId: assigned_mission_id, type: 'vote_approved' },
      })
    }
  } else if (assigned.status === 'completed' && rejects >= majority) {
    const { data: scoringLock } = await supabase
      .from('assigned_missions')
      .update({ status: 'rejected', scored_at: nowIso, decision: 'rejected' })
      .eq('id', assigned_mission_id)
      .eq('status', 'completed')
      .is('scored_at', null)
      .select('id')
      .maybeSingle()

    if (!scoringLock) {
      return NextResponse.json({ success: true })
    }

    const { data: mission } = await supabase.from('missions').select('title').eq('id', assigned.mission_id).single()

    await sendPushNotification({
      userIds: [assigned.user_id],
      title: 'Missao rejeitada',
      body: `Sua evidencia foi rejeitada: ${mission?.title || 'missao'}`,
      data: { operationId, assignedMissionId: assigned_mission_id, type: 'vote_rejected' },
    })
  }

  return NextResponse.json({ success: true })
}

