"use client";

import React, { useEffect, useState, useTransition, memo } from "react";
import Link from "next/link";
import {
    Users,
    Briefcase,
    TrendingUp,
    DollarSign,
    Target,
    Trophy,
    BarChart3,
    KanbanSquare,
    ArrowUpRight,
    Activity,
    Sparkles,
    ChevronRight,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import { analyticsApi } from "@/lib/api/crm.api";
import { formatMoney } from "@/utils/format";

// =========================================================================
// Types & Domain Models
// =========================================================================

/** Pipeline monetary metrics */
export interface PipelineMetrics {
    readonly raw: number;
    readonly weighted: number;
}

/** CRM Dashboard KPI aggregation payload */
export interface CrmDashboardStats {
    readonly contacts: number;
    readonly openDeals: number;
    readonly wonThisMonth: number;
    readonly lostThisMonth: number;
    readonly wonRevenueThisMonth: number;
    readonly pipeline: PipelineMetrics;
    readonly activitiesThisMonth: number;
    readonly clients: number;
}

/** Individual KPI metric configuration item */
interface MetricConfig {
    readonly id: string;
    readonly label: string;
    readonly value: string | number;
    readonly subtext?: string;
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly iconColor: string;
    readonly iconBg: string;
}

/** Navigation link card configuration item */
interface QuickLinkConfig {
    readonly href: string;
    readonly title: string;
    readonly description: string;
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly badge?: string;
}

// =========================================================================
// Main Dashboard Page
// =========================================================================

export default function CrmDashboardPage() {
    const [stats, setStats] = useState<CrmDashboardStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    /**
     * Fetches real-time CRM performance stats from the server
     */
    const loadDashboardData = async () => {
        try {
            setError(null);
            const data = await analyticsApi.dashboardStats();
            startTransition(() => {
                setStats(data as unknown as CrmDashboardStats);
            });
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Unable to retrieve dashboard metrics.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDashboardData();
    }, []);

    return (
        <main className="min-h-screen bg-slate-50/60 pb-16 text-slate-900">
            <div className="mx-auto container space-y-8 p-6 lg:p-8">
                {/* Top Header & Fast Navigation Bar */}
                <DashboardHeader
                    isRefreshing={loading || isPending}
                    onRefresh={() => void loadDashboardData()}
                />

                {/* Global Error Notice Banner */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800 backdrop-blur-xs"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                            <span>{error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => void loadDashboardData()}
                            className="font-semibold text-rose-700 underline hover:text-rose-900"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Metric Cards Matrix */}
                {loading ? (
                    <DashboardStatsSkeleton />
                ) : (
                    <DashboardStatsGrid stats={stats} />
                )}

                {/* Module Fast Access Links */}
                <DashboardQuickNav />
            </div>
        </main>
    );
}

// =========================================================================
// Presentation Sub-Components
// =========================================================================

/**
 * Top branding bar with operational pipeline links
 */
interface DashboardHeaderProps {
    readonly isRefreshing: boolean;
    readonly onRefresh: () => void;
}

const DashboardHeader = memo(function DashboardHeader({
    isRefreshing,
    onRefresh,
}: DashboardHeaderProps) {
    return (
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6">
            <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        CRM Dashboard
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                        Live operations, pipeline analytics, and revenue metrics
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    aria-label="Refresh Dashboard Metrics"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>

                <Link
                    href="/crm/pipeline"
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                >
                    <KanbanSquare className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                    Pipeline
                </Link>

                <Link
                    href="/crm/contacts"
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20"
                >
                    <Users className="mr-1.5 h-3.5 w-3.5 text-slate-300" />
                    Contacts
                </Link>
            </div>
        </header>
    );
});

/**
 * High-density metrics board organized in an 8-cell layout
 */
interface DashboardStatsGridProps {
    readonly stats: CrmDashboardStats | null;
}

const DashboardStatsGrid = memo(function DashboardStatsGrid({
    stats,
}: DashboardStatsGridProps) {
    const metrics: readonly MetricConfig[] = [
        {
            id: "contacts",
            label: "Total Contacts",
            value: stats?.contacts.toLocaleString() ?? 0,
            icon: Users,
            iconColor: "text-slate-900",
            iconBg: "bg-slate-100",
        },
        {
            id: "open-deals",
            label: "Open Deals",
            value: stats?.openDeals.toLocaleString() ?? 0,
            icon: Briefcase,
            iconColor: "text-indigo-600",
            iconBg: "bg-indigo-50",
        },
        {
            id: "weighted-pipeline",
            label: "Weighted Pipeline",
            value: formatMoney(stats?.pipeline.weighted ?? 0, "USD"),
            subtext: `Raw Pipeline: ${formatMoney(stats?.pipeline.raw ?? 0, "USD")}`,
            icon: Target,
            iconColor: "text-emerald-600",
            iconBg: "bg-emerald-50",
        },
        {
            id: "won-deals",
            label: "Won This Month",
            value: stats?.wonThisMonth.toLocaleString() ?? 0,
            subtext: `Revenue: ${formatMoney(stats?.wonRevenueThisMonth ?? 0, "USD")}`,
            icon: Trophy,
            iconColor: "text-amber-600",
            iconBg: "bg-amber-50",
        },
        {
            id: "activities",
            label: "Monthly Activities",
            value: stats?.activitiesThisMonth.toLocaleString() ?? 0,
            subtext: "Logged client touchpoints",
            icon: Activity,
            iconColor: "text-cyan-600",
            iconBg: "bg-cyan-50",
        },
        {
            id: "clients",
            label: "Active Clients",
            value: stats?.clients.toLocaleString() ?? 0,
            icon: Users,
            iconColor: "text-violet-600",
            iconBg: "bg-violet-50",
        },
        {
            id: "lost-deals",
            label: "Lost This Month",
            value: stats?.lostThisMonth.toLocaleString() ?? 0,
            icon: BarChart3,
            iconColor: "text-rose-600",
            iconBg: "bg-rose-50",
        },
        {
            id: "won-revenue",
            label: "Won Revenue (MTD)",
            value: formatMoney(stats?.wonRevenueThisMonth ?? 0, "USD"),
            icon: DollarSign,
            iconColor: "text-emerald-600",
            iconBg: "bg-emerald-50",
        },
    ];

    return (
        <section
            aria-label="Core Performance Metrics"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            {metrics.map((m) => (
                <MetricCard key={m.id} config={m} />
            ))}
        </section>
    );
});

/**
 * Metric card component with consistent border and typography hierarchy
 */
interface MetricCardProps {
    readonly config: MetricConfig;
}

const MetricCard = memo(function MetricCard({ config }: MetricCardProps) {
    const { label, value, subtext, icon: Icon, iconColor, iconBg } = config;

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-sm">
            <div className="flex items-start justify-between">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/50 ${iconBg} ${iconColor}`}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-700" />
            </div>

            <div className="mt-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                </h3>
                <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900">
                    {value}
                </p>
                {subtext && (
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        {subtext}
                    </p>
                )}
            </div>
        </article>
    );
});

/**
 * Quick access navigation cards
 */
const DashboardQuickNav = memo(function DashboardQuickNav() {
    const quickLinks: readonly QuickLinkConfig[] = [
        {
            href: "/crm/pipeline",
            icon: KanbanSquare,
            title: "Sales Pipeline",
            description: "Manage stages, progression, and lead velocity",
            badge: "Kanban",
        },
        {
            href: "/crm/forecast",
            icon: TrendingUp,
            title: "Sales Forecast",
            description: "Review weighted probability models and quarterly targets",
            badge: "Analytics",
        },
        {
            href: "/crm/clients",
            icon: Users,
            title: "Client Directory",
            description: "Monitor RFQs, accounts, and engagement history",
        },
        {
            href: "/crm/leaderboard",
            icon: Trophy,
            title: "Rep Leaderboard",
            description: "Evaluate quotas and monthly conversions",
            badge: "Monthly",
        },
    ];

    return (
        <section aria-labelledby="quick-access-heading">
            <div className="mb-4 flex items-center justify-between">
                <h2
                    id="quick-access-heading"
                    className="text-sm font-bold tracking-tight text-slate-900 uppercase"
                >
                    Workspaces & Tools
                </h2>
                <span className="text-xs text-slate-500">
                    Direct navigation to core modules
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickLinks.map((link) => (
                    <QuickLinkCard key={link.href} item={link} />
                ))}
            </div>
        </section>
    );
});

/**
 * Individual workspace jump card
 */
interface QuickLinkCardProps {
    readonly item: QuickLinkConfig;
}

const QuickLinkCard = memo(function QuickLinkCard({ item }: QuickLinkCardProps) {
    const { href, icon: Icon, title, description, badge } = item;

    return (
        <Link
            href={href}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all hover:border-slate-900/20 hover:bg-slate-50/50 hover:shadow-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
        >
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
                        <Icon className="h-4 w-4" />
                    </div>

                    {badge && (
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {badge}
                        </span>
                    )}
                </div>

                <div className="mt-4">
                    <h3 className="flex items-center text-sm font-semibold text-slate-900 group-hover:text-slate-950">
                        {title}
                        <ChevronRight className="ml-1.5 h-3.5 w-3.5 -translate-x-1 text-slate-400 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
});

/**
 * Loading skeleton matching the dashboard card dimensions
 */
const DashboardStatsSkeleton = memo(function DashboardStatsSkeleton() {
    return (
        <div
            aria-label="Loading analytics data"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
                >
                    <div className="h-10 w-10 rounded-xl bg-slate-100" />
                    <div className="mt-4 h-3 w-20 rounded-md bg-slate-100" />
                    <div className="mt-2 h-7 w-28 rounded-md bg-slate-100" />
                    <div className="mt-2 h-3 w-36 rounded-md bg-slate-50" />
                </div>
            ))}
        </div>
    );
});