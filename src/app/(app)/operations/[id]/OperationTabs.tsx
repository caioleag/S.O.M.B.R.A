'use client'

import { useRouter, usePathname } from 'next/navigation'
import { MissionPoolWrapper } from './MissionPoolWrapper'
import { FeedWrapper } from './FeedWrapper'
import { RankingWrapper } from './RankingWrapper'

interface OperationTabsProps {
  operationId: string
  userId: string
  currentTab: string
  resetHour: number
}

export function OperationTabs({ operationId, userId, currentTab, resetHour }: OperationTabsProps) {
  const router = useRouter()
  const pathname = usePathname()

  const setTab = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`)
  }

  return (
    <div>
      <div className="border-b border-[#242424]">
        <div className="flex">
          <button
            onClick={() => setTab('missions')}
            className={`flex-1 py-3 font-['Special_Elite'] text-xs uppercase tracking-wider transition-colors ${
              currentTab === 'missions' ? 'text-[#c9a227]' : 'text-[#3a3632]'
            }`}
          >
            MISSOES
          </button>
          <button
            onClick={() => setTab('feed')}
            className={`flex-1 py-3 font-['Special_Elite'] text-xs uppercase tracking-wider transition-colors ${
              currentTab === 'feed' ? 'text-[#c9a227]' : 'text-[#3a3632]'
            }`}
          >
            FEED
          </button>
          <button
            onClick={() => setTab('ranking')}
            className={`flex-1 py-3 font-['Special_Elite'] text-xs uppercase tracking-wider transition-colors ${
              currentTab === 'ranking' ? 'text-[#c9a227]' : 'text-[#3a3632]'
            }`}
          >
            RANKING
          </button>
        </div>
      </div>

      <div>
        {currentTab === 'missions' && (
          <MissionPoolWrapper operationId={operationId} userId={userId} resetHour={resetHour} />
        )}
        {currentTab === 'feed' && <FeedWrapper operationId={operationId} userId={userId} />}
        {currentTab === 'ranking' && <RankingWrapper operationId={operationId} userId={userId} />}
      </div>
    </div>
  )
}

