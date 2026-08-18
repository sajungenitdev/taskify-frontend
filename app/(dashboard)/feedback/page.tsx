/**
 * @file FeedbackPage.tsx
 * @description Modern, responsive, and type-safe feedback management page for users and administrators.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Send,
  Star,
  Bug,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Home,
  ThumbsUp,
  Loader2,
  X,
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import api from "@/lib/axios";

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
}

interface AdminReply {
  message: string;
  repliedBy: {
    fullName: string;
  };
  repliedAt: string;
  isPublic: boolean;
}

interface Feedback {
  _id: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  rating?: number;
  votes: number;
  hasVoted?: boolean;
  createdAt: string;
  user: UserProfile;
  adminReply?: AdminReply;
}

interface FeedbackFormData {
  category: string;
  subject: string;
  message: string;
  priority: string;
  rating: number;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ==========================================
// CONSTANTS
// ==========================================

const CATEGORIES = [
  { value: "bug", label: "🐛 Bug Report", icon: Bug },
  { value: "feature", label: "✨ Feature Request", icon: Lightbulb },
  { value: "improvement", label: "📈 Improvement", icon: TrendingUp },
  { value: "praise", label: "🌟 Praise", icon: Star },
  { value: "general", label: "📝 General", icon: MessageSquare },
  { value: "issue", label: "⚠️ Issue", icon: AlertCircle },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
  duplicate: "bg-purple-50 text-purple-700 border-purple-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  interactive?: boolean;
  size?: number;
}

const StarRating = ({
  rating,
  onChange,
  interactive = false,
  size = 20,
}: StarRatingProps) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= rating;
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              size={size}
              className={`${
                isFilled ? "fill-amber-400 text-amber-400" : "text-gray-300"
              } transition-colors`}
            />
          </button>
        ) : (
          <Star
            key={star}
            size={size}
            className={`${
              isFilled ? "fill-amber-400 text-amber-400" : "text-gray-200"
            } transition-colors`}
          />
        );
      })}
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function FeedbackPage() {
  const { hasRole } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  // Form State
  const [formData, setFormData] = useState<FeedbackFormData>({
    category: "general",
    subject: "",
    message: "",
    priority: "medium",
    rating: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter & Search State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = hasRole(["admin", "super_admin", "hr_manager", "dept_manager"]);

  /**
   * Fetch feedback items based on user privileges
   */
  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/feedback" : "/feedback/my";
      const response = await api.get(endpoint);
      if (response.data.success) {
        setFeedbackList(response.data.data || []);
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  /**
   * Handle new feedback submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/feedback", formData);
      if (response.data.success) {
        toast.success("Thank you for your feedback! 🎉");
        setShowForm(false);
        resetForm();
        fetchFeedback();
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle or submit an upvote on specific feedback
   */
  const handleVote = async (feedbackId: string) => {
    try {
      const response = await api.post(`/feedback/${feedbackId}/vote`);
      if (response.data.success) {
        setFeedbackList((prev) =>
          prev.map((item) =>
            item._id === feedbackId
              ? {
                  ...item,
                  votes: response.data.data.votes,
                  hasVoted: response.data.data.hasVoted,
                }
              : item
          )
        );
      }
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Failed to vote");
    }
  };

  const resetForm = () => {
    setFormData({
      category: "general",
      subject: "",
      message: "",
      priority: "medium",
      rating: 0,
    });
  };

  /**
   * Filtered list based on search, status, and category selections
   */
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter((item) => {
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;
      const matchesSearch =
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [feedbackList, filterStatus, filterCategory, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryIcon = (categoryVal: string) => {
    const found = CATEGORIES.find((c) => c.value === categoryVal);
    return found?.icon || MessageSquare;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">
          
          {/* Breadcrumb Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-gray-500"
          >
            <Link
              href="/dashboard"
              className="hover:text-amber-600 transition flex items-center gap-1.5 font-medium"
            >
              <Home size={15} />
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-800 font-semibold">Feedback</span>
          </motion.div>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20 text-white">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Feedback Portal
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                    {feedbackList.length} Total
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">
                  Share ideas, report bugs, or track your submitted inquiries.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition shadow-md shadow-amber-500/20 active:scale-98"
            >
              <Plus size={18} />
              New Feedback
            </button>
          </motion.div>

          {/* Filters & Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs"
          >
            <div className="flex-1 relative min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-amber-500 focus:bg-white outline-none transition cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="duplicate">Duplicate</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-amber-500 focus:bg-white outline-none transition cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterCategory("all");
              }}
              title="Reset Filters"
              className="p-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl transition"
            >
              <X size={16} />
            </button>
            <button
              onClick={fetchFeedback}
              title="Refresh Data"
              className="p-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl transition"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </motion.div>

          {/* Feedback Feed / List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-xs"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No Feedback Found
              </h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                  ? "No feedback matches your selected search criteria or filter options."
                  : "You haven't submitted any feedback yet. Start the conversation!"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((item, index) => {
                const Icon = getCategoryIcon(item.category);
                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedFeedback(item)}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md hover:border-amber-200/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-amber-600 group-hover:scale-105 transition-transform">
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition text-base">
                              {item.subject}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span
                                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                                  STATUS_COLORS[item.status] || STATUS_COLORS.pending
                                }`}
                              >
                                {item.status.replace("_", " ")}
                              </span>
                              <span
                                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                                  PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium
                                }`}
                              >
                                {item.priority} priority
                              </span>
                              <span className="text-xs text-gray-400">
                                • {formatDate(item.createdAt)}
                              </span>
                              {item.user?.fullName && (
                                <span className="text-xs text-gray-400">
                                  by {item.user.fullName}
                                </span>
                              )}
                              {item.rating ? (
                                <StarRating rating={item.rating} size={13} />
                              ) : null}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVote(item._id);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                              item.hasVoted
                                ? "bg-amber-50 border-amber-300 text-amber-700"
                                : "bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50/50"
                            }`}
                          >
                            <ThumbsUp
                              size={13}
                              className={item.hasVoted ? "fill-amber-500" : ""}
                            />
                            <span>{item.votes || 0}</span>
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mt-3 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        {item.adminReply && (
                          <div className="mt-3 p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5">
                            <CheckCircle size={15} className="text-blue-600 mt-0.5 shrink-0" />
                            <div className="text-xs">
                              <span className="font-semibold text-blue-900">
                                Admin Response ({item.adminReply.repliedBy?.fullName || "Support"}):
                              </span>
                              <p className="text-blue-800 mt-0.5">{item.adminReply.message}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Create Feedback</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Let us know how we can enhance your experience.</p>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-medium transition border text-left ${
                          formData.category === cat.value
                            ? "border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-100 shadow-xs"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition"
                    placeholder="Brief summary..."
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition resize-none"
                    placeholder="Provide detailed explanation..."
                    maxLength={5000}
                    required
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>Minimum 10 characters</span>
                    <span>{formData.message.length}/5000</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-amber-500 focus:bg-white outline-none transition"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Rating (Optional)
                    </label>
                    <div className="pt-2">
                      <StarRating
                        rating={formData.rating}
                        onChange={(rating) => setFormData({ ...formData, rating })}
                        interactive={true}
                        size={24}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details / Read Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                    {(() => {
                      const Icon = getCategoryIcon(selectedFeedback.category);
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">
                      {selectedFeedback.subject}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submitted on {formatDate(selectedFeedback.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      STATUS_COLORS[selectedFeedback.status] || STATUS_COLORS.pending
                    }`}
                  >
                    Status: {selectedFeedback.status.replace("_", " ")}
                  </span>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${
                      PRIORITY_COLORS[selectedFeedback.priority] || PRIORITY_COLORS.medium
                    }`}
                  >
                    Priority: {selectedFeedback.priority}
                  </span>
                  {selectedFeedback.rating ? (
                    <div className="ml-auto">
                      <StarRating rating={selectedFeedback.rating} size={15} />
                    </div>
                  ) : null}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    {selectedFeedback.message}
                  </p>
                </div>

                {selectedFeedback.adminReply && (
                  <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100">
                    <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <CheckCircle size={15} />
                      Admin Response
                    </h4>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {selectedFeedback.adminReply.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      — {selectedFeedback.adminReply.repliedBy?.fullName || "Support Agent"} •{" "}
                      {formatDate(selectedFeedback.adminReply.repliedAt)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-500">
                  <span>Author: <strong className="text-gray-800">{selectedFeedback.user?.fullName || "Anonymous"}</strong></span>
                  <button
                    onClick={() => handleVote(selectedFeedback._id)}
                    className="flex items-center gap-1.5 font-medium px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-amber-50 hover:border-amber-200 transition"
                  >
                    <ThumbsUp
                      size={14}
                      className={selectedFeedback.hasVoted ? "fill-amber-500 text-amber-500" : ""}
                    />
                    <span>{selectedFeedback.votes || 0} Votes</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition mt-2"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}