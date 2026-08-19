"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Star,
    Send,
    Loader2,
    Lock,
    RefreshCw,
    MessageSquare,
    Shield,
    CheckCircle,
    Edit2,
    Trash2,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

// ============ INTERFACES ============
interface UserReference {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
}

interface Feedback {
    _id: string;
    kpiId: string;
    userId: UserReference | string;
    comment: string;
    rating?: number;
    createdAt: string;
    updatedAt: string;
    isEdited: boolean;
    editedAt?: string;
    isDeleted?: boolean;
    createdBy: UserReference;
}

interface KPIFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    kpiId: string;
    employeeId: string;
    employeeName: string;
    month: string;
    year: number;
    currentUserRole: string;
    currentUserId?: string; // Recommended to accurately check own feedback ownership
    onFeedbackAdded?: () => void;
}

// ============ CONSTANTS ============
const ROLES_WITH_FEEDBACK_PERMISSION = [
    "super_admin",
    "admin",
    "hr_manager",
    "project_manager",
    "dept_manager",
];

export default function KPIFeedbackModal({
    isOpen,
    onClose,
    kpiId,
    employeeId,
    employeeName,
    month,
    year,
    currentUserRole,
    currentUserId,
    onFeedbackAdded,
}: KPIFeedbackModalProps) {
    // State management
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null); // State for inline delete confirmation
    const [comment, setComment] = useState<string>("");
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const [lockMessage, setLockMessage] = useState<string>("");
    const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

    const canProvideFeedback = ROLES_WITH_FEEDBACK_PERMISSION.includes(currentUserRole);

    // ============ DATA FETCHING ============
    const fetchFeedbackAndLockStatus = useCallback(async () => {
        if (!kpiId) return;
        setLoading(true);
        setError(null);

        try {
            // Concurrent fetch for feedback list & lock status if available
            const [feedbackRes] = await Promise.all([
                api.get(`/kpi/feedback/${kpiId}`).catch(() => null),
                api.get(`/kpi/lock-status/${employeeId}`, { params: { month, year } }).catch(() => null),
            ]);

            if (feedbackRes?.data?.success) {
                const responseData = feedbackRes.data.data;
                const rawList = Array.isArray(responseData) ? responseData : responseData.feedback || [];
                const activeList = rawList.filter((f: Feedback) => !f.isDeleted);

                setFeedbackList(activeList);
                setIsLocked(responseData.isLocked || false);
                setLockMessage(responseData.lockMessage || "");
            }
        } catch (err: any) {
            console.error("Error fetching feedback dependencies:", err);
            setError(err.response?.data?.message || "Failed to load feedback records.");
        } finally {
            setLoading(false);
        }
    }, [kpiId, employeeId, month, year]);

    useEffect(() => {
        if (isOpen) {
            fetchFeedbackAndLockStatus();
        }
    }, [isOpen, fetchFeedbackAndLockStatus]);

    // ============ FORM ACTIONS ============
    const resetForm = () => {
        setComment("");
        setRating(0);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.error("Feedback comment cannot be empty.");
            return;
        }

        if (comment.length > 2000) {
            toast.error("Comment cannot exceed 2000 characters.");
            return;
        }

        if (isLocked) {
            toast.error(lockMessage || "KPI period is locked. Modifications are disabled.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                comment: comment.trim(),
                rating: rating > 0 ? rating : undefined,
            };

            let response;
            if (editingId) {
                response = await api.put(`/kpi/feedback/${kpiId}/${editingId}`, payload);
            } else {
                response = await api.post(`/kpi/feedback/${kpiId}`, payload);
            }

            if (response.data.success) {
                toast.success(editingId ? "Feedback updated successfully!" : "Feedback posted successfully!");
                await fetchFeedbackAndLockStatus();
                resetForm();
                if (onFeedbackAdded) onFeedbackAdded();
            }
        } catch (err: any) {
            console.error("Submission error:", err);
            toast.error(err.response?.data?.message || "Failed to save feedback.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: Feedback) => {
        if (isLocked) {
            toast.error("Cannot edit feedback while KPI is locked.");
            return;
        }
        setEditingId(item._id);
        setComment(item.comment);
        setRating(item.rating || 0);
    };

    const handleDelete = async (feedbackId: string) => {
        if (isLocked) {
            toast.error("Cannot delete feedback while KPI is locked.");
            return;
        }

        try {
            setSubmitting(true);
            const response = await api.delete(`/kpi/feedback/${kpiId}/${feedbackId}`);

            if (response.data.success) {
                toast.success("Feedback deleted successfully.");
                setFeedbackList((prev) => prev.filter((f) => f._id !== feedbackId));
                setDeletingId(null);
                if (onFeedbackAdded) onFeedbackAdded();
            }
        } catch (err: any) {
            console.error("Deletion error:", err);
            if (err?.response?.status === 404) {
                setFeedbackList((prev) => prev.filter((f) => f._id !== feedbackId));
                toast.success("Feedback entry removed.");
            } else {
                toast.error(err.response?.data?.message || "Failed to delete feedback.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ============ HELPERS ============
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getInitials = (name: string = "") => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const getRoleBadgeStyles = (role: string) => {
        const styles: Record<string, string> = {
            super_admin: "bg-purple-50 text-purple-700 border-purple-200",
            admin: "bg-red-50 text-red-700 border-red-200",
            hr_manager: "bg-pink-50 text-pink-700 border-pink-200",
            dept_manager: "bg-blue-50 text-blue-700 border-blue-200",
            project_manager: "bg-indigo-50 text-indigo-700 border-indigo-200",
            employee: "bg-gray-50 text-gray-700 border-gray-200",
        };
        return styles[role] || "bg-gray-50 text-gray-700 border-gray-200";
    };

    const formatRoleName = (role: string) => {
        return role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const renderInteractiveStars = () => {
        return [1, 2, 3, 4, 5].map((starIdx) => (
            <button
                key={starIdx}
                type="button"
                onClick={() => setRating(starIdx)}
                onMouseEnter={() => setHoverRating(starIdx)}
                onMouseLeave={() => setHoverRating(0)}
                disabled={isLocked}
                className="cursor-pointer focus:outline-none transition-transform hover:scale-110 disabled:cursor-not-allowed"
            >
                <Star
                    className={`w-5 h-5 ${starIdx <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                        } transition-colors`}
                />
            </button>
        ));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">Performance Feedback</h2>
                            <p className="text-xs text-gray-500">
                                {employeeName} • {month} {year}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* KPI Locked Status Banner */}
                {isLocked && (
                    <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 shrink-0">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="text-xs">
                            <span className="font-semibold text-amber-800">KPI Locked: </span>
                            <span className="text-amber-700">{lockMessage || "This evaluation period is finalized. Entries are read-only."}</span>
                        </div>
                    </div>
                )}

                {/* Modal Main Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add / Edit Form Panel */}
                    {canProvideFeedback && !isLocked && (
                        <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-200/80 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    {editingId ? "Edit Feedback Entry" : "Write Feedback"}
                                </h3>
                                {editingId && (
                                    <button
                                        onClick={resetForm}
                                        className="text-xs text-gray-400 hover:text-gray-600 font-medium transition"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {/* Rating Selector */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-xs font-medium text-gray-500">Rating Score:</span>
                                <div className="flex gap-1">{renderInteractiveStars()}</div>
                                {rating > 0 && (
                                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        {rating} / 5
                                    </span>
                                )}
                            </div>

                            {/* Textarea Input */}
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Provide constructive feedback, key accomplishments, or areas of focus..."
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 outline-none transition resize-none shadow-inner"
                                rows={3}
                                maxLength={2000}
                                disabled={submitting}
                            />

                            <div className="flex items-center justify-between mt-2.5">
                                <span className="text-[11px] text-gray-400 font-mono">
                                    {comment.length} / 2000 chars
                                </span>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !comment.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            <span>{editingId ? "Update Feedback" : "Post Feedback"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Feedback Feed List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Feedback History ({feedbackList.length})
                            </h3>
                            <button
                                onClick={fetchFeedbackAndLockStatus}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
                                title="Refresh feed"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                <p className="text-xs text-gray-400">Loading comments...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 bg-red-50/50 rounded-xl border border-red-100 p-4">
                                <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                                <p className="text-xs text-red-600 font-medium">{error}</p>
                            </div>
                        ) : feedbackList.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-600">No feedback entries recorded</p>
                                <p className="text-xs text-gray-400 mt-0.5">Reviews and comments will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {feedbackList.map((item) => {
                                    const creator = item.createdBy || { fullName: "Anonymous", role: "employee" };

                                    const isCreator = currentUserId ? creator._id === currentUserId : false;
                                    const isAdmin = ["super_admin", "admin"].includes(currentUserRole);
                                    const isManager = ["hr_manager", "dept_manager", "project_manager"].includes(currentUserRole);

                                    // Only the creator or admins/managers can manage feedback
                                    const canManage = !isLocked && (isCreator || isAdmin || isManager);
                                    const isExpanded = expandedFeedbackId === item._id;
                                    const isConfirmingDelete = deletingId === item._id;

                                    return (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs hover:border-gray-300 transition"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                {/* Author Profile Information */}
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 overflow-hidden text-emerald-800 font-bold text-xs">
                                                        {creator.avatar ? (
                                                            <img src={creator.avatar} alt={creator.fullName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            getInitials(creator.fullName)
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-bold text-gray-900 truncate">
                                                                {creator.fullName}
                                                            </span>
                                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeStyles(creator.role)}`}>
                                                                {formatRoleName(creator.role)}
                                                            </span>
                                                            {item.isEdited && (
                                                                <span className="text-[10px] text-gray-400 italic">(edited)</span>
                                                            )}
                                                        </div>

                                                        {/* Ratings & Timestamp Row */}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {item.rating && (
                                                                <div className="flex gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star
                                                                            key={s}
                                                                            className={`w-3.5 h-3.5 ${s <= item.rating!
                                                                                ? "fill-amber-400 text-amber-400"
                                                                                : "text-gray-200"
                                                                                }`}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <span className="text-[10px] text-gray-400">• {formatDate(item.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons (Edit / Delete) */}
                                                {canManage && !isConfirmingDelete && (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                            title="Edit feedback"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingId(item._id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="Delete feedback"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Inline Delete Confirmation Box */}
                                            <AnimatePresence>
                                                {isConfirmingDelete && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between gap-2"
                                                    >
                                                        <span className="text-xs font-medium text-red-700">Delete this entry permanently?</span>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <button
                                                                onClick={() => setDeletingId(null)}
                                                                className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs rounded-lg transition font-medium"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item._id)}
                                                                disabled={submitting}
                                                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition font-medium flex items-center gap-1"
                                                            >
                                                                {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                                                Confirm Delete
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Comment Body */}
                                            <div className="mt-2.5 text-xs text-gray-700 leading-relaxed">
                                                {isExpanded || item.comment.length <= 180 ? (
                                                    <p className="whitespace-pre-wrap">{item.comment}</p>
                                                ) : (
                                                    <div>
                                                        <p>{item.comment.substring(0, 180)}...</p>
                                                        <button
                                                            onClick={() => setExpandedFeedbackId(item._id)}
                                                            className="text-emerald-600 hover:text-emerald-700 font-semibold mt-1 inline-block"
                                                        >
                                                            Read more
                                                        </button>
                                                    </div>
                                                )}
                                                {isExpanded && item.comment.length > 180 && (
                                                    <button
                                                        onClick={() => setExpandedFeedbackId(null)}
                                                        className="text-emerald-600 hover:text-emerald-700 font-semibold mt-1 inline-block"
                                                    >
                                                        Show less
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                        <span>Secure feedback ledger</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {isLocked ? (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                                <Lock className="w-3.5 h-3.5" /> Locked Period
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" /> Active Period
                            </span>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}