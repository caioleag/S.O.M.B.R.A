'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { VoteButtons } from './VoteButtons'
import { ReactionBar } from './ReactionBar'
import { FavoriteButton } from './FavoriteButton'
import { playSfx } from '@/lib/sfx'

type ReactionType = 'funny' | 'creative' | 'precise' | 'bold' | 'gross'

interface FeedItem {
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
    objective: string
  } | null
  decision?: 'approved' | 'rejected' | null
  profiles?: {
    id: string
    username: string | null
    avatar_url: string | null
  } | null
  votes?: Array<{
    voter_id: string
    vote: 'approve' | 'reject'
  }>
  reactions?: Array<{
    user_id: string
    reaction_type: ReactionType
  }>
  favorite_photos?: Array<{ user_id: string }>
}

interface FeedCardProps {
  item: FeedItem
  currentUserId: string
  onUpdate: () => Promise<void>
}

export function FeedCard({ item, currentUserId, onUpdate }: FeedCardProps) {
  const [showLightbox, setShowLightbox] = useState(false)
  const [working, setWorking] = useState(false)
  const reduceMotion = useReducedMotion()

  const submission = {
    id: item.id,
    user: {
      id: item.user_id,
      username: item.profiles?.username || 'agente',
      avatar_url: item.profiles?.avatar_url || undefined,
    },
    mission: {
      title: item.missions?.title || 'Missao sem titulo',
      category: item.missions?.category || 'desconhecida',
      difficulty: item.missions?.difficulty || 'easy',
      objective: item.missions?.objective || '',
    },
    photo_url: item.photo_url || '',
    caption: item.caption || undefined,
    status: item.status,
    decision: item.decision,
  }

  const votes = useMemo(
    () => (item.votes || []).map((v) => ({ user_id: v.voter_id, vote: v.vote })),
    [item.votes]
  )

  const reactions = useMemo(
    () => item.reactions || [],
    [item.reactions]
  )

  const favoriteCount = item.favorite_photos?.length || 0
  const isFavorite = (item.favorite_photos || []).some((fav) => fav.user_id === currentUserId)

  const handleVote = async (submissionId: string, vote: 'approve' | 'reject') => {
    setWorking(true)
    try {
      const response = await fetch(`/api/operations/${item.operation_id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_mission_id: submissionId, vote }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        playSfx('error', 0.3)
        throw new Error(data.error || 'Nao foi possivel registrar voto.')
      }

      playSfx(vote === 'approve' ? 'success' : 'undo', 0.28)
      await onUpdate()
    } finally {
      setWorking(false)
    }
  }

  const handleReact = async (submissionId: string, reactionType: string) => {
    setWorking(true)
    try {
      const response = await fetch(`/api/operations/${item.operation_id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_mission_id: submissionId, reaction_type: reactionType }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        playSfx('error', 0.3)
        throw new Error(data.error || 'Nao foi possivel registrar reacao.')
      }

      playSfx('click', 0.22)
      await onUpdate()
    } finally {
      setWorking(false)
    }
  }

  const handleFavorite = async () => {
    setWorking(true)
    try {
      const response = await fetch(`/api/operations/${item.operation_id}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_mission_id: item.id }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        playSfx('error', 0.3)
        throw new Error(data.error || 'Nao foi possivel atualizar favorito.')
      }

      playSfx('secret', 0.2)
      await onUpdate()
    } finally {
      setWorking(false)
    }
  }

  const isApproved = submission.decision === 'approved'
  const isRejected = submission.decision === 'rejected'

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="font-['Special_Elite'] text-sm text-[#e8e4d9]">{submission.user.username}</span>
          <div className="flex items-center gap-2">
            <span className="font-['Inter'] text-xs text-[#6b6660] uppercase">{submission.mission.category}</span>
            <DifficultyBadge difficulty={submission.mission.difficulty} />
          </div>
        </div>

        {submission.photo_url ? (
          <div className="relative mb-3 cursor-pointer" onClick={() => setShowLightbox(true)}>
            <div className="relative w-full aspect-[4/3] bg-[#1a1a1a] rounded-sm overflow-hidden">
              <Image
                src={submission.photo_url}
                alt="Mission evidence"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>

            <AnimatePresence>
              {(isApproved || isRejected) && (
                <motion.div
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 0, scale: 0.8 }}
                  animate={reduceMotion ? { opacity: 0.85 } : { opacity: 0.85, rotate: isApproved ? -6 : -8, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                  className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                    isApproved ? 'stamp-approved' : 'stamp-rejected'
                  }`}
                >
                  <div
                    className={`px-6 py-3 border-2 ${
                      isApproved ? 'border-[#4a8c4a] text-[#4a8c4a]' : 'border-[#c94040] text-[#c94040]'
                    } font-['Special_Elite'] text-xl uppercase tracking-[0.15em] rotate-[-2deg]`}
                  >
                    {isApproved ? 'APROVADO' : 'REJEITADO'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}

        <div className="space-y-2 mb-3">
          <p className="font-['Special_Elite'] text-sm text-[#e8e4d9]">{submission.mission.title}</p>
          <p className="font-['Inter'] text-[13px] text-[#a39d91] leading-relaxed">{submission.mission.objective}</p>
          {submission.caption && (
            <p className="font-['Inter'] text-[13px] text-[#6b6660] italic border-l-2 border-[#242424] pl-2">"{submission.caption}"</p>
          )}
        </div>

        <div className="mb-3 flex justify-end">
          <FavoriteButton
            isActive={isFavorite}
            count={favoriteCount}
            onToggle={handleFavorite}
            disabled={working}
          />
        </div>

        <VoteButtons
          submissionId={submission.id}
          currentUserId={currentUserId}
          submitterId={submission.user.id}
          votes={votes}
          decision={submission.decision}
          onVote={handleVote}
        />

        <ReactionBar
          submissionId={submission.id}
          currentUserId={currentUserId}
          reactions={reactions}
          onReact={handleReact as (submissionId: string, reactionType: ReactionType) => Promise<void>}
        />
      </Card>

      <AnimatePresence>
        {showLightbox && submission.photo_url ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLightbox(false)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <Image src={submission.photo_url} alt="Mission evidence" width={1200} height={900} className="w-full h-auto object-contain" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

