'use client'

import { useState, useEffect } from 'react'
import { MissionCard } from './MissionCard'

interface Mission {
  id: string
  category: string
  title: string
  objective: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  status?: string
}

interface MissionPoolProps {
  missions: Mission[]
  selectedMissionId?: string
  onSelectMission: (missionId: string) => void
  resetHour: number
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'

export function MissionPool({ missions, selectedMissionId, onSelectMission, resetHour }: MissionPoolProps) {
  const [filter, setFilter] = useState<DifficultyFilter>('all')
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(resetHour, 0, 0, 0)

      if (now.getHours() < resetHour) {
        tomorrow.setDate(tomorrow.getDate() - 1)
      }

      const diff = tomorrow.getTime() - now.getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [resetHour])

  const filteredMissions = filter === 'all' ? missions : missions.filter((mission) => mission.difficulty === filter)

  const availableMissions = filteredMissions.filter((mission) => !mission.status || mission.status === 'available')

  return (
    <div className="px-4 py-4">
      <div className="mb-4 text-center">
        <span className="font-['Inter'] text-sm text-[#6b6660] font-mono">VIRADA EM {timeLeft}</span>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-sm text-[10px] font-['Special_Elite'] uppercase tracking-wider whitespace-nowrap border transition-colors ${
            filter === 'all' ? 'border-[#c9a227] text-[#c9a227]' : 'border-[#242424] text-[#6b6660]'
          }`}
        >
          TODAS
        </button>
        <button
          onClick={() => setFilter('easy')}
          className={`px-3 py-1.5 rounded-sm text-[10px] font-['Special_Elite'] uppercase tracking-wider whitespace-nowrap border transition-colors ${
            filter === 'easy' ? 'border-[#c9a227] text-[#c9a227]' : 'border-[#242424] text-[#6b6660]'
          }`}
        >
          {'\u25CF\u25CB\u25CB'} FACIL
        </button>
        <button
          onClick={() => setFilter('medium')}
          className={`px-3 py-1.5 rounded-sm text-[10px] font-['Special_Elite'] uppercase tracking-wider whitespace-nowrap border transition-colors ${
            filter === 'medium' ? 'border-[#c9a227] text-[#c9a227]' : 'border-[#242424] text-[#6b6660]'
          }`}
        >
          {'\u25CF\u25CF\u25CB'} MEDIA
        </button>
        <button
          onClick={() => setFilter('hard')}
          className={`px-3 py-1.5 rounded-sm text-[10px] font-['Special_Elite'] uppercase tracking-wider whitespace-nowrap border transition-colors ${
            filter === 'hard' ? 'border-[#c9a227] text-[#c9a227]' : 'border-[#242424] text-[#6b6660]'
          }`}
        >
          {'\u25CF\u25CF\u25CF'} DIFICIL
        </button>
      </div>

      <div className="space-y-3">
        {availableMissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-2">
              <div className="h-4 bg-[#242424] w-48 mx-auto rounded" />
              <p className="text-[#6b6660] font-['Inter'] text-sm">NENHUMA MISSAO DISPONIVEL</p>
            </div>
          </div>
        ) : (
          availableMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isSelected={mission.id === selectedMissionId}
              onAccept={onSelectMission}
              disabled={Boolean(selectedMissionId && selectedMissionId !== mission.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
