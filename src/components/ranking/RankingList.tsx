'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { normalizeRank, rankColor } from '@/lib/utils'
import { RankInsignia } from '@/components/rank/RankInsignia'

interface RankingMember {
  user_id: string
  total_points: number
  user: {
    username: string
    avatar_url?: string | null
    rank: string
  }
}

interface RankingListProps {
  operationId: string
  currentUserId: string
}

export function RankingList({ operationId, currentUserId }: RankingListProps) {
  const [members, setMembers] = useState<RankingMember[]>([])
  const [flashingId, setFlashingId] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()

  const fetchMembers = useCallback(async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('operation_members')
      .select('user_id,total_points,user:profiles(username, avatar_url, rank)')
      .eq('operation_id', operationId)
      .order('total_points', { ascending: false })

    if (data) setMembers(data as unknown as RankingMember[])
  }, [operationId])

  useEffect(() => {
    fetchMembers()

    const supabase = createClient()

    const channel = supabase
      .channel(`ranking-${operationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'operation_members',
          filter: `operation_id=eq.${operationId}`,
        },
        async (payload) => {
          const updatedMemberId = String(payload.new.user_id || '')
          if (updatedMemberId) {
            setFlashingId(updatedMemberId)
            setTimeout(() => setFlashingId(null), 900)
          }
          await fetchMembers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [operationId, fetchMembers])

  const sortedMembers = [...members].sort((a, b) => b.total_points - a.total_points)

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider">CLASSIFICACAO</span>
        <div className="flex items-center gap-1">
          <span className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider">AO VIVO</span>
          <motion.span
            animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 0.3, 1] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
            className="text-[#4a8c4a] text-xs"
          >
            {'\u25CF'}
          </motion.span>
        </div>
      </div>

      <div className="space-y-0">
        {sortedMembers.map((member, index) => {
          const position = index + 1
          const isCurrentUser = member.user_id === currentUserId
          const isLeader = position === 1
          const isFlashing = flashingId === member.user_id
          const normalizedRank = normalizeRank(member.user.rank)

          return (
            <motion.div
              key={member.user_id}
              initial={false}
              animate={{ backgroundColor: isFlashing ? 'rgba(201, 162, 39, 0.1)' : 'transparent' }}
              transition={{ duration: 0.9 }}
              className={`flex items-center gap-3 py-3 px-2 border-b border-[#1a1a1a] ${
                isCurrentUser ? 'bg-[#0f0e0a]' : ''
              } ${isLeader ? 'border-l-2 border-l-[#c9a227]' : 'border-l-2 border-l-transparent'}`}
            >
              <span className={`font-['Inter'] text-sm font-mono w-8 ${isLeader ? 'text-[#c9a227]' : 'text-[#3a3632]'}`}>
                #{String(position).padStart(2, '0')}
              </span>

              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#242424] flex-shrink-0">
                {member.user.avatar_url ? (
                  <Image src={member.user.avatar_url} alt={member.user.username} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#6b6660] text-xs">
                    {member.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-['Special_Elite'] text-sm text-[#e8e4d9] truncate">{member.user.username}</div>
                <div className="flex items-center gap-2">
                  <span className="font-['Special_Elite'] text-[10px] uppercase" style={{ color: rankColor(normalizedRank) }}>
                    {normalizedRank}
                  </span>
                  <RankInsignia rank={normalizedRank} size={12} />
                </div>
              </div>

              <div className="font-['Inter'] font-mono text-right">
                <span className="text-[#c9a227] text-base">{member.total_points}</span>
                <span className="text-[#6b6660] text-xs">pt</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {sortedMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="space-y-2">
            <div className="h-4 bg-[#242424] w-48 mx-auto rounded" />
            <p className="text-[#6b6660] font-['Inter'] text-sm">AGUARDANDO CLASSIFICACAO</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

