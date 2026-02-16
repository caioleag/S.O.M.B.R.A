'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { playSfx } from '@/lib/sfx'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [flashing, setFlashing] = useState(false)
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (prevPath.current === null) {
      prevPath.current = pathname
      return
    }
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    playSfx('nav-morse', 0.11)
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 320)
    return () => clearTimeout(t)
  }, [pathname])

  return (
    <>
      {/* Warm dark flash overlay on route change */}
      {flashing && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none bg-[#0a0804]"
          style={{ animation: 'screen-flash 320ms ease-out forwards' }}
        />
      )}

      {/* Page content — remounts on route change to re-trigger enter animation */}
      <div key={pathname} style={{ animation: 'page-enter 320ms ease-out both' }}>
        {children}
      </div>
    </>
  )
}
