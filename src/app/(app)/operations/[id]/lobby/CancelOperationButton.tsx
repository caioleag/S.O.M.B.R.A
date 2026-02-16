'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { playSfx } from '@/lib/sfx'

export function CancelOperationButton({ operationId }: { operationId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/operations/${operationId}`, { method: 'DELETE' })

      if (!response.ok) {
        playSfx('error', 0.3)
        setIsLoading(false)
        setConfirming(false)
        return
      }

      playSfx('undo', 0.25)
      window.location.href = '/operations'
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
      onClick={handleCancel}
      disabled={isLoading}
    >
      {isLoading ? 'ENCERRANDO...' : confirming ? 'CONFIRMAR ENCERRAMENTO' : 'ENCERRAR OPERACAO'}
    </Button>
  )
}
