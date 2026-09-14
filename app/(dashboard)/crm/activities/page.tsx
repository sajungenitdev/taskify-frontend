// app/(dashboard)/crm/activities/page.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import {
    Activity,
    ArrowRight,
    Briefcase,
    CalendarClock,
    Mail,
    Phone,
    RefreshCw,
    StickyNote,
    Users,
    Clock3,
    Filter,
    CheckCircle2,
} from "lucide-react";
import { activityApi } from "@/lib/api/crm.api";
import { formatDateTime, relativeTime } from "@/utils/format";
import toast from "react-hot-toast";
import type { ActivityType, DealActivity } from "@/types/crm/crm.types";

// ============================================================================
// Visual Icon & Palette Configurations
// ============================================================================

interface ActivityVisualConfig {
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly iconClass: string;
    readonly badgeClass: string;
}

const ACTIVITY_VISUALS: Record<ActivityType, ActivityVisualConfig> = {
    call: {
        icon: Phone,
        iconClass: "text-sky-600 bg-sky-50 border-sky-100",
        badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    },
    email: {
        icon: Mail,
        iconClass: "text-indigo-600 bg-indigo-50 border-indigo-100",
        badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    meeting: {
        icon: Users,
        iconClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    follow_up: {
        icon: CalendarClock,
        iconClass: "text-amber-600 bg-amber-50 border-amber-100",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    },
    note: {
        icon: StickyNote,
        iconClass: "text-slate-600 bg-slate-100 border-slate-200",
        badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    },
    stage_change: {
        icon: ArrowRight,
        iconClass: "text-slate-900 bg-slate-100 border-slate-300",
        badgeClass: "border-slate-300 bg-slate-100 text-slate-900",
    },
    task_created: {
        icon: CalendarClock,
        iconClass: "text-teal-600 bg-teal-50 border-teal-100",
        badgeClass: "border-teal-200 bg-teal-50 text-teal-700",
    },
};

interface FilterOption {
    readonly value: string;
    readonly label: string;
    readonly icon?: React.ComponentType<{ className?: string }>;
}

const FILTERS: readonly FilterOption[] = [
    { value: "all", label: "All Engagements" },
    { value: "call", label: "Calls", icon: Phone },
    { value: "email", label: "Emails", icon: Mail },
    { value: "meeting", label: "Meetings", icon: Users },
    { value: "follow_up", label: "Follow-ups", icon: CalendarClock },
    { value: "note", label: "Notes", icon: StickyNote },
    { value: "stage_change", label: "Stage Changes", icon: ArrowRight },
];

// ============================================================================
// Main Page Component
// ============================================================================

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<DealActivity[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<string>("all");
    const [refreshing, setRefreshing] = useState<boolean>(false);

    const loadActivities = useCallback(
        async (isManualRefresh = false) => {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);

            try {
                const res = await activityApi.myFeed({
                    type: filter === "all" ? undefined : filter,
                    limit: 100,
                });
                setActivities(Array.isArray(res?.data) ? res.data : []);
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Failed to load activity stream";
                toast.error(message);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [filter]
    );

    useEffect(() => {
        void loadActivities();
    }, [loadActivities]);

    // Aggregate high-level touchpoint counters
    const metrics = useMemo(() => {
        let calls = 0;
        let emails = 0;
        let meetings = 0;
        let stageChanges = 0;

        for (let i = 0; i < activities.length; i++) {
            const type = activities[i].type;
            if (type === "call") calls++;
            else if (type === "email") emails++;
            else if (type === "meeting") meetings++;
            else if (type === "stage_change") stageChanges++;
        }

        return {
            total: activities.length,
            calls,
            emails,
            meetings,
            stageChanges,
        };
    }, [activities]);

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* Header Section */}
                <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <Activity className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Engagement Feed
                                </h1>
                                <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs sm:inline-flex">
                                    <Clock3 className="h-3 w-3 text-slate-400" /> Real-time Audit
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Chronological ledger of customer consultations, outbound communication, and stage velocity
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void loadActivities(true)}
                            disabled={refreshing || loading}
                            aria-label="Refresh Feed"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-slate-900" : "text-slate-500"}`}
                            />
                            <span>Refresh Ledger</span>
                        </button>
                    </div>
                </header>

                {/* Analytic Metrics Strip */}
                <section
                    aria-label="Feed Activity Summary"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <SummaryMiniTile
                        label="Total Logged"
                        value={metrics.total}
                        colorClass="text-slate-950"
                    />
                    <SummaryMiniTile
                        label="Calls Completed"
                        value={metrics.calls}
                        colorClass="text-sky-600"
                        icon={Phone}
                        iconBg="bg-sky-50 text-sky-600"
                    />
                    <SummaryMiniTile
                        label="Meetings Held"
                        value={metrics.meetings}
                        colorClass="text-emerald-600"
                        icon={Users}
                        iconBg="bg-emerald-50 text-emerald-600"
                    />
                    <SummaryMiniTile
                        label="Pipeline Transitions"
                        value={metrics.stageChanges}
                        colorClass="text-slate-900"
                        icon={ArrowRight}
                        iconBg="bg-slate-100 text-slate-700"
                    />
                </section>

                {/* Filter Navigation Bar */}
                <section
                    aria-label="Activity Filter Bar"
                    className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs"
                >
                    <div className="flex items-center gap-1 px-2 text-slate-400">
                        <Filter className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Filter</span>
                    </div>

                    {FILTERS.map((f) => {
                        const isActive = filter === f.value;
                        const Icon = f.icon;

                        return (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFilter(f.value)}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${isActive
                                        ? "bg-slate-900 text-white shadow-xs"
                                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                                    }`}
                            >
                                {Icon && <Icon className="h-3 w-3" />}
                                <span>{f.label}</span>
                            </button>
                        );
                    })}
                </section>

                {/* Chronological Activity Feed */}
                <section aria-label="Activity Events Ledger">
                    {loading ? (
                        <ActivityFeedSkeleton />
                    ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-2xs">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 shadow-2xs">
                                <Activity className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                                No Logged Engagements
                            </h3>
                            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                                No activity logs match your active criteria. Log client touchpoints or advance deal stages to build your pipeline audit trail.
                            </p>
                            <Link
                                href="/crm/pipeline"
                                className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden"
                            >
                                <Briefcase className="h-3.5 w-3.5" />
                                <span>Navigate to Pipeline</span>
                            </Link>
                        </div>
                    ) : (
                        <ol className="relative border-l border-slate-200 ml-4 space-y-6">
                            {activities.map((activity) => {
                                const visual = ACTIVITY_VISUALS[activity.type] ?? ACTIVITY_VISUALS.note;
                                const Icon = visual.icon;
                                const deal =
                                    activity.leadId && typeof activity.leadId === "object"
                                        ? activity.leadId
                                        : null;

                                return (
                                    <li key={activity._id} className="relative pl-6 group">
                                        {/* Visual Node Pin on Vertical Spine */}
                                        <span
                                            className={`absolute -left-3.5  flex h-7 w-7 items-center justify-center rounded-xl border shadow-2xs ${visual.iconClass}`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                        </span>

                                        {/* Content Card */}
                                        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300 hover:shadow-xs">
                                            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${visual.badgeClass}`}
                                                        >
                                                            {activity.type.replace(/_/g, " ")}
                                                        </span>
                                                        <p className="truncate text-xs font-bold text-slate-900">
                                                            {activity.summary}
                                                        </p>
                                                    </div>

                                                    {deal && (
                                                        <Link
                                                            href={`/crm/deals/${deal._id}`}
                                                            className="mt-1 inline-flex items-center gap-1 font-semibold text-xs text-slate-700 hover:text-indigo-600 hover:underline transition-colors"
                                                        >
                                                            <Briefcase className="h-3 w-3 text-slate-400" />
                                                            <span>{deal.dealName || deal.companyName}</span>
                                                        </Link>
                                                    )}
                                                </div>

                                                {/* Timestamp Metadata */}
                                                <div className="shrink-0 text-right font-mono text-[11px] text-slate-400">
                                                    <div className="font-semibold text-slate-600">
                                                        {relativeTime(activity.createdAt)}
                                                    </div>
                                                    <div>{formatDateTime(activity.createdAt)}</div>
                                                </div>
                                            </div>

                                            {/* Observations & Narrative Text */}
                                            {activity.details && (
                                                <p className="mt-2.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                                                    {activity.details}
                                                </p>
                                            )}

                                            {/* Stage Transition Visual Indicator */}
                                            {activity.metadata?.fromStage && activity.metadata?.toStage && (
                                                <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-[11px] font-mono font-medium">
                                                    <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 capitalize text-slate-700 shadow-2xs">
                                                        {activity.metadata.fromStage.replace(/_/g, " ")}
                                                    </span>
                                                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                                                    <span className="rounded-md border border-slate-900 bg-slate-900 px-2 py-0.5 capitalize text-white shadow-2xs">
                                                        {activity.metadata.toStage.replace(/_/g, " ")}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Sub-line Context */}
                                            {activity.duration ? (
                                                <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                                    <Clock3 className="h-3 w-3 text-slate-400" />
                                                    <span>Call Duration: {activity.duration} minutes</span>
                                                </div>
                                            ) : null}
                                        </article>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </section>
            </div>
        </main>
    );
}

// ============================================================================
// Sub-Components & Skeletons
// ============================================================================

interface SummaryMiniTileProps {
    readonly label: string;
    readonly value: number;
    readonly colorClass: string;
    readonly icon?: React.ComponentType<{ className?: string }>;
    readonly iconBg?: string;
}

const SummaryMiniTile = memo(function SummaryMiniTile({
    label,
    value,
    colorClass,
    icon: Icon,
    iconBg = "bg-slate-50 text-slate-400",
}: SummaryMiniTileProps) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between transition hover:border-slate-300">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </p>
                <p className={`text-xl font-bold font-mono tracking-tight mt-1 ${colorClass}`}>
                    {value.toLocaleString()}
                </p>
            </div>
            {Icon && (
                <div className={`p-2.5 rounded-xl border border-slate-100 ${iconBg}`}>
                    <Icon className="w-4 h-4" />
                </div>
            )}
        </div>
    );
});

function ActivityFeedSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="h-6 w-16 rounded-md bg-slate-200" />
                            <div className="h-4 w-44 rounded-md bg-slate-200" />
                        </div>
                        <div className="h-3 w-20 rounded-md bg-slate-100" />
                    </div>
                    <div className="mt-3 space-y-1.5">
                        <div className="h-3 w-full rounded bg-slate-100" />
                        <div className="h-3 w-2/3 rounded bg-slate-50" />
                    </div>
                </div>
            ))}
        </div>
    );
}