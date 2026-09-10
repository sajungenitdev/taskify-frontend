"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  action: "approve" | "reject" | null;
  isOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onApprove: (note: string) => void;
  onReject: (note: string) => void;
}

export function ApprovalNoteModal({
  action,
  isOpen,
  loading,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const [note, setNote] = useState("");

  // reset whenever the modal opens with a new action
  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen, action]);

  const handleConfirm = () => {
    if (!note.trim()) {
      toast.error(
        action === "approve"
          ? "Please provide feedback for approval"
          : "Please provide a reason for rejection"
      );
      return;
    }
    if (action === "approve") onApprove(note.trim());
    else if (action === "reject") onReject(note.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    action === "approve" ? "bg-emerald-50" : "bg-rose-50"
                  }`}
                >
                  {action === "approve" ? (
                    <ThumbsUp className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ThumbsDown className="w-5 h-5 text-rose-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  {action === "approve" ? "Approve" : "Reject"} Task
                </h3>
              </div>

              <p className="text-gray-500 text-sm mb-4">
                {action === "approve"
                  ? "Provide feedback for approving this task. This will be sent to the assignee."
                  : "Please provide a reason for rejecting this task. This will be sent to the assignee for rework."}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === "approve" ? "Approval Note" : "Rejection Reason"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    action === "approve"
                      ? "Enter approval feedback..."
                      : "Enter rejection reason..."
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={!note.trim() || loading}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : action === "approve" ? (
                    <ThumbsUp size={14} />
                  ) : (
                    <ThumbsDown size={14} />
                  )}
                  Confirm {action === "approve" ? "Approval" : "Rejection"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}