import { RANK_COLORS, normalizeRank } from '@/lib/utils'

type Rank = 'RECRUTA' | 'AGENTE' | 'SENIOR' | 'OPERADOR' | 'VETERANO' | 'LENDA'

interface RankInsigniaProps {
  rank: string | null | undefined
  size?: number
  showLabel?: boolean
}

const RANK_LEVEL: Record<Rank, number> = {
  RECRUTA: 0,
  AGENTE: 1,
  SENIOR: 2,
  OPERADOR: 3,
  VETERANO: 4,
  LENDA: 5,
}

export function RankInsignia({ rank, size = 16, showLabel = false }: RankInsigniaProps) {
  const normalized = normalizeRank(rank) as Rank
  const color = RANK_COLORS[normalized] || '#6b6660'
  const filled = Math.min(RANK_LEVEL[normalized], 4)

  const symbols =
    normalized === 'LENDA'
      ? ['\u2605', '\u2605', '\u2605', '\u2605']
      : Array.from({ length: 4 }, (_, index) => (index < filled ? '\u25CF' : '\u25CB'))

  return (
    <span className="inline-flex items-center gap-1" style={{ color }}>
      <span className="font-mono" style={{ fontSize: `${Math.max(10, Math.round(size * 0.8))}px`, lineHeight: 1 }}>
        {symbols.join(' ')}
      </span>
      {showLabel ? (
        <span className="font-['Special_Elite'] uppercase tracking-wider" style={{ fontSize: `${Math.max(10, Math.round(size * 0.65))}px` }}>
          {normalized}
        </span>
      ) : null}
    </span>
  )
}
