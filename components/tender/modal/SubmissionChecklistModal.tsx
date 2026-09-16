// components/tender/SubmissionChecklistModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

export interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
    /** true = part of the default set, false = user-added */
    isCustom?: boolean;
}

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    tenderLabel: string;              // e.g. "BPDB — Acronis Backup Solution Renewal, 3 Sites"
    initialItems?: ChecklistItem[];
    onSave?: (items: ChecklistItem[]) => void;
}

/** Default checklist seeded the first time the modal opens */
const DEFAULT_ITEMS: Omit<ChecklistItem, "id">[] = [
    { label: "Pre-bid meeting attended (if applicable)", checked: false },
    { label: "Tender security pay order ready", checked: false },
    { label: "All document tasks marked Done", checked: false },
    { label: "Submitted before deadline", checked: false },
];

function makeId() {
    return `chk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function SubmissionChecklistModal({
    open,
    onOpenChange,
    tenderLabel,
    initialItems,
    onSave,
}: Props) {
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newLabel, setNewLabel] = useState("");
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Reset on open */
    useEffect(() => {
        if (!open) return;
        const base =
            initialItems && initialItems.length > 0
                ? initialItems
                : DEFAULT_ITEMS.map((d) => ({ ...d, id: makeId() }));
        setItems(base);
        setNewLabel("");
    }, [open, initialItems]);

    /* Esc + scroll lock */
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

    /* ---------- Mutations ---------- */
    const toggleItem = (id: string) =>
        setItems((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, checked: !it.checked } : it,
            ),
        );

    const updateLabel = (id: string, label: string) =>
        setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, label } : it)),
        );

    const removeItem = (id: string) =>
        setItems((prev) => prev.filter((it) => it.id !== id));

    const addItem = (label?: string) => {
        const finalLabel = (label ?? newLabel).trim();
        if (!finalLabel) return;
        setItems((prev) => [
            ...prev,
            { id: makeId(), label: finalLabel, checked: false, isCustom: true },
        ]);
        setNewLabel("");
        // Keep focus in the input for fast entry of several items
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave?.(items);
            onOpenChange(false);
        } catch (e) {
            // Parent shows its own error toast — keep the modal open
        } finally {
            setSaving(false);
        }
    };

    const completedCount = items.filter((i) => i.checked).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => !saving && onOpenChange(false)}
            />

            <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-slate-900">
                            Submission Checklist — {tenderLabel}
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            Track what&apos;s needed before this tender can be submitted —
                            check items off or add your own.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => !saving && onOpenChange(false)}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        aria-label="Close"
                        disabled={saving}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <ul className="space-y-1.5">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="group flex items-center gap-2 rounded-md py-1 hover:bg-slate-50"
                            >
                                {/* Checkbox */}
                                <button
                                    type="button"
                                    onClick={() => toggleItem(item.id)}
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${item.checked
                                        ? "border-[#a97400] bg-[#a97400] text-white"
                                        : "border-slate-300 bg-white hover:border-slate-400"
                                        }`}
                                    aria-label="Toggle"
                                >
                                    {item.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                                </button>

                                {/* Editable label */}
                                <input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => updateLabel(item.id, e.target.value)}
                                    className={`flex-1 truncate border-none bg-transparent text-[12px] text-slate-800 outline-none focus:bg-white ${item.checked ? "line-through opacity-60" : ""
                                        }`}
                                />

                                {/* Delete */}
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    aria-label="Remove"
                                    className="shrink-0 rounded-md p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Add-input repeater */}
                    <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-3">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="New checklist item"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addItem();
                                }
                            }}
                            className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-[12px] placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                        <button
                            type="button"
                            onClick={() => addItem()}
                            disabled={!newLabel.trim()}
                            className="inline-flex h-9 items-center gap-1 rounded-lg bg-slate-100 px-3 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => addItem()}
                        className="mt-2 text-[11px] font-semibold text-[#b8860b] hover:underline"
                    >
                        + Add Input
                    </button>

                    {/* Progress hint */}
                    <p className="mt-3 text-[10px] uppercase tracking-wider text-slate-400">
                        {completedCount} of {items.length} complete
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#a97400] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {saving ? "Saving..." : "Save Checklist"}
                    </button>
                </div>
            </div>
        </div>
    );
}