// components/crm/LeaderboardTable.tsx
"use client";

import React, { memo } from "react";
import { Award, Crown, Medal, Trophy, ArrowUpRight } from "lucide-react";
import { formatMoney, initials } from "@/utils/format";

// ==========================================
// Types & Domain Definitions
// ==========================================

export interface LeaderboardRow {
  readonly userId: string;
  readonly fullName: string;
  readonly email: string;
  readonly wonRevenue: number;
  readonly wonCount: number;
  readonly activities: number;
}

interface LeaderboardTableProps {
  readonly rows: readonly LeaderboardRow[];
  readonly loading?: boolean;
}

interface RankVisualConfig {
  readonly badge: string;
  readonly rowStyle: string;
  readonly avatarBg: string;
  readonly icon: React.ComponentType<{ className?: string }> | null;
  readonly iconClass: string;
}

// ==========================================
// Styling Configurations
// ==========================================

function getRankStyle(index: number): RankVisualConfig {
  switch (index) {
    case 0:
      return {
        badge: "bg-amber-100/80 text-amber-900 border border-amber-300/80 shadow-2xs font-mono",
        rowStyle: "bg-amber-50/25 hover:bg-amber-50/50",
        avatarBg: "bg-amber-500 text-slate-950 ring-2 ring-amber-300/70",
        icon: Crown,
        iconClass: "h-3.5 w-3.5 text-amber-700",
      };
    case 1:
      return {
        badge: "bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs font-mono",
        rowStyle: "bg-slate-50/35 hover:bg-slate-50/70",
        avatarBg: "bg-slate-300 text-slate-900 ring-2 ring-slate-200",
        icon: Medal,
        iconClass: "h-3.5 w-3.5 text-slate-600",
      };
    case 2:
      return {
        badge: "bg-orange-100/70 text-orange-900 border border-orange-300/70 shadow-2xs font-mono",
        rowStyle: "bg-orange-50/15 hover:bg-orange-50/40",
        avatarBg: "bg-orange-400 text-slate-950 ring-2 ring-orange-200",
        icon: Award,
        iconClass: "h-3.5 w-3.5 text-orange-700",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-600 border border-slate-200 font-mono",
        rowStyle: "hover:bg-slate-50/70",
        avatarBg: "bg-slate-900 text-white",
        icon: null,
        iconClass: "",
      };
  }
}

// ==========================================
// Main Component
// ==========================================

export const LeaderboardTable = memo(function LeaderboardTable({
  rows,
  loading = false,
}: LeaderboardTableProps) {
  if (loading) {
    return <LeaderboardTableSkeleton />;
  }

  if (!rows.length) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Sales Leaderboard
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Trophy className="h-6 w-6" />
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            No Standings for This Window
          </p>
          <p className="max-w-xs text-xs text-slate-500">
            Account managers and reps will display rankings here once revenue or client touchpoints are logged.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      {/* Table Container Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Sales Leaderboard
            </h2>
            <p className="text-[11px] font-medium text-slate-500">
              Real-time rep closed deals and customer retention stats
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold font-mono text-slate-700 shadow-2xs">
            {rows.length} {rows.length === 1 ? "Rep" : "Reps"} Listed
          </span>
        </div>
      </div>

      {/* Structured Modern Grid */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <th scope="col" className="w-[64px] px-5 py-3.5 text-center">
                Rank
              </th>
              <th scope="col" className="px-5 py-3.5">
                Representative
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Won Revenue
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Closed Deals
              </th>
              <th scope="col" className="px-5 py-3.5 text-right">
                Touchpoints
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((rep, idx) => {
              const rank = getRankStyle(idx);
              const RankIcon = rank.icon;

              return (
                <tr
                  key={rep.userId}
                  className={`group transition-colors duration-150 ${rank.rowStyle}`}
                >
                  {/* Rank Badge Cell */}
                  <td className="w-[64px] px-5 py-3.5 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${rank.badge}`}
                    >
                      {RankIcon ? (
                        <RankIcon className={rank.iconClass} />
                      ) : (
                        String(idx + 1).padStart(2, "0")
                      )}
                    </span>
                  </td>

                  {/* Representative Identity */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs transition-transform group-hover:scale-105 ${rank.avatarBg}`}
                      >
                        {initials(rep.fullName)}
                      </div>
                      <div className="min-w-0 max-w-[240px]">
                        <p className="truncate text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {rep.fullName}
                        </p>
                        <p className="truncate text-[11px] font-medium text-slate-500">
                          {rep.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Won Revenue */}
                  <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-950">
                      {formatMoney(rep.wonRevenue, "USD")}
                    </span>
                  </td>

                  {/* Won Count */}
                  <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {rep.wonCount.toLocaleString()}
                    </span>
                  </td>

                  {/* Activities / Touchpoints */}
                  <td className="px-5 py-3.5 text-right font-mono whitespace-nowrap">
                    <span className="text-xs font-semibold text-slate-600">
                      {rep.activities.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// ==========================================
// Skeleton Loader
// ==========================================

function LeaderboardTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 animate-pulse">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-slate-200" />
          <div className="space-y-1">
            <div className="h-3 w-28 rounded-md bg-slate-200" />
            <div className="h-2 w-44 rounded-md bg-slate-100" />
          </div>
        </div>
        <div className="h-6 w-20 rounded-md bg-slate-200" />
      </div>

      <div className="divide-y divide-slate-100 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 animate-pulse"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-7 w-7 rounded-lg bg-slate-100" />
              <div className="h-9 w-9 rounded-xl bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-3 w-32 rounded-md bg-slate-200" />
                <div className="h-2.5 w-44 rounded-md bg-slate-100" />
              </div>
            </div>
            <div className="h-4 w-20 rounded-md bg-slate-200" />
            <div className="h-5 w-12 rounded-md bg-slate-100" />
            <div className="h-4 w-10 rounded-md bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}