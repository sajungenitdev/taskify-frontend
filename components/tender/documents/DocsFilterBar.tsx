"use client";

import { List } from "lucide-react";

export interface ExperienceFilters {
  sector: string;    // "all" | "Power & Energy" | "Financial" | "Government"
  duration: string;  // "all" | "1+ Yr" | "3+ Yrs" | "5+ Yrs"
  volume: string;    // "all" | "৳3L+" | "৳5L+" | "৳10L+"
}

interface Props {
  value: ExperienceFilters;
  onChange: (next: ExperienceFilters) => void;
  sectors: string[];
}

const selectCls =
  "h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none";

export function DocsFilterBar({ value, onChange, sectors }: Props) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={selectCls}
          value={value.sector}
          onChange={(e) => onChange({ ...value, sector: e.target.value })}
        >
          <option value="all">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className={selectCls}
          value={value.duration}
          onChange={(e) => onChange({ ...value, duration: e.target.value })}
        >
          <option value="all">Any Duration</option>
          <option value="1+ Yr">1+ Yr</option>
          <option value="3+ Yrs">3+ Yrs</option>
          <option value="5+ Yrs">5+ Yrs</option>
        </select>

        <select
          className={selectCls}
          value={value.volume}
          onChange={(e) => onChange({ ...value, volume: e.target.value })}
        >
          <option value="all">Any Volume</option>
          <option value="৳3L+">৳3L+</option>
          <option value="৳5L+">৳5L+</option>
          <option value="৳10L+">৳10L+</option>
        </select>

        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <List className="h-3.5 w-3.5" />
          List View
        </button>
      </div>

      <p className="text-[11px] text-slate-500">
        Select entries below to import as reference certificates.
      </p>
    </section>
  );
}