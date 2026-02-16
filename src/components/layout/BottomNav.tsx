'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Radio, Crosshair, BarChart2, Shield, Fingerprint } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type NavKey = 'feed' | 'missions' | 'ranking'
type GlobalKey = 'operations' | 'profile'

const operationItems: Array<{
  key: NavKey
  label: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}> = [
  { key: 'feed', label: 'SINAL', Icon: Radio },
  { key: 'missions', label: 'MISSAO', Icon: Crosshair },
  { key: 'ranking', label: 'STATUS', Icon: BarChart2 },
]

const globalItems: Array<{
  key: GlobalKey
  label: string
  href: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
}> = [
  { key: 'operations', label: 'OPERACAO', href: '/operations', Icon: Shield },
  { key: 'profile', label: 'AGENTE', href: '/profile', Icon: Fingerprint },
]

function getOperationIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/operations\/([0-9a-fA-F-]{36})(?:\/|$)/)
  return match?.[1] ?? null
}

export function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const operationIdFromPath = useMemo(() => getOperationIdFromPath(pathname), [pathname])

  const [activeOperationId, setActiveOperationId] = useState<string | null>(operationIdFromPath)

  const isLobbyOrCeremony = pathname.includes('/lobby') || pathname.includes('/ceremony')
  const isMissionDetail = /\/operations\/[0-9a-fA-F-]{36}\/missions\//.test(pathname)
  const isInsideOperation = Boolean(operationIdFromPath) && !isLobbyOrCeremony && !isMissionDetail

  const isGlobal =
    !isInsideOperation &&
    (pathname === '/operations' ||
      pathname === '/operations/create' ||
      pathname === '/operations/join' ||
      pathname.startsWith('/profile'))

  useEffect(() => {
    let canceled = false

    if (operationIdFromPath) {
      setActiveOperationId(operationIdFromPath)
      return () => {
        canceled = true
      }
    }

    const loadMembership = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || canceled) {
        if (!canceled) setActiveOperationId(null)
        return
      }

      const { data } = await supabase
        .from('operation_members')
        .select('operation_id, operations!inner(status)')
        .eq('user_id', user.id)
        .in('operations.status', ['inactive', 'active'])
        .limit(1)

      if (!canceled) {
        setActiveOperationId((data?.[0] as { operation_id: string } | undefined)?.operation_id ?? null)
      }
    }

    loadMembership()

    return () => {
      canceled = true
    }
  }, [operationIdFromPath, pathname])

  if (!isInsideOperation && !isGlobal) return null

  const resolveTabActive = (key: NavKey) => {
    if (!currentTab) return key === 'missions'
    return currentTab === key
  }

  const resolveGlobalActive = (key: GlobalKey) => {
    if (key === 'operations') {
      return (
        pathname === '/operations' ||
        pathname === '/operations/create' ||
        pathname === '/operations/join'
      )
    }
    if (key === 'profile') return pathname.startsWith('/profile')
    return false
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30">
      <div className="mx-auto max-w-xl">
        {/* Interface edge — single pixel separator */}
        <div className="h-px bg-[#241e12]" />

        <div className="bg-[#0c0a07]">
          {isInsideOperation ? (
            <div className="grid grid-cols-3 divide-x divide-[#181410]">
              {operationItems.map(({ key, label, Icon }) => {
                const active = resolveTabActive(key)
                return (
                  <Link
                    key={key}
                    href={`/operations/${activeOperationId}?tab=${key}`}
                    className="relative flex flex-col items-center justify-center gap-1.5 py-4 group"
                  >
                    {/* Active signal line */}
                    {active && (
                      <span className="absolute inset-x-0 top-0 h-[2px] bg-gold animate-nav-line-glow" />
                    )}

                    <Icon
                      size={16}
                      strokeWidth={active ? 1.5 : 1.3}
                      className={`transition-all duration-150 ${
                        active
                          ? 'text-gold drop-shadow-[0_0_6px_rgba(201,162,39,0.55)]'
                          : 'text-ink-faint group-hover:text-ink-muted'
                      }`}
                    />

                    <span
                      className={`font-spy text-[9px] tracking-[0.22em] uppercase transition-colors duration-150 ${
                        active ? 'text-gold' : 'text-ink-faint group-hover:text-ink-muted'
                      }`}
                    >
                      {label}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 divide-x divide-[#181410]">
                {globalItems.map(({ key, label, href, Icon }) => {
                  const active = resolveGlobalActive(key)
                  return (
                    <Link
                      key={key}
                      href={href}
                      className="relative flex flex-col items-center justify-center gap-1.5 py-3.5 group"
                    >
                      {active && (
                        <span className="absolute inset-x-0 top-0 h-[2px] bg-gold animate-nav-line-glow" />
                      )}

                      <Icon
                        size={16}
                        strokeWidth={active ? 1.5 : 1.3}
                        className={`transition-all duration-150 ${
                          active
                            ? 'text-gold drop-shadow-[0_0_6px_rgba(201,162,39,0.55)]'
                            : 'text-ink-faint group-hover:text-ink-muted'
                        }`}
                      />

                      <span
                        className={`font-spy text-[9px] tracking-[0.22em] uppercase transition-colors duration-150 ${
                          active ? 'text-gold' : 'text-ink-faint group-hover:text-ink-muted'
                        }`}
                      >
                        {label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}

          {/* iOS safe area */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </nav>
  )
}
