'use client'

import { useEffect, useState } from 'react'

interface TypewriterProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div'
}

export function Typewriter({ text, speed = 18, delay = 0, className, as: Tag = 'span' }: TypewriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    let interval: ReturnType<typeof setInterval>

    const start = setTimeout(() => {
      interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, speed)
    }, delay)

    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [text, speed, delay])

  return (
    <Tag className={className}>
      {displayed}
      {!done && <span className="tw-cursor" aria-hidden>|</span>}
    </Tag>
  )
}
