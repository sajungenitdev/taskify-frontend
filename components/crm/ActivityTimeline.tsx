// components/crm/ActivityTimeline.tsx
"use client";
import {
  Phone,
  Mail,
  Users,
  StickyNote,
  ArrowRight,
  CalendarClock,
  Plus,
} from "lucide-react";
import { formatDateTime, relativeTime, getOwnerName } from "@/utils/format";
import type { ActivityType, DealActivity } from "@/types/crm/crm.types";

const iconByType: Record<
  ActivityType,
  React.ComponentType<{ className?: string }>
> = {
  call: Phone,
  email: Mail,
  follow_up: CalendarClock,
  meeting: Users,
  note: StickyNote,
  stage_change: ArrowRight,
  task_created: CalendarClock,
};

const colorByType: Record<ActivityType, string> = {
  call: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  email: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  follow_up: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
  meeting: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  note: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
  stage_change:
    "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  task_created: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
};

interface Props {
  activities: DealActivity[];
  loading?: boolean;
  onLogActivity?: () => void;
}

export function ActivityTimeline({ activities, loading, onLogActivity }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0d1b33]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Activity Timeline
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activities.length} entr{activities.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogActivity}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 text-xs font-medium text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Log activity
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5"
              />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            No activity yet. Click &ldquo;Log activity&rdquo; to add the first
            entry.
          </div>
        ) : (
          <ol className="relative space-y-4 border-l border-gray-200 pl-6 dark:border-gray-800">
            {activities.map((a) => {
              const Icon = iconByType[a.type] ?? StickyNote;
              return (
                <li key={a._id} className="relative">
                  {/* Icon bubble */}
                  <span
                    className={`absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0d1b33] ${colorByType[a.type]
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>

                  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 transition hover:border-gray-200 dark:border-gray-800 dark:bg-white/5 dark:hover:border-gray-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {a.summary}
                        </p>
                        {a.details && (
                          <p className="mt-1 whitespace-pre-wrap text-xs text-gray-500 dark:text-gray-400">
                            {a.details}
                          </p>
                        )}
                        {a.metadata?.fromStage && a.metadata?.toStage && (
                          <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="rounded-full border border-gray-200 px-2 py-0.5 capitalize dark:border-gray-700">
                              {a.metadata.fromStage.replace("_", " ")}
                            </span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="rounded-full border border-gray-200 px-2 py-0.5 capitalize dark:border-gray-700">
                              {a.metadata.toStage.replace("_", " ")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-gray-400 dark:text-gray-500">
                        <div>{relativeTime(a.createdAt)}</div>
                        <div>{formatDateTime(a.createdAt)}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                      by {getOwnerName(a.createdBy)}
                      {a.duration ? ` · ${a.duration} min` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}