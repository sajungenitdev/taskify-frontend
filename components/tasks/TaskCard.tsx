// components/tasks/TaskCard.tsx
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Star, Edit2, Trash2, Play, Send, ThumbsUp, ThumbsDown,
    RefreshCw, Eye, ExternalLink, CalendarClock, Clock as ClockIcon,
    Calendar, Briefcase, Paperclip, AlertCircle, X
} from "lucide-react";
import { Task } from "@/types/task";
import { getPriorityConfig, getStatusConfig, formatDate, getRelativeTime } from "@/utils/task-helpers";

interface TaskCardProps {
    task: Task;
    idx: number;
    user: any;
    canManage: boolean;
    canApprove: boolean;
    updatingStatus: string | null;
    approving: boolean;
    rejecting: boolean;
    onStatusChange: (taskId: string, status: string) => void;
    onApprove: (taskId: string) => void;
    onRejectClick: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onStar: (taskId: string) => void;
    onViewDetails: (task: Task) => void;
    onRequestExtension: (task: Task) => void;
    onStartTimer: (taskId: string) => void;
    onPauseTimer: () => void;
    onResumeTimer: () => void;
    onStopTimer: (taskId: string) => void;
    isTimerActive: boolean;
    isTimerRunning: boolean;
    timerState: any;
    formatTime: (seconds: number) => string;
}

