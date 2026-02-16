'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Copy, Share2 } from 'lucide-react'
import { playSfx } from '@/lib/sfx'

interface InviteCardProps {
  code: string
  operationId: string
}

export function InviteCard({ code, operationId }: InviteCardProps) {
  const link = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${code}`
    : `/join/${code}`

  const handleCopy = () => {
    navigator.clipboard?.writeText(link)
    playSfx('success', 0.25)
  }
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'S.O.M.B.R.A', url: link })
      playSfx('morse', 0.22)
    } else {
      handleCopy()
    }
  }

  return (
    <div className="border border-border-gold bg-surface rounded-sm p-4">
      <p className="font-spy text-ink-muted text-xs uppercase tracking-wider mb-3">
        CÓDIGO DE ACESSO
      </p>
      <div className="flex items-center justify-between">
        <span className="font-spy text-gold text-2xl tracking-[0.4em]">{code}</span>
        <div className="bg-white p-2 rounded-sm">
          <QRCodeSVG value={link} size={96} />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 border border-border text-ink text-xs font-spy uppercase tracking-wider py-2 hover:border-gold transition-colors rounded-sm"
        >
          <Copy size={14} /> COPIAR LINK
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 border border-border text-ink text-xs font-spy uppercase tracking-wider py-2 hover:border-gold transition-colors rounded-sm"
        >
          <Share2 size={14} /> COMPARTILHAR
        </button>
      </div>
    </div>
  )
}
