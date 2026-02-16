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
    const refreshLobby = () => router.refresh()

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
        refreshLobby
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'operations',
          filter: `id=eq.${operationId}`,
        },
        refreshLobby
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [operationId, router])

  return null
}
