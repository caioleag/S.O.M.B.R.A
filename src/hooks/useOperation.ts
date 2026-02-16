'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Operation, OperationMember } from '@/lib/supabase/types'

export function useOperation(operationId: string | null) {
  const [operation, setOperation] = useState<Operation | null>(null)
  const [members, setMembers] = useState<OperationMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOperation = useCallback(async () => {
    if (!operationId) { setLoading(false); return }
    const supabase = createClient()

    const { data: op } = await supabase
      .from('operations')
      .select('*')
      .eq('id', operationId)
      .single()

    const { data: mems } = await supabase
      .from('operation_members')
      .select('*, profiles(*)')
      .eq('operation_id', operationId)

    setOperation(op)
    setMembers(mems || [])
    setLoading(false)
  }, [operationId])

  useEffect(() => {
    fetchOperation()

    if (!operationId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`operation-${operationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'operation_members',
        filter: `operation_id=eq.${operationId}`,
      }, () => fetchOperation())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'operations',
        filter: `id=eq.${operationId}`,
      }, (payload) => setOperation(payload.new as Operation))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [operationId, fetchOperation])

  return { operation, members, loading, refetch: fetchOperation }
}
