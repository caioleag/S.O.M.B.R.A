'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FeedCard } from '@/components/feed/FeedCard'

interface Props {
  operationId: string
  userId: string
}

type FeedItem = {
  id: string
  operation_id: string
  user_id: string
  status: 'available' | 'selected' | 'completed' | 'failed' | 'rejected'
  photo_url: string | null
  caption: string | null
  missions?: {
    title: string
    category: string
    difficulty: 'easy' | 'medium' | 'hard'
  } | null
  profiles?: {
    id: string
    username: string | null
    avatar_url: string | null
  } | null
  votes?: Array<{ voter_id: string; vote: 'approve' | 'reject' }>
  reactions?: Array<{ user_id: string; reaction_type: 'funny' | 'creative' | 'precise' | 'bold' | 'gross' }>
  favorite_photos?: Array<{ user_id: string }>
}

export function FeedWrapper({ operationId, userId }: Props) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newCount, setNewCount] = useState(0)

  const fetchFeed = useCallback(async () => {
    const supabase = createClient()
    
    console.log('[FEED DEBUG] Fetching for operation:', operationId)
    
    // Primeiro, teste simples sem filtro de status
    const { data: allData, error: allError } = await supabase
      .from('assigned_missions')
      .select('id, status, submitted_at, photo_url')
      .eq('operation_id', operationId)
    
    console.log('[FEED DEBUG] ALL assigned missions:', allData)
    
    const { data, error } = await supabase
      .from('assigned_missions')
      .select(
        'id, operation_id, user_id, status, photo_url, caption, submitted_at, missions(title,category,difficulty), profiles(id,username,avatar_url), votes(voter_id,vote), reactions(user_id,reaction_type), favorite_photos(user_id)'
      )
      .eq('operation_id', operationId)
      .in('status', ['completed', 'rejected'])
      .order('submitted_at', { ascending: false })

    console.log('[FEED DEBUG] Filtered query result:', { 
      data, 
      error, 
      count: data?.length,
      statuses: data?.map(d => d.status),
      firstItem: data?.[0]
    })

    const normalized = ((data || []) as unknown as FeedItem[]).map((item) => ({
      ...item,
      missions: Array.isArray(item.missions) ? item.missions[0] || null : item.missions || null,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] || null : item.profiles || null,
    }))

    console.log('[FEED DEBUG] Normalized items:', normalized.length, normalized)
    setItems(normalized)
    setLoading(false)
  }, [operationId])

  useEffect(() => {
    fetchFeed()

    const supabase = createClient()
    const channel = supabase
      .channel(`feed-${operationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'assigned_missions',
          filter: `operation_id=eq.${operationId}`,
        },
        () => {
          setNewCount((c) => c + 1)
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchFeed())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => fetchFeed())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorite_photos' }, () => fetchFeed())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [operationId, fetchFeed])

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-sm overflow-hidden">
            <div className="p-4 space-y-2">
              <div className="redacted h-4 w-32" />
            </div>
            <div className="redacted w-full" style={{ paddingBottom: '75%' }} />
            <div className="p-4 space-y-2">
              <div className="redacted h-3 w-full" />
              <div className="redacted h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {newCount > 0 ? (
        <button
          onClick={() => {
            setNewCount(0)
            fetchFeed()
            window.scrollTo({ top: 0 })
          }}
          className="w-full text-center font-spy text-xs text-gold uppercase tracking-wider py-2 border border-border-gold rounded-sm bg-[#0f0e0a]"
        >
          {newCount} nova(s) evidencia(s)
        </button>
      ) : null}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="redacted text-sm mx-auto w-48 h-4 mb-3" />
          <p className="font-spy text-ink-muted text-xs uppercase tracking-wider">NENHUMA EVIDENCIA SUBMETIDA</p>
        </div>
      ) : (
        items.map((item) => (
          <FeedCard key={item.id} item={item} currentUserId={userId} onUpdate={fetchFeed} />
        ))
      )}
    </div>
  )
}

