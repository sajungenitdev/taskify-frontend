"use client";
import { motion } from "framer-motion";
import {
    Play, Pause, Square, Upload, Send, CalendarClock, Star, Link2,
    Loader2, ThumbsUp, ThumbsDown, RefreshCw, Zap,
} from "lucide-react";
import type { Task, Review } from "../../types/tasks";

interface Props {
    task: Task;
    user: any;
    updating: boolean;
    submittingForReview: boolean;
    isTimerActive: boolean;
    isTimerRunningForTask: boolean;
    isTimerActiveForTask: (id: string) => boolean;
    activeTimerTaskId: string | null;
    canReview: boolean;
    reviews: Review[];
    onUpdateStatus: (status: string, data?: any) => void;
    onStartTimer: () => void;
    onPauseTimer: () => void;
    onStopTimer: () => void;
    onResumeTimer: () => void;
    onSubmitForReview: () => void;
    onOpenDependencyEditor: () => void;
    onOpenExtensionModal: () => void;
    onOpenApprovalModal: (action: "approve" | "reject") => void;
    onOpenReviewModal: () => void;
}

export function TaskActions(props: Props) {
    const {
        task, user, updating, submittingForReview,
        isTimerActive, isTimerRunningForTask, activeTimerTaskId,
        canReview, reviews,
        onUpdateStatus,
        onStartTimer, onResumeTimer, onPauseTimer, onStopTimer,   // 👈 destructure resume
        onSubmitForReview, onOpenDependencyEditor, onOpenExtensionModal,
        onOpenApprovalModal, onOpenReviewModal,
    } = props;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 top-6 pb-0"
        >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Actions
            </h3>

            <div className="space-y-3">
                {/* Dependencies */}
                <button
                    onClick={onOpenDependencyEditor}
                    className="w-full py-2.5 mb-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition flex items-center justify-center gap-2 shadow-sm border border-indigo-200"
                >
                    <Link2 size={16} />
                    Manage Dependencies
                    {task.dependencies && task.dependencies.length > 0 && (
                        <span className="bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                            {task.dependencies.length}
                        </span>
                    )}
                </button>

                {/* Status actions */}
                <div className="grid grid-cols-2 gap-2">
                    {task.status === "pending" ? (
                        <button
                            onClick={() => onUpdateStatus("in_progress")}
                            disabled={updating}
                            className="col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                        >
                            {updating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            Start Task
                        </button>
                    ) : task.status === "submitted" && canReview !== null ? (
                        <>
                            <button
                                onClick={() => onOpenApprovalModal("approve")}
                                disabled={updating}
                                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {updating ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                                Approve
                            </button>
                            <button
                                onClick={() => onOpenApprovalModal("reject")}
                                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                            >
                                <ThumbsDown size={16} />
                                Reject
                            </button>
                        </>
                    ) : task.status === "rejected" ? (
                        <button
                            onClick={() => onUpdateStatus("pending")}
                            disabled={updating}
                            className="col-span-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {updating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            Send for Rework
                        </button>
                    ) : null}
                </div>

                {/* Timer */}
                <div className="space-y-2">
                    {(!isTimerActive || (isTimerActive && !isTimerRunningForTask)) && (
                        <button
                            onClick={isTimerActive ? onResumeTimer : onStartTimer}   // 👈 ROUTE
                            className="w-full py-2.5 cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            disabled={activeTimerTaskId !== null && activeTimerTaskId !== task._id}
                        >
                            <Play size={14} />
                            {isTimerActive ? "Resume Timer" : "Start Timer"}
                        </button>
                    )}

                    {isTimerActive && isTimerRunningForTask && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onPauseTimer}
                                className="py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                            >
                                <Pause size={14} /> Pause
                            </button>
                            <button
                                onClick={onStopTimer}
                                className="py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg transition flex items-center justify-center gap-1 shadow-sm"
                            >
                                <Square size={14} /> Stop
                            </button>
                        </div>
                    )}
                </div>

                {/* Upload evidence / Submit */}
                {task.status === "in_progress" && (
                    <>
                        <button
                            onClick={onSubmitForReview}
                            disabled={updating || submittingForReview}
                            className="w-full py-2.5 cursor-pointer bg-white border border-gray-300 text-black rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {updating || submittingForReview ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Upload Evidence
                        </button>
                        <button
                            onClick={onSubmitForReview}
                            disabled={updating || submittingForReview}
                            className="w-full py-2.5 cursor-pointer bg-amber-200 border border-amber-700 text-amber-700 rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            {updating || submittingForReview ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Submit for Approval
                        </button>
                    </>
                )}

                {/* Extension */}
                <button
                    onClick={onOpenExtensionModal}
                    className="w-full py-2.5 cursor-pointer bg-white border border-gray-300 text-black rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                    <CalendarClock size={16} /> Request Extension
                </button>

                {/* Review */}
                {canReview &&
                    task.status === "completed" &&
                    !reviews.some((r) => r.reviewer?._id === user?._id) && (
                        <button
                            onClick={onOpenReviewModal}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Star size={16} /> Leave a Review
                        </button>
                    )}
            </div>
        </motion.div>
    );
}