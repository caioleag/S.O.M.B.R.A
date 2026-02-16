import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.56.0'

interface OperationRow {
  id: string
  name: string
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const functionBaseUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`
const serviceJwt = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

async function notifyOperationCompleted(operationId: string, operationName: string) {
  const { data: members } = await supabase.from('operation_members').select('user_id').eq('operation_id', operationId)
  const userIds = (members || []).map((m) => m.user_id)

  if (!userIds.length || !serviceJwt) return

  await fetch(functionBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceJwt}`,
    },
    body: JSON.stringify({
      userIds,
      title: 'Operacao encerrada',
      body: `Cerimonia disponivel: ${operationName}`,
      data: { operationId, type: 'operation_completed' },
    }),
  }).catch(() => undefined)
}

Deno.serve(async (_req: Request) => {
  const { data: operations, error } = await supabase
    .from('operations')
    .select('id, name')
    .eq('status', 'active')
    .lte('ends_at', new Date().toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const completed: string[] = []

  for (const operation of (operations || []) as OperationRow[]) {
    await supabase.rpc('award_operation_badges', { p_operation_id: operation.id })

    const { error: updateError } = await supabase
      .from('operations')
      .update({ status: 'completed' })
      .eq('id', operation.id)
      .eq('status', 'active')

    if (!updateError) {
      completed.push(operation.id)
      await notifyOperationCompleted(operation.id, operation.name)
    }
  }

  return new Response(JSON.stringify({ completed }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
