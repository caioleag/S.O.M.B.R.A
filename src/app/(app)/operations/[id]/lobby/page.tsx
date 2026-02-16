import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { MemberList } from '@/components/operations/MemberList'
import { InviteCard } from '@/components/operations/InviteCard'
import { StartOperationButton } from './StartOperationButton'

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
    redirect('/')
  }

  if (operation.status === 'active') {
    redirect(`/operations/${operationId}`)
  }

  const { data: members } = await supabase
    .from('operation_members')
    .select('user_id, role, joined_at, profiles(username, avatar_url)')
    .eq('operation_id', operationId)
    .order('joined_at', { ascending: true })

  const isCreator = operation.creator_id === user.id
  const memberCount = members?.length || 0
  const canStart = isCreator && memberCount >= 3

  return (
    <>
      <TopBar title={operation.name} subtitle={<span className="inline-block animate-pulse">AGUARDANDO AGENTES ¦</span>} />

      <div className="p-4 space-y-4">
        <MemberList members={(members || []) as any} maxMembers={5} creatorId={operation.creator_id} />

        <InviteCard code={operation.invite_code} operationId={operationId} />

        {isCreator ? (
          <div className="space-y-2">
            <StartOperationButton operationId={operationId} canStart={canStart} memberCount={memberCount} />
            {!canStart && memberCount < 3 ? (
              <p className="text-center font-['Inter'] text-xs text-[#3a3632]">Minimo de 3 agentes necessario.</p>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="font-['Inter'] text-sm text-[#6b6660]">Aguardando o criador iniciar a operacao...</p>
          </div>
        )}
      </div>
    </>
  )
}

