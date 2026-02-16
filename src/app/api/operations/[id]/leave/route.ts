import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Member leaves an operation — removes their row from operation_members
// Creator cannot leave; they must cancel (DELETE /api/operations/[id])
export async function POST(_request: Request, context: RouteContext) {
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
  if (operation.creator_id === user.id) return NextResponse.json({ error: 'O criador deve encerrar a operacao, nao sair.' }, { status: 400 })
  if (operation.status !== 'inactive') return NextResponse.json({ error: 'Nao e possivel sair de uma operacao ativa.' }, { status: 400 })

  const { error } = await supabase
    .from('operation_members')
    .delete()
    .eq('operation_id', operationId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
