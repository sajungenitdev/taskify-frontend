// components/crm/modals/AddDealModal.tsx
"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Loader2,
    Briefcase,
    Building2,
    Calendar,
    Layers,
    Sparkles,
    Contact as ContactIcon,
} from "lucide-react";
import { leadApi, contactApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { Contact, Currency, Lead } from "@/types/crm/crm.types";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultStage?: string;
    onCreated?: (lead: Lead) => void;
}

const CURRENCIES: Currency[] = ["BDT", "USD", "SAR", "AED", "INR", "EUR", "GBP"];

const STAGE_OPTIONS = [
    { value: "lead_in", label: "Lead In" },
    { value: "qualified", label: "Qualified" },
    { value: "proposal", label: "Proposal Sent" },
    { value: "negotiation", label: "Negotiation" },
];

interface FormState {
    contactId: string;
    companyName: string;
    dealName: string;
    value: number | "";
    currency: Currency;
    expectedCloseDate: string;
    stage: string;
}

const INITIAL_FORM: FormState = {
    contactId: "",
    companyName: "",
    dealName: "",
    value: "",
    currency: "BDT",
    expectedCloseDate: "",
    stage: "lead_in",
};

export const AddDealModal = memo(function AddDealModal({
    open,
    onOpenChange,
    defaultStage,
    onCreated,
}: Props) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);

    // Load available contacts upon modal display
    useEffect(() => {
        if (!open) return;
        setLoadingContacts(true);
        contactApi
            .list({ limit: 200 })
            .then((r) => setContacts(r.data || []))
            .catch((e) => toast.error((e as Error).message || "Failed to load contacts"))
            .finally(() => setLoadingContacts(false));
    }, [open]);

    // Sync default stage and reset
    useEffect(() => {
        if (open) {
            setForm({
                ...INITIAL_FORM,
                stage: defaultStage || "lead_in",
            });
        }
    }, [open, defaultStage]);

    // Esc key listener + body scroll lock
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onOpenChange(false);
        };

        window.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, saving, onOpenChange]);

    // Auto-fill company name & deal title when contact is chosen
    const handleContactChange = useCallback(
        (contactId: string) => {
            const selected = contacts.find((c) => c._id === contactId);
            setForm((prev) => {
                const companyName = selected?.company || prev.companyName;
                const dealName =
                    !prev.dealName && selected
                        ? `${selected.company || selected.name} - Opportunity`
                        : prev.dealName;

                return {
                    ...prev,
                    contactId,
                    companyName,
                    dealName,
                };
            });
        },
        [contacts]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.contactId) return toast.error("Please select an associated contact");
        if (!form.companyName.trim()) return toast.error("Company name is required");
        if (typeof form.value !== "number" || form.value <= 0) {
            return toast.error("Value must be greater than zero");
        }

        setSaving(true);
        try {
            const created = await leadApi.create({
                ...form,
                dealName: form.dealName.trim() || `${form.companyName} Deal`,
                expectedCloseDate: form.expectedCloseDate || undefined,
            } as unknown as Partial<Lead>);

            toast.success("Opportunity added to pipeline");
            onCreated?.(created);
            onOpenChange(false);
        } catch (err) {
            toast.error((err as Error).message || "Failed to create deal");
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
                        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
                                    <Briefcase className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Add New Deal
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Create a sales opportunity in your pipeline
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={saving}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
                                aria-label="Close modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form
                            id="add-deal-form"
                            onSubmit={handleSubmit}
                            className="overflow-y-auto p-6 space-y-4"
                        >
                            {/* Associated Contact */}
                            <div>
                                <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                                    <span className="flex items-center gap-1.5">
                                        <ContactIcon className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Contact Person</span>
                                        <span className="text-rose-500">*</span>
                                    </span>
                                    {loadingContacts && (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                                            <Loader2 className="h-2.5 w-2.5 animate-spin" /> Fetching...
                                        </span>
                                    )}
                                </label>
                                <select
                                    required
                                    value={form.contactId}
                                    onChange={(e) => handleContactChange(e.target.value)}
                                    disabled={loadingContacts}
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition disabled:opacity-60"
                                >
                                    <option value="">
                                        {loadingContacts ? "Loading contacts directory..." : "Select existing contact"}
                                    </option>
                                    {contacts.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name} {c.company ? `(${c.company})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Company / Account</span>
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.companyName}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, companyName: e.target.value }))
                                    }
                                    placeholder="e.g. Acme Industries Ltd."
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                />
                            </div>

                            {/* Deal Name */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Opportunity Title</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.dealName}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, dealName: e.target.value }))
                                    }
                                    placeholder="e.g. Enterprise Tier Migration"
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                />
                            </div>

                            {/* Value & Currency Pair */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Deal Value <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={form.value}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                value: e.target.value === "" ? "" : Number(e.target.value),
                                            }))
                                        }
                                        placeholder="0.00"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Currency
                                    </label>
                                    <select
                                        value={form.currency}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                currency: e.target.value as Currency,
                                            }))
                                        }
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    >
                                        {CURRENCIES.map((curr) => (
                                            <option key={curr} value={curr}>
                                                {curr}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Expected Close Date & Initial Pipeline Stage */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Target Close Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={form.expectedCloseDate}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))
                                        }
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Pipeline Stage</span>
                                    </label>
                                    <select
                                        value={form.stage}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, stage: e.target.value }))
                                        }
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    >
                                        {STAGE_OPTIONS.map((stg) => (
                                            <option key={stg.value} value={stg.value}>
                                                {stg.label}
                                            </option>
                                        ))}
                                    </select>
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
                                form="add-deal-form"
                                disabled={saving}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>{saving ? "Creating Opportunity..." : "Create Deal"}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
});