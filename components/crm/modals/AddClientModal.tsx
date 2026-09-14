// components/crm/modals/AddClientModal.tsx
"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Loader2,
    X,
    MapPin,
    Globe2,
    Tag,
    Briefcase,
    FileText,
} from "lucide-react";
import { clientApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { Client } from "@/types/crm/crm.types";

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onCreated?: (c: Client) => void;
    initial?: Partial<Client>;
}

const STAGE_OPTIONS: { value: Client["stage"]; label: string }[] = [
    { value: "cold", label: "Cold Account" },
    { value: "warm", label: "Warm Pipeline" },
    { value: "hot", label: "Hot Opportunity" },
    { value: "won", label: "Won / Active Client" },
];

const FORM_DEFAULTS: Partial<Client> = {
    name: "",
    sector: "",
    location: "",
    city: "",
    country: "Bangladesh",
    stage: "cold",
    notes: "",
};

export const AddClientModal = memo(function AddClientModal({
    open,
    onOpenChange,
    onCreated,
    initial,
}: Props) {
    const [form, setForm] = useState<Partial<Client>>({ ...FORM_DEFAULTS, ...initial });
    const [saving, setSaving] = useState(false);

    // Sync state when dialog triggers
    useEffect(() => {
        if (!open) return;
        setForm({ ...FORM_DEFAULTS, ...initial });
    }, [open, initial]);

    // Esc keyboard shortcut and scroll locking
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onOpenChange(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [open, saving, onOpenChange]);

    const updateField = useCallback(<K extends keyof Client>(k: K, v: Client[K]) => {
        setForm((f) => ({ ...f, [k]: v }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name?.trim()) {
            toast.error("Client corporate name is required");
            return;
        }

        setSaving(true);
        try {
            const created = await clientApi.create(form);
            toast.success("Client account registered");
            onCreated?.(created);
            onOpenChange(false);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to register client";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
                    onClick={() => !saving && onOpenChange(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
                                    <Building2 className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Register Client Account
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Add an enterprise account to track engagement and RFQs
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={saving}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
                                aria-label="Close dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form
                            id="add-client-form"
                            onSubmit={handleSubmit}
                            className="overflow-y-auto p-6 space-y-4"
                        >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Client Corporate Name */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <span>Corporate / Client Name</span>
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name ?? ""}
                                        onChange={(e) => updateField("name", e.target.value)}
                                        placeholder="e.g. Dhaka Power Distribution Company (DPDC)"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Industry Sector */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Sector / Vertical</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.sector ?? ""}
                                        onChange={(e) => updateField("sector", e.target.value)}
                                        placeholder="e.g. Energy & Power, Telecommunications"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Stage Selection */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Relationship Stage</span>
                                    </label>
                                    <select
                                        value={form.stage}
                                        onChange={(e) => updateField("stage", e.target.value as Client["stage"])}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    >
                                        {STAGE_OPTIONS.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Territory / Area */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Territory / Street Address</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.location ?? ""}
                                        onChange={(e) => updateField("location", e.target.value)}
                                        placeholder="e.g. Motijheel C/A, Gulshan-1"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* City */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        City / Metropolitan Area
                                    </label>
                                    <input
                                        type="text"
                                        value={form.city ?? ""}
                                        onChange={(e) => updateField("city", e.target.value)}
                                        placeholder="e.g. Dhaka, Chattogram"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Country */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Operating Country</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.country ?? "Bangladesh"}
                                        onChange={(e) => updateField("country", e.target.value)}
                                        placeholder="Bangladesh"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Internal Observations / Notes */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Contextual Observations & Notes</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.notes ?? ""}
                                        onChange={(e) => updateField("notes", e.target.value)}
                                        placeholder="Procurement protocols, recurring tender cycles, point-of-contact details..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition resize-none leading-relaxed"
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={saving}
                                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-client-form"
                                disabled={saving}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>{saving ? "Registering Client..." : "Create Client Account"}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
});