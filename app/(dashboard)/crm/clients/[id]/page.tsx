// app/(dashboard)/crm/clients/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Building2,
    CalendarPlus,
    MapPin,
    Users,
    FileText,
    Briefcase,
    Layers,
    Clock3,
    Calendar,
    ChevronRight,
    ExternalLink,
    ShieldCheck,
    RefreshCw,
} from "lucide-react";
import { RfqTable } from "@/components/crm/RfqTable";
import { VisitLogModal } from "@/components/crm/VisitLogModal";
import { clientApi } from "@/lib/api/crm.api";
import { formatDate, formatDateTime, getOwnerName, initials } from "@/utils/format";
import toast from "react-hot-toast";
import type { Client, Lead, Rfq } from "@/types/crm/crm.types";

// ============================================================================
// Types & Domain Definitions
// ============================================================================

type ClientWithLinks = Client & { rfqs: Rfq[]; leads: Lead[] };
type TabId = "visits" | "rfqs" | "leads";

interface TabConfig {
    readonly id: TabId;
    readonly label: string;
    readonly icon: React.ComponentType<{ className?: string }>;
    readonly count: number;
}

const STAGE_CONFIG: Record<
    Client["stage"],
    { label: string; badge: string; dot: string }
> = {
    hot: {
        label: "Hot Account",
        badge: "border-rose-200/80 bg-rose-50 text-rose-700",
        dot: "bg-rose-500",
    },
    warm: {
        label: "Warm Pipeline",
        badge: "border-amber-200/80 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },
    won: {
        label: "Won / Active Client",
        badge: "border-emerald-200/80 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
    },
    cold: {
        label: "Cold Account",
        badge: "border-sky-200/80 bg-sky-50 text-sky-700",
        dot: "bg-sky-500",
    },
};

// ============================================================================
// Main Component
// ============================================================================

export default function ClientDetailPage() {
    const params = useParams<{ id: string }>();
    const [client, setClient] = useState<ClientWithLinks | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [openVisit, setOpenVisit] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<TabId>("visits");

    const loadClientDetails = useCallback(async () => {
        if (!params.id) return;
        setLoading(true);
        try {
            const data = await clientApi.get(params.id);
            setClient(data);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to load client profile";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        void loadClientDetails();
    }, [loadClientDetails]);

    if (loading || !client) {
        return (
            <main className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
                <div className="mx-auto container space-y-6">
                    <div className="h-4 w-28 animate-pulse rounded-md bg-slate-200" />
                    <div className="h-28 w-full animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
                            />
                        ))}
                    </div>
                    <div className="h-96 w-full animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
                </div>
            </main>
        );
    }

    const stageConfig = STAGE_CONFIG[client.stage] ?? {
        label: client.stage,
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        dot: "bg-slate-400",
    };

    const tabs: readonly TabConfig[] = [
        {
            id: "visits",
            label: "Logged Visits",
            icon: CalendarPlus,
            count: client.visitLog?.length ?? 0,
        },
        {
            id: "rfqs",
            label: "RFQ Requests",
            icon: FileText,
            count: client.rfqs?.length ?? 0,
        },
        {
            id: "leads",
            label: "Active Opportunities",
            icon: Briefcase,
            count: client.leads?.length ?? 0,
        },
    ];

    const fullLocation = [client.location, client.city, client.country]
        .filter(Boolean)
        .join(", ");

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* Navigation Breadcrumb */}
                <nav aria-label="Breadcrumb">
                    <Link
                        href="/crm/clients"
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
                        <span>Return to Client Directory</span>
                    </Link>
                </nav>

                {/* Executive Header Banner */}
                <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <Building2 className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    {client.name}
                                </h1>
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold capitalize ${stageConfig.badge}`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${stageConfig.dot}`} />
                                    <span>{stageConfig.label}</span>
                                </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                                {fullLocation && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{fullLocation}</span>
                                    </span>
                                )}
                                {client.sector && (
                                    <>
                                        <span className="text-slate-300">·</span>
                                        <span className="text-slate-700">{client.sector}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => void loadClientDetails()}
                            disabled={loading}
                            aria-label="Refresh Record"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 cursor-pointer disabled:opacity-50"
                            title="Refresh Account Data"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenVisit(true)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                        >
                            <CalendarPlus className="h-4 w-4" />
                            <span>Log Client Visit</span>
                        </button>
                    </div>
                </header>

                {/* Performance Metric Tiles */}
                <section
                    aria-label="Key Account Indicators"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <StatTile
                        label="Sector / Industry"
                        value={client.sector || "Unassigned"}
                    />
                    <StatTile
                        label="Assigned Lead Rep"
                        value={getOwnerName(client.assignedRep)}
                        icon={Users}
                    />
                    <StatTile
                        label="Visit Frequency"
                        value={`${client.visitsPerMonth ?? 0} per month`}
                        subtext={`Last Visit: ${client.lastVisitAt ? formatDate(client.lastVisitAt) : "Never recorded"
                            }`}
                        icon={Clock3}
                    />
                    <StatTile
                        label="Active RFQ Pipeline"
                        value={String(client.rfqs?.length ?? 0)}
                        subtext={`${client.leads?.length ?? 0} Opportunities linked`}
                        icon={FileText}
                    />
                </section>

                {/* Tabbed Activity Ledger */}
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    {/* Navigation Bar */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50 px-2 pt-2">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            const isActive = activeTab === t.id;

                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setActiveTab(t.id)}
                                    className={`relative inline-flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors cursor-pointer ${isActive
                                            ? "text-slate-950"
                                            : "text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                                    <span>{t.label}</span>
                                    <span
                                        className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${isActive
                                                ? "bg-slate-900 text-white"
                                                : "border border-slate-200 bg-white text-slate-600"
                                            }`}
                                    >
                                        {t.count}
                                    </span>

                                    {isActive && (
                                        <span className="absolute inset-x-2 bottom-0 h-0.5 bg-slate-900" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Workspaces */}
                    <div className="p-6">
                        {activeTab === "visits" && (
                            <VisitsTab client={client} onOpenModal={() => setOpenVisit(true)} />
                        )}
                        {activeTab === "rfqs" && <RfqTable rfqs={client.rfqs ?? []} />}
                        {activeTab === "leads" && <LeadsTab leads={client.leads ?? []} />}
                    </div>
                </section>
            </div>

            {/* Visit Logging Overlay Dialog */}
            <VisitLogModal
                open={openVisit}
                onOpenChange={setOpenVisit}
                clientId={client._id}
                onLogged={() => void loadClientDetails()}
            />
        </main>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface StatTileProps {
    readonly label: string;
    readonly value: string;
    readonly subtext?: string;
    readonly icon?: React.ComponentType<{ className?: string }>;
}

const StatTile = memo(function StatTile({
    label,
    value,
    subtext,
    icon: Icon,
}: StatTileProps) {
    return (
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
            <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </span>
                {Icon && (
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                )}
            </div>
            <p className="mt-1 font-mono text-base font-bold text-slate-900 truncate">
                {value}
            </p>
            {subtext && (
                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                    {subtext}
                </p>
            )}
        </article>
    );
});

interface VisitsTabProps {
    readonly client: ClientWithLinks;
    readonly onOpenModal: () => void;
}

const VisitsTab = memo(function VisitsTab({
    client,
    onOpenModal,
}: VisitsTabProps) {
    const visits = client.visitLog ?? [];

    if (!visits.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-2xs">
                    <CalendarPlus className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                    No Logged Visits On File
                </h3>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                    No historical onsite consultations, audits, or meetings recorded for this client.
                </p>
                <button
                    type="button"
                    onClick={onOpenModal}
                    className="mt-4 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                    <CalendarPlus className="h-3.5 w-3.5 text-slate-500" />
                    <span>Record First Visit</span>
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {[...visits].reverse().map((visit) => {
                const ownerName = getOwnerName(visit.by);

                return (
                    <article
                        key={visit._id}
                        className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-slate-900" />
                                <h4 className="text-xs font-bold text-slate-900">
                                    {visit.purpose || "On-site Visit"}
                                </h4>
                            </div>
                            <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-slate-500">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {formatDateTime(visit.at)}
                            </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-[9px] font-bold text-white">
                                    {initials(ownerName)}
                                </div>
                                <span className="text-xs font-medium text-slate-600">
                                    Conducted by <strong className="text-slate-900 font-semibold">{ownerName}</strong>
                                </span>
                                {visit.location && (
                                    <>
                                        <span className="text-slate-300">·</span>
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <MapPin className="h-3 w-3 text-slate-400" />
                                            {visit.location}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {visit.notes && (
                            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap">
                                {visit.notes}
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
});

interface LeadsTabProps {
    readonly leads: readonly Lead[];
}

const LeadsTab = memo(function LeadsTab({ leads }: LeadsTabProps) {
    if (!leads.length) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-2xs">
                    <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                    No Linked Pipeline Deals
                </h3>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                    This client account does not currently hold any assigned opportunity records in the pipeline.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
            {leads.map((deal) => (
                <div
                    key={deal._id}
                    className="flex items-center justify-between p-4 transition hover:bg-slate-50/60"
                >
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/crm/deals/${deal._id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                            <span>{deal.dealName || deal.companyName}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-700">
                                {deal.stage.replace(/_/g, " ")}
                            </span>
                            <span>·</span>
                            <span>Opened {formatDate(deal.createdAt)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-950">
                            ৳{(deal.value || 0).toLocaleString()}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                </div>
            ))}
        </div>
    );
});