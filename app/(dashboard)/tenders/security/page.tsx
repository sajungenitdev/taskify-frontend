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
import { SecurityNotifyModal } from "@/components/tender/modal/SecurityNotifyModal";

/* ---------- Config ---------- */
const ENTITIES = ["NGL-26", "NG-26", "JT"];
const TYPES: SecurityType[] = [
    "Tender Security",
    "Performance Security",
    "Bank Guarantee",
];

export default function TenderSecurityPage() {
    const [notifyEntity, setNotifyEntity] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        entity: "all",
        type: "all",
        docs: "all",
    });

    /* ---------- Edit tracking ----------
     * We keep a client-side map of { id → patch } for rows currently being
     * edited. On Save, we PATCH the row and refetch. On Cancel, we drop the
     * patch and the row snaps back to its server values.
     */
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPatch, setEditPatch] = useState<Partial<SecurityRowUI>>({});

    const { rows, loading, refetch } = useSecurity({
        entity: filters.entity === "all" ? undefined : filters.entity,
        type: filters.type === "all" ? undefined : filters.type,
        docs: filters.docs === "all" ? undefined : filters.docs,
        limit: 200,
    });

    const { stats, loading: statsLoading, refetch: refetchStats } =
        useSecurityStats();

    /* ---------- Server rows + edit overlay ---------- */
    const uiRows: SecurityRowUI[] = useMemo(() => {
        const base = rows.map(toSecurityUIRow);
        if (!editingId) return base;
        return base.map((r) =>
            r.id === editingId ? { ...r, ...editPatch, isEditing: true } : r,
        );
    }, [rows, editingId, editPatch]);

    /* ---------- Add new draft row ---------- */
    const [draft, setDraft] = useState<SecurityRowUI | null>(null);

    const addRecord = () => {
        if (uiRows.some((r) => r.isDraft)) return;
        if (editingId) return; // don't allow two edits at once
        setDraft({
            id: `draft-${crypto.randomUUID()}`,
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
                ...(r.dueDate ? { dueDate: new Date(r.dueDate).toISOString() } : {}),
            });
            toast.success("Security record saved");
            setDraft(null);
            await Promise.all([refetch(), refetchStats()]);
        } catch (e) {
            toast.error((e as Error).message || "Save failed");
        }
    };

    /* ---------- Update a row (draft or edit) ---------- */
    const updateRow = (id: string, patch: Partial<SecurityRowUI>) => {
        if (draft && draft.id === id) {
            setDraft({ ...draft, ...patch });
            return;
        }
        if (editingId === id) {
            setEditPatch((prev) => ({ ...prev, ...patch }));
        }
    };

    /* ---------- Enter edit mode ---------- */
    const startEdit = (id: string) => {
        if (draft) return; // don't allow edit while a draft exists
        setEditingId(id);
        setEditPatch({});
    };

    /* ---------- Save edit → PATCH ---------- */
    const saveEdit = async (id: string) => {
        if (!editPatch || Object.keys(editPatch).length === 0) {
            // Nothing changed — just exit edit mode
            setEditingId(null);
            setEditPatch({});
            return;
        }

        /* Guard: description must remain non-empty */
        const merged = { ...editPatch };
        if (
            typeof merged.clientDescription === "string" &&
            !merged.clientDescription.trim()
        ) {
            toast.error("Description is required");
            return;
        }

        /* Convert display date back to ISO if it changed */
        const payload: Record<string, unknown> = { ...merged };
        if (typeof merged.dueDate === "string") {
            payload.dueDate = merged.dueDate
                ? new Date(merged.dueDate).toISOString()
                : null;
        }

        const loadingId = toast.loading("Saving changes...");
        try {
            await securityApi.update(id, payload);
            toast.success("Security record updated", { id: loadingId });
            setEditingId(null);
            setEditPatch({});
            await Promise.all([refetch(), refetchStats()]);
        } catch (e) {
            toast.error(
                (e as Error).message || "Failed to save changes",
                { id: loadingId },
            );
        }
    };

    /* ---------- Cancel edit ---------- */
    const cancelEdit = () => {
        setEditingId(null);
        setEditPatch({});
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
                        onUpdate={(id, patch) => {
                            updateRow(id, patch);
                        }}
                        onCreate={(d) => {
                            if (d.id) void saveRow(d as SecurityRowUI);
                        }}
                        onDelete={(id) => {
                            void deleteRow(id);
                        }}
                        onNotify={(id) => {
                            const row = uiRows.find((r) => r.id === id);
                            if (row) setNotifyEntity(row.entity);
                        }}
                        /* ----- NEW: edit-mode handlers ----- */
                        onEdit={(id) => startEdit(id)}
                        onSaveEdit={(id) => {
                            void saveEdit(id);
                        }}
                        onCancelEdit={() => cancelEdit()}
                    />
                )}

                <SecurityFooter rows={uiRows} />
            </div>

            <SecurityNotifyModal
                open={!!notifyEntity}
                onOpenChange={(o) => !o && setNotifyEntity(null)}
                entity={notifyEntity ?? ""}
                onSend={async (emails) => {
                    console.log("Send to:", emails);
                    toast.success(
                        `Notification sent to ${emails.length} recipient(s)`,
                    );
                }}
            />
        </main>
    );
}