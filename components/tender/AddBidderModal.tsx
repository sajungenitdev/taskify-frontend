// components/tender/submission/AddBidderModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";

export interface BidderRow {
    bidder: string;
    value: number;
    isUs?: boolean;
}

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    initial?: BidderRow[];
    onSave: (bidders: BidderRow[]) => Promise<void> | void;
}

const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const labelCls =
    "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

export function AddBidderModal({
    open,
    onOpenChange,
    initial,
    onSave,
}: Props) {
    const [rows, setRows] = useState<BidderRow[]>([]);
    const [saving, setSaving] = useState(false);

    /* Reset / seed on open */
    useEffect(() => {
        if (!open) return;
        setSaving(false);
        setRows(
            initial && initial.length
                ? initial.map((r) => ({ ...r }))
                : [{ bidder: "", value: 0, isUs: false }],
        );
    }, [open, initial]);

    /* Esc + body scroll lock */
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onOpenChange(false);
        };
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, saving, onOpenChange]);

    if (!open) return null;

    const updateRow = (idx: number, patch: Partial<BidderRow>) => {
        setRows((prev) =>
            prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
        );
    };

    const addRow = () =>
        setRows((prev) => [
            ...prev,
            { bidder: "", value: 0, isUs: false },
        ]);

    const removeRow = (idx: number) =>
        setRows((prev) => prev.filter((_, i) => i !== idx));

    const toggleUs = (idx: number) => {
        setRows((prev) =>
            prev.map((r, i) => ({
                ...r,
                isUs: i === idx ? !r.isUs : false, // only one can be "us"
            })),
        );
    };

    const valid =
        rows.length > 0 &&
        rows.every((r) => r.bidder.trim().length > 0) &&
        !saving;

    const handleSave = async () => {
        if (!valid) return;
        setSaving(true);
        try {
            await onSave(
                rows
                    .filter((r) => r.bidder.trim().length > 0)
                    .map((r) => ({
                        bidder: r.bidder.trim(),
                        value: Number(r.value) || 0,
                        isUs: !!r.isUs,
                    })),
            );
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !saving && onOpenChange(false)}
            />

            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            Add Bidders
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Record competing bidders and their bid values for this tender.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[65vh] space-y-3 overflow-y-auto px-6 py-5">
                    {rows.map((row, idx) => (
                        <div
                            key={idx}
                            className="rounded-lg border border-slate-200 bg-slate-50/40 p-3"
                        >
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_80px_40px] sm:items-end">
                                {/* Name */}
                                <div>
                                    <label className={labelCls}>Name *</label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        placeholder="e.g. TechVantage Ltd."
                                        value={row.bidder}
                                        onChange={(e) =>
                                            updateRow(idx, { bidder: e.target.value })
                                        }
                                    />
                                </div>

                                {/* Value */}
                                <div>
                                    <label className={labelCls}>Value (৳)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className={inputCls}
                                        placeholder="e.g. 720000"
                                        value={row.value || ""}
                                        onChange={(e) =>
                                            updateRow(idx, { value: Number(e.target.value) || 0 })
                                        }
                                    />
                                </div>

                                {/* Is us? */}
                                <div>
                                    <label className={labelCls}>Us?</label>
                                    <button
                                        type="button"
                                        onClick={() => toggleUs(idx)}
                                        className={`h-10 w-full rounded-lg border text-xs font-semibold transition ${row.isUs
                                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                            }`}
                                    >
                                        {row.isUs ? "Yes" : "No"}
                                    </button>
                                </div>

                                {/* Remove */}
                                <div className="flex sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeRow(idx)}
                                        disabled={rows.length === 1}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Remove row"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add another bidder
                    </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!valid}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a97400] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {saving ? "Saving..." : "Save Bidders"}
                    </button>
                </div>
            </div>
        </div>
    );
}