import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RankInsignia } from '@/components/rank/RankInsignia'
import { PushSubscriptionCard } from '@/components/profile/PushSubscriptionCard'
import { TopBar } from '@/components/layout/TopBar'
import Image from 'next/image'
import Link from 'next/link'

interface BadgeValue {
  name?: string
  type?: string
  operation_id?: string
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profileRows } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1)
  const profile = profileRows?.[0]

  if (!profile) {
    redirect('/onboarding')
  }

  const { data: missionStats } = await supabase
    .from('assigned_missions')
    .select('status, missions(category, points)')
    .eq('user_id', user.id)
    .in('status', ['completed', 'rejected'])

  const { count: favoritesCount } = await supabase
    .from('favorite_photos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const totalSubmissions = missionStats?.length || 0
  const approvedSubmissions = (missionStats || []).filter((row) => row.status === 'completed').length
  const approvalRate = totalSubmissions > 0 ? Math.round((approvedSubmissions / totalSubmissions) * 100) : 0

  const totalPoints = (missionStats || [])
    .filter((row) => row.status === 'completed')
    .reduce((acc, row) => acc + ((row as any).missions?.points || 0), 0)
  const avgPoints = approvedSubmissions > 0 ? Math.round(totalPoints / approvedSubmissions) : 0

  const categoryMap = new Map<string, number>()
  for (const row of missionStats || []) {
    const category = (row as any).missions?.category || 'desconhecida'
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
  }

  const badgesRaw: unknown[] = Array.isArray(profile.badges_earned) ? profile.badges_earned : []
  const badges = badgesRaw.map((badge) => {
    if (typeof badge === 'string') return badge
    if (badge && typeof badge === 'object') {
      const data = badge as BadgeValue
      return data.name || data.type || 'Badge'
    }
    return 'Badge'
  })

  return (
    <>
    <TopBar title="AGENTE" subtitle={profile.rank || 'RECRUTA'} />
    <div className="py-4 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-[#242424] flex-shrink-0">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.username || 'agente'} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#6b6660] text-xl">
                    {(profile.username || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="font-['Special_Elite'] text-xl text-[#e8e4d9]">{profile.username}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-['Special_Elite'] text-[11px] text-[#6b6660] uppercase tracking-wide">{profile.rank || 'RECRUTA'}</p>
                  <RankInsignia rank={profile.rank} size={16} />
                </div>
              </div>
            </div>

            <div className="h-px bg-[#1a1a1a]" />

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-1">Operacoes</p>
                <p className="font-['Inter'] text-2xl text-[#c9a227] font-mono">{String(profile.total_operations || 0).padStart(2, '0')}</p>
              </div>

              <div className="text-center">
                <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-1">Missoes</p>
                <p className="font-['Inter'] text-2xl text-[#c9a227] font-mono">{profile.total_missions_completed || 0}</p>
              </div>

              <div className="text-center">
                <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-1">Taxa</p>
                <p className="font-['Inter'] text-2xl text-[#c9a227] font-mono">{approvalRate}%</p>
              </div>
            </div>

            <div className="h-px bg-[#1a1a1a]" />

            <div className="space-y-3">
              <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider">STATS DETALHADAS</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#242424] rounded-sm p-2">
                  <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase">Media de pontos</p>
                  <p className="font-['Inter'] text-lg text-[#c9a227] font-mono">{avgPoints}pt</p>
                </div>
                <div className="border border-[#242424] rounded-sm p-2">
                  <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase">Favoritos</p>
                  <p className="font-['Inter'] text-lg text-[#c9a227] font-mono">{favoritesCount || 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider">Missoes por categoria</p>
                {Array.from(categoryMap.entries()).length > 0 ? (
                  <div className="space-y-1">
                    {Array.from(categoryMap.entries()).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between border border-[#242424] rounded-sm px-2 py-1">
                        <span className="font-['Special_Elite'] text-[11px] uppercase text-[#e8e4d9]">{category}</span>
                        <span className="font-['Inter'] text-sm font-mono text-[#c9a227]">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-['Inter'] text-xs text-[#3a3632]">Sem dados de missao ainda.</p>
                )}
              </div>
            </div>

            <div className="h-px bg-[#1a1a1a]" />

            <div>
              <p className="font-['Special_Elite'] text-[10px] text-[#6b6660] uppercase tracking-wider mb-3">Badges</p>
              {badges.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {badges.map((badge, index) => (
                    <div key={`${badge}-${index}`} className="px-3 py-1 bg-[#1a1a1a] border border-[#3d3520] rounded-sm">
                      <span className="font-['Inter'] text-xs text-[#c9a227]">{badge}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-['Inter'] text-sm text-[#3a3632]">Nenhum ainda</p>
              )}
            </div>

            <div className="h-px bg-[#1a1a1a]" />

            <div className="flex gap-2">
              <Link href="/profile/favorites" className="flex-1">
                <Button variant="secondary" className="w-full">
                  GALERIA FAVORITOS
                </Button>
              </Link>
              <form action="/api/auth/logout" method="POST" className="flex-1">
                <Button type="submit" variant="danger" className="w-full">
                  ENCERRAR SESSAO
                </Button>
              </form>
            </div>
          </div>
        </Card>

        <PushSubscriptionCard />
      </div>
    </div>
    </>
  )
}

