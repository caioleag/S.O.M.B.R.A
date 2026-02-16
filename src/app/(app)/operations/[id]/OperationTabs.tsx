'use client'

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
  const safeTab = currentTab === 'feed' || currentTab === 'ranking' || currentTab === 'missions' ? currentTab : 'missions'

  return (
    <div>
      {safeTab === 'missions' && <MissionPoolWrapper operationId={operationId} userId={userId} resetHour={resetHour} />}
      {safeTab === 'feed' && <FeedWrapper operationId={operationId} userId={userId} />}
      {safeTab === 'ranking' && <RankingWrapper operationId={operationId} userId={userId} />}
    </div>
  )
}
