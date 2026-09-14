"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import api from "@/lib/axios";

// ==========================================
// Types & Interfaces
// ==========================================

interface ApiResponse {
    success: boolean;
    message?: string;
}

interface RejectExpenseModalProps {
    isOpen: boolean;
    expenseId: string | null;
    expenseTitle?: string;
    onClose: () => void;
    onRejected: () => void;
}

const MAX_REASON_LENGTH = 500;

// ==========================================
// Main Component
// ==========================================

export default function RejectExpenseModal({
    isOpen,
    expenseId,
    expenseTitle,
    onClose,
    onRejected,
}: RejectExpenseModalProps) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset textarea on dialog open
    useEffect(() => {
        if (isOpen) {
            setReason("");
        }
    }, [isOpen]);

    // Handle escape key closure
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting) {
                onClose();
            }
        },
        [isSubmitting, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleKeyDown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseId) return;

        const trimmedReason = reason.trim();
        if (!trimmedReason) {
            toast.error("Please provide an audit rejection justification");
            return;
        }

        if (trimmedReason.length > MAX_REASON_LENGTH) {
            toast.error(`Reason cannot exceed ${MAX_REASON_LENGTH} characters`);
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.patch<ApiResponse>(
                `/expenses/${expenseId}/reject`,
                { rejectionReason: trimmedReason }
            );

            if (response.data.success !== false) {
                toast.success("Expense request rejected");
                onRejected();
                onClose();
            }
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            const errorMessage =
                err.response?.data?.message || "Failed to complete expense rejection";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isOverLimit = reason.length > MAX_REASON_LENGTH;

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
                    onClick={!isSubmitting ? onClose : undefined}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reject-dialog-title"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 6 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                    <ShieldAlert className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h2
                                        id="reject-dialog-title"
                                        className="text-sm font-bold text-slate-900"
                                    >
                                        Reject Expense Claim
                                    </h2>
                                    {expenseTitle ? (
                                        <p className="text-xs text-slate-500 truncate max-w-[240px]">
                                            {expenseTitle}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-slate-500">
                                            Submit formal reason for denial
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                aria-label="Close dialog"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Notice Banner */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                                <AlertCircle size={15} className="text-slate-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    The employee will receive this justification so they can
                                    clarify, re-attach missing receipts, or correct discrepancies.
                                </p>
                            </div>

                            {/* Textarea Input */}
                            <div>
                                <label
                                    htmlFor="rejection-reason"
                                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                                >
                                    Audit Notes / Reason <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    id="rejection-reason"
                                    rows={4}
                                    required
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    maxLength={MAX_REASON_LENGTH}
                                    placeholder="e.g. Total amount does not match attached tax invoice. Please upload original VAT voucher and resubmit."
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 resize-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition"
                                />

                                <div className="flex justify-end mt-1">
                                    <span
                                        className={`text-[10px] font-mono ${isOverLimit ? "text-rose-600 font-bold" : "text-slate-400"
                                            }`}
                                    >
                                        {reason.length} / {MAX_REASON_LENGTH}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !reason.trim() || isOverLimit}
                                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : null}
                                    <span>Confirm Rejection</span>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}