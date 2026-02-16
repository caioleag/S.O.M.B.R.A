'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MissionPool } from '@/components/missions/MissionPool'
import { playSfx } from '@/lib/sfx'

interface Mission {
  id: string
  category: string
  title: string
  objective: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  status?: string
}

interface AssignedMission {
  id: string
  mission_id: string
  status: 'available' | 'selected' | 'completed' | 'failed' | 'rejected'
}

interface Props {
  operationId: string
  userId: string
  resetHour: number
}

export function MissionPoolWrapper({ operationId, resetHour }: Props) {
  const router = useRouter()
  const [missions, setMissions] = useState<Mission[]>([])
  const [assigned, setAssigned] = useState<AssignedMission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMissions = useCallback(async () => {
    const response = await fetch(`/api/operations/${operationId}/missions`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar as missoes.')
    }

    const data = await response.json()
    setMissions(data.missions ?? [])
    setAssigned(data.assigned ?? [])
  }, [operationId])

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetchMissions()
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Falha ao carregar missoes.')
      })
      .finally(() => setLoading(false))
  }, [fetchMissions])

  const selectedAssignedMission = useMemo(
    () => assigned.find((item) => item.status === 'selected'),
    [assigned]
  )

  const completedMission = useMemo(
    () => assigned.find((item) => item.status === 'completed'),
    [assigned]
  )

  const missionsWithStatus = useMemo(
    () =>
      missions.map((mission) => {
        const assignment = assigned.find((item) => item.mission_id === mission.id)
        return {
          ...mission,
          status: assignment?.status ?? 'available',
        }
      }),
    [missions, assigned]
  )

  const handleSelectMission = async (missionId: string) => {
    try {
      const response = await fetch(`/api/operations/${operationId}/missions/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission_id: missionId }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel selecionar a missao.')
      }

      playSfx('mission', 0.3)
      router.push(`/operations/${operationId}/missions/${data.id}`)
    } catch (err) {
      playSfx('error', 0.3)
      setError(err instanceof Error ? err.message : 'Falha ao selecionar missao.')
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-surface border border-border rounded-sm p-4 space-y-2">
            <div className="redacted h-3 w-20" />
            <div className="redacted h-5 w-3/4" />
            <div className="redacted h-4 w-full" />
            <div className="redacted h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {completedMission ? (
        <div className="px-4 pt-4 pb-4">
          <button
            onClick={() => router.push(`/operations/${operationId}/missions/${completedMission.id}`)}
            className="w-full font-['Special_Elite'] text-xs uppercase tracking-wider border border-[#4a8c4a] bg-[#0f0e0a] text-[#4a8c4a] py-3 rounded-sm"
          >
            ✓ MISSAO DO DIA CONCLUIDA - VER DETALHES
          </button>
          <p className="text-center text-[#6b6660] font-['Inter'] text-xs mt-3">
            Aguarde a proxima virada para novas missoes
          </p>
        </div>
      ) : selectedAssignedMission ? (
        <div className="px-4 pt-4">
          <button
            onClick={() => router.push(`/operations/${operationId}/missions/${selectedAssignedMission.id}`)}
            className="w-full font-['Special_Elite'] text-xs uppercase tracking-wider border border-[#3d3520] bg-[#0f0e0a] text-[#c9a227] py-3 rounded-sm"
          >
            CONTINUAR MISSAO EM ANDAMENTO
          </button>
      {!completedMission && (
        <MissionPool
          missions={missionsWithStatus}
          selectedMissionId={selectedAssignedMission?.mission_id}
          onSelectMission={handleSelectMission}
          resetHour={resetHour}
        />
      )}  <div className="border border-[#8b1a1a] bg-[#1f0d0d] rounded-sm p-3">
            <p className="font-['Special_Elite'] text-[11px] text-[#c94040] uppercase tracking-wider">TRANSMISSAO INTERROMPIDA</p>
            <p className="font-['Inter'] text-xs text-[#e8e4d9] mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      <MissionPool
        missions={missionsWithStatus}
        selectedMissionId={selectedAssignedMission?.mission_id}
        onSelectMission={handleSelectMission}
        resetHour={resetHour}
      />
    </div>
  )
}

