'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Target, MessageSquare, BarChart2, User } from 'lucide-react'

const items = [
  { key: 'missions', label: 'MISSOES', Icon: Target },
  { key: 'feed', label: 'FEED', Icon: MessageSquare },
  { key: 'ranking', label: 'RANKING', Icon: BarChart2 },
  { key: 'profile', label: 'AGENTE', Icon: User },
]

function getOperationIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/operations\/([^/?#]+)/)
  return match?.[1] ?? null
}

export function BottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const operationId = getOperationIdFromPath(pathname)
  const tab = searchParams.get('tab') ?? 'missions'

  const getHref = (key: string) => {
    if (key === 'profile') return '/profile'
    if (!operationId) return '/'
    return `/operations/${operationId}?tab=${key}`
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 bg-base border-t border-border z-30 flex">
      {items.map(({ key, label, Icon }) => {
        const active = key === 'profile'
          ? pathname.startsWith('/profile')
          : pathname.startsWith('/operations/') && tab === key

        return (
          <Link
            key={key}
            href={getHref(key)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              color={active ? '#c9a227' : '#3a3632'}
            />
            <span
              className="font-spy text-[10px] uppercase tracking-wider"
              style={{ color: active ? '#c9a227' : '#3a3632' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

