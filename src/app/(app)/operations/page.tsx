import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LeaveOperationButton } from '@/components/operations/LeaveOperationButton'
import { Typewriter } from '@/components/ui/Typewriter'

type MembershipRow = {
  role: 'creator' | 'member'
  operation_id: string
  operations: {
    id: string
    name: string
    status: 'inactive' | 'active' | 'completed'
    invite_code: string
    creator_id: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OperationsHubPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: memberships } = await supabase
    .from('operation_members')
    .select('role, operation_id, operations!inner(id,name,status,invite_code,creator_id)')
    .eq('user_id', user.id)
    .in('operations.status', ['inactive', 'active'])
    .limit(1)

  const membership = memberships?.[0] as MembershipRow | undefined
  const operation = membership?.operations
  const hasActiveOperation = Boolean(operation)
  const isCreator = membership?.role === 'creator' || operation?.creator_id === user.id
  const openOperationHref = operation
    ? operation.status === 'inactive'
      ? `/operations/${operation.id}/lobby`
      : `/operations/${operation.id}`
    : null

  return (
    <>
      <TopBar
        title="OPERACAO"
        subtitle={
          <Typewriter
            text={hasActiveOperation ? 'PAINEL TATICO DISPONIVEL' : 'SELECIONE UMA ACAO PARA COMECAR'}
            speed={28}
            delay={120}
          />
        }
      />

      <div className="space-y-4 p-4">
        <Card active={hasActiveOperation}>
          <div className="space-y-3">
            <p className="font-['Special_Elite'] text-[10px] uppercase tracking-[0.2em] text-[#6b6660]">
              VISUALIZAR / GERENCIAR
            </p>

            {operation ? (
              <>
                <div className="rounded-sm border border-[#3d3520] bg-[#100d08] p-3">
                  <p className="font-['Special_Elite'] text-sm text-[#e8e4d9]">{operation.name}</p>
                  <p className="mt-1 font-['Inter'] text-xs text-[#6b6660]">
                    {operation.status === 'inactive' ? 'Status: aguardando inicio' : 'Status: em andamento'}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#c9a227]">Codigo: {operation.invite_code}</p>
                </div>

                {openOperationHref ? (
                  <Link href={openOperationHref} className="block">
                    <Button variant="primary" className="w-full">
                      ABRIR OPERACAO
                    </Button>
                  </Link>
                ) : null}

                <Link href={`/operations/${operation.id}/lobby`} className="block">
                  <Button variant="secondary" className="w-full">
                    {isCreator ? 'GERENCIAR LOBBY E CONVITES' : 'VER LOBBY DA OPERACAO'}
                  </Button>
                </Link>

                {!isCreator && operation.status === 'inactive' && (
                  <LeaveOperationButton operationId={operation.id} />
                )}
              </>
            ) : (
              <p className="font-['Inter'] text-sm text-[#6b6660]">
                Voce nao esta em nenhuma operacao ainda. Crie uma ou entre com codigo abaixo.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <p className="font-['Special_Elite'] text-[10px] uppercase tracking-[0.2em] text-[#6b6660]">ENTRAR / CRIAR</p>
            {hasActiveOperation ? (
              <p className="font-['Inter'] text-sm text-[#6b6660]">
                Para entrar ou criar outra operacao, finalize ou saia da operacao atual primeiro.
              </p>
            ) : (
              <>
                <Link href="/operations/create" className="block">
                  <Button variant="primary" className="w-full">
                    CRIAR OPERACAO
                  </Button>
                </Link>

                <Link href="/operations/join" className="block">
                  <Button variant="secondary" className="w-full">
                    ENTRAR COM CODIGO
                  </Button>
                </Link>
              </>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