export const TaskCard = ({
    task,
    idx,
    user,
    canManage,
    canApprove,
    updatingStatus,
    approving,
    rejecting,
    onStatusChange,
    onApprove,
    onRejectClick,
    onEdit,
    onDelete,
    onStar,
    onViewDetails,
    onRequestExtension,
    onStartTimer,
    isTimerActive,
    formatTime,
}: TaskCardProps) => {
    const isAssignee = task.assignedTo?._id === user?._id;
    const isOverdue =
        new Date(task.deadline) < new Date() && task.status !== "completed";
    const isRejected = task.status === "rejected";
    const hasEvidence = (task.evidenceUrls ?? []).length > 0;
    const rejectionReason = task.rejectionReason || "";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/50 shadow-md overflow-hidden ${isRejected ? "border-red-200 hover:border-red-300" : "border-gray-200 hover:border-indigo-300"
                }`}
        >
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-700 pointer-events-none" />

            <div
                className={`h-1 bg-linear-to-r ${isRejected ? "from-red-400 to-red-600" : getPriorityConfig(task.priority).gradient
                    }`}
            />

            <div className="p-5 relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color} shadow-sm flex items-center gap-1`}
                        >
                            <span>{getPriorityConfig(task.priority).icon}</span>
                            {task.priority.toUpperCase()}
                        </span>
                        <span
                            className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color} shadow-sm flex items-center gap-1`}
                        >
                            <span>{getStatusConfig(task.status).icon}</span>
                            {task.status.replace("_", " ").toUpperCase()}
                        </span>

                        {hasEvidence && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-1">
                                <Paperclip size={10} /> Evidence ({task.evidenceUrls?.length || 0})
                            </span>
                        )}

                        {isRejected && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 flex items-center gap-1 animate-pulse">
                                <X size={10} /> Rejected
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onStar(task._id)}
                            className="p-1.5 text-gray-300 hover:text-amber-400 transition-all hover:scale-110"
                        >
                            <Star
                                size={14}
                                className={`transition-all ${task.isStarred ? "fill-amber-400 text-amber-400" : ""}`}
                            />
                        </button>
                        {canManage && (
                            <>
                                <button
                                    onClick={() => onEdit(task)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                                >
                                    <Edit2 size={12} />
                                </button>
                                {(user?.role === "super_admin" || user?.role === "admin") && (
                                    <button
                                        onClick={() => onDelete(task._id)}
                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <h3 className="text-gray-800 font-semibold text-base mb-2 line-clamp-2 group-hover:text-indigo-600 transition-all duration-300">
                    {task.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3 leading-relaxed">
                    {task.description}
                </p>

                {isRejected && rejectionReason && (
                    <div className="mb-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-medium text-red-700">Rejection Reason</p>
                                <p className="text-xs text-red-600 mt-0.5 line-clamp-2">{rejectionReason}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {task.projectId && (
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/50">
                            <Briefcase size={10} /> <span>{task.projectId.name}</span>
                        </div>
                    )}
                    {isOverdue && (
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/50 animate-pulse">
                            <AlertCircle size={10} /> <span>Overdue</span>
                        </div>
                    )}
                    {hasEvidence && (
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            <Paperclip size={10} /> <span>Has Evidence</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100/80">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
                                <span className="text-white text-[10px] font-bold">
                                    {task.assignedTo?.fullName?.charAt(0) || "?"}
                                </span>
                            </div>
                            {task.assignedTo?._id === user?._id && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <div>
                            <p className="text-gray-800 text-[11px] font-medium leading-tight">
                                {task.assignedTo?.fullName || "Unassigned"}
                            </p>
                            <p className="text-gray-400 text-[9px] flex items-center gap-1">
                                <ClockIcon size={8} /> {getRelativeTime(task.createdAt || new Date().toISOString())}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                            <Calendar size={10} />
                            <span className={isOverdue ? "text-rose-500 font-semibold" : ""}>
                                {formatDate(task.deadline)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100/80">
                    {task.status === "pending" && (
                        <button
                            onClick={() => onStatusChange(task._id, "in_progress")}
                            disabled={updatingStatus === task._id}
                            className="flex-1 py-1.5 bg-linear-to-r from-indigo-50 to-indigo-100/50 hover:from-indigo-600 hover:to-indigo-700 text-indigo-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-indigo-200/50 hover:border-transparent shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <Play size={12} /> Start
                        </button>
                    )}

                    {task.status === "in_progress" && (
                        <button
                            onClick={() => onStatusChange(task._id, "submitted")}
                            disabled={updatingStatus === task._id}
                            className="flex-1 py-1.5 bg-linear-to-r from-purple-50 to-purple-100/50 hover:from-purple-600 hover:to-purple-700 text-purple-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-purple-200/50 hover:border-transparent shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <Send size={12} /> Submit
                        </button>
                    )}

                    {task.status === "submitted" && canApprove && (
                        <>
                            <button
                                onClick={() => onApprove(task._id)}
                                disabled={approving}
                                className="flex-1 py-1.5 bg-linear-to-r from-emerald-50 to-emerald-100/50 hover:from-emerald-600 hover:to-emerald-700 text-emerald-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-emerald-200/50 hover:border-transparent shadow-sm hover:shadow-md disabled:opacity-50"
                            >
                                <ThumbsUp size={12} /> Approve
                            </button>
                            <button
                                onClick={() => onRejectClick(task)}
                                className="flex-1 py-1.5 bg-linear-to-r from-rose-50 to-rose-100/50 hover:from-rose-600 hover:to-rose-700 text-rose-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-rose-200/50 hover:border-transparent shadow-sm hover:shadow-md"
                            >
                                <ThumbsDown size={12} /> Reject
                            </button>
                        </>
                    )}

                    {task.status === "rejected" && (
                        <button
                            onClick={() => onStatusChange(task._id, "pending")}
                            disabled={updatingStatus === task._id}
                            className="flex-1 py-1.5 bg-linear-to-r from-amber-50 to-amber-100/50 hover:from-amber-600 hover:to-amber-700 text-amber-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-amber-200/50 hover:border-transparent shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            <RefreshCw size={12} /> Rework
                        </button>
                    )}

                    <button
                        onClick={() => onViewDetails(task)}
                        className="py-1.5 px-3 bg-linear-to-r from-gray-50 to-gray-100/50 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-gray-200/50 hover:border-transparent shadow-sm hover:shadow-md"
                    >
                        <Eye size={12} /> View
                    </button>
                    <Link
                        href={`/tasks/${task._id}`}
                        className="py-1.5 px-3 bg-linear-to-r from-indigo-50 to-purple-50 hover:from-indigo-600 hover:to-purple-600 text-indigo-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-indigo-200/50 hover:border-transparent shadow-sm hover:shadow-md"
                    >
                        <ExternalLink size={12} /> Details
                    </Link>
                    {isAssignee && task.status !== "completed" &&
                        task.status !== "submitted" &&
                        task.status !== "rejected" && (
                            <button
                                onClick={() => onRequestExtension(task)}
                                className="py-1.5 px-3 bg-linear-to-r from-amber-50 to-amber-100/50 hover:from-amber-600 hover:to-amber-700 text-amber-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-amber-200/50 hover:border-transparent shadow-sm hover:shadow-md"
                            >
                                <CalendarClock size={12} /> Extend
                            </button>
                        )}
                </div>
            </div>
        </motion.div>
    );
};