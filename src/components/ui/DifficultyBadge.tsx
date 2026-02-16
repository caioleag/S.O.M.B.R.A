import { getDifficultyDots, getDifficultyColor } from '@/lib/utils'

interface DifficultyBadgeProps {
  difficulty: string
  showPoints?: boolean
  points?: number
}

export function DifficultyBadge({ difficulty, showPoints, points }: DifficultyBadgeProps) {
  const color = getDifficultyColor(difficulty)
  const dots = getDifficultyDots(difficulty)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ color }} className="font-mono text-sm tracking-tight">{dots}</span>
      {showPoints && points && (
        <span className="font-mono text-sm text-gold">{points}<span className="text-ink-muted">pt</span></span>
      )}
    </span>
  )
}
