// app/(dashboard)/crm/deals/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
    Briefcase,
    Filter,
    KanbanSquare,
    Layers,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { DealTable } from "@/components/crm/DealTable";
import { AddDealModal } from "@/components/crm/modals/AddDealModal";
import { EditDealModal } from "@/components/crm/modals/EditDealModal";
import { useLeads } from "@/hooks/crm/useLeads";
import { leadApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { Lead } from "@/types/crm/crm.types";

const STAGE_FILTERS: { value: string; label: string }[] = [
    { value: "all", label: "All Stages" },
    { value: "lead_in", label: "Lead In" },
    { value: "qualified", label: "Qualified" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
];

export default function AllDealsPage() {
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [stage, setStage] = useState("all");
    const [openAdd, setOpenAdd] = useState(false);
    const [editingDeal, setEditingDeal] = useState<Lead | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
        return () => clearTimeout(t);
    }, [searchInput]);

    const { data, loading, refetch } = useLeads({
        search: debouncedSearch || undefined,
        stage: stage === "all" ? undefined : stage,
        limit: 500,
    });

    const leads = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    const stats = useMemo(() => {
        let total = 0;
        let won = 0;
        let lost = 0;
        let openCount = 0;
        for (const l of leads) {
            total++;
            if (l.stage === "won") won++;
            else if (l.stage === "lost") lost++;
            else openCount++;
        }
        return { total, open: openCount, won, lost };
    }, [leads]);

    const executeDelete = useCallback(
        async (id: string, toastId: string) => {
            toast.dismiss(toastId);
            const loadingToast = toast.loading("Removing deal record...");
            try {
                await leadApi.remove(id);
                toast.success("Deal deleted successfully", { id: loadingToast });
                refetch();
            } catch (err: unknown) {
                toast.error((err as Error).message || "Failed to delete deal", {
                    id: loadingToast,
                });
            }
        },
        [refetch]
    );

    const handleDelete = useCallback(
        (lead: Lead) => {
            toast(
                (t) => (
                    <div className="flex flex-col gap-2.5 py-1 text-slate-900">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Delete {lead.dealName || lead.companyName}?
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                This action cannot be undone and will erase all linked notes.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => toast.dismiss(t.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => executeDelete(lead._id, t.id)}
                                className="px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                ),
                {
                    duration: 7000,
                    position: "top-center",
                    style: {
                        borderRadius: "1rem",
                        border: "1px solid #e2e8f0",
                        padding: "0.85rem 1rem",
                        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
                        background: "#ffffff",
                    },
                }
            );
        },
        [executeDelete]
    );

    const hasFilters = Boolean(searchInput || stage !== "all");

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto max-w-[1680px] space-y-6 p-6 lg:p-8">
                {/* Header */}
                <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <Briefcase className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    All Deals
                                </h1>
                                <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs sm:inline-flex">
                                    <Layers className="h-3 w-3 text-slate-400" /> Registry
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Every opportunity in your CRM — search, filter, and drill into any deal
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/crm/pipeline"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                        >
                            <KanbanSquare className="h-3.5 w-3.5 text-slate-500" />
                            <span>Kanban View</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={loading}
                            aria-label="Refresh Deals"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenAdd(true)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Deal</span>
                        </button>
                    </div>
                </header>

                {/* KPI Tiles */}
                <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatTile label="Total Deals" value={stats.total} />
                    <StatTile label="Open" value={stats.open} accent="text-sky-600" />
                    <StatTile label="Won" value={stats.won} accent="text-emerald-600" />
                    <StatTile label="Lost" value={stats.lost} accent="text-rose-600" />
                </section>

                {/* Filters */}
                <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by company or deal name..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => setSearchInput("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                                aria-label="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
                        {STAGE_FILTERS.map((opt) => {
                            const active = stage === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStage(opt.value)}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${active
                                            ? "bg-slate-900 text-white shadow-xs"
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchInput("");
                                    setStage("all");
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:underline px-2.5 py-1 ml-1 cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </section>

                {/* Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    <DealTable
                        leads={leads}
                        loading={loading}
                        onEdit={(lead) => setEditingDeal(lead)}
                        onDelete={handleDelete}
                    />
                </section>
            </div>

            {/* Add Deal Modal */}
            <AddDealModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onCreated={() => refetch()}
            />

            {/* Edit Deal Modal */}
            <EditDealModal
                open={Boolean(editingDeal)}
                onOpenChange={(open) => {
                    if (!open) setEditingDeal(null);
                }}
                lead={editingDeal}
                onUpdated={() => refetch()}
            />
        </main>
    );
}

function StatTile({
    label,
    value,
    accent = "text-slate-900",
}: {
    label: string;
    value: number;
    accent?: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </p>
            <p className={`mt-1 font-mono text-xl font-bold tracking-tight ${accent}`}>
                {value.toLocaleString()}
            </p>
        </div>
    );
}