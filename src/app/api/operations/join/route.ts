import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await request.json()
  const code = String(payload.code || payload.invite_code || '').trim().toUpperCase()

  if (!code) return NextResponse.json({ error: 'Codigo e obrigatorio.' }, { status: 400 })

  const { data: operation } = await supabase.from('operations').select('*').eq('invite_code', code).maybeSingle()

  if (!operation) return NextResponse.json({ error: 'Codigo invalido ou operacao nao encontrada.' }, { status: 404 })
  if (operation.status === 'completed') return NextResponse.json({ error: 'Operacao ja encerrada.' }, { status: 400 })

  const { data: activeMembership } = await supabase
    .from('operation_members')
    .select('operation_id, operations!inner(status)')
    .eq('user_id', user.id)
    .in('operations.status', ['inactive', 'active'])
    .neq('operation_id', operation.id)
    .limit(1)

  if ((activeMembership || []).length > 0) {
    return NextResponse.json({ error: 'Voce ja participa de uma operacao ativa.' }, { status: 400 })
  }

  const { count } = await supabase
    .from('operation_members')
    .select('*', { count: 'exact', head: true })
    .eq('operation_id', operation.id)

  if ((count || 0) >= 5) {
    return NextResponse.json({ error: 'OPERACAO COMPLETA - LIMITE DE AGENTES ATINGIDO' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('operation_members')
    .select('*')
    .eq('operation_id', operation.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ operation_id: operation.id })
  }

  const { error } = await supabase.from('operation_members').insert({
    operation_id: operation.id,
    user_id: user.id,
    role: 'member',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ operation_id: operation.id })
}

