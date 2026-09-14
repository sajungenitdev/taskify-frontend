// app/(dashboard)/crm/contacts/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Mail,
    Phone,
    MessageCircle,
    Building2,
    RefreshCw,
    User,
    ShieldCheck,
    FileText,
    Briefcase,
    Layers,
    ChevronRight,
    ExternalLink,
    Pencil,
} from "lucide-react";
import { LeadScoreCard } from "@/components/crm/LeadScoreCard";
import { TagBadge } from "@/components/crm/TagBadge";
import { EditContactModal } from "@/components/crm/modals/EditContactModal";
import { contactApi, leadApi } from "@/lib/api/crm.api";
import { initials } from "@/utils/format";
import toast from "react-hot-toast";
import type { Contact, Lead } from "@/types/crm/crm.types";

export default function ContactDetailPage() {
    const params = useParams<{ id: string }>();
    const [contact, setContact] = useState<Contact | null>(null);
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [rescoring, setRescoring] = useState<boolean>(false);
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

    const loadData = useCallback(async () => {
        if (!params.id) return;
        setLoading(true);
        try {
            const c = await contactApi.get(params.id);
            setContact(c);

            const lid =
                typeof c.leadId === "object" && c.leadId
                    ? c.leadId._id
                    : (c.leadId as string | undefined);

            if (lid) {
                const l = await leadApi.get(lid);
                setLead(l);
            } else {
                setLead(null);
            }
        } catch (e) {
            toast.error((e as Error).message || "Failed to load contact records");
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleRescore = async () => {
        if (!lead) return;
        setRescoring(true);
        try {
            const { score, scoreBreakdown } = await leadApi.rescore(lead._id);
            setLead({ ...lead, score, scoreBreakdown });
            toast.success("Lead score successfully recomputed");
        } catch (e) {
            toast.error((e as Error).message || "Error recomputing lead score");
        } finally {
            setRescoring(false);
        }
    };

    if (loading || !contact) {
        return (
            <main className="min-h-screen bg-slate-50/70 p-6 lg:p-8">
                <div className="mx-auto container space-y-6">
                    <div className="h-4 w-28 animate-pulse rounded-md bg-slate-200" />
                    <div className="h-24 w-full animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="h-96 rounded-2xl border border-slate-200/80 bg-white lg:col-span-2" />
                        <div className="h-96 rounded-2xl border border-slate-200/80 bg-white" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* Navigation Breadcrumb */}
                <nav aria-label="Breadcrumb">
                    <Link
                        href="/crm/contacts"
                        className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
                        <span>Return to Contacts Directory</span>
                    </Link>
                </nav>

                {/* Identity Header Card */}
                <header className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-base font-bold text-white shadow-md shadow-slate-900/10">
                            {initials(contact.name)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                    {contact.name}
                                </h1>
                                <TagBadge tag={contact.tag} />
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                {contact.jobTitle ? `${contact.jobTitle} · ` : ""}
                                <span className="text-slate-700">{contact.company || "No Company Specified"}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void loadData()}
                            aria-label="Refresh Record"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
                            title="Refresh Details"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-slate-600" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditOpen(true)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit Contact</span>
                        </button>
                    </div>
                </header>

                {/* Master Workspace Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Primary Contact Details */}
                    <section className="space-y-6 lg:col-span-2">
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
                                        <User className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                            Profile & Communication Channels
                                        </h2>
                                        <p className="text-[11px] font-medium text-slate-500">
                                            Reachability, permissions, and organizational context
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                                <InfoCell
                                    icon={Mail}
                                    label="Email Address"
                                    value={contact.email || "—"}
                                    isCopyable
                                />
                                <InfoCell
                                    icon={Phone}
                                    label="Direct Line"
                                    value={contact.phone || "—"}
                                    isMono
                                />
                                <InfoCell
                                    icon={MessageCircle}
                                    label="WhatsApp Identifier"
                                    value={contact.whatsappNumber || "—"}
                                    isMono
                                />
                                <InfoCell
                                    icon={ShieldCheck}
                                    label="WhatsApp Opt-in"
                                    value={contact.whatsappOptIn ? "Confirmed Opt-in" : "Not Permitted"}
                                    badge={
                                        contact.whatsappOptIn
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                                            : "bg-slate-100 text-slate-600 border-slate-200"
                                    }
                                />
                                <InfoCell
                                    icon={Building2}
                                    label="Enterprise Size"
                                    value={contact.companySize ? `${contact.companySize} Employees` : "—"}
                                />
                                <InfoCell
                                    icon={Layers}
                                    label="Lead Channel Source"
                                    value={contact.source.replace(/_/g, " ")}
                                    isCapitalized
                                />

                                {/* Additional Field: Opportunity Stage */}
                                <InfoCell
                                    icon={Briefcase}
                                    label="Opportunity Stage"
                                    value={
                                        lead?.stage ? (
                                            <Link
                                                href={`/crm/deals/${lead._id}`}
                                                className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:text-indigo-600 hover:underline"
                                            >
                                                <span className="capitalize">{lead.stage.replace(/_/g, " ")}</span>
                                                <ExternalLink className="h-3 w-3 text-slate-400" />
                                            </Link>
                                        ) : (
                                            "No Associated Deal"
                                        )
                                    }
                                />
                            </div>

                            {/* Internal Notes Section */}
                            {contact.notes && (
                                <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-5">
                                    <div className="mb-2 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                            Internal Observations
                                        </h3>
                                    </div>
                                    <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 shadow-2xs">
                                        <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                                            {contact.notes}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right Panel: Scoring or Conversion Pathway */}
                    <aside className="space-y-6">
                        {lead ? (
                            <div className="space-y-4">
                                <LeadScoreCard lead={lead} />
                                <button
                                    type="button"
                                    onClick={handleRescore}
                                    disabled={rescoring}
                                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${rescoring ? "animate-spin" : ""}`} />
                                    <span>{rescoring ? "Recalculating..." : "Recalculate Score"}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-2xs">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                                    No Active Deal Linked
                                </h3>
                                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                    Convert this contact into a pipeline opportunity to track deal velocity and value.
                                </p>
                                <Link
                                    href="/crm/pipeline"
                                    className="mt-5 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden"
                                >
                                    <span>Initiate Pipeline Deal</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            {/* ---------- Edit Contact Modal ---------- */}
            <EditContactModal
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                contact={contact}
                onUpdated={(updated) => {
                    // Optimistically update the header
                    setContact(updated);
                    // Re-fetch to also refresh the linked lead (in case its
                    // reference data changed too)
                    void loadData();
                }}
            />
        </main>
    );
}

// ==========================================
// Sub-Components
// ==========================================

interface InfoCellProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
    isMono?: boolean;
    isCapitalized?: boolean;
    isCopyable?: boolean;
    badge?: string;
}

const InfoCell = memo(function InfoCell({
    icon: Icon,
    label,
    value,
    isMono = false,
    isCapitalized = false,
    isCopyable = false,
    badge,
}: InfoCellProps) {
    const handleCopy = () => {
        if (typeof value === "string" && value !== "—") {
            void navigator.clipboard.writeText(value);
            toast.success("Copied to clipboard");
        }
    };

    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5 transition-colors hover:border-slate-200">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Icon className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{label}</span>
            </div>

            <div className="mt-1 flex items-center justify-between">
                {badge ? (
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${badge}`}>
                        {value}
                    </span>
                ) : (
                    <span
                        onClick={isCopyable ? handleCopy : undefined}
                        className={`truncate text-xs font-semibold text-slate-900 ${isMono ? "font-mono" : ""
                            } ${isCapitalized ? "capitalize" : ""} ${isCopyable ? "cursor-pointer hover:underline" : ""
                            }`}
                    >
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
});