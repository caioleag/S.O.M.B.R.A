'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { CATEGORY_LABELS, CATEGORY_COLORS, getDifficultyDots, getDifficultyColor } from '@/lib/utils'
import { Camera, X, ChevronLeft } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'
import Link from 'next/link'
import type { AssignedMission, Mission } from '@/lib/supabase/types'
import { playSfx } from '@/lib/sfx'
import { Typewriter } from '@/components/ui/Typewriter'

interface Props {
  params: { id: string; missionId: string }
}

export default function ActiveMissionPage({ params }: Props) {
  const [assigned, setAssigned] = useState<AssignedMission | null>(null)
  const [mission, setMission] = useState<Mission | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('assigned_missions')
      .select('*, missions(*)')
      .eq('id', params.missionId)
      .single()
      .then(({ data }) => {
        if (data) {
          setAssigned(data)
          setMission(data.missions as unknown as Mission)
        }
        setFetching(false)
      })
  }, [params.missionId])

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 800,
      initialQuality: 0.7,
      useWebWorker: true,
    })

    setPhoto(compressed)
    const url = URL.createObjectURL(compressed)
    setPreview(url)
    playSfx('mission', 0.25)
  }

  async function handleSubmit() {
    if (!photo || !assigned) return
    setLoading(true)

    const form = new FormData()
    form.append('assigned_mission_id', assigned.id)
    form.append('photo', photo)
    if (caption) form.append('caption', caption)

    const res = await fetch(`/api/operations/${params.id}/missions/submit`, {
      method: 'POST',
      body: form,
    })

    if (res.ok) {
      playSfx('submit', 0.32)
      router.push(`/operations/${params.id}`)
    } else {
      playSfx('error', 0.3)
      setLoading(false)
    }
  }

  if (fetching || !mission || !assigned) {
    return (
      <div className="min-h-screen bg-base">
        <TopBar title="MISSÃO" left={<Link href={`/operations/${params.id}`}><ChevronLeft size={18} /></Link>} />
        <div className="p-4 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="redacted h-6 w-full rounded-sm" />)}
        </div>
      </div>
    )
  }

  const catColors = CATEGORY_COLORS[mission.category] || CATEGORY_COLORS.vigilancia

  return (
    <div className="min-h-screen bg-base pb-20">
      <TopBar
        title="MISSÃO ATIVA"
        left={<Link href={`/operations/${params.id}`}><ChevronLeft size={18} className="text-ink-muted" /></Link>}
      />

      <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
        {/* Classified stamp */}
        <div>
          <span className="stamp stamp-classified">[CLASSIFICADO]</span>
        </div>

        {/* Mission header */}
        <div>
          <p className="font-spy text-ink-muted text-xs uppercase tracking-wider mb-1">SUA MISSAO</p>
          <Typewriter
            text={mission.title}
            speed={22}
            as="h1"
            className="font-spy text-ink text-xl leading-snug block animate-gold-glow"
          />
        </div>

        <div className="border-t border-[#1a1a1a]" />

        {/* Objective */}
        <div>
          <p className="font-spy text-ink-muted text-[10px] uppercase tracking-wider mb-2">OBJETIVO</p>
          <Typewriter
            text={mission.objective}
            speed={12}
            delay={mission.title.length * 22 + 120}
            as="p"
            className="text-ink text-sm leading-relaxed block"
          />
        </div>

        {/* Difficulty + Points */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm" style={{ color: getDifficultyColor(mission.difficulty) }}>
            {getDifficultyDots(mission.difficulty)}
          </span>
          <span className="font-spy text-ink-muted text-xs uppercase tracking-wider">
            {mission.difficulty === 'easy' ? 'FÁCIL' : mission.difficulty === 'medium' ? 'MÉDIA' : 'DIFÍCIL'}
          </span>
          <span className="text-ink-muted">|</span>
          <span className="font-mono text-gold text-sm">{mission.points}<span className="text-ink-muted text-xs">PT</span></span>
        </div>

        <div className="border-t border-[#1a1a1a]" />

        {/* Photo upload area */}
        <div>
          <p className="font-spy text-ink-muted text-xs uppercase tracking-wider mb-3">
            ÁREA DE EVIDÊNCIA FOTOGRÁFICA
          </p>

          {preview ? (
            <div className="relative aspect-[4/3] rounded-sm overflow-hidden">
              <Image src={preview} alt="Preview" fill className="object-cover" />
              <button
                onClick={() => { setPhoto(null); setPreview(null) }}
                className="absolute top-2 right-2 bg-black/80 text-white w-7 h-7 flex items-center justify-center rounded-sm"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border-gold bg-warm rounded-sm"
            >
              <Camera size={32} className="text-border-gold" />
              <p className="font-spy text-ink-muted text-xs uppercase tracking-wider text-center px-4">
                Toque para fotografar ou selecionar da galeria
              </p>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* Caption (only after photo) */}
        {preview && (
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Descreva sua evidência, agente..."
            className="w-full px-3 py-2.5 text-sm resize-none h-20"
          />
        )}

        <Button
          fullWidth
          disabled={!photo}
          loading={loading}
          onClick={handleSubmit}
        >
          {loading ? 'TRANSMITINDO' : 'SUBMETER EVIDÊNCIA'}
        </Button>
      </div>
    </div>
  )
}
