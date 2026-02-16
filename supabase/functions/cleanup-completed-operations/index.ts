import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.56.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function extractStoragePath(photoUrl: string): string | null {
  const marker = '/storage/v1/object/public/mission-photos/'
  const index = photoUrl.indexOf(marker)
  if (index === -1) return null
  return decodeURIComponent(photoUrl.slice(index + marker.length))
}

Deno.serve(async (_req: Request) => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: operations, error } = await supabase
    .from('operations')
    .select('id')
    .eq('status', 'completed')
    .lte('ends_at', cutoff)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const removedOperations: string[] = []
  let removedPhotos = 0

  for (const operation of operations || []) {
    const { data: missions } = await supabase
      .from('assigned_missions')
      .select('photo_url')
      .eq('operation_id', operation.id)
      .not('photo_url', 'is', null)

    const paths = (missions || [])
      .map((row) => (row.photo_url ? extractStoragePath(row.photo_url) : null))
      .filter((value): value is string => Boolean(value))

    if (paths.length > 0) {
      await supabase.storage.from('mission-photos').remove(paths)
      removedPhotos += paths.length
    }

    const { error: deleteError } = await supabase.from('operations').delete().eq('id', operation.id)
    if (!deleteError) {
      removedOperations.push(operation.id)
    }
  }

  return new Response(JSON.stringify({ removedOperations, removedPhotos }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
