import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/push-server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  const { id: operationId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const assignedMissionId = formData.get('assigned_mission_id') as string
  const caption = formData.get('caption') as string | null
  const photo = formData.get('photo') as File | null

  if (!assignedMissionId || !photo) {
    return NextResponse.json({ error: 'assigned_mission_id and photo are required' }, { status: 400 })
  }

  const { data: assigned } = await supabase
    .from('assigned_missions')
    .select('id, operation_id, user_id, mission_id')
    .eq('id', assignedMissionId)
    .eq('operation_id', operationId)
    .eq('user_id', user.id)
    .eq('status', 'selected')
    .single()

  if (!assigned) return NextResponse.json({ error: 'Missao nao encontrada.' }, { status: 404 })

  const ext = photo.name.split('.').pop() || 'jpg'
  const filePath = `${user.id}/${assignedMissionId}.${ext}`

  const { error: uploadError } = await supabase.storage.from('mission-photos').upload(filePath, photo, {
    contentType: photo.type,
    upsert: true,
  })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const {
    data: { publicUrl },
  } = supabase.storage.from('mission-photos').getPublicUrl(filePath)

  const { error } = await supabase
    .from('assigned_missions')
    .update({
      status: 'completed',
      photo_url: publicUrl,
      caption: caption || null,
      submitted_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', assignedMissionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: mission } = await supabase.from('missions').select('title').eq('id', assigned.mission_id).single()
  const { data: members } = await supabase
    .from('operation_members')
    .select('user_id')
    .eq('operation_id', operationId)
    .neq('user_id', user.id)

  await sendPushNotification({
    userIds: (members || []).map((member) => member.user_id),
    title: 'Nova evidencia no feed',
    body: `Um agente enviou: ${mission?.title || 'nova missao'}`,
    data: { operationId, assignedMissionId, type: 'submission' },
  })

  return NextResponse.json({ success: true, photo_url: publicUrl })
}

