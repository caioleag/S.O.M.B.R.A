'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/Button'
import { CATEGORY_LABELS, CATEGORY_COLORS, getDifficultyDots, getDifficultyColor } from '@/lib/utils'
import { Camera, X, ChevronLeft, Eye, Package, UserCircle, Shirt, MapPin } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import Image from 'next/image'
import Link from 'next/link'
import type { AssignedMission, Mission } from '@/lib/supabase/types'
import { playSfx } from '@/lib/sfx'
import { Typewriter } from '@/components/ui/Typewriter'

const CATEGORY_ICONS = {
  vigilancia: Eye,
  coleta: Package,
  infiltracao: UserCircle,
  disfarce: Shirt,
  reconhecimento: MapPin,
} as const

interface Props {
  params: Promise<{ id: string; missionId: string }>
}

export default function ActiveMissionPage({ params }: Props) {
  const [assigned, setAssigned] = useState<AssignedMission | null>(null)
  const [mission, setMission] = useState<Mission | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [resolvedParams, setResolvedParams] = useState<{ id: string; missionId: string } | null>(null)
  const [submittedPhotoUrl, setSubmittedPhotoUrl] = useState<string | null>(null)
  const [votes, setVotes] = useState<{ approved: number; rejected: number }>({ approved: 0, rejected: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  useEffect(() => {
    if (!resolvedParams) return
    const supabase = createClient()
    supabase
      .from('assigned_missions')
      .select('*, missions(*)')
      .eq('id', resolvedParams.missionId)
      .single()
      .then(({ data }) => {
        if (data) {
          setAssigned(data)
          setMission(data.missions as unknown as Mission)
          if (data.photo_url) {
            setSubmittedPhotoUrl(data.photo_url)
            if (data.caption) setCaption(data.caption)
          }
        }
        setFetching(false)
      })

    // Buscar votos se missão está completa
    supabase
      .from('votes')
      .select('vote')
      .eq('assigned_mission_id', resolvedParams.missionId)
      .then(({ data }) => {
        if (data) {
          const approved = data.filter(v => v.vote === 'approve').length
          const rejected = data.filter(v => v.vote === 'reject').length
          setVotes({ approved, rejected })
        }
      })
  }, [resolvedParams])

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
    if (!photo || !assigned || !resolvedParams) return
    setLoading(true)

    const form = new FormData()
    form.append('assigned_mission_id', assigned.id)
    form.append('photo', photo)
    if (caption) form.append('caption', caption)

    const res = await fetch(`/api/operations/${resolvedParams.id}/missions/submit`, {
      method: 'POST',
      body: form,
    })

    if (res.ok) {
      playSfx('submit', 0.32)
      router.push(`/operations/${resolvedParams.id}`)
    } else {
      playSfx('error', 0.3)
      setLoading(false)
    }
  }

  if (fetching || !mission || !assigned || !resolvedParams) {
    return (
      <div className="min-h-screen bg-base">
        <TopBar title="MISSÃO" left={<ChevronLeft size={18} />} />
        <div className="p-4 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="redacted h-6 w-full rounded-sm" />)}
        </div>
      </div>
    )
  }

  const catColors = CATEGORY_COLORS[mission.category] || CATEGORY_COLORS.vigilancia
  const categoryKey = mission.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') as keyof typeof CATEGORY_ICONS
  const Icon = CATEGORY_ICONS[categoryKey] || Eye

  // Se a missão está concluída, mostra visualização diferente
  if (assigned.status === 'completed') {
    return (
      <div className="min-h-screen bg-base pb-20">
        <TopBar
          title="MISSÃO CONCLUÍDA"
          left={<Link href={`/operations/${resolvedParams.id}`}><ChevronLeft size={18} className="text-ink-muted" /></Link>}
        />

        <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
          {/* Success stamp */}
          <div className="text-center">
            <span className="inline-block px-4 py-2 border-2 border-[#4a8c4a] bg-[#0d1f0d] text-[#4a8c4a] font-['Special_Elite'] text-xs tracking-wider">
              ✓ MISSÃO CONCLUÍDA
            </span>
          </div>

          {/* Ícone grande da categoria */}
          <div className="flex justify-center py-2">
            <Icon size={64} style={{ color: catColors.text, opacity: 0.7 }} strokeWidth={1.5} />
          </div>

          {/* Mission header */}
          <div>
            <p className="font-['Special_Elite'] text-[#6b6660] text-[10px] uppercase tracking-wider mb-1">{mission.category}</p>
            <h1 className="font-['Special_Elite'] text-[#e8e4d9] text-lg leading-tight">{mission.title}</h1>
          </div>

          {/* Difficulty + Points */}
          <div className="flex items-center gap-3 pb-3 border-b border-[#1a1a1a]">
            <span className="font-mono text-sm" style={{ color: getDifficultyColor(mission.difficulty) }}>
              {getDifficultyDots(mission.difficulty)}
            </span>
            <span className="font-['Special_Elite'] text-[#6b6660] text-xs uppercase">
              {mission.difficulty === 'easy' ? 'FÁCIL' : mission.difficulty === 'medium' ? 'MÉDIA' : 'DIFÍCIL'}
            </span>
            <span className="text-[#6b6660]">|</span>
            <span className="font-mono text-[#c9a227] text-sm">{mission.points}<span className="text-[#6b6660] text-xs">PT</span></span>
          </div>

          {/* Votos */}
          <div className="bg-[#0a0a0a] border border-[#242424] rounded-sm p-4">
            <p className="font-['Special_Elite'] text-[#6b6660] text-[10px] uppercase tracking-wider mb-3">VALIDAÇÃO DA EQUIPE</p>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4a8c4a] font-mono">{votes.approved}</div>
                <div className="text-[10px] text-[#6b6660] font-['Special_Elite'] uppercase tracking-wider mt-1">Aprovaram</div>
              </div>
              <div className="w-px h-12 bg-[#242424]" />
              <div className="text-center">
                <div className="text-2xl font-bold text-[#c94040] font-mono">{votes.rejected}</div>
                <div className="text-[10px] text-[#6b6660] font-['Special_Elite'] uppercase tracking-wider mt-1">Rejeitaram</div>
              </div>
            </div>
          </div>

          {/* Foto submetida */}
          {submittedPhotoUrl && (
            <div>
              <p className="font-['Special_Elite'] text-[#6b6660] text-xs uppercase tracking-wider mb-3">
                EVIDÊNCIA FOTOGRÁFICA
              </p>
              <div className="relative aspect-[4/3] rounded-sm overflow-hidden border border-[#242424]">
                <Image src={submittedPhotoUrl} alt="Evidência" fill className="object-cover" />
              </div>
            </div>
          )}

          {/* Caption */}
          {caption && (
            <div className="bg-[#0a0a0a] border border-[#242424] rounded-sm p-4">
              <p className="font-['Special_Elite'] text-[#6b6660] text-[10px] uppercase tracking-wider mb-2">OBSERVAÇÕES</p>
              <p className="font-['Inter'] text-sm text-[#a39d91] leading-relaxed">{caption}</p>
            </div>
          )}

          <Button
            fullWidth
            variant="secondary"
            onClick={() => router.push(`/operations/${resolvedParams.id}`)}
          >
            VOLTAR PARA OPERAÇÃO
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base pb-20">
      <TopBar
        title="MISSÃO ATIVA"
        left={<Link href={`/operations/${resolvedParams.id}`}><ChevronLeft size={18} className="text-ink-muted" /></Link>}
      />

      <div className="px-4 py-6 max-w-sm mx-auto space-y-5">
        {/* Classified stamp */}
        <div>
          <span className="stamp stamp-classified">[CLASSIFICADO]</span>
        </div>

        {/* Ícone grande da categoria */}
        <div className="flex justify-center py-4">
          <Icon size={72} style={{ color: catColors.text, opacity: 0.8 }} strokeWidth={1.5} />
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
