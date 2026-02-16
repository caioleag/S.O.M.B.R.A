import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

  const { assigned_mission_id, reaction_type } = await request.json()
  const validTypes = ['funny', 'creative', 'precise', 'bold', 'gross']

  if (!assigned_mission_id || !validTypes.includes(reaction_type)) {
    return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 })
  }

  const { data: mission } = await supabase
    .from('assigned_missions')
    .select('id')
    .eq('id', assigned_mission_id)
    .eq('operation_id', operationId)
    .maybeSingle()

  if (!mission) {
    return NextResponse.json({ error: 'Missao nao encontrada.' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('reactions')
    .select('*')
    .eq('assigned_mission_id', assigned_mission_id)
    .eq('user_id', user.id)
    .eq('reaction_type', reaction_type)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('reactions')
      .delete()
      .eq('assigned_mission_id', assigned_mission_id)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)

    return NextResponse.json({ action: 'removed' })
  }

  const { error } = await supabase.from('reactions').insert({
    assigned_mission_id,
    user_id: user.id,
    reaction_type,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ action: 'added' })
}

