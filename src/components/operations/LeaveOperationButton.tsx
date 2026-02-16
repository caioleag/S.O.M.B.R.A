'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { playSfx } from '@/lib/sfx'

export function LeaveOperationButton({ operationId }: { operationId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLeave = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/operations/${operationId}/leave`, { method: 'POST' })

      if (!response.ok) {
        playSfx('error', 0.3)
        setIsLoading(false)
        setConfirming(false)
        return
      }

      playSfx('undo', 0.25)
      router.push('/operations')
    } catch {
      playSfx('error', 0.3)
      setIsLoading(false)
      setConfirming(false)
    }
  }

  return (
    <Button
      variant="danger"
      className="w-full"
      onClick={handleLeave}
      disabled={isLoading}
    >
      {isLoading ? 'SAINDO...' : confirming ? 'CONFIRMAR SAIDA' : 'SAIR DA OPERACAO'}
    </Button>
  )
}
