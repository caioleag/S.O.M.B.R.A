'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { didRankUp, normalizeRank } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { RankInsignia } from '@/components/rank/RankInsignia'

const STORAGE_KEY = 'sombra:last-rank'

export function RankPromotionWatcher() {
  const [open, setOpen] = useState(false)
  const [newRank, setNewRank] = useState<string>('RECRUTA')

  useEffect(() => {
    const supabase = createClient()
    let currentUserId = ''

    const handleRank = (rank: string | null | undefined) => {
      const normalized = normalizeRank(rank)
      const previous = localStorage.getItem(STORAGE_KEY)

      if (previous && didRankUp(previous, normalized)) {
        setNewRank(normalized)
        setOpen(true)
      }

      localStorage.setItem(STORAGE_KEY, normalized)
    }

    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        const user = data.user
        if (!user) return

        currentUserId = user.id

        const { data: profiles } = await supabase.from('profiles').select('rank').eq('id', user.id).limit(1)
        handleRank(profiles?.[0]?.rank)
      })
      .catch(() => undefined)

    const channel = supabase
      .channel('profile-rank-watcher')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          if (!currentUserId || payload.new.id !== currentUserId) return
          handleRank(String(payload.new.rank || 'RECRUTA'))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="PROMOVIDO">
      <div className="space-y-3">
        <span className="stamp stamp-approved">[PROMOVIDO]</span>
        <p className="font-['Special_Elite'] text-sm uppercase tracking-wider text-ink">Nova patente: {newRank}</p>
        <RankInsignia rank={newRank} size={24} showLabel={false} />
      </div>
    </Modal>
  )
}

