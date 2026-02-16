import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface PushSubscriptionPayload {
  endpoint: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { count } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return NextResponse.json({ subscribed: (count || 0) > 0 })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = (await request.json()) as PushSubscriptionPayload
  if (!payload?.endpoint || !payload?.keys?.p256dh || !payload?.keys?.auth) {
    return NextResponse.json({ error: 'Invalid push subscription payload.' }, { status: 400 })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: payload.endpoint,
      p256dh: payload.keys.p256dh,
      auth: payload.keys.auth,
    },
    { onConflict: 'user_id,endpoint' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = (await request.json().catch(() => ({}))) as { endpoint?: string }

  let query = supabase.from('push_subscriptions').delete().eq('user_id', user.id)
  if (payload.endpoint) {
    query = query.eq('endpoint', payload.endpoint)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

