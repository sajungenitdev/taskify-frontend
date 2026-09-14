// components/crm/modals/EditContactModal.tsx
"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Pencil,
    X,
    Building2,
    Mail,
    Phone,
    MessageSquare,
    Tag,
    Share2,
    Users,
    FileText,
} from "lucide-react";
import { contactApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { Contact, ContactSource, ContactTag } from "@/types/crm/crm.types";

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    contact: Contact | null;
    onUpdated?: (c: Contact) => void;
}

const TAG_OPTIONS: { value: ContactTag; label: string }[] = [
    { value: "hot", label: "Hot Lead" },
    { value: "warm", label: "Warm Lead" },
    { value: "cold", label: "Cold Lead" },
];

const SOURCE_OPTIONS: { value: ContactSource; label: string }[] = [
    { value: "demo_request", label: "Demo Request" },
    { value: "referral", label: "Referral" },
    { value: "cold_outreach", label: "Cold Outreach" },
    { value: "website", label: "Website" },
    { value: "event", label: "Event" },
    { value: "partner", label: "Partner" },
    { value: "other", label: "Other" },
];

type FormState = {
    name: string;
    company: string;
    jobTitle: string;
    email: string;
    phone: string;
    whatsappNumber: string;
    whatsappOptIn: boolean;
    tag: ContactTag;
    source: ContactSource;
    companySize: number;
    notes: string;
};

function contactToForm(c: Contact | null): FormState {
    return {
        name: c?.name ?? "",
        company: c?.company ?? "",
        jobTitle: c?.jobTitle ?? "",
        email: c?.email ?? "",
        phone: c?.phone ?? "",
        whatsappNumber: c?.whatsappNumber ?? "",
        whatsappOptIn: Boolean(c?.whatsappOptIn),
        tag: (c?.tag as ContactTag) ?? "cold",
        source: (c?.source as ContactSource) ?? "other",
        companySize: c?.companySize ?? 0,
        notes: c?.notes ?? "",
    };
}

export const EditContactModal = memo(function EditContactModal({
    open,
    onOpenChange,
    contact,
    onUpdated,
}: Props) {
    const [form, setForm] = useState<FormState>(() => contactToForm(contact));
    const [saving, setSaving] = useState(false);

    // Sync state whenever the target contact changes or dialog opens
    useEffect(() => {
        if (!open) return;
        setForm(contactToForm(contact));
    }, [open, contact]);

    // Handle ESC key and scroll locking
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) {
                onOpenChange(false);
            }
        };

        window.addEventListener("keydown", onKey);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = originalOverflow;
        };
    }, [open, saving, onOpenChange]);

    const setField = useCallback(
        <K extends keyof FormState>(k: K, v: FormState[K]) => {
            setForm((f) => ({ ...f, [k]: v }));
        },
        []
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact) return;
        if (!form.name.trim()) {
            toast.error("Contact name is required");
            return;
        }

        setSaving(true);
        try {
            const updated = await contactApi.update(
                contact._id,
                form as Partial<Contact>
            );
            toast.success("Contact details updated");
            onUpdated?.(updated);
            onOpenChange(false);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to update contact";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (!contact) return null;

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
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 10 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                                    <Pencil className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Edit Contact
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Update profile and details for{" "}
                                        <span className="font-semibold text-slate-700">
                                            {contact.name}
                                        </span>
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

                        {/* Form Fields */}
                        <form
                            id="edit-contact-form"
                            onSubmit={handleSubmit}
                            className="overflow-y-auto p-6 space-y-5"
                        >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <span>Full Name</span>
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setField("name", e.target.value)}
                                        placeholder="e.g. Ayesha Rahman"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Company */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Company</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.company}
                                        onChange={(e) => setField("company", e.target.value)}
                                        placeholder="e.g. Acme Corporation"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Job Title */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        value={form.jobTitle}
                                        onChange={(e) => setField("jobTitle", e.target.value)}
                                        placeholder="e.g. VP of Operations"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Email Address */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Email Address</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setField("email", e.target.value)}
                                        placeholder="name@company.com"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Phone Number</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setField("phone", e.target.value)}
                                        placeholder="+880 1700 000000"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* WhatsApp Number */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                                        <span>WhatsApp Number</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.whatsappNumber}
                                        onChange={(e) => setField("whatsappNumber", e.target.value)}
                                        placeholder="Optional"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* WhatsApp Opt-in Checkbox */}
                                <div className="flex items-end pb-1.5">
                                    <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={form.whatsappOptIn}
                                            onChange={(e) => setField("whatsappOptIn", e.target.checked)}
                                            className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-0 accent-slate-900 cursor-pointer"
                                        />
                                        <span>Opt-in for WhatsApp messaging</span>
                                    </label>
                                </div>

                                {/* Tag Selection */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Pipeline Tag</span>
                                    </label>
                                    <select
                                        value={form.tag}
                                        onChange={(e) => setField("tag", e.target.value as ContactTag)}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    >
                                        {TAG_OPTIONS.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Source Selection */}
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Share2 className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Acquisition Source</span>
                                    </label>
                                    <select
                                        value={form.source}
                                        onChange={(e) =>
                                            setField("source", e.target.value as ContactSource)
                                        }
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    >
                                        {SOURCE_OPTIONS.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Company Size */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Company Size (Employees)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.companySize || ""}
                                        onChange={(e) =>
                                            setField("companySize", Number(e.target.value))
                                        }
                                        placeholder="Total headcount (e.g. 100)"
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                    />
                                </div>

                                {/* Notes */}
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Observations & Notes</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.notes}
                                        onChange={(e) => setField("notes", e.target.value)}
                                        placeholder="Internal observations, requirements, context..."
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
                                form="edit-contact-form"
                                disabled={saving}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
});