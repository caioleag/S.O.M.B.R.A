'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { normalizeRank, rankColor } from '@/lib/utils'
import { RankInsignia } from '@/components/rank/RankInsignia'

type Phase = 'opening' | 'ranking' | 'stats' | 'gallery' | 'badges' | 'done'

interface Props {
  params: { id: string }
}

interface BadgeItem {
  name?: string
  type?: string
  operation_id?: string
}

export default function CeremonyPage({ params }: Props) {
  const [phase, setPhase] = useState<Phase>('opening')
  const [members, setMembers] = useState<
    Array<{
      user_id: string
      total_points: number
      profiles: { username: string; avatar_url: string | null; rank: string; badges_earned: BadgeItem[] }
    }>
  >([])
  const [topPhotos, setTopPhotos] = useState<Array<{ id: string; photo_url: string; profiles: { username: string }; missions: { title: string } }>>([])
  const [opName, setOpName] = useState('')
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('operations')
      .select('name')
      .eq('id', params.id)
      .single()
      .then(({ data }) => {
        if (data) setOpName(data.name)
      })

    supabase
      .from('operation_members')
      .select('user_id, total_points, profiles(username, avatar_url, rank, badges_earned)')
      .eq('operation_id', params.id)
      .order('total_points', { ascending: false })
      .then(({ data }) => setMembers((data || []) as any))

    supabase
      .from('assigned_missions')
      .select('id, photo_url, profiles(username), missions(title), votes(vote)')
      .eq('operation_id', params.id)
      .eq('status', 'completed')
      .not('photo_url', 'is', null)
      .then(({ data }) => {
        const sorted = (data || [])
          .map((item) => ({
            ...item,
            approveCount: ((item as any).votes || []).filter((vote: { vote: string }) => vote.vote === 'approve').length,
          }))
          .sort((a, b) => b.approveCount - a.approveCount)
          .slice(0, 6)
        setTopPhotos(sorted as any)
      })
  }, [params.id])

  useEffect(() => {
    const timings: Record<Phase, number> = {
      opening: 4000,
      ranking: 6000,
      stats: 5000,
      gallery: 6000,
      badges: 5000,
      done: 0,
    }

    if (phase === 'done') return

    const timer = setTimeout(() => {
      const order: Phase[] = ['opening', 'ranking', 'stats', 'gallery', 'badges', 'done']
      const next = order[order.indexOf(phase) + 1]
      if (next) setPhase(next)
    }, timings[phase])

    return () => clearTimeout(timer)
  }, [phase])

  const operationBadges = useMemo(
    () =>
      members.flatMap((member) => {
        const badges = Array.isArray(member.profiles?.badges_earned) ? member.profiles.badges_earned : []
        return badges
          .filter((badge) => !badge.operation_id || badge.operation_id === params.id)
          .map((badge) => ({ user: member.profiles.username, name: badge.name || badge.type || 'Badge' }))
      }),
    [members, params.id]
  )

  return (
    <div className="fixed inset-0 bg-base flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'opening' ? (
          <motion.div
            key="opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center px-4"
          >
            <TypewriterText text="OPERACAO ENCERRADA" className="font-spy text-gold text-2xl uppercase tracking-wider" />
            <p className="font-spy text-ink-muted text-sm mt-4 uppercase tracking-wider">{opName}</p>
          </motion.div>
        ) : null}

        {phase === 'ranking' ? (
          <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm px-4 space-y-3">
            <p className="font-spy text-ink-muted text-xs uppercase tracking-wider text-center mb-4">CLASSIFICACAO FINAL</p>
            {members.map((member, index) => {
              const rank = normalizeRank(member.profiles?.rank)
              return (
                <motion.div
                  key={member.user_id}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.2, type: 'spring' }}
                  className={`flex items-center gap-3 p-3 border rounded-sm ${index === 0 ? 'border-gold bg-[#0f0e0a]' : 'border-border bg-surface'}`}
                >
                  <span className="font-mono text-xs w-6" style={{ color: index === 0 ? '#c9a227' : '#3a3632' }}>
                    #{index + 1}
                  </span>
                  {member.profiles?.avatar_url ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={member.profiles.avatar_url} alt="avatar" width={32} height={32} className="object-cover w-full h-full" />
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <p className="font-spy text-ink text-sm">{member.profiles?.username}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-spy text-[10px] uppercase" style={{ color: rankColor(rank) }}>
                        {rank}
                      </p>
                      <RankInsignia rank={rank} size={12} />
                    </div>
                  </div>
                  <span className="font-mono text-gold">
                    {member.total_points}
                    <span className="text-ink-muted text-xs">pt</span>
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        ) : null}

        {phase === 'stats' ? (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm px-4 space-y-3">
            <p className="font-spy text-gold text-xs uppercase tracking-wider text-center mb-4">RELATORIO DE INTELIGENCIA</p>
            {members.slice(0, 3).map((member, index) => (
              <motion.div
                key={member.user_id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.3 }}
                className="bg-surface border border-border-gold rounded-sm p-4"
              >
                <p className="font-spy text-ink text-sm">
                  <span className="text-gold">{member.profiles?.username}</span> completou{' '}
                  <span className="text-gold">
                    {Math.round(
                      (member.total_points / (members.reduce((acc, curr) => acc + curr.total_points, 0) || 1)) * 100
                    )}
                    %
                  </span>{' '}
                  dos pontos totais.
                </p>
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {phase === 'gallery' ? (
          <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm px-4">
            <p className="font-spy text-gold text-xs uppercase tracking-wider text-center mb-4">GALERIA DE EVIDENCIAS</p>
            <div className="grid grid-cols-2 gap-1">
              {topPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.1 }}
                  className="space-y-1"
                >
                  {photo.photo_url ? (
                    <div className="relative aspect-square">
                      <Image src={photo.photo_url} alt="top foto" fill className="object-cover" />
                    </div>
                  ) : null}
                  <p className="font-spy text-ink-faint text-[9px] uppercase truncate">{photo.profiles?.username}</p>
                  <p className="font-spy text-ink-muted text-[9px] uppercase truncate">{photo.missions?.title}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}

        {phase === 'badges' ? (
          <motion.div key="badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm px-4 space-y-4">
            <p className="font-spy text-gold text-xs uppercase tracking-wider text-center mb-4">CONDECORACOES</p>
            {operationBadges.length > 0 ? (
              operationBadges.map((badge, index) => (
                <motion.div
                  key={`${badge.user}-${badge.name}-${index}`}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: -15 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotate: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.2, type: 'spring', bounce: 0.4 }}
                  className="flex items-center gap-3 bg-surface border border-border-gold rounded-sm p-4"
                >
                  <span className="stamp stamp-approved text-xs">{badge.name}</span>
                  <span className="font-spy text-ink text-sm">{badge.user} recebeu {badge.name}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-ink-muted text-sm text-center font-spy uppercase tracking-wider">NENHUMA CONDECORACAO DESTA VEZ.</p>
            )}
          </motion.div>
        ) : null}

        {phase === 'done' ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-4 space-y-6">
            <p className="font-spy text-gold text-xl uppercase tracking-wider">MISSAO CUMPRIDA</p>
            <p className="font-spy text-ink-muted text-xs uppercase tracking-wider">Bom trabalho, agentes.</p>
            <Link
              href="/"
              className="inline-block font-spy text-xs uppercase tracking-wider border border-border text-ink px-6 py-3 rounded-sm hover:border-gold transition-colors"
            >
              VOLTAR AO QUARTEL-GENERAL
            </Link>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {phase !== 'done' ? (
        <button
          onClick={() => setPhase('done')}
          className="absolute bottom-8 right-4 font-spy text-ink-faint text-[10px] uppercase tracking-wider"
        >
          PULAR ?
        </button>
      ) : null}
    </div>
  )
}

function TypewriterText({ text, className }: { text: string; className: string }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1))
      i += 1
      if (i >= text.length) clearInterval(interval)
    }, 80)

    return () => clearInterval(interval)
  }, [text])

  return <p className={`${className} typewriter-cursor`}>{displayed}</p>
}
