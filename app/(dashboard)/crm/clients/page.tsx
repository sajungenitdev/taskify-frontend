// app/(dashboard)/crm/clients/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
    Building2,
    Plus,
    Search,
    RefreshCw,
    X,
    Filter,
    Trash2,
    CheckCircle2,
    Flame,
    Thermometer,
    Snowflake,
} from "lucide-react";
import toast from "react-hot-toast";
import { ClientTable } from "@/components/crm/ClientTable";
import { AddClientModal } from "@/components/crm/modals/AddClientModal";
import { useClients } from "@/hooks/crm/useClients";
import { clientApi } from "@/lib/api/crm.api";
import type { Client } from "@/types/crm/crm.types";

// ============================================================================
// Types & Definitions
// ============================================================================

export type ClientStageFilter = "all" | "hot" | "warm" | "won" | "cold";

interface StagePillOption {
    readonly value: ClientStageFilter;
    readonly label: string;
    readonly icon?: React.ComponentType<{ className?: string }>;
    readonly activeClass: string;
}

const STAGE_OPTIONS: readonly StagePillOption[] = [
    {
        value: "all",
        label: "All Accounts",
        activeClass: "bg-slate-900 text-white shadow-xs",
    },
    {
        value: "won",
        label: "Won",
        icon: CheckCircle2,
        activeClass: "bg-emerald-600 text-white shadow-xs",
    },
    {
        value: "hot",
        label: "Hot",
        icon: Flame,
        activeClass: "bg-rose-600 text-white shadow-xs",
    },
    {
        value: "warm",
        label: "Warm",
        icon: Thermometer,
        activeClass: "bg-amber-500 text-white shadow-xs",
    },
    {
        value: "cold",
        label: "Cold",
        icon: Snowflake,
        activeClass: "bg-sky-600 text-white shadow-xs",
    },
];

// ============================================================================
// Main Page Component
// ============================================================================

export default function ClientsPage() {
    const [searchInput, setSearchInput] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [selectedStage, setSelectedStage] = useState<ClientStageFilter>("all");
    const [openAdd, setOpenAdd] = useState<boolean>(false);

    // Debounce search query to prevent excessive network requests
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 300);

        return () => clearTimeout(handler);
    }, [searchInput]);

    const { data, loading, refetch } = useClients({
        search: debouncedSearch || undefined,
        stage: selectedStage === "all" ? undefined : selectedStage,
    });

    const clientsList = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    // Aggregate high-level metric KPIs
    const metrics = useMemo(() => {
        let won = 0;
        let hot = 0;
        let warm = 0;
        let cold = 0;

        for (let i = 0; i < clientsList.length; i++) {
            const stage = (clientsList[i].stage || "").toLowerCase();
            if (stage === "won") won++;
            else if (stage === "hot") hot++;
            else if (stage === "warm") warm++;
            else if (stage === "cold") cold++;
        }

        return { total: clientsList.length, won, hot, warm, cold };
    }, [clientsList]);

    // Execute server archive action
    const executeArchive = useCallback(
        async (clientId: string, toastId: string) => {
            toast.dismiss(toastId);
            const loadingToast = toast.loading("Archiving client record...");

            try {
                await clientApi.remove(clientId);
                toast.success("Client account archived", { id: loadingToast });
                refetch();
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Failed to archive client account";
                toast.error(message, { id: loadingToast });
            }
        },
        [refetch]
    );

    // Interactive in-toast confirmation replacing window.confirm
    const handleDelete = useCallback(
        (client: Client) => {
            toast(
                (t) => (
                    <div className="flex flex-col gap-2.5 py-1 text-slate-900">
                        <div>
                            <p className="text-xs font-bold text-slate-900">
                                Archive {client.name}?
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                This account and associated RFQ references will be archived.
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
                                onClick={() => executeArchive(client._id, t.id)}
                                className="px-3 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span>Archive</span>
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
        [executeArchive]
    );

    const handleResetFilters = useCallback(() => {
        setSearchInput("");
        setDebouncedSearch("");
        setSelectedStage("all");
    }, []);

    const hasActiveFilters = Boolean(searchInput || selectedStage !== "all");

    return (
        <main className="min-h-screen bg-slate-50/70 pb-16 text-slate-900">
            <div className="mx-auto container space-y-6 p-6 lg:p-8">
                {/* Header Section */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <Building2 className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Client Accounts
                            </h1>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Enterprise directory, RFQ histories, and logged customer interactions
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={loading}
                            aria-label="Refresh Directory"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50 cursor-pointer"
                            title="Refresh Directory"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? "animate-spin text-slate-900" : ""}`}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenAdd(true)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Client</span>
                        </button>
                    </div>
                </header>

                {/* Analytic Metrics Strip */}
                <section
                    aria-label="Client Account Statistics"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                >
                    <StatMiniTile
                        label="Total Accounts"
                        value={metrics.total}
                        colorClass="text-slate-950"
                    />
                    <StatMiniTile
                        label="Won / Active Clients"
                        value={metrics.won}
                        colorClass="text-emerald-600"
                        icon={CheckCircle2}
                        iconBg="bg-emerald-50 text-emerald-600"
                    />
                    <StatMiniTile
                        label="Hot Accounts"
                        value={metrics.hot}
                        colorClass="text-rose-600"
                        icon={Flame}
                        iconBg="bg-rose-50 text-rose-600"
                    />
                    <StatMiniTile
                        label="Warm Pipeline"
                        value={metrics.warm}
                        colorClass="text-amber-600"
                        icon={Thermometer}
                        iconBg="bg-amber-50 text-amber-600"
                    />
                </section>

                {/* Filter and Query Controls */}
                <section
                    aria-label="Client Filtering Strip"
                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs"
                >
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by client name, industry, or contact..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => setSearchInput("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                aria-label="Clear Search Input"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Stage Filtering Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
                        {STAGE_OPTIONS.map((opt) => {
                            const isActive = selectedStage === opt.value;
                            const Icon = opt.icon;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSelectedStage(opt.value)}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${isActive
                                            ? opt.activeClass
                                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50"
                                        }`}
                                >
                                    {Icon && <Icon className="h-3 w-3" />}
                                    <span>{opt.label}</span>
                                </button>
                            );
                        })}

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:underline px-2.5 py-1 ml-1 cursor-pointer transition-colors"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </section>

                {/* Clients Table Card Container */}
                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    <ClientTable
                        clients={clientsList}
                        loading={loading}
                        onDelete={handleDelete}
                    />
                </section>
            </div>

            {/* Add Client Modal */}
            <AddClientModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                onCreated={() => refetch()}
            />
        </main>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface StatMiniTileProps {
    label: string;
    value: number;
    colorClass: string;
    icon?: React.ComponentType<{ className?: string }>;
    iconBg?: string;
}

const StatMiniTile = memo(function StatMiniTile({
    label,
    value,
    colorClass,
    icon: Icon,
    iconBg = "bg-slate-50 text-slate-400",
}: StatMiniTileProps) {
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