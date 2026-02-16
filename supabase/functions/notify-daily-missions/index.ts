import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.56.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const functionBaseUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`
const serviceJwt = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (_req: Request) => {
  const now = new Date()
  const currentHour = now.getUTCHours()

  const { data: operations, error } = await supabase
    .from('operations')
    .select('id, name, daily_reset_hour, started_at, duration_days')
    .eq('status', 'active')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const notified: string[] = []

  for (const operation of operations || []) {
    if (operation.daily_reset_hour !== currentHour) continue

    const { data: dayResult } = await supabase.rpc('calculate_operation_day', {
      p_started_at: operation.started_at,
      p_reset_hour: operation.daily_reset_hour,
      p_now: now.toISOString(),
    })

    const dayNumber = Number(dayResult || 1)
    const notificationType = 'daily_reset'

    const { error: insertError } = await supabase.from('operation_notification_log').insert({
      operation_id: operation.id,
      day_number: dayNumber,
      notification_type: notificationType,
    })

    if (insertError) {
      // duplicate key = already sent for this operation/day/type
      continue
    }

    const { data: members } = await supabase.from('operation_members').select('user_id').eq('operation_id', operation.id)
    const userIds = (members || []).map((member) => member.user_id)

    if (!userIds.length || !serviceJwt) continue

    await fetch(functionBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceJwt}`,
      },
      body: JSON.stringify({
        userIds,
        title: 'Novas missoes disponiveis',
        body: `Dia ${String(dayNumber).padStart(2, '0')} da operacao ${operation.name}`,
        data: { operationId: operation.id, type: 'daily_reset', dayNumber },
      }),
    }).catch(() => undefined)

    notified.push(operation.id)
  }

  return new Response(JSON.stringify({ notified }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
