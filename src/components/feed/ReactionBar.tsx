'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { REACTION_EMOJIS } from '@/lib/utils'

type ReactionType = 'funny' | 'creative' | 'precise' | 'bold' | 'gross'

interface Reaction {
  user_id: string
  reaction_type: ReactionType
}

interface ReactionBarProps {
  submissionId: string
  currentUserId: string
  reactions: Reaction[]
  onReact: (submissionId: string, reactionType: ReactionType) => Promise<void>
}

export function ReactionBar({ submissionId, currentUserId, reactions, onReact }: ReactionBarProps) {
  const [isReacting, setIsReacting] = useState(false)
  const reduceMotion = useReducedMotion()

  const getReactionCount = (type: ReactionType) => reactions.filter((r) => r.reaction_type === type).length

  const hasUserReacted = (type: ReactionType) =>
    reactions.some((r) => r.user_id === currentUserId && r.reaction_type === type)

  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return

    setIsReacting(true)
    try {
      await onReact(submissionId, type)
    } finally {
      setIsReacting(false)
    }
  }

  return (
    <div className="pt-3 border-t border-[#1a1a1a]">
      <div className="flex gap-1">
        {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => {
          const count = getReactionCount(type)
          const isActive = hasUserReacted(type)

          return (
            <motion.button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={isReacting}
              className={`flex-1 py-2 px-2 rounded-sm transition-all flex items-center justify-center gap-1 ${
                isActive ? 'bg-[#1a1a1a] border border-[#3d3520]' : 'bg-transparent hover:bg-[#1a1a1a]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              whileTap={reduceMotion || isActive ? undefined : { scale: 1.15 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 17 }}
            >
              <span className="text-base">{REACTION_EMOJIS[type]}</span>
              <span
                className={`font-['Inter'] text-[12px] font-mono ${
                  count === 0 ? 'text-[#3a3632]' : 'text-[#6b6660]'
                }`}
              >
                {count}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

