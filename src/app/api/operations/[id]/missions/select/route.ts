import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getCurrentDay(startedAt: string, resetHour: number): number {
  const start = new Date(startedAt)
  const now = new Date()
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), resetHour)
  const diffMs = now.getTime() - startDay.getTime()
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1)
}

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

  const { mission_id } = await request.json()
  if (!mission_id) return NextResponse.json({ error: 'mission_id is required' }, { status: 400 })

  const { data: operation } = await supabase.from('operations').select('*').eq('id', operationId).single()

  if (!operation || operation.status !== 'active') {
    return NextResponse.json({ error: 'Operacao inativa.' }, { status: 400 })
  }

  const dayNumber = getCurrentDay(operation.started_at, operation.daily_reset_hour)

  const { data: pool } = await supabase
    .from('daily_mission_pools')
    .select('mission_ids')
    .eq('operation_id', operationId)
    .eq('day_number', dayNumber)
    .maybeSingle()

  if (!pool?.mission_ids?.includes(mission_id)) {
    return NextResponse.json({ error: 'Missao fora do pool diario.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('assigned_missions')
    .select('*')
    .eq('operation_id', operationId)
    .eq('user_id', user.id)
    .eq('day_number', dayNumber)
    .eq('status', 'selected')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Voce ja tem uma missao em andamento hoje.' }, { status: 400 })
  }

  const { data: mission } = await supabase.from('missions').select('*').eq('id', mission_id).single()
  if (!mission) return NextResponse.json({ error: 'Missao nao encontrada.' }, { status: 404 })

  const { data: assigned, error } = await supabase
    .from('assigned_missions')
    .insert({
      operation_id: operationId,
      user_id: user.id,
      mission_id,
      day_number: dayNumber,
      category_assigned: mission.category,
      status: 'selected',
      selected_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(assigned)
}

