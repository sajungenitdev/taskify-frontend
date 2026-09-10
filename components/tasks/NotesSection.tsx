"use client";
import { motion } from "framer-motion";
import { MessageCircle, ThumbsUp, CalendarClock, Check } from "lucide-react";
import type { Task, ExtensionRequest } from "../../types/tasks";
import { formatDate, formatDateTime } from "../../utils/formatters";

interface Props {
  task: Task;
  extensionRequests: ExtensionRequest[];
  canApprove: boolean;
  onShowRejection: () => void;
  onApproveExtension: (id: string, date: string) => void;
}

export function NotesSection({
  task,
  extensionRequests,
  canApprove,
  onShowRejection,
  onApproveExtension,
}: Props) {
  return (
    <>
      {task.status === "rejected" && task.rejectionReason && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-200 cursor-pointer hover:bg-rose-100 transition"
          onClick={onShowRejection}
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-rose-100 rounded-lg">
              <MessageCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-rose-800">Rejection Reason</p>
                <span className="text-xs text-rose-500">Click to view</span>
              </div>
              <p className="text-sm text-rose-700 mt-1 line-clamp-2">{task.rejectionReason}</p>
            </div>
          </div>
        </motion.div>
      )}

      {task.status === "completed" && task.approvalNote && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
        >
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-800">Approval Note</p>
              <p className="text-sm text-emerald-700 mt-1">{task.approvalNote}</p>
            </div>
          </div>
        </motion.div>
      )}

      {extensionRequests.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">
              Extension Requests ({extensionRequests.length})
            </p>
          </div>
          <div className="space-y-3">
            {extensionRequests.map((req) => (
              <div key={req._id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          req.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : req.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700 animate-pulse"
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">Requested: {formatDateTime(req.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      New Deadline: {formatDate(req.requestedDate)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-400 text-xs font-medium">Reason:</span> {req.reason}
                    </p>
                    {req.approvedBy && (
                      <p className="text-xs text-gray-500 mt-1">Approved by: {req.approvedBy.fullName}</p>
                    )}
                  </div>
                  {canApprove && req.status === "pending" && (
                    <button
                      onClick={() => onApproveExtension(req._id, req.requestedDate)}
                      className="ml-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg transition shadow-sm flex items-center gap-1"
                    >
                      <Check size={12} /> Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}