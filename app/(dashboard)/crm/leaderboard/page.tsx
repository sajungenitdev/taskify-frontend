// app/(dashboard)/crm/leaderboard/page.tsx
"use client";

import React, { useState, useMemo, memo } from "react";
import Link from "next/link";
import {
    Trophy,
    Calendar,
    DollarSign,
    Briefcase,
    Activity,
    Award,
    KanbanSquare,
    TrendingUp,
} from "lucide-react";
import { LeaderboardTable } from "@/components/crm/LeaderboardTable";
import { useLeaderboard } from "@/hooks/crm/useCrmAnalytics";
import { formatMoney } from "@/utils/format";

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export default function LeaderboardPage() {
    const now = new Date();
    const [month, setMonth] = useState<number>(now.getMonth() + 1);
    const [year, setYear] = useState<number>(now.getFullYear());

    const { rows, loading } = useLeaderboard({ month, year });

    const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

    // Aggregate aggregate performance statistics for this specific period
    const metrics = useMemo(() => {
        let totalRevenue = 0;
        let totalDeals = 0;
        let totalActivities = 0;

        for (let i = 0; i < safeRows.length; i++) {
            totalRevenue += safeRows[i].wonRevenue || 0;
            totalDeals += safeRows[i].wonCount || 0;
            totalActivities += safeRows[i].activities || 0;
        }

        const topPerformer = safeRows.length > 0 ? safeRows[0].fullName : "None";

        return {
            totalRevenue,
            totalDeals,
            totalActivities,
            topPerformer,
        };
    }, [safeRows]);

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return [currentYear - 1, currentYear, currentYear + 1];
    }, []);

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* Header Section */}
                <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <Trophy className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Sales Leaderboard
                                </h1>
                                <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs sm:inline-flex">
                                    <Award className="h-3 w-3 text-amber-500" /> Performance Rankings
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Monthly revenue closed, win rates, and client engagement activity by representative
                            </p>
                        </div>
                    </div>

                    {/* Period Selector Controls */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs">
                            <Calendar className="ml-2 h-4 w-4 text-slate-400 shrink-0" />
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="h-8 rounded-lg bg-transparent px-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                                aria-label="Filter Month"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={i} value={i + 1}>
                                        {m}
                                    </option>
                                ))}
                            </select>

                            <span className="text-slate-300">/</span>

                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="h-8 rounded-lg bg-transparent px-2.5 text-xs font-semibold font-mono text-slate-800 focus:outline-hidden cursor-pointer"
                                aria-label="Filter Year"
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quick Context Links */}
                        <Link
                            href="/crm/pipeline"
                            className="hidden lg:inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden"
                            title="Sales Pipeline"
                        >
                            <KanbanSquare className="h-3.5 w-3.5 text-slate-500" />
                            <span>Pipeline</span>
                        </Link>
                        <Link
                            href="/crm/forecast"
                            className="hidden lg:inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden"
                            title="Forecast Matrix"
                        >
                            <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                            <span>Forecast</span>
                        </Link>
                    </div>
                </header>

                {/* Aggregate KPI Strip */}
                <section
                    aria-label="Period Performance Metrics"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <StatTile
                        label="Total Closed Revenue"
                        value={formatMoney(metrics.totalRevenue, "USD")}
                        icon={DollarSign}
                        iconBg="bg-emerald-50 text-emerald-600"
                    />
                    <StatTile
                        label="Deals Won"
                        value={metrics.totalDeals.toLocaleString()}
                        icon={Briefcase}
                        iconBg="bg-slate-50 text-slate-900"
                    />
                    <StatTile
                        label="Client Activities Logged"
                        value={metrics.totalActivities.toLocaleString()}
                        icon={Activity}
                        iconBg="bg-indigo-50 text-indigo-600"
                    />
                    <StatTile
                        label="Current Period Leader"
                        value={metrics.topPerformer}
                        isName
                        icon={Trophy}
                        iconBg="bg-amber-50 text-amber-600"
                    />
                </section>

                {/* Leaderboard Table Workspace */}
                <section aria-label="Leaderboard Rankings">
                    <LeaderboardTable rows={safeRows} loading={loading} />
                </section>
            </div>
        </main>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface StatTileProps {
    readonly label: string;
    readonly value: string;
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly iconBg: string;
    readonly isName?: boolean;
}

const StatTile = memo(function StatTile({
    label,
    value,
    icon: Icon,
    iconBg,
    isName = false,
}: StatTileProps) {
    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
            <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </span>
                <div className={`p-2 rounded-xl border border-slate-100 ${iconBg}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p
                className={`mt-2 text-xl font-bold tracking-tight text-slate-900 truncate ${isName ? "font-sans" : "font-mono"
                    }`}
            >
                {value}
            </p>
        </article>
    );
});