"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";

export interface UpcomingTender {
  id: string;
  tenderer: string;
  title: string;
  daysLeft: number;
  value?: string;
}

interface Props {
  items: UpcomingTender[];
}

export function TenderOverviewUpcoming({ items }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#a97400]" />
          <h2 className="text-sm font-bold text-slate-900">
            Upcoming Deadlines
          </h2>
        </div>
        <Link
          href="/tenders/manage"
          className="text-[11px] font-semibold text-[#b8860b] hover:underline"
        >
          View all →
        </Link>
      </header>

      <ul className="divide-y divide-slate-100">
        {items.length === 0 && (
          <li className="p-8 text-center text-xs text-slate-500">
            No upcoming deadlines.
          </li>
        )}
        {items.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50/60"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {t.tenderer}
              </p>
              <p className="truncate text-[11px] text-slate-500">{t.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {t.value && (
                <span className="font-mono text-[11px] font-semibold text-slate-700">
                  {t.value}
                </span>
              )}
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                  t.daysLeft <= 3
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : t.daysLeft <= 7
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {t.daysLeft} d
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}