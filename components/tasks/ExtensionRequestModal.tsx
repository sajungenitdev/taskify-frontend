"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import type { Task } from "@/types/task";
import { formatDate } from "../../utils/formatters";

interface Props {
  isOpen: boolean;
  task: Task;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ExtensionModal({ isOpen, task, onClose, onSubmitted }: Props) {
  const [requestedDate, setRequestedDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "completed";

  const reset = () => {
    setRequestedDate("");
    setReason("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!requestedDate) {
      toast.error("Please select a new deadline");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for extension");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/tasks/${task._id}/request-extension`, {
        requestedDate,
        reason: reason.trim(),
      });

      if (response.data.success) {
        toast.success("Extension request submitted successfully!");
        reset();
        onSubmitted();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to request extension");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">📅</span>
                <h3 className="text-xl font-bold text-gray-900">
                  Request Extension
                </h3>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                {task.title || "Task"} · Due: {formatDate(task.deadline)}
              </p>

              {isOverdue && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
                  <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-xs text-red-600 leading-relaxed">
                    This task is overdue. An extension will be logged against
                    your KPI timeliness score.
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  New Requested Deadline
                </label>
                <input
                  type="datetime-local"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                  min={
                    task.deadline || new Date().toISOString().split("T")[0]
                  }
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                  Reason for Extension <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you need an extension..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 text-sm"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Request
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ✅ Correct default export — points to the named export above
export default ExtensionModal;