import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: operationId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: operation } = await supabase
    .from('operations')
    .select('creator_id, status')
    .eq('id', operationId)
    .single()

  if (!operation) return NextResponse.json({ error: 'Operacao nao encontrada.' }, { status: 404 })
  if (operation.creator_id !== user.id) return NextResponse.json({ error: 'Apenas o criador pode encerrar.' }, { status: 403 })
  if (operation.status !== 'inactive') return NextResponse.json({ error: 'Apenas operacoes no lobby podem ser encerradas.' }, { status: 400 })

  const { error } = await supabase.from('operations').delete().eq('id', operationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
