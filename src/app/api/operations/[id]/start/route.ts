import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: operationId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: operation } = await supabase.from('operations').select('*').eq('id', operationId).single()

  if (!operation) return NextResponse.json({ error: 'Operacao nao encontrada.' }, { status: 404 })
  if (operation.creator_id !== user.id) return NextResponse.json({ error: 'Apenas o criador pode iniciar.' }, { status: 403 })
  if (operation.status !== 'inactive') return NextResponse.json({ error: 'Operacao ja iniciada.' }, { status: 400 })

  const { count } = await supabase
    .from('operation_members')
    .select('*', { count: 'exact', head: true })
    .eq('operation_id', operationId)

  if ((count || 0) < 3) return NextResponse.json({ error: 'Minimo de 3 agentes necessario.' }, { status: 400 })

  const now = new Date()
  const endsAt = new Date(now)
  endsAt.setDate(endsAt.getDate() + operation.duration_days)

  const { error } = await supabase
    .from('operations')
    .update({
      status: 'active',
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .eq('id', operationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

