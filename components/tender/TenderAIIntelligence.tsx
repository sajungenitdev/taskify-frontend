"use client";

import { Sparkles } from "lucide-react";
import type { AIMatch } from "@/hooks/tender/useTenderOverview";
import { formatTimeAgo } from "@/hooks/tender/useTenderOverview";
import Link from "next/link";

interface Props {
  matches: AIMatch[];
  crawledAt?: string;
  loading?: boolean;
}

export function TenderAIIntelligence({ matches, crawledAt, loading }: Props) {
  const timeAgo = formatTimeAgo(crawledAt);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-500" />
          <h2 className="text-sm font-bold text-slate-900">
            AI Tender Intelligence
          </h2>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Crawled {timeAgo}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <p className="mb-4 text-[11px] text-slate-500">
          Scanned e-GP, CPTU &amp; 6 client portals overnight for matches to
          your active principals.
        </p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-16 rounded-full bg-slate-200" />
                </div>
                <div className="mt-2 h-3 w-3/4 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No AI matches found today.
          </p>
        ) : (
          <div className="space-y-4 h-[50px]">
            {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {match.portal}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${match.matchPercentage >= 90
                      ? "bg-emerald-100 text-emerald-700"
                      : match.matchPercentage >= 80
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-orange-50 text-orange-600"
                      }`}
                  >
                    {match.matchPercentage}% Match
                  </span>
                </div>
                <h3 className="mt-2 text-xs font-bold text-slate-900">
                  {match.title}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  {match.matches}
                </p>
                <Link
                  href="/tender/manage"
                  type="button"
                  className="mt-2 cursor-pointer text-[11px] font-semibold text-[#a97400] hover:underline"
                >
                  {match.actionText}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[10px] text-slate-400">
          Sources and matching keywords are configurable in Admin Panel ·
          Tender Source Settings.
        </p>
      </div>
    </section>
  );
}