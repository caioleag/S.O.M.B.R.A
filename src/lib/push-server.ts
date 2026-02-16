interface PushPayload {
  userIds: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function sendPushNotification(payload: PushPayload): Promise<void> {
  if (!payload.userIds.length) return

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!baseUrl || !anonKey || anonKey === 'REPLACE_WITH_ANON_KEY') {
    return
  }

  await fetch(`${baseUrl}/functions/v1/send-push-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined)
}

