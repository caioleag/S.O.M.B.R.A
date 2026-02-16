import { BottomNav } from '@/components/layout/BottomNav';
import { RankPromotionWatcher } from '@/components/layout/RankPromotionWatcher';
import { PageTransition } from '@/components/layout/PageTransition';
import { Suspense } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <Suspense fallback={null}>
        <PageTransition>{children}</PageTransition>
      </Suspense>
      <Suspense fallback={null}>
        <RankPromotionWatcher />
        <BottomNav />
      </Suspense>
    </div>
  );
}
