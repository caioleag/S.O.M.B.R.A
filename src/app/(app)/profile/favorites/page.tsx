import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: favorites } = await supabase
    .from('favorite_photos')
    .select('created_at, assigned_missions(id, photo_url, caption, missions(title), operations(name), profiles(username))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-16">
      <TopBar
        title="FAVORITOS"
        subtitle="GALERIA"
        left={
          <Link href="/profile" aria-label="Voltar para perfil">
            <ChevronLeft size={18} className="text-ink-muted" />
          </Link>
        }
      />

      <div className="p-4">
        {(favorites || []).length === 0 ? (
          <div className="text-center py-16">
            <p className="font-['Special_Elite'] text-sm text-[#6b6660] uppercase tracking-wider">Nenhuma foto favoritada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(favorites || []).map((item) => {
              const mission = (item as any).assigned_missions
              const photoUrl = mission?.photo_url as string | null

              if (!photoUrl) return null

              return (
                <div key={mission.id} className="bg-surface border border-border rounded-sm overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <Image src={photoUrl} alt={mission?.missions?.title || 'favorite'} fill className="object-cover" />
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase truncate">{mission?.operations?.name || 'Operacao'}</p>
                    <p className="font-['Special_Elite'] text-xs text-[#e8e4d9] truncate">{mission?.missions?.title || 'Missao'}</p>
                    <p className="font-['Inter'] text-[11px] text-[#6b6660] truncate">{mission?.profiles?.username || 'agente'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

