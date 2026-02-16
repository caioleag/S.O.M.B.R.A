import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface PublicJoinPageProps {
  params: Promise<{ code: string }>
}

export default async function PublicJoinPage({ params }: PublicJoinPageProps) {
  const supabase = await createClient()
  const { code } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/join/${code}`)
  }

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .limit(1)
  const profile = profileRows?.[0]

  if (!profile?.username) {
    redirect('/onboarding')
  }

  redirect(`/operations/join?code=${code.toUpperCase()}`)
}

