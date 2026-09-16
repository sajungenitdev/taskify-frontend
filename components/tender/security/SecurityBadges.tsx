"use client";

import { FileCheck, AlertTriangle } from "lucide-react";

/* ----- Entity badge ----- */
const ENTITY_STYLES: Record<string, string> = {
  "NGL-26": "bg-sky-100 text-sky-700 border-sky-200",
  "NG-26": "bg-amber-100 text-amber-700 border-amber-200",
  JT: "bg-slate-100 text-slate-600 border-slate-200",
};

export function EntityBadge({ entity }: { entity: string }) {
  const cls =
    ENTITY_STYLES[entity] ??
    "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${cls}`}
    >
      {entity}
    </span>
  );
}

/* ----- Docs status badge ----- */
export function DocsBadge({
  status,
}: {
  status: "Attached" | "Missing";
}) {
  if (status === "Attached") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <FileCheck className="h-3 w-3" />
        Attached
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
      <AlertTriangle className="h-3 w-3" />
      Missing
    </span>
  );
}

/* ----- Bell icon for due-date alert ----- */
export function BellIcon({ tone = "warn" }: { tone?: "warn" | "info" }) {
  const color =
    tone === "warn" ? "text-amber-500" : "text-slate-400";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 ${color}`}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}