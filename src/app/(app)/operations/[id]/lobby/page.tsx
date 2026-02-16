import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { MemberList } from '@/components/operations/MemberList'
import { InviteCard } from '@/components/operations/InviteCard'
import { StartOperationButton } from './StartOperationButton'
import { CancelOperationButton } from './CancelOperationButton'
import { LeaveOperationButton } from '@/components/operations/LeaveOperationButton'
import { LobbyRealtimeSync } from './LobbyRealtimeSync'
import { Typewriter } from '@/components/ui/Typewriter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface LobbyPageProps {
  params: Promise<{ id: string }>
}

export default async function LobbyPage({ params }: LobbyPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id: operationId } = await params

  const { data: operation } = await supabase.from('operations').select('*').eq('id', operationId).single()

  if (!operation) {
    redirect('/operations')
  }

  if (operation.status === 'active') {
    redirect(`/operations/${operationId}`)
  }

  if (operation.status !== 'inactive') {
    redirect('/operations')
  }

  const { data: members } = await supabase
    .from('operation_members')
    .select('user_id, role, joined_at, profiles(username, avatar_url)')
    .eq('operation_id', operationId)
    .order('joined_at', { ascending: true })

  const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle()
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null
  const profileInitial = String(profile?.username || user.user_metadata?.full_name || user.email || 'A')
    .charAt(0)
    .toUpperCase()

  const isCreator = operation.creator_id === user.id
  const memberCount = members?.length || 0

  return (
    <>
      <TopBar
        left={
          <Link
            href="/operations"
            aria-label="Voltar ao hub"
            className="flex items-center justify-center -ml-1 mr-1 p-1 text-[#6b6660] hover:text-[#c9a227] transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </Link>
        }
        title={operation.name}
        right={
          <div className="flex items-center gap-3">
            <span className="inline-block animate-pulse font-mono text-ink-muted text-xs">LOBBY ¦</span>
            <Link
              href="/profile"
              aria-label="Ver perfil do agente"
              className="block h-7 w-7 overflow-hidden rounded-full border border-[#3d3520] bg-[#1a1a1a]"
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Perfil" width={28} height={28} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-mono text-[11px] text-[#6b6660]">
                  {profileInitial}
                </span>
              )}
            </Link>
          </div>
        }
      />
      <LobbyRealtimeSync operationId={operationId} />

      <div className="p-4 space-y-4">
        <MemberList members={(members || []) as any} maxMembers={5} creatorId={operation.creator_id} />

        <InviteCard code={operation.invite_code} operationId={operationId} />

        {isCreator ? (
          <div className="space-y-2">
            <StartOperationButton operationId={operationId} />
            <CancelOperationButton operationId={operationId} />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-center py-2">
              <Typewriter text="Aguardando o criador iniciar a operacao..." speed={22} delay={300} className="font-['Inter'] text-sm text-[#6b6660]" />
            </div>
            <LeaveOperationButton operationId={operationId} />
          </div>
        )}
      </div>
    </>
  )
}
