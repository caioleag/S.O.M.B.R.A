import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, duration_days, daily_reset_hour } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nome e obrigatorio.' }, { status: 400 })
  if (![7, 14, 30].includes(duration_days)) {
    return NextResponse.json({ error: 'Duracao invalida.' }, { status: 400 })
  }

  const { data: activeMembership } = await supabase
    .from('operation_members')
    .select('operation_id, operations!inner(status)')
    .eq('user_id', user.id)
    .in('operations.status', ['inactive', 'active'])
    .limit(1)

  if ((activeMembership || []).length > 0) {
    return NextResponse.json({ error: 'Voce ja participa de uma operacao ativa.' }, { status: 400 })
  }

  let invite_code = generateCode()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase.from('operations').select('id').eq('invite_code', invite_code).maybeSingle()
    if (!existing) break
    invite_code = generateCode()
    attempts++
  }

  const { data: operation, error } = await supabase
    .from('operations')
    .insert({
      name: name.trim(),
      creator_id: user.id,
      duration_days,
      daily_reset_hour: daily_reset_hour ?? 0,
      invite_code,
      status: 'inactive',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { error: memberError } = await supabase.from('operation_members').insert({
    operation_id: operation.id,
    user_id: user.id,
    role: 'creator',
  })

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

  await supabase.rpc('increment_profile_stat', { uid: user.id, stat: 'total_operations' })

  return NextResponse.json(operation)
}

