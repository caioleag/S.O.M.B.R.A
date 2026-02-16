import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.56.0'
import webpush from 'npm:web-push@3.6.7'

interface PushRequest {
  userIds: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:ops@sombra.local'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'Missing VAPID keys in function secrets.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = (await req.json()) as PushRequest
  if (!payload.userIds?.length || !payload.title || !payload.body) {
    return new Response(JSON.stringify({ error: 'Invalid payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', payload.userIds)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  })

  let sent = 0
  const staleEndpoints: string[] = []

  for (const subscription of subscriptions || []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        notificationPayload
      )
      sent += 1
    } catch (pushError) {
      const statusCode = (pushError as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        staleEndpoints.push(subscription.endpoint)
      }
    }
  }

  if (staleEndpoints.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints)
  }

  return new Response(JSON.stringify({ sent, staleRemoved: staleEndpoints.length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
