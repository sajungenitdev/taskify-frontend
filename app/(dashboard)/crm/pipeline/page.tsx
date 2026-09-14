// app/(dashboard)/crm/pipeline/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
    KanbanSquare,
    Plus,
    TrendingUp,
    RefreshCw,
    Users,
    BarChart3,
    Layers,
} from "lucide-react";
import { DealKanban } from "@/components/crm/DealKanban";
import { AddDealModal } from "@/components/crm/modals/AddDealModal";

export default function PipelinePage() {
    const [openAdd, setOpenAdd] = useState<boolean>(false);
    const [defaultStage, setDefaultStage] = useState<string | undefined>();
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const handleManualRefresh = useCallback(() => {
        setIsRefreshing(true);
        setRefreshKey((prev) => prev + 1);
        setTimeout(() => setIsRefreshing(false), 500);
    }, []);

    const handleOpenAdd = useCallback((stage?: string) => {
        setDefaultStage(stage);
        setOpenAdd(true);
    }, []);

    const handleDealCreated = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
    }, []);

    return (
        <main className="flex h-[calc(100vh-64px)] min-h-0 flex-col overflow-hidden bg-slate-50/70 text-slate-900">
            <div className="mx-auto flex w-full container flex-1 min-h-0 flex-col gap-6 p-6 lg:p-8">
                {/* Header Banner */}
                <header className="flex shrink-0 flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10">
                            <KanbanSquare className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Sales Pipeline
                                </h1>
                                <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-2xs sm:inline-flex">
                                    <Layers className="h-3 w-3 text-slate-400" /> Live Kanban
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Drag deals across stages to advance deals and calculate weighted probability
                            </p>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2.5">
                        <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-2xs lg:flex">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Drag cards to transition stages</span>
                        </div>

                        <Link
                            href="/crm/contacts"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden"
                            title="View Directory"
                        >
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Contacts</span>
                        </Link>

                        <Link
                            href="/crm/forecast"
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden"
                            title="Forecast Matrix"
                        >
                            <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Forecast</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            aria-label="Refresh Board"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 cursor-pointer disabled:opacity-50"
                            title="Refresh Pipeline Board"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-slate-900" : ""}`}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOpenAdd()}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Deal</span>
                        </button>
                    </div>
                </header>

                {/* Board Container — fills remaining space, no page scroll */}
                <section
                    aria-label="Kanban Pipeline Board"
                    className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
                >
                    <DealKanban
                        key={refreshKey}
                        onAddDeal={(stage) => handleOpenAdd(stage)}
                    />
                </section>
            </div>

            <AddDealModal
                open={openAdd}
                onOpenChange={setOpenAdd}
                defaultStage={defaultStage}
                onCreated={handleDealCreated}
            />
        </main>
    );
}