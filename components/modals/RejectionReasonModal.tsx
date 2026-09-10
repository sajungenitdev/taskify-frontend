"use client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Info, RefreshCw } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rejectionReason: string;
  onRework: () => void;
}

export function RejectionReasonModal({
  isOpen,
  onClose,
  rejectionReason,
  onRework,
}: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Task Rejected</h3>
                  <p className="text-xs text-gray-500">Feedback from the reviewer</p>
                </div>
              </div>

              <div className="bg-rose-50 rounded-xl p-4 border border-rose-200 mb-4">
                <p className="text-sm text-rose-700 leading-relaxed">{rejectionReason}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mb-4">
                <Info className="w-4 h-4 text-gray-400" />
                <span>Please review the feedback and resubmit with improvements.</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onRework}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw size={14} />
                  Send for Rework
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}