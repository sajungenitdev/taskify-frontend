// components/tender/TenderOverviewRecent.tsx
"use client";

import {
  FileText,
  Trophy,
  XCircle,
  Upload,
  MessageCircle,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
type TenderActivity = {
  id: string | number;
  kind:
    | "submitted"
    | "won"
    | "lost"
    | "uploaded"
    | "discussed"
    | "chat"
    | "stage_change";
  tenderer: string;
  message: string;
  timeAgo: string;
};

/* Icon + tint per activity kind.
 * Includes the two newer kinds from the combined /overview endpoint:
 *   • chat         — a tender support chat message
 *   • stage_change — a stage transition logged on a tender
 */
const ICON_BY_KIND: Record<
  TenderActivity["kind"],
  { Icon: React.ComponentType<{ className?: string }>; bg: string }
> = {
  submitted: { Icon: Upload, bg: "bg-indigo-50 text-indigo-600" },
  won: { Icon: Trophy, bg: "bg-emerald-50 text-emerald-600" },
  lost: { Icon: XCircle, bg: "bg-rose-50 text-rose-600" },
  uploaded: { Icon: FileText, bg: "bg-slate-100 text-slate-600" },
  discussed: { Icon: MessageCircle, bg: "bg-amber-50 text-amber-600" },
  chat: { Icon: MessageSquare, bg: "bg-sky-50 text-sky-600" },
  stage_change: { Icon: RefreshCw, bg: "bg-violet-50 text-violet-600" },
};

interface Props {
  items: TenderActivity[];
}

export function TenderOverviewRecent({ items }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
        <p className="text-[11px] text-slate-500">
          Latest events across all tenders
        </p>
      </header>

      <ol className="divide-y divide-slate-100">
        {items.length === 0 && (
          <li className="p-8 text-center text-xs text-slate-500">
            No recent activity.
          </li>
        )}

        {items.map((a) => {
          /* Fall back gracefully if a kind ever arrives that we don't map */
          const meta =
            ICON_BY_KIND[a.kind] ??
            { Icon: FileText, bg: "bg-slate-100 text-slate-600" };
          const { Icon, bg } = meta;

          return (
            <li
              key={a.id}
              className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/60"
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${bg}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {a.tenderer}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {a.message}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-slate-400">
                {a.timeAgo}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}