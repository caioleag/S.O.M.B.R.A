'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { playSfx } from '@/lib/sfx'

interface CurrentOperationCardProps {
  operation: {
    id: string
    name: string
    status: string
    creator_id: string
    duration_days: number
    started_at?: string
  }
  isCreator: boolean
}

export function CurrentOperationCard({ operation, isCreator }: CurrentOperationCardProps) {
  const router = useRouter()
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLeave = async () => {
    if (!confirmingLeave) {
      setConfirmingLeave(true)
      setTimeout(() => setConfirmingLeave(false), 3000)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/operations/${operation.id}/leave`, { 
        method: 'POST' 
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Erro ao sair:', data.error)
        playSfx('error', 0.3)
        setIsLoading(false)
        setConfirmingLeave(false)
        return
      }

      playSfx('undo', 0.25)
      router.push('/operations')
      router.refresh()
    } catch (error) {
      console.error('Erro:', error)
      playSfx('error', 0.3)
      setIsLoading(false)
      setConfirmingLeave(false)
    }
  }

  const handleCancel = async () => {
    if (!confirmingCancel) {
      setConfirmingCancel(true)
      setTimeout(() => setConfirmingCancel(false), 3000)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/operations/${operation.id}`, { 
        method: 'DELETE' 
      })

      if (!response.ok) {
        playSfx('error', 0.3)
        setIsLoading(false)
        setConfirmingCancel(false)
        return
      }

      playSfx('undo', 0.25)
      router.push('/operations')
      router.refresh()
    } catch {
      playSfx('error', 0.3)
      setIsLoading(false)
      setConfirmingCancel(false)
    }
  }

  const statusText = {
    inactive: 'NO LOBBY',
    active: 'EM ANDAMENTO',
    completed: 'CONCLUIDA'
  }[operation.status] || operation.status.toUpperCase()

  const statusColor = {
    inactive: 'text-[#6b6660]',
    active: 'text-[#4a8c4a]',
    completed: 'text-[#c9a227]'
  }[operation.status] || 'text-[#6b6660]'

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-2">
            OPERACAO ATUAL
          </p>
          <h3 className="font-['Special_Elite'] text-lg text-[#e8e4d9]">
            {operation.name}
          </h3>
          <div className="mt-1 flex items-center gap-3">
            <span className={`font-['Special_Elite'] text-[10px] uppercase tracking-wider ${statusColor}`}>
              {statusText}
            </span>
            {isCreator && (
              <span className="font-['Special_Elite'] text-[10px] text-[#c9a227] uppercase tracking-wider">
                ● LIDER
              </span>
            )}
          </div>
        </div>

        <div className="h-px bg-[#1a1a1a]" />

        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push(`/operations/${operation.id}`)}
          >
            ACESSAR OPERACAO
          </Button>

          <Button
            variant="danger"
            className="w-full text-[10px]"
            onClick={handleLeave}
            disabled={isLoading}
          >
            {isLoading 
              ? 'PROCESSANDO...' 
              : confirmingLeave 
              ? isCreator 
                ? 'CONFIRMAR TRANSFERENCIA E SAIDA' 
                : 'CONFIRMAR SAIDA'
              : 'SAIR DA OPERACAO'
            }
          </Button>

          {isCreator && operation.status === 'inactive' && (
            <Button
              variant="danger"
              className="w-full text-[10px]"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading 
                ? 'ENCERRANDO...' 
                : confirmingCancel 
                ? 'CONFIRMAR ENCERRAMENTO' 
                : 'ENCERRAR E EXCLUIR OPERACAO'
              }
            </Button>
          )}
        </div>

        {isCreator && operation.status !== 'inactive' && (
          <p className="font-['Inter'] text-[10px] text-[#6b6660] text-center">
            Ao sair, a liderança será transferida para outro membro
          </p>
        )}
      </div>
    </Card>
  )
}
