'use client'

import { Heart } from 'lucide-react'

interface FavoriteButtonProps {
  isActive: boolean
  count?: number
  onToggle: () => Promise<void>
  disabled?: boolean
}

export function FavoriteButton({ isActive, count = 0, onToggle, disabled }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded-sm transition-colors ${
        isActive
          ? 'border-[#3d3520] bg-[#1a1a1a] text-[#c9a227]'
          : 'border-[#242424] text-[#6b6660] hover:border-[#3d3520]'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <Heart size={14} fill={isActive ? '#c9a227' : 'none'} />
      <span className="font-['Inter'] text-xs font-mono">{count}</span>
    </button>
  )
}

