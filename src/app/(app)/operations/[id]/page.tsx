import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { OperationTabs } from './OperationTabs'

interface OperationPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function OperationPage({ params, searchParams }: OperationPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id: operationId } = await params
  const { tab } = await searchParams

  const { data: operation } = await supabase.from('operations').select('*').eq('id', operationId).single()

  if (!operation) {
    redirect('/operations')
  }

  if (operation.status === 'inactive') {
    redirect(`/operations/${operationId}/lobby`)
  }

  if (operation.status === 'completed') {
    redirect(`/operations/${operationId}/ceremony`)
  }

  const startDate = operation.started_at ? new Date(operation.started_at) : new Date()
  const now = new Date()
  const diffTime = Math.max(0, now.getTime() - startDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  const currentDay = Math.min(diffDays, operation.duration_days)

  const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle()
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null
  const profileInitial = String(profile?.username || user.user_metadata?.full_name || user.email || 'A')
    .charAt(0)
    .toUpperCase()

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
        glow
        title={operation.name}
        right={
          <div className="flex items-center gap-3">
            <span className="font-mono text-ink-muted text-xs">DIA {String(currentDay).padStart(2, '0')}</span>
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

      <OperationTabs operationId={operationId} userId={user.id} currentTab={tab || 'missions'} resetHour={operation.daily_reset_hour} />
    </>
  )
}
