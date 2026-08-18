// components/tasks/RejectTaskModal.tsx
"use client";

import { useState } from "react";
import { X, ThumbsDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { Task } from "@/types/task";

interface RejectTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onSuccess: () => void;
}

export default function RejectTaskModal({
    isOpen,
    onClose,
    task,
    onSuccess,
}: RejectTaskModalProps) {
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const handleSubmit = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        if (!task) {
            toast.error("No task selected");
            return;
        }

        setRejecting(true);
        try {
            const response = await api.patch(`/tasks/${task._id}/status`, {
                status: "rejected",
                rejectionReason: rejectionReason.trim(),
            });

            if (response.data.success) {
                toast.success("Task rejected. Feedback sent to assignee");
                setRejectionReason("");
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to reject task");
        } finally {
            setRejecting(false);
        }
    };

    const handleClose = () => {
        setRejectionReason("");
        onClose();
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                                <ThumbsDown className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Reject Task</h3>
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
                        Provide feedback for the assignee. This will be sent to them.
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Rejection Reason <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this task is being rejected..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            This feedback will be sent to the assignee.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={rejecting || !rejectionReason.trim()}
                            className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {rejecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Rejecting...
                                </>
                            ) : (
                                <>
                                    <ThumbsDown size={16} />
                                    Reject Task
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClose}
                            disabled={rejecting}
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