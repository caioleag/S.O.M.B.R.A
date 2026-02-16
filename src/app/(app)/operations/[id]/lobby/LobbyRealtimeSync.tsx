'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LobbyRealtimeSyncProps {
  operationId: string
}

export function LobbyRealtimeSync({ operationId }: LobbyRealtimeSyncProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`lobby-${operationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'operation_members',
          filter: `operation_id=eq.${operationId}`,
        },
        () => router.refresh()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'operations',
          filter: `id=eq.${operationId}`,
        },
        (payload: { new: { status?: string } }) => {
          const status = payload.new?.status
          if (status === 'cancelled') {
            window.location.href = '/operations'
          } else {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [operationId, router])

  return null
}
