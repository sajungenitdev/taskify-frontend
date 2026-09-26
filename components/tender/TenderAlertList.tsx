"use client";

import Link from "next/link";
import { Flame, Clock, Lock, FileText, Target } from "lucide-react";
import type { AlertSection, AlertItem } from "@/hooks/tender/useTenderOverview";

type Props = AlertSection;

const ITEMS_PER_CARD = 3;

/* ============================================================
 * Section-aware destination mapping
 * keyed by the AlertSection.icon so every card routes to the
 * correct page.
 * ============================================================ */
const HREF_BY_ICON: Record<AlertSection["icon"], string> = {
  /* NEW HOT RFQS / TENDERS */
  flame: "/tenders/manage",

  /* IMMEDIATE SUBMISSION DEADLINES → active tab on manage */
  clock: "/tenders/manage?tab=active",

  /* TENDER / PERFORMANCE SECURITY MATURING */
  lock: "/tenders/security",

  /* BILLABLE — DELIVERED, READY TO INVOICE */
  file: "/tenders/submissions",

  /* DELIVERY DEADLINES — WON TENDERS IN EXECUTION */
  target: "/tenders/manage?tab=won",
};

export function TenderAlertList({ title, icon, color, items }: Props) {
  // Normalize: always exactly 3 slots
  const visibleItems: (AlertItem | null)[] = Array.from(
    { length: ITEMS_PER_CARD },
    (_, i) => items[i] ?? null,
  );

  /* ✅ Resolve the destination for this card */
  const href = HREF_BY_ICON[icon] ?? "/tenders/manage";

  const getIcon = () => {
    const cls = "h-4 w-4";
    switch (icon) {
      case "flame":
        return <Flame className={`${cls} text-red-500`} />;
      case "clock":
        return <Clock className={`${cls} text-orange-500`} />;
      case "lock":
        return <Lock className={`${cls} text-blue-500`} />;
      case "file":
        return <FileText className={`${cls} text-emerald-500`} />;
      case "target":
        return <Target className={`${cls} text-emerald-600`} />;
      default:
        return <FileText className={`${cls} text-slate-500`} />;
    }
  };

  const borderColor: Record<AlertSection["color"], string> = {
    red: "border-l-red-500",
    orange: "border-l-orange-500",
    blue: "border-l-blue-500",
    green: "border-l-emerald-500",
  };

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case "red":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "orange":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "blue":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "green":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <section
      className={`flex h-[260px] flex-col overflow-hidden rounded-xl border border-slate-200/80 border-l-4 ${borderColor[color]} bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]`}
    >
      <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        {getIcon()}
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {title}
        </h2>
      </header>

      <ul className="flex-1 divide-y divide-slate-100">
        {visibleItems.map((item, idx) =>
          item ? (
            <li key={item.id ?? idx}>
              {/* ✅ Each row links to the destination resolved for this section */}
              <Link
                href={href}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50/80 focus:bg-slate-50/80 focus:outline-none"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {item.entity}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {item.desc}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${getStatusColor(
                    item.statusColor,
                  )}`}
                >
                  {item.status}
                </span>
              </Link>
            </li>
          ) : (
            <li
              key={`empty-${idx}`}
              className="flex items-center justify-between gap-4 px-5 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="h-3 w-3/4 rounded bg-slate-100" />
                <div className="mt-1.5 h-2.5 w-1/2 rounded bg-slate-100" />
              </div>
              <span className="shrink-0 rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                —
              </span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}