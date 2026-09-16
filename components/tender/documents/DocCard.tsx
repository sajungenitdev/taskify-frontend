// components/tender/documents/DocCard.tsx
"use client";

import { FileText, Trophy } from "lucide-react";
import { StatusPill } from "./StatusPill";
import type { CompanyDocUI } from "@/lib/api/mappers";

/** Re-export for consumers that import `CompanyDoc` from here */
export type CompanyDoc = CompanyDocUI;

interface Props {
  doc: CompanyDocUI;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onAction?: (doc: CompanyDocUI) => void;
}

export function DocCard({ doc, selected, onToggleSelect, onAction }: Props) {
  const isExpiring = doc.status === "Expiring Soon";
  const isExperience = doc.category === "experience";

  /* ---------- Experience / Profile card variant ---------- */
  if (isExperience || (doc.chips && doc.chips.length > 0)) {
    return (
      <article
        className={`relative flex flex-col rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition ${selected
            ? "border-slate-900 ring-1 ring-slate-900/5"
            : "border-slate-200/80 hover:border-slate-300"
          }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Trophy className="h-5 w-5" />
          </div>
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect?.(doc.id)}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
        </div>

        <div className="mt-3 min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-slate-900">
            {doc.title}
          </h3>
          {doc.subtitle && (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
              {doc.subtitle}
            </p>
          )}
        </div>

        {doc.chips && doc.chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {doc.chips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onAction?.(doc)}
          className="mt-4 self-start text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline"
        >
          View Certificate →
        </button>
      </article>
    );
  }

  /* ---------- Legal / certificate card variant ---------- */
  return (
    <article
      className={`relative flex flex-col rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition ${isExpiring
          ? "border-orange-300 ring-1 ring-orange-100"
          : selected
            ? "border-slate-900"
            : "border-slate-200/80 hover:border-slate-300"
        }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <FileText className="h-5 w-5" />
        </div>
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect?.(doc.id)}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-slate-900 focus:ring-slate-900"
        />
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-slate-900">
          {doc.title}
        </h3>
        {doc.reference && (
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
            {doc.reference}
          </p>
        )}
        {doc.validity && (
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {doc.validity}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <StatusPill status={doc.status} />
        {doc.action && (
          <button
            type="button"
            onClick={() => onAction?.(doc)}
            className={
              doc.action === "Replace"
                ? "inline-flex h-7 items-center rounded-md bg-[#a97400] px-3 text-[10px] font-semibold text-white hover:bg-[#8f6100]"
                : "text-[11px] font-semibold text-slate-700 hover:text-slate-900 hover:underline"
            }
          >
            {doc.action}
          </button>
        )}
      </div>
    </article>
  );
}