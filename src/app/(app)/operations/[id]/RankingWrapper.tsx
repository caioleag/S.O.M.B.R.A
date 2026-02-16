'use client'

import { RankingList } from '@/components/ranking/RankingList'

interface Props {
  operationId: string
  userId: string
}

export function RankingWrapper({ operationId, userId }: Props) {
  return <RankingList operationId={operationId} currentUserId={userId} />
}

