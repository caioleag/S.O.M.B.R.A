'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Package, UserCircle, Shirt, MapPin } from 'lucide-react'
import { playSfx } from '@/lib/sfx'

const CATEGORIES = [
  { id: 'vigilancia', name: 'VIGILÂNCIA', color: '#4a8c4a', icon: Eye },
  { id: 'coleta', name: 'COLETA DE PROVAS', color: '#c94040', icon: Package },
  { id: 'infiltracao', name: 'INFILTRAÇÃO', color: '#4a7ab5', icon: UserCircle },
  { id: 'disfarce', name: 'DISFARCE', color: '#8a5abf', icon: Shirt },
  { id: 'reconhecimento', name: 'RECONHECIMENTO', color: '#c9a227', icon: MapPin },
]

interface CategoryRouletteProps {
  onComplete: (category: string) => void
  selectedCategory?: string
}

export function CategoryRoulette({ onComplete, selectedCategory }: CategoryRouletteProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [finalCategory, setFinalCategory] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (selectedCategory && !isSpinning && !finalCategory) {
      startRoulette(selectedCategory)
    }
  }, [selectedCategory])

  const startRoulette = (targetCategory: string) => {
    setIsSpinning(true)
    let spins = 0
    const maxSpins = 15
    const spinDuration = 80
    
    playSfx('click', 0.15)

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CATEGORIES.length)
      playSfx('click', 0.08)
      spins++

      if (spins >= maxSpins) {
        clearInterval(interval)
        const targetIndex = CATEGORIES.findIndex(cat => cat.id === targetCategory)
        setCurrentIndex(targetIndex >= 0 ? targetIndex : 0)
        playSfx('morse', 0.3)
        
        setTimeout(() => {
          setFinalCategory(targetCategory)
          setIsSpinning(false)
        }, 500)
      }
    }, spinDuration + Math.floor(spins * 10))
  }

  const handleConfirm = () => {
    if (finalCategory && !isConfirming) {
      setIsConfirming(true)
      playSfx('mission', 0.3)
      onComplete(finalCategory)
    }
  }

  const currentCategory = CATEGORIES[currentIndex]
  const CurrentIcon = currentCategory.icon

  if (finalCategory) {
    const selected = CATEGORIES.find(cat => cat.id === finalCategory)
    const SelectedIcon = selected?.icon || Eye

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-[#0a0a0a] border-2 border-[#c9a227] rounded-sm p-6 max-w-md w-full"
        >
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider">
                MISSÃO DESIGNADA
              </p>
              <div 
                className="flex items-center justify-center gap-3 py-4"
                style={{ color: selected?.color }}
              >
                <SelectedIcon size={32} strokeWidth={1.5} />
                <h2 className="font-['Special_Elite'] text-2xl uppercase">
                  {selected?.name}
                </h2>
              </div>
            </div>

            <div className="h-px bg-[#1a1a1a]" />

            <p className="font-['Inter'] text-sm text-[#e8e4d9]">
              Você foi designado para uma missão de <span style={{ color: selected?.color }} className="font-bold">{selected?.name}</span>.
              Selecione uma das missões disponíveis para começar.
            </p>

            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full font-['Special_Elite'] text-sm uppercase tracking-wider bg-[#c9a227] text-[#0a0a0a] py-3 rounded-sm hover:bg-[#d4ad2f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? 'CARREGANDO...' : 'SELECIONAR MISSÃO'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#0a0a0a] border-2 border-[#3d3520] rounded-sm p-8 max-w-md w-full">
        <div className="text-center space-y-6">
          <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider">
            SORTEANDO CATEGORIA
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.1 }}
              className="flex flex-col items-center gap-4"
            >
              <div 
                className="p-6 rounded-full border-2"
                style={{ borderColor: currentCategory.color, color: currentCategory.color }}
              >
                <CurrentIcon size={64} strokeWidth={1.5} />
              </div>
              <h2 
                className="font-['Special_Elite'] text-3xl uppercase"
                style={{ color: currentCategory.color }}
              >
                {currentCategory.name}
              </h2>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 justify-center">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                className="h-1 w-8 rounded-full transition-colors"
                style={{ 
                  backgroundColor: idx === currentIndex ? cat.color : '#1a1a1a'
                }}
              />
            ))}
          </div>

          {isSpinning && (
            <p className="font-['Inter'] text-xs text-[#6b6660]">
              Aguarde...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
