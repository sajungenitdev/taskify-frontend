// app/(dashboard)/tenders/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { TenderHeader } from "@/components/tender/TenderHeader";
import { TenderOverviewStats } from "@/components/tender/TenderOverviewStats";
import { TenderOverviewPipeline } from "@/components/tender/TenderOverviewPipeline";
import { TenderOverviewUpcoming } from "@/components/tender/TenderOverviewUpcoming";
import { TenderOverviewPerformance } from "@/components/tender/TenderOverviewPerformance";
import { TenderOverviewRecent } from "@/components/tender/TenderOverviewRecent";
import { TenderOverviewQuickActions } from "@/components/tender/TenderOverviewQuickActions";
import {
  useTenderOverview,
  useUpcomingDeadlines,
  useTenderPerformance,
  useRecentActivity,
} from "@/hooks/tender/useTenderOverview";

export default function TenderOverviewPage() {
  const router = useRouter();
  const { data: overview, loading: overviewLoading } = useTenderOverview();
  const { data: upcoming, loading: upcomingLoading } = useUpcomingDeadlines();
  const { data: performance, loading: perfLoading } = useTenderPerformance();
  const { data: recent, loading: recentLoading } = useRecentActivity(10);

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <TenderHeader onAddTender={() => router.push("/tenders/manage")} />

        {/* KPI strip */}
        {overviewLoading || !overview ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[104px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
              />
            ))}
          </div>
        ) : (
          <TenderOverviewStats stats={overview.stats} />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {overviewLoading || !overview ? (
              <div className="h-[180px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ) : (
              <TenderOverviewPipeline stages={overview.pipeline} />
            )}

            {/* Performance chart — now dynamic */}
            {perfLoading || !performance ? (
              <div className="h-[280px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ) : (
              <TenderOverviewPerformance
                data={performance.data}
                winRate={performance.winRate}
              />
            )}
          </div>

          <div className="space-y-6">
            {upcomingLoading ? (
              <div className="h-[280px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ) : (
              <TenderOverviewUpcoming items={upcoming ?? []} />
            )}

            {/* Recent activity — now dynamic */}
            {recentLoading ? (
              <div className="h-[280px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
            ) : (
              <TenderOverviewRecent items={recent ?? []} />
            )}
          </div>
        </div>

        <TenderOverviewQuickActions />
      </div>
    </main>
  );
}