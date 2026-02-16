import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getCurrentDay(startedAt: string, resetHour: number): number {
  const start = new Date(startedAt)
  const now = new Date()
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), resetHour)
  const diffMs = now.getTime() - startDay.getTime()
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1)
}

function sample<T>(arr: T[], size: number): T[] {
  const copy = [...arr]
  const output: T[] = []
  while (copy.length > 0 && output.length < size) {
    const index = Math.floor(Math.random() * copy.length)
    output.push(copy.splice(index, 1)[0])
  }
  return output
}

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id: operationId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: operation } = await supabase.from('operations').select('*').eq('id', operationId).single()

  if (!operation || operation.status !== 'active') {
    return NextResponse.json({ missions: [], assigned: [] })
  }

  const dayNumber = getCurrentDay(operation.started_at, operation.daily_reset_hour)

  let { data: pool } = await supabase
    .from('daily_mission_pools')
    .select('*')
    .eq('operation_id', operationId)
    .eq('day_number', dayNumber)
    .maybeSingle()

  if (!pool) {
    const { data: allMissions } = await supabase.from('missions').select('*')
    if (!allMissions || allMissions.length === 0) {
      return NextResponse.json({ missions: [], assigned: [] })
    }

    const categories = ['vigilancia', 'coleta', 'infiltracao', 'disfarce', 'reconhecimento']
    const category = categories[Math.floor(Math.random() * categories.length)]
    const categoryMissions = allMissions.filter((mission) => mission.category === category)

    const easy = sample(categoryMissions.filter((mission) => mission.difficulty === 'easy'), 3)
    const medium = sample(categoryMissions.filter((mission) => mission.difficulty === 'medium'), 3)
    const hard = sample(categoryMissions.filter((mission) => mission.difficulty === 'hard'), 3)

    let selected = [...easy, ...medium, ...hard]
    if (selected.length < 9) {
      const fallback = sample(
        allMissions.filter((mission) => !selected.find((picked) => picked.id === mission.id)),
        9 - selected.length
      )
      selected = [...selected, ...fallback]
    }

    const { data: newPool } = await supabase
      .from('daily_mission_pools')
      .insert({
        operation_id: operationId,
        day_number: dayNumber,
        mission_ids: selected.map((mission) => mission.id),
      })
      .select()
      .single()

    pool = newPool
  }

  if (!pool) return NextResponse.json({ missions: [], assigned: [] })

  const { data: missions } = await supabase.from('missions').select('*').in('id', pool.mission_ids)

  const { data: assigned } = await supabase
    .from('assigned_missions')
    .select('*')
    .eq('operation_id', operationId)
    .eq('user_id', user.id)
    .eq('day_number', dayNumber)

  return NextResponse.json({ missions: missions || [], assigned: assigned || [] })
}

