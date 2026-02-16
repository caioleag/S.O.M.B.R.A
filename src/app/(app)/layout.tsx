import { BottomNav } from '@/components/layout/BottomNav';
import { RankPromotionWatcher } from '@/components/layout/RankPromotionWatcher';
import { Suspense } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {children}
      <Suspense fallback={null}>
        <RankPromotionWatcher />
        <BottomNav />
      </Suspense>
    </div>
  );
}
