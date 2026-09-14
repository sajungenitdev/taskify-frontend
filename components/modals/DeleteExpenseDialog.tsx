"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
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

interface DeleteExpenseDialogProps {
    isOpen: boolean;
    expenseId: string | null;
    expenseTitle?: string;
    onClose: () => void;
    onDeleted: () => void;
}

// ==========================================
// Main Component
// ==========================================

export default function DeleteExpenseDialog({
    isOpen,
    expenseId,
    expenseTitle,
    onClose,
    onDeleted,
}: DeleteExpenseDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    // Close on Escape key press
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isDeleting) {
                onClose();
            }
        },
        [isDeleting, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleKeyDown]);

    const handleDelete = async () => {
        if (!expenseId) return;

        setIsDeleting(true);
        try {
            const response = await api.delete<ApiResponse>(`/expenses/${expenseId}`);

            if (response.data.success !== false) {
                toast.success("Expense record removed");
                onDeleted();
                onClose();
            }
        } catch (error) {
            const err = error as AxiosError<{ message?: string }>;
            const errorMessage =
                err.response?.data?.message || "Failed to remove expense record";
            toast.error(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
                    onClick={!isDeleting ? onClose : undefined}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-dialog-title"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 6 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
                    >
                        {/* Top Close Button */}
                        <div className="flex justify-end pt-3 pr-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isDeleting}
                                aria-label="Close dialog"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 pb-6 pt-1 text-center">
                            {/* Alert Badge */}
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 ring-4 ring-rose-50/60 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6 text-rose-600" />
                            </div>

                            <h3
                                id="delete-dialog-title"
                                className="text-base font-bold text-slate-900"
                            >
                                Delete Expense Claim?
                            </h3>

                            {expenseTitle ? (
                                <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                    "{expenseTitle}"
                                </p>
                            ) : null}

                            <p className="text-xs text-slate-500 leading-relaxed mt-2.5 mb-6">
                                This item will be permanently removed from your submission log.
                                This action cannot be undone.
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                >
                                    {isDeleting ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}