import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function mapJoinError(message: string) {
  if (message.includes('OP_NOT_FOUND')) {
    return { status: 404, error: 'Codigo invalido ou operacao nao encontrada.' }
  }
  if (message.includes('OP_COMPLETED')) {
    return { status: 400, error: 'Operacao ja encerrada.' }
  }
  if (message.includes('ALREADY_IN_ACTIVE_OPERATION')) {
    return { status: 400, error: 'Voce ja participa de uma operacao ativa.' }
  }
  if (message.includes('OP_FULL')) {
    return { status: 400, error: 'OPERACAO COMPLETA - LIMITE DE AGENTES ATINGIDO' }
  }
  return null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await request.json()
  const code = String(payload.code || payload.invite_code || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  if (!code) return NextResponse.json({ error: 'Codigo e obrigatorio.' }, { status: 400 })

  const { data: operationId, error } = await supabase.rpc('join_operation_by_code', {
    p_code: code,
    p_user_id: user.id,
  })

  if (error) {
    const mapped = mapJoinError(error.message || '')
    if (mapped) return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ operation_id: operationId })
}
