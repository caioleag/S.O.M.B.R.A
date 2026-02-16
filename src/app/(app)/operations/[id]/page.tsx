import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  const { data: operation } = await supabase
    .from('operations')
    .select('*')
    .eq('id', operationId)
    .single()

  if (!operation) {
    redirect('/')
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

  return (
    <>
      <TopBar title={operation.name} subtitle={`DIA ${String(currentDay).padStart(2, '0')}`} />

      <OperationTabs
        operationId={operationId}
        userId={user.id}
        currentTab={tab || 'missions'}
        resetHour={operation.daily_reset_hour}
      />
    </>
  )
}

