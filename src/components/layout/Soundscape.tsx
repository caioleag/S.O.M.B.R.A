'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { playSfx } from '@/lib/sfx'

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('button, a, [role="button"], input[type="submit"], input[type="button"]'))
}

export function Soundscape() {
  const pathname = usePathname()
  const hasMounted = useRef(false)

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }

    playSfx('navigate', 0.22)
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isInteractive(event.target)) return
      playSfx('click', 0.22)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
