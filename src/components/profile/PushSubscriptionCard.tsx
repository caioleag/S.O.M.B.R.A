'use client'

import { useEffect, useState } from 'react'
import { subscribeToPush, unsubscribeFromPush, isPushSupported } from '@/lib/notifications'
import { Button } from '@/components/ui/Button'
import { playSfx } from '@/lib/sfx'

export function PushSubscriptionCard() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSupported(isPushSupported())
    fetch('/api/push/subscription', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : { subscribed: false }))
      .then((data) => setSubscribed(Boolean(data.subscribed)))
      .catch(() => setSubscribed(false))
  }, [])

  const handleSubscribe = async () => {
    setError(null)
    setLoading(true)

    try {
      await subscribeToPush()
      setSubscribed(true)
      playSfx('success', 0.3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel ativar notificacoes.')
      playSfx('error', 0.3)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setError(null)
    setLoading(true)

    try {
      await unsubscribeFromPush()
      setSubscribed(false)
      playSfx('undo', 0.25)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel desativar notificacoes.')
      playSfx('error', 0.3)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div className="border border-border rounded-sm p-4 bg-surface">
        <p className="font-['Special_Elite'] text-xs uppercase tracking-wider text-ink-muted">NOTIFICACOES PUSH</p>
        <p className="font-['Inter'] text-xs text-ink-faint mt-2">Este navegador nao suporta push notifications.</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-sm p-4 bg-surface space-y-3">
      <p className="font-['Special_Elite'] text-xs uppercase tracking-wider text-ink-muted">NOTIFICACOES PUSH</p>
      <p className="font-['Inter'] text-sm text-ink">{subscribed ? 'Alertas ativos.' : 'Ative alertas para novas missoes e votos.'}</p>

      {error ? <p className="font-['Inter'] text-xs text-[#c94040]">{error}</p> : null}

      {subscribed ? (
        <Button variant="secondary" onClick={handleUnsubscribe} disabled={loading}>
          DESATIVAR ALERTAS
        </Button>
      ) : (
        <Button variant="primary" onClick={handleSubscribe} disabled={loading}>
          ATIVAR ALERTAS
        </Button>
      )}
    </div>
  )
}

