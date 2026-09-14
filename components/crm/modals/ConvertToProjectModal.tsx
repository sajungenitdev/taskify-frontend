// components/crm/modals/ConvertToProjectModal.tsx
"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    Calendar,
    Hash,
    FileText,
    Loader2,
    X,
    ArrowRight,
    FolderPlus,
} from "lucide-react";
import { leadApi } from "@/lib/api/crm.api";
import { toast } from "react-hot-toast";

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    leadId: string;
    defaultName?: string;
    onConverted?: () => void;
}

export const ConvertToProjectModal = memo(function ConvertToProjectModal({
    open,
    onOpenChange,
    leadId,
    defaultName = "",
    onConverted,
}: Props) {
    const [name, setName] = useState(defaultName);
    const [code, setCode] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    // Auto-generate a clean project code from the name if none entered
    const generateProjectCode = useCallback((inputName: string) => {
        const cleaned = inputName
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .trim()
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 4);

        const randomSuffix = Math.floor(100 + Math.random() * 900);
        return cleaned ? `PRJ-${cleaned}-${randomSuffix}` : `PRJ-${randomSuffix}`;
    }, []);

    // Re-hydrate state on dialog trigger
    useEffect(() => {
        if (!open) return;
        const initialName = defaultName.trim();
        setName(initialName);
        setCode(generateProjectCode(initialName));
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
        setDescription("");
    }, [open, defaultName, generateProjectCode]);

    // Escape key listener & body scroll lock
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Project name is required");
            return;
        }

        setSaving(true);
        try {
            await leadApi.convertToProject(leadId, {
                name: name.trim(),
                code: code.trim() || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                description: description.trim() || undefined,
            });

            toast.success("Deal converted to active project");
            onConverted?.();
            onOpenChange(false);
        } catch (e: unknown) {
            const message =
                e instanceof Error ? e.message : "Failed to convert deal to project";
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
                        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
                                    <FolderPlus className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Convert Deal to Project
                                    </h2>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Transition closed won opportunity into execution workflow
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

                        {/* Form Body */}
                        <form
                            id="convert-project-form"
                            onSubmit={handleSubmit}
                            className="overflow-y-auto p-6 space-y-4"
                        >
                            {/* Project Title */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Project Title</span>
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Enterprise Cloud Deployment"
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                />
                            </div>

                            {/* Unique Project Code */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Project Identifier Code</span>
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="PRJ-001"
                                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs font-bold uppercase text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                                />
                            </div>

                            {/* Timeline Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Kickoff Date</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        <span>Target Delivery</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition font-mono"
                                    />
                                </div>
                            </div>

                            {/* Description & Scope */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Scope of Work & Deliverables</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Primary milestones, team requirements, statement of work summaries..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition resize-none leading-relaxed"
                                />
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
                                form="convert-project-form"
                                disabled={saving}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                {saving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <ArrowRight className="h-3.5 w-3.5" />
                                )}
                                <span>{saving ? "Provisioning..." : "Launch Project"}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
});