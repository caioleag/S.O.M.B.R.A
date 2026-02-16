import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const rawRedirectPath = url.searchParams.get('next') || '/'
  const redirectPath = rawRedirectPath.startsWith('/') ? rawRedirectPath : '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .limit(1)
  const profile = profileRows?.[0]

  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      avatar_url: user.user_metadata?.avatar_url || null,
    })
  }

  const { data: profileAfter } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .limit(1)

  if (!profileAfter?.[0]?.username) {
    return NextResponse.redirect(new URL('/onboarding', url.origin))
  }

  return NextResponse.redirect(new URL(redirectPath, url.origin))
}
