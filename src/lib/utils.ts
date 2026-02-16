export const CATEGORY_LABELS: Record<string, string> = {
  vigilancia: 'VIGILANCIA',
  coleta: 'COLETA',
  infiltracao: 'INFILTRACAO',
  disfarce: 'DISFARCE',
  reconhecimento: 'RECONHECIMENTO',
}

export const CATEGORY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  vigilancia: { text: '#4a8c4a', border: '#1e3f1e', bg: '#0d1f0d' },
  coleta: { text: '#c94040', border: '#3f1e1e', bg: '#1f0d0d' },
  infiltracao: { text: '#4a7ab5', border: '#1e3a52', bg: '#0d1a26' },
  disfarce: { text: '#8a5abf', border: '#2a1e3f', bg: '#150d1f' },
  reconhecimento: { text: '#c9a227', border: '#3f320e', bg: '#1f180d' },
}

export const RANK_ORDER: Record<string, number> = {
  RECRUTA: 0,
  AGENTE: 1,
  SENIOR: 2,
  OPERADOR: 3,
  VETERANO: 4,
  LENDA: 5,
}

export const RANK_LABELS: Record<string, string> = {
  RECRUTA: 'Recruta',
  AGENTE: 'Agente',
  SENIOR: 'Senior',
  OPERADOR: 'Operador',
  VETERANO: 'Veterano',
  LENDA: 'Lenda',
}

export const RANK_COLORS: Record<string, string> = {
  RECRUTA: '#6b6660',
  AGENTE: '#4a7ab5',
  SENIOR: '#4a8c4a',
  OPERADOR: '#c9a227',
  VETERANO: '#c94040',
  LENDA: '#c9a227',
}

export const REACTION_EMOJIS: Record<string, string> = {
  funny: '\u{1F602}',
  creative: '\u{1F3A8}',
  precise: '\u{1F3AF}',
  bold: '\u{1F633}',
  gross: '\u{1F922}',
}

export function normalizeRank(rank: string | null | undefined): keyof typeof RANK_ORDER {
  const value = (rank || 'RECRUTA').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const compact = value.replace(/[^A-Z]/g, '')

  if (value in RANK_ORDER) return value as keyof typeof RANK_ORDER
  if (compact === 'SENIOR' || compact === 'SNIOR') return 'SENIOR'

  return 'RECRUTA'
}

export function rankColor(rank: string | null | undefined): string {
  return RANK_COLORS[normalizeRank(rank)] || RANK_COLORS.RECRUTA
}

export function didRankUp(previousRank: string | null | undefined, nextRank: string | null | undefined): boolean {
  return RANK_ORDER[normalizeRank(nextRank)] > RANK_ORDER[normalizeRank(previousRank)]
}

export function getDifficultyDots(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return '\u25CF\u25CB\u25CB'
    case 'medium':
      return '\u25CF\u25CF\u25CB'
    case 'hard':
      return '\u25CF\u25CF\u25CF'
    default:
      return '\u25CB\u25CB\u25CB'
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return '#4a8c4a'
    case 'medium':
      return '#c9a227'
    case 'hard':
      return '#c94040'
    default:
      return '#6b6660'
  }
}

export function getCurrentDay(startedAt: string, resetHour: number): number {
  const start = new Date(startedAt)
  const now = new Date()
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), resetHour)
  const diffMs = now.getTime() - startDay.getTime()
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1)
}

export function getTimeUntilReset(resetHour: number): string {
  const now = new Date()
  const next = new Date()
  next.setHours(resetHour, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  const diff = next.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatPoints(points: number): string {
  return `${points}pt`
}
