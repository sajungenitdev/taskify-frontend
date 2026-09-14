// components/crm/LeadScoreCard.tsx
"use client";
import { Sparkles, TrendingUp } from "lucide-react";
import type { Lead } from "@/types/crm/crm.types";

function getTier(score: number) {
  if (score >= 80)
    return {
      label: "Excellent",
      text: "text-emerald-600 dark:text-emerald-400",
      bar: "bg-gradient-to-r from-emerald-500 to-teal-500",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  if (score >= 60)
    return {
      label: "Good",
      text: "text-indigo-600 dark:text-indigo-400",
      bar: "bg-gradient-to-r from-indigo-500 to-purple-500",
      badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    };
  if (score >= 40)
    return {
      label: "Fair",
      text: "text-amber-600 dark:text-amber-400",
      bar: "bg-gradient-to-r from-amber-500 to-orange-500",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    };
  return {
    label: "Low",
    text: "text-red-600 dark:text-red-400",
    bar: "bg-gradient-to-r from-red-500 to-rose-500",
    badge: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  };
}

export function LeadScoreCard({ lead }: { lead: Lead }) {
  const score = lead.score ?? 0;
  const breakdown = lead.scoreBreakdown ?? [];
  const tier = getTier(score);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0d1b33]">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Lead Score
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tier.badge}`}
        >
          {tier.label}
        </span>
      </div>

      {/* ---------- Body ---------- */}
      <div className="space-y-4 px-5 py-4">
        {/* Score row */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {score}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">/ 100</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
          <div
            className={`h-full ${tier.bar} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {breakdown.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No scoring rules matched yet.
            </p>
          ) : (
            breakdown.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-gray-50/60 px-3 py-1.5 text-xs dark:bg-white/5"
              >
                <span className="truncate pr-2 text-gray-600 dark:text-gray-300">
                  {b.reason}
                </span>
                <span className="inline-flex flex-shrink-0 items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />+{b.points}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}