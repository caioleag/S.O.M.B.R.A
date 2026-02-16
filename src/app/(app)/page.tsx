import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: memberships } = await supabase
    .from('operation_members')
    .select('operation_id, operations!inner(id,name,status)')
    .eq('user_id', user.id)
    .in('operations.status', ['inactive', 'active'])
    .limit(1)

  const operation = (memberships?.[0] as any)?.operations

  if (operation) {
    if (operation.status === 'inactive') {
      redirect(`/operations/${operation.id}/lobby`)
    }
    redirect(`/operations/${operation.id}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="font-['Special_Elite'] text-3xl text-[#c9a227] tracking-[0.3em]">S.O.M.B.R.A</h1>
          <p className="font-['Inter'] text-sm text-[#6b6660]">Aguardando ordens, agente.</p>
        </div>

        <div className="space-y-3">
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
        </div>
      </div>
    </div>
  )
}

