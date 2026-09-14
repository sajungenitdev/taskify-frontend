// app/(dashboard)/crm/forecast/page.tsx
"use client";

import React, { memo } from "react";
import Link from "next/link";
import {
    Briefcase,
    Target,
    TrendingUp,
    KanbanSquare,
    Building2,
    Percent,
} from "lucide-react";
import { ForecastChart } from "@/components/crm/ForecastChart";
import { useForecast } from "@/hooks/crm/useCrmAnalytics";
import { formatMoney } from "@/utils/format";

export default function ForecastPage() {
    const { rows, totals, loading } = useForecast();

    // Weighted win conversion velocity calculation
    const weightedEfficiency =
        totals.raw > 0 ? Math.round((totals.weighted / totals.raw) * 100) : 0;

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* Header Section */}
                <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <TrendingUp className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Sales Forecast
                                </h1>
                                <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs sm:inline-flex">
                                    <Percent className="h-3 w-3 text-slate-400" /> Probability Weighted
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Probability-adjusted revenue projections grouped across target close dates
                            </p>
                        </div>
                    </div>

                    {/* Quick Module Context Actions */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/crm/pipeline"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                        >
                            <KanbanSquare className="h-3.5 w-3.5 text-slate-500" />
                            <span>Pipeline Board</span>
                        </Link>
                        <Link
                            href="/crm/clients"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                        >
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Clients</span>
                        </Link>
                    </div>
                </header>

                {/* Analytic Metric Tiles */}
                {loading ? (
                    <ForecastSkeleton />
                ) : (
                    <section
                        aria-label="Forecast Financial Aggregations"
                        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        <ForecastTile
                            label="Weighted Pipeline Total"
                            value={formatMoney(totals.weighted, "BDT")}
                            subtext="Expected risk-adjusted revenue"
                            formula="Σ (Deal Value × Probability %)"
                            icon={Target}
                            iconBg="bg-indigo-50 text-indigo-600"
                        />
                        <ForecastTile
                            label="Gross Pipeline Value"
                            value={formatMoney(totals.raw, "BDT")}
                            subtext="Unweighted face valuation"
                            formula="Sum of all open deals"
                            icon="৳"
                            iconBg="bg-emerald-50 text-emerald-600"
                        />
                        <ForecastTile
                            label="Active Pipeline Deals"
                            value={totals.count.toLocaleString()}
                            subtext="In-flight sales negotiations"
                            formula="Excludes won & lost deals"
                            icon={Briefcase}
                            iconBg="bg-amber-50 text-amber-600"
                        />
                        <ForecastTile
                            label="Weighted Probability Index"
                            value={`${weightedEfficiency}%`}
                            subtext="Weighted portfolio efficiency"
                            formula="Weighted Total ÷ Gross Total"
                            icon={Percent}
                            iconBg="bg-sky-50 text-sky-600"
                        />
                    </section>
                )}

                {/* Visual Chart Card */}
                <section
                    aria-label="Quarterly Forecast Visualizer"
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs"
                >
                    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                Revenue Trajectory
                            </h2>
                            <p className="text-xs text-slate-500">
                                Comparing gross opportunity commitments against conservative weighted projections
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5 font-medium text-slate-600">
                                <span className="h-2.5 w-2.5 rounded-sm bg-slate-900" />
                                <span>Weighted</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium text-slate-500">
                                <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
                                <span>Gross Value</span>
                            </div>
                        </div>
                    </div>

                    <ForecastChart rows={rows} currency="BDT" />
                </section>
            </div>
        </main>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ForecastTileProps {
    readonly label: string;
    readonly value: string;
    readonly subtext: string;
    readonly formula?: string;
    readonly icon: React.ComponentType<{ className?: string }> | string;
    readonly iconBg: string;
}

const ForecastTile = memo(function ForecastTile({
    label,
    value,
    subtext,
    formula,
    icon,
    iconBg,
}: ForecastTileProps) {
    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs">
            <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </span>
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 text-sm font-bold ${iconBg}`}
                >
                    {typeof icon === "string" ? (
                        <span>{icon}</span>
                    ) : (
                        (() => {
                            const Icon = icon;
                            return <Icon className="h-4 w-4" />;
                        })()
                    )}
                </div>
            </div>

            <div className="mt-3">
                <p className="font-mono text-2xl font-bold tracking-tight text-slate-900 truncate">
                    {value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 truncate">
                    {subtext}
                </p>
            </div>

            {formula && (
                <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                    <span className="font-mono text-[10px] text-slate-400">
                        {formula}
                    </span>
                </div>
            )}
        </article>
    );
});

const ForecastSkeleton = memo(function ForecastSkeleton() {
    return (
        <div
            aria-label="Loading forecast metrics"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            {Array.from({ length: 4 }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
                >
                    <div className="flex items-start justify-between">
                        <div className="h-3 w-28 rounded-md bg-slate-100" />
                        <div className="h-9 w-9 rounded-xl bg-slate-100" />
                    </div>
                    <div className="mt-4 h-7 w-32 rounded-md bg-slate-100" />
                    <div className="mt-2 h-3 w-40 rounded-md bg-slate-50" />
                    <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="h-2.5 w-32 rounded-md bg-slate-50" />
                    </div>
                </div>
            ))}
        </div>
    );
});