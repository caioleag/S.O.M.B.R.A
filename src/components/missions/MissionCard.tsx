'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DifficultyBadge } from '@/components/ui/DifficultyBadge'
import { Typewriter } from '@/components/ui/Typewriter'

const CATEGORY_COLORS = {
  infiltracao: { bg: '#0d1a26', text: '#4a7ab5', border: '#1e3a52' },
  vigilancia: { bg: '#0d1f0d', text: '#4a8c4a', border: '#1e3f1e' },
  coleta: { bg: '#1f0d0d', text: '#c94040', border: '#3f1e1e' },
  disfarce: { bg: '#150d1f', text: '#8a5abf', border: '#2a1e3f' },
  reconhecimento: { bg: '#1f180d', text: '#c9a227', border: '#3f320e' },
}

interface MissionCardProps {
  mission: {
    id: string
    category: string
    title: string
    objective: string
    difficulty: 'easy' | 'medium' | 'hard'
    points: number
  }
  isSelected?: boolean
  onAccept?: (missionId: string) => void
  disabled?: boolean
}

export function MissionCard({ mission, isSelected = false, onAccept, disabled = false }: MissionCardProps) {
  const categoryKey = mission.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') as keyof typeof CATEGORY_COLORS
  const colors = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.vigilancia

  return (
    <Card className={`border-l-4 ${isSelected ? 'border-[#3d3520] bg-[#0f0e0a]' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-['Special_Elite'] uppercase tracking-wider" style={{ color: colors.text }}>
          {mission.category}
        </span>
        <div className="flex items-center gap-2">
          <DifficultyBadge difficulty={mission.difficulty} />
          <span className="font-['Inter'] text-sm">
            <span className="text-[#c9a227]">{mission.points}</span>
            <span className="text-[#6b6660]">pt</span>
          </span>
        </div>
      </div>

      <Typewriter
        text={mission.title}
        speed={16}
        as="h3"
        className="font-['Special_Elite'] text-base text-[#e8e4d9] mb-2 leading-tight block"
      />

      <p className="font-['Inter'] text-[13px] text-[#6b6660] mb-4 line-clamp-3 leading-relaxed">{mission.objective}</p>

      {!isSelected && onAccept ? (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => onAccept(mission.id)} disabled={disabled}>
            ACEITAR MISSAO
          </Button>
        </div>
      ) : null}

      {isSelected ? (
        <div className="text-center py-1">
          <span className="text-[#c9a227] font-['Special_Elite'] text-[10px] tracking-wider">[MISSAO SELECIONADA]</span>
        </div>
      ) : null}
    </Card>
  )
}

