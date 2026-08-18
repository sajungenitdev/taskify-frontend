// components/tasks/ExtensionRequestModal.tsx
"use client";

import { useState } from "react";
import { X, CalendarClock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { Task } from "@/types/task";
import { formatDate } from "@/utils/task-helpers";

interface ExtensionRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onSuccess: () => void;
}

export default function ExtensionRequestModal({
    isOpen,
    onClose,
    task,
    onSuccess,
}: ExtensionRequestModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [extensionData, setExtensionData] = useState({
        requestedDate: "",
        reason: "",
    });

    const handleSubmit = async () => {
        if (!extensionData.requestedDate) {
            toast.error("Please select a new deadline");
            return;
        }

        if (!extensionData.reason.trim()) {
            toast.error("Please provide a reason for extension");
            return;
        }

        if (!task) {
            toast.error("No task selected");
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post(`/tasks/${task._id}/request-extension`, {
                requestedDate: extensionData.requestedDate,
                reason: extensionData.reason.trim(),
            });

            if (response.data.success) {
                toast.success("✅ Extension request submitted successfully!");
                setExtensionData({ requestedDate: "", reason: "" });
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error("Error requesting extension:", error);
            toast.error(error.response?.data?.message || "Failed to request extension");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setExtensionData({ requestedDate: "", reason: "" });
        onClose();
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md"
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                                <CalendarClock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Request Extension</h3>
                                <p className="text-xs text-slate-500 line-clamp-1">{task.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                        >
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>

                    <p className="text-sm text-slate-500 mb-4">
                        Request a new deadline for this task. Your manager will review the request.
                    </p>

                    {/* Current Deadline */}
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500">Current Deadline</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {formatDate(task.deadline)}
                        </p>
                    </div>

                    {/* New Deadline */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            New Deadline <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={extensionData.requestedDate}
                            onChange={(e) =>
                                setExtensionData({
                                    ...extensionData,
                                    requestedDate: e.target.value,
                                })
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                            min={new Date().toISOString().split("T")[0]}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Current deadline: {formatDate(task.deadline)}
                        </p>
                    </div>

                    {/* Reason */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Reason <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={extensionData.reason}
                            onChange={(e) =>
                                setExtensionData({
                                    ...extensionData,
                                    reason: e.target.value,
                                })
                            }
                            placeholder="Explain why you need an extension..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <CalendarClock size={16} />
                                    Submit Request
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}