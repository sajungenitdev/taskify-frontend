// app/(dashboard)/tenders/security/page.tsx
"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SecurityHeader } from "@/components/tender/security/SecurityHeader";
import { SecurityStats } from "@/components/tender/security/SecurityStats";
import {
    SecurityFilters,
    type FilterState,
} from "@/components/tender/security/SecurityFilters";
import {
    SecurityTable,
    type SecurityType,
} from "@/components/tender/security/SecurityTable";
import { SecurityFooter } from "@/components/tender/security/SecurityFooter";
import {
    useSecurity,
    useSecurityStats,
} from "@/hooks/tender/useSecurity";
import { securityApi } from "@/lib/api/tender.api";
import {
    toSecurityUIRow,
    toSecurityStatsTiles,
    type SecurityRowUI,
} from "@/lib/api/mappers";

/* ---------- Config ---------- */
const ENTITIES = ["NGL-26", "NG-26", "JT"];
const TYPES: SecurityType[] = [
    "Tender Security",
    "Performance Security",
    "Bank Guarantee",
];

export default function TenderSecurityPage() {
    const [filters, setFilters] = useState<FilterState>({
        entity: "all",
        type: "all",
        docs: "all",
    });

    const { rows, loading, refetch } = useSecurity({
        entity: filters.entity === "all" ? undefined : filters.entity,
        type: filters.type === "all" ? undefined : filters.type,
        docs: filters.docs === "all" ? undefined : filters.docs,
        limit: 200,
    });

    const { stats, loading: statsLoading, refetch: refetchStats } =
        useSecurityStats();

    /* ---------- Filtered rows (server does most of the work; keep this for
         the draft row which lives only on the client) ---------- */
    const uiRows: SecurityRowUI[] = useMemo(
        () => rows.map(toSecurityUIRow),
        [rows],
    );

    /* ---------- Add new draft row ---------- */
    const addRecord = () => {
        if (uiRows.some((r) => r.isDraft)) return;
        // We keep drafts in a separate client-only state; simplest approach:
        // append a draft to the visible list.
        setDraft({
            id: `draft-${Date.now()}`,
            entity: ENTITIES[0],
            clientDescription: "",
            type: "Tender Security",
            amount: 0,
            currency: "৳",
            dueDate: "",
            docsStatus: "Missing",
            isDraft: true,
        });
    };

    const [draft, setDraft] = useState<SecurityRowUI | null>(null);

    /* ---------- Save draft → POST ---------- */
    const saveRow = async (r: SecurityRowUI) => {
        if (!r.clientDescription.trim()) {
            toast.error("Description is required");
            return;
        }
        try {
            await securityApi.create({
                entity: r.entity,
                clientDescription: r.clientDescription,
                type: r.type,
                amount: r.amount,
                docsStatus: r.docsStatus,
                // dueDate comes as display string — convert back to ISO
                ...(r.dueDate ? { dueDate: new Date(r.dueDate).toISOString() } : {}),
            });
            toast.success("Security record saved");
            setDraft(null);
            await Promise.all([refetch(), refetchStats()]);
        } catch (e) {
            toast.error((e as Error).message || "Save failed");
        }
    };

    /* ---------- Update a live row ---------- */
    const updateRow = (id: string, patch: Partial<SecurityRowUI>) => {
        if (draft && draft.id === id) {
            setDraft({ ...draft, ...patch });
        }
        // Server rows are read-only on this page for now
    };

    /* ---------- Delete (also used for "Cancel" on the draft) ---------- */
    const deleteRow = async (id: string) => {
        if (draft && draft.id === id) {
            setDraft(null);
            return;
        }
        try {
            await securityApi.remove(id);
            toast.success("Security record deleted");
            await Promise.all([refetch(), refetchStats()]);
        } catch (e) {
            toast.error((e as Error).message || "Delete failed");
        }
    };

    /* ---------- Stat tiles ---------- */
    const statTiles = useMemo(
        () => (stats ? toSecurityStatsTiles(stats) : []),
        [stats],
    );

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                <SecurityHeader onAdd={addRecord} />

                {statsLoading || !stats ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-[80px] animate-pulse rounded-xl border border-slate-200/80 bg-white"
                            />
                        ))}
                    </div>
                ) : (
                    <SecurityStats stats={statTiles} />
                )}

                <SecurityFilters
                    value={filters}
                    entities={ENTITIES}
                    types={TYPES}
                    onChange={setFilters}
                />

                {loading ? (
                    <div className="h-[300px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                ) : (
                    <SecurityTable
                        rows={draft ? [...uiRows, draft] : uiRows}
                        entities={ENTITIES}
                        types={TYPES}
                        onUpdate={updateRow}
                        onCreate={saveRow}
                        onDelete={deleteRow}
                    />
                )}

                <SecurityFooter />
            </div>
        </main>
    );
}