// app/(dashboard)/crm/deals/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
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
    const [lead, setLead] = useState<
        (Lead & { activities: DealActivity[] }) | null
    >(null);
    const [loading, setLoading] = useState(true);
    const [openLog, setOpenLog] = useState(false);
    const [openFollow, setOpenFollow] = useState(false);
    const [openConvert, setOpenConvert] = useState(false);
    const [markingWon, setMarkingWon] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await leadApi.get(params.id);
            setLead(data);
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    if (loading || !lead) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#070f22] dark:via-[#0a1730] dark:to-[#070f22]">
                <div className="mx-auto container p-6 lg:p-8">
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-[#0d1b33] dark:text-gray-400">
                        Loading deal...
                    </div>
                </div>
            </div>
        );
    }

    const markWon = async () => {
        setMarkingWon(true);
        try {
            await leadApi.changeStage(lead._id, "won");
            toast.success("Deal marked as won");
            await load();
        } catch (e) {
            toast.error((e as Error).message);
        } finally {
            setMarkingWon(false);
        }
    };

    const projectObj =
        lead.projectId && typeof lead.projectId === "object" ? lead.projectId : null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#070f22] dark:via-[#0a1730] dark:to-[#070f22]">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* ---------- Back ---------- */}
                <Link
                    href="/crm/pipeline"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to pipeline
                </Link>

                {/* ---------- Header ---------- */}
                <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                                {lead.dealName || lead.companyName}
                            </h1>
                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Building2 className="h-3.5 w-3.5" />
                                {lead.companyName}
                                <span className="text-gray-300 dark:text-gray-700">·</span>
                                <UserIcon className="h-3.5 w-3.5" />
                                {getOwnerName(lead.owner)}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <StageBadge stage={lead.stage} />

                        <button
                            type="button"
                            onClick={() => setOpenFollow(true)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-[#0d1b33] dark:text-gray-200 dark:hover:bg-white/5"
                        >
                            <Calendar className="h-4 w-4" />
                            Schedule follow-up
                        </button>

                        {lead.stage !== "won" && lead.stage !== "lost" && (
                            <button
                                type="button"
                                onClick={markWon}
                                disabled={markingWon}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                            >
                                <CheckCircle className="h-4 w-4" />
                                {markingWon ? "Marking..." : "Mark won"}
                            </button>
                        )}

                        {lead.stage === "won" && !projectObj && (
                            <button
                                type="button"
                                onClick={() => setOpenConvert(true)}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700"
                            >
                                <Rocket className="h-4 w-4" />
                                Convert to project
                            </button>
                        )}

                        {projectObj && (
                            <Link
                                href={`/projects/${projectObj._id}`}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-700 hover:to-teal-700"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open project
                            </Link>
                        )}
                    </div>
                </header>

                {/* ---------- Grid ---------- */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column: deal info */}
                    <section className="space-y-4">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#0d1b33]">
                            <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    <Sparkles className="h-4 w-4 text-indigo-500" />
                                    Deal Summary
                                </h2>
                            </div>

                            <div className="space-y-1 px-5 py-4">
                                <Row
                                    icon={DollarSign}
                                    label="Value"
                                    value={formatMoney(lead.value, lead.currency)}
                                    highlight
                                />
                                <Row
                                    icon={Percent}
                                    label="Probability"
                                    value={`${lead.probability}%`}
                                />
                                <Row
                                    icon={CalendarClock}
                                    label="Expected close"
                                    value={formatDate(lead.expectedCloseDate)}
                                />
                                <Row
                                    icon={Sparkles}
                                    label="Score"
                                    value={String(lead.score ?? 0)}
                                />
                                {projectObj && (
                                    <Row
                                        icon={Rocket}
                                        label="Project"
                                        value={projectObj.name}
                                    />
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Right column: activity timeline */}
                    <section className="lg:col-span-2">
                        <ActivityTimeline
                            activities={lead.activities}
                            onLogActivity={() => setOpenLog(true)}
                        />
                    </section>
                </div>
            </div>

            <LogActivityModal
                open={openLog}
                onOpenChange={setOpenLog}
                leadId={lead._id}
                onCreated={() => load()}
            />
            <ScheduleFollowUpModal
                open={openFollow}
                onOpenChange={setOpenFollow}
                leadId={lead._id}
                onCreated={() => load()}
            />
            <ConvertToProjectModal
                open={openConvert}
                onOpenChange={setOpenConvert}
                leadId={lead._id}
                defaultName={lead.dealName || lead.companyName}
                onConverted={() => load()}
            />
        </div>
    );
}

function Row({
    icon: Icon,
    label,
    value,
    highlight,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0 dark:border-gray-800">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <Icon className="h-3.5 w-3.5" />
                {label}
            </span>
            <span
                className={`truncate text-sm font-semibold ${highlight
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
            >
                {value}
            </span>
        </div>
    );
}