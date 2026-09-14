// app/(dashboard)/crm/deals/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle,
    Rocket,
    DollarSign,
    Percent,
    CalendarClock,
    Sparkles,
    ExternalLink,
    Building2,
    User as UserIcon,
    RefreshCw,
    FolderCheck,
} from "lucide-react";
import { ActivityTimeline } from "@/components/crm/ActivityTimeline";
import { StageBadge } from "@/components/crm/StageBadge";
import { LogActivityModal } from "@/components/crm/modals/LogActivityModal";
import { ScheduleFollowUpModal } from "@/components/crm/modals/ScheduleFollowUpModal";
import { ConvertToProjectModal } from "@/components/crm/modals/ConvertToProjectModal";
import { leadApi } from "@/lib/api/crm.api";
import { formatMoney, formatDate, getOwnerName } from "@/utils/format";
import toast from "react-hot-toast";
import type { DealActivity, Lead } from "@/types/crm/crm.types";

export default function DealWorkspacePage() {
    const params = useParams<{ id: string }>();
    const [lead, setLead] = useState<(Lead & { activities: DealActivity[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [openLog, setOpenLog] = useState(false);
    const [openFollow, setOpenFollow] = useState(false);
    const [openConvert, setOpenConvert] = useState(false);
    const [markingWon, setMarkingWon] = useState(false);

    const loadDeal = useCallback(async () => {
        if (!params.id) return;
        setLoading(true);
        try {
            const data = await leadApi.get(params.id);
            setLead(data);
        } catch (e) {
            toast.error((e as Error).message || "Failed to load deal record");
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        void loadDeal();
    }, [loadDeal]);

    const markWon = async () => {
        if (!lead) return;
        setMarkingWon(true);
        try {
            await leadApi.changeStage(lead._id, "won");
            toast.success("Deal moved to Won");
            await loadDeal();
        } catch (e) {
            toast.error((e as Error).message || "Failed to update deal stage");
        } finally {
            setMarkingWon(false);
        }
    };

    if (loading || !lead) {
        return (
            <main className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="h-4 w-28 animate-pulse rounded-md bg-slate-200" />
                    <div className="h-28 w-full animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
                        <div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-white lg:col-span-2" />
                    </div>
                </div>
            </main>
        );
    }

    const projectObj =
        lead.projectId && typeof lead.projectId === "object" ? lead.projectId : null;

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
                {/* Navigation Breadcrumb */}
                <nav aria-label="Breadcrumb">
                    <Link
                        href="/crm/pipeline"
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
                        <span>Return to Pipeline</span>
                    </Link>
                </nav>

                {/* Executive Header Banner */}
                <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <Briefcase className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
                                    {lead.dealName || lead.companyName}
                                </h1>
                                <StageBadge stage={lead.stage} />
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-700">{lead.companyName}</span>
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="flex items-center gap-1">
                                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{getOwnerName(lead.owner)}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void loadDeal()}
                            disabled={loading}
                            aria-label="Refresh Record"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 cursor-pointer disabled:opacity-50"
                            title="Refresh Record"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-slate-900" : ""}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenFollow(true)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                        >
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>Follow-up</span>
                        </button>

                        {lead.stage !== "won" && lead.stage !== "lost" && (
                            <button
                                type="button"
                                onClick={markWon}
                                disabled={markingWon}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700 shadow-2xs transition-colors hover:bg-emerald-100 disabled:opacity-60 cursor-pointer"
                            >
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{markingWon ? "Marking..." : "Mark Won"}</span>
                            </button>
                        )}

                        {lead.stage === "won" && !projectObj && (
                            <button
                                type="button"
                                onClick={() => setOpenConvert(true)}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                            >
                                <Rocket className="h-3.5 w-3.5 text-indigo-400" />
                                <span>Convert to Project</span>
                            </button>
                        )}

                        {projectObj && (
                            <Link
                                href={`/projects/${projectObj._id}`}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 shadow-2xs transition-colors hover:bg-indigo-100"
                            >
                                <FolderCheck className="h-3.5 w-3.5" />
                                <span>Open Project</span>
                                <ExternalLink className="h-3 w-3 opacity-60" />
                            </Link>
                        )}
                    </div>
                </header>

                {/* Content Workspace Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Summary Panel */}
                    <section className="space-y-4">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-slate-900" />
                                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                        Deal Valuation
                                    </h2>
                                </div>
                                {lead.score !== undefined && (
                                    <span
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700"
                                        title="Proprietary Lead Score"
                                    >
                                        Score {lead.score}
                                    </span>
                                )}
                            </div>

                            <div className="divide-y divide-slate-100 pt-1">
                                <DealDataRow
                                    icon={DollarSign}
                                    label="Deal Value"
                                    value={formatMoney(lead.value, lead.currency || "BDT")}
                                    isCurrency
                                />
                                <DealDataRow
                                    icon={Percent}
                                    label="Win Probability"
                                    value={`${lead.probability ?? (lead.stage === "won" ? 100 : 50)}%`}
                                />
                                <DealDataRow
                                    icon={CalendarClock}
                                    label="Expected Close"
                                    value={lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : "Not established"}
                                />
                                <DealDataRow
                                    icon={Calendar}
                                    label="Created Date"
                                    value={formatDate(lead.createdAt)}
                                />

                                {projectObj && (
                                    <div className="flex items-center justify-between gap-3 py-3">
                                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                                            <Rocket className="h-3.5 w-3.5 text-slate-400" />
                                            <span>Linked Project</span>
                                        </span>
                                        <Link
                                            href={`/projects/${projectObj._id}`}
                                            className="truncate text-xs font-bold text-indigo-600 hover:underline max-w-[170px]"
                                            title={projectObj.name}
                                        >
                                            {projectObj.name}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Activity Timeline Ledger */}
                    <section className="lg:col-span-2">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                            <ActivityTimeline
                                activities={lead.activities}
                                onLogActivity={() => setOpenLog(true)}
                            />
                        </div>
                    </section>
                </div>
            </div>

            {/* Action Modals */}
            <LogActivityModal
                open={openLog}
                onOpenChange={setOpenLog}
                leadId={lead._id}
                onCreated={() => void loadDeal()}
            />
            <ScheduleFollowUpModal
                open={openFollow}
                onOpenChange={setOpenFollow}
                leadId={lead._id}
                onCreated={() => void loadDeal()}
            />
            <ConvertToProjectModal
                open={openConvert}
                onOpenChange={setOpenConvert}
                leadId={lead._id}
                defaultName={lead.dealName || lead.companyName}
                onConverted={() => void loadDeal()}
            />
        </main>
    );
}

interface DealDataRowProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    isCurrency?: boolean;
}

const DealDataRow = memo(function DealDataRow({
    icon: Icon,
    label,
    value,
    isCurrency = false,
}: DealDataRowProps) {
    return (
        <div className="flex items-center justify-between gap-3 py-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <span>{label}</span>
            </span>
            <span
                className={`truncate font-mono text-xs ${isCurrency ? "text-base font-bold text-slate-950" : "font-semibold text-slate-800"
                    }`}
            >
                {value}
            </span>
        </div>
    );
});