import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// Member leaves an operation — removes their row from operation_members
// If creator leaves and there are other members, leadership is transferred randomly
// If last member leaves, operation is cancelled
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
  
  // Completed operations cannot be left
  if (operation.status === 'completed') {
    return NextResponse.json({ error: 'Nao e possivel sair de uma operacao concluida.' }, { status: 400 })
  }

  // Use the new leave_operation function that handles leadership transfer
  const { data, error } = await supabase.rpc('leave_operation', {
    p_operation_id: operationId,
    p_user_id: user.id,
  })

  if (error) {
    if (error.message?.includes('OPERATION_NOT_FOUND')) {
      return NextResponse.json({ error: 'Operacao nao encontrada.' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, ...data })
}
