"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  Briefcase,
  Send,
  Play,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
  MessageSquare,
  Paperclip,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  Zap,
  Clock as ClockIcon,
  Image as ImageIcon,
  FileText,
  Download,
  X,
  Star,
  Upload,
  File,
  Trash,
  ChevronDown,
  ChevronUp,
  Award,
  Info,
  Reply,
  MoreVertical,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Types
interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "pending"
    | "in_progress"
    | "submitted"
    | "completed"
    | "overdue"
    | "rejected";
  deadline: string;
  estimatedHours: number;
  actualMinutes?: number;
  assignedTo: { _id: string; fullName: string; email: string; avatar?: string };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  evidenceUrls?: string[];
  commentsCount?: number;
  attachmentsCount?: number;
  reviewsCount?: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; fullName: string; email: string; avatar?: string };
  parentCommentId?: string | null;
  replies?: Comment[];
  likes: string[];
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: { _id: string; fullName: string; email: string };
  createdAt: string;
}

interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewer: { _id: string; fullName: string; email: string; avatar?: string };
  response?: {
    content: string;
    respondedBy: { _id: string; fullName: string };
    respondedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // UI state
  const [showComments, setShowComments] = useState(true);
  const [showAttachments, setShowAttachments] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const userRole = user?.role;
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const isHrManager = userRole === "hr_manager";
  const canManage = isSuperAdmin || isAdmin || isHrManager;
  const canApprove =
    isSuperAdmin ||
    isAdmin ||
    isHrManager ||
    userRole === "dept_manager" ||
    userRole === "project_manager" ||
    userRole === "line_manager";
  const isAssignee = task?.assignedTo?._id === user?._id;
  const canReview = task?.status === "completed" && (isAssignee || canManage);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchTask();
      fetchComments();
      fetchAttachments();
      fetchReviews();
    }
  }, [isAuthenticated, id]);

  // Fetch Task
  const fetchTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/tasks/${id}`);

      let taskData;
      if (response.data.success) {
        taskData = response.data.data;
      } else if (response.data.task) {
        taskData = response.data.task;
      } else {
        taskData = response.data;
      }

      if (taskData && taskData._id) {
        const formattedTask = {
          ...taskData,
          priority: taskData.priority || "normal",
          status: taskData.status || "pending",
          title: taskData.title || "Untitled Task",
          description: taskData.description || "",
          estimatedHours: taskData.estimatedHours || 0,
          assignedTo: taskData.assignedTo || {
            _id: "",
            fullName: "Unassigned",
            email: "",
          },
          assignedBy: taskData.assignedBy || { _id: "", fullName: "Unknown" },
          createdAt: taskData.createdAt || new Date().toISOString(),
          updatedAt: taskData.updatedAt || new Date().toISOString(),
          commentsCount: taskData.commentsCount || 0,
          attachmentsCount: taskData.attachmentsCount || 0,
          reviewsCount: taskData.reviewsCount || 0,
          averageRating: taskData.averageRating || 0,
        };
        setTask(formattedTask);
      } else {
        throw new Error("Invalid task data received");
      }
    } catch (error: any) {
      console.error("Error fetching task:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch task";
      setError(errorMessage);
      toast.error(errorMessage);

      if (error.response?.status === 404) {
        setTimeout(() => router.push("/tasks"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Comments API
  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${id}/comments`);
      if (response.data.success) {
        setComments(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await api.post(`/tasks/${id}/comments`, {
        content: newComment,
      });

      if (response.data.success) {
        toast.success("Comment added successfully");
        setNewComment("");
        fetchComments();
        fetchTask(); // Update task to refresh comment count
      }
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      const response = await api.post(`/tasks/${id}/comments`, {
        content: replyContent,
        parentCommentId: commentId,
      });

      if (response.data.success) {
        toast.success("Reply added successfully");
        setReplyContent("");
        setReplyingTo(null);
        fetchComments();
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error adding reply:", error);
      toast.error(error.response?.data?.message || "Failed to add reply");
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error("Please enter content");
      return;
    }

    try {
      const response = await api.put(`/tasks/${id}/comments/${commentId}`, {
        content: editContent,
      });

      if (response.data.success) {
        toast.success("Comment updated successfully");
        setEditingComment(null);
        setEditContent("");
        fetchComments();
      }
    } catch (error: any) {
      console.error("Error updating comment:", error);
      toast.error(error.response?.data?.message || "Failed to update comment");
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await api.post(
        `/tasks/${id}/comments/${commentId}/like`,
      );
      if (response.data.success) {
        fetchComments();
      }
    } catch (error: any) {
      console.error("Error liking comment:", error);
      toast.error(error.response?.data?.message || "Failed to like comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await api.delete(`/tasks/${id}/comments/${commentId}`);
      if (response.data.success) {
        toast.success("Comment deleted successfully");
        fetchComments();
        fetchTask();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete comment");
    }
  };

  // Attachments API
  const fetchAttachments = async () => {
    try {
      const response = await api.get(`/tasks/${id}/attachments`);
      if (response.data.success) {
        setAttachments(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
      toast.error("Failed to load attachments");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("attachments", files[i]);
    }

    try {
      const response = await api.post(`/tasks/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success(`${files.length} file(s) uploaded successfully`);
        fetchAttachments();
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error(error.response?.data?.message || "Failed to upload files");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const response = await api.get(
        `/tasks/${id}/attachments/${attachment._id}/download`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", attachment.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error: any) {
      console.error("Error downloading attachment:", error);
      toast.error(error.response?.data?.message || "Failed to download file");
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      const response = await api.delete(
        `/tasks/${id}/attachments/${attachmentId}`,
      );
      if (response.data.success) {
        toast.success("Attachment deleted successfully");
        fetchAttachments();
        fetchTask();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete attachment",
      );
    }
  };

  // Reviews API
  const fetchReviews = async () => {
    try {
      const response = await api.get(`/tasks/${id}/reviews`);
      if (response.data.success) {
        setReviews(response.data.data || []);
        if (response.data.stats) {
          setReviewStats(response.data.stats);
        }
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleAddReview = async () => {
    if (!reviewComment.trim()) {
      toast.error("Please enter a review comment");
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await api.post(`/tasks/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });

      if (response.data.success) {
        toast.success("Review submitted successfully");
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewComment("");
        fetchReviews();
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await api.delete(`/tasks/${id}/reviews/${reviewId}`);
      if (response.data.success) {
        toast.success("Review deleted successfully");
        fetchReviews();
        fetchTask();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  // Task Status Updates
  const updateTaskStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await api.patch(`/tasks/${id}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        const statusMessages: Record<string, string> = {
          in_progress: "🚀 Task started! Moving to In Progress",
          submitted: "📤 Task submitted for review!",
          pending: "🔄 Task sent back for rework",
          completed: "🎉 Task completed! Great job!",
          rejected: "❌ Task rejected",
        };
        toast.success(statusMessages[newStatus] || "Task status updated");
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update status",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    setUpdating(true);
    try {
      const response = await api.patch(`/tasks/${id}/status`, {
        status: "completed",
      });
      if (response.data.success) {
        toast.success("✅ Task approved and completed!");
        fetchTask();
        setShowReviewModal(true);
      }
    } catch (error: any) {
      console.error("Error approving task:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve task",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setRejecting(true);
    try {
      const response = await api.patch(`/tasks/${id}/status`, {
        status: "rejected",
        rejectionReason,
      });
      if (response.data.success) {
        toast.success("Task rejected. Feedback sent to assignee");
        setShowRejectModal(false);
        setRejectionReason("");
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error rejecting task:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject task",
      );
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      if (response.data.success) {
        toast.success("Task deleted successfully");
        router.push("/tasks");
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete task",
      );
    }
  };

  // Helper Functions
  const getPriorityConfig = (priority: string) => {
    const config = {
      low: {
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "🟢",
        label: "Low",
      },
      normal: {
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        icon: "🔵",
        label: "Normal",
      },
      high: {
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: "🟠",
        label: "High",
      },
      urgent: {
        color: "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse",
        icon: "🔴",
        label: "Urgent",
      },
    };
    return config[priority as keyof typeof config] || config.normal;
  };

  const getStatusConfig = (status: string) => {
    const config = {
      pending: {
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: "⏳",
        label: "Pending",
      },
      in_progress: {
        color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        icon: "🔄",
        label: "In Progress",
      },
      submitted: {
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        icon: "📬",
        label: "Submitted",
      },
      completed: {
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "✅",
        label: "Completed",
      },
      overdue: {
        color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: "⚠️",
        label: "Overdue",
      },
      rejected: {
        color: "bg-red-500/10 text-red-400 border-red-500/20",
        icon: "❌",
        label: "Rejected",
      },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date set";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "No date set";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return <ImageIcon size={20} />;
    if (mimeType === "application/pdf") return <FileText size={20} />;
    return <File size={20} />;
  };

  // Render Comment Component
  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) => {
    const [showReply, setShowReply] = useState(false);
    const [localReplyContent, setLocalReplyContent] = useState("");
    const isLiked = comment.likes?.includes(user?._id || "");

    return (
      <div className={`${depth > 0 ? "ml-8 mt-3" : "mb-4"}`}>
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {comment.author?.fullName?.charAt(0) || "?"}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-white text-sm font-medium">
                    {comment.author?.fullName}
                  </span>
                  <span className="text-slate-500 text-xs ml-2">
                    {formatDateTime(comment.createdAt)}
                  </span>
                  {comment.isEdited && (
                    <span className="text-slate-500 text-xs ml-2">
                      (edited)
                    </span>
                  )}
                </div>
                {(comment.author?._id === user?._id || canManage) && (
                  <div className="flex items-center gap-1">
                    {comment.author?._id === user?._id && (
                      <button
                        onClick={() => {
                          setEditingComment(comment._id);
                          setEditContent(comment.content);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-400 transition"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {editingComment === comment._id ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateComment(comment._id)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingComment(null);
                        setEditContent("");
                      }}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-300 text-sm">{comment.content}</p>
              )}

              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => handleLikeComment(comment._id)}
                  className={`flex items-center gap-1 text-xs transition ${
                    isLiked
                      ? "text-indigo-400"
                      : "text-slate-500 hover:text-indigo-400"
                  }`}
                >
                  <ThumbsUp size={12} />
                  {comment.likes?.length || 0} Likes
                </button>
                <button
                  onClick={() => setShowReply(!showReply)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition"
                >
                  <Reply size={12} />
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>

        {showReply && (
          <div className="mt-2 ml-8">
            <div className="flex gap-2">
              <textarea
                value={localReplyContent}
                onChange={(e) => setLocalReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-indigo-500 outline-none resize-none"
              />
              <button
                onClick={async () => {
                  if (!localReplyContent.trim()) return;
                  try {
                    const response = await api.post(`/tasks/${id}/comments`, {
                      content: localReplyContent,
                      parentCommentId: comment._id,
                    });
                    if (response.data.success) {
                      toast.success("Reply added successfully");
                      setLocalReplyContent("");
                      setShowReply(false);
                      fetchComments();
                      fetchTask();
                    }
                  } catch (error: any) {
                    toast.error(
                      error.response?.data?.message || "Failed to add reply",
                    );
                  }
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="p-6 lg:p-8">
          <div className="container mx-auto">
            <Link
              href="/tasks/my"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              Back to Tasks
            </Link>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 p-12 text-center">
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-rose-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Task Not Found
              </h2>
              <p className="text-slate-400 mb-6">
                {error ||
                  "The task you're looking for doesn't exist or has been deleted."}
              </p>
              <Link
                href="/tasks/my"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                <ArrowLeft size={16} />
                Return to Tasks
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "completed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-6 lg:p-8">
        <div className="container mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Tasks
            </Link>
          </motion.div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Task Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getPriorityConfig(task.priority).color}`}
                      >
                        {getPriorityConfig(task.priority).icon}{" "}
                        {task.priority.toUpperCase()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusConfig(task.status).color}`}
                      >
                        {getStatusConfig(task.status).icon}{" "}
                        {task.status.replace("_", " ").toUpperCase()}
                      </span>
                      {isOverdue && (
                        <span className="text-xs px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          ⚠️ OVERDUE
                        </span>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/tasks/${id}/edit`)}
                          className="p-2 text-slate-400 hover:text-blue-400 transition rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-2 text-slate-400 hover:text-rose-400 transition rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
                    {task.title}
                  </h1>
                  <p className="text-slate-300 leading-relaxed">
                    {task.description || "No description provided."}
                  </p>
                </div>
              </motion.div>

              {/* Task Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/30 rounded-2xl border border-slate-700 p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-400" />
                  Task Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Assigned To
                        </p>
                        <p className="text-white font-medium">
                          {task.assignedTo?.fullName || "Unassigned"}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {task.assignedTo?.email || ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Assigned By
                        </p>
                        <p className="text-white font-medium">
                          {task.assignedBy?.fullName || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Deadline</p>
                        <p
                          className={`font-medium ${isOverdue ? "text-rose-400" : "text-white"}`}
                        >
                          {formatDate(task.deadline)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ClockIcon size={18} className="text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Estimated Hours
                        </p>
                        <p className="text-white font-medium">
                          {task.estimatedHours} hours
                        </p>
                      </div>
                    </div>
                    {task.projectId && task.projectId.name && (
                      <div className="flex items-start gap-3">
                        <Briefcase
                          size={18}
                          className="text-slate-500 mt-0.5"
                        />
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Project</p>
                          <p className="text-white font-medium">
                            {task.projectId.name}
                          </p>
                          {task.projectId.code && (
                            <p className="text-slate-500 text-sm">
                              Code: {task.projectId.code}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Comments Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Comments ({comments.length})
                    </h3>
                  </div>
                  {showComments ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {showComments && (
                  <div className="p-5 pt-0 space-y-5">
                    {/* Add Comment */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {user?.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          rows={3}
                          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 outline-none resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleAddComment}
                            disabled={submittingComment || !newComment.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                          >
                            {submittingComment ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          No comments yet. Be the first to comment!
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <CommentItem key={comment._id} comment={comment} />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Attachments Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Attachments ({attachments.length})
                    </h3>
                  </div>
                  {showAttachments ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </button>

                {showAttachments && (
                  <div className="p-5 pt-0">
                    {/* Upload Area */}
                    <div className="mb-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 transition bg-slate-900/30"
                      >
                        {uploadingFiles ? (
                          <Loader2
                            size={20}
                            className="animate-spin text-indigo-400"
                          />
                        ) : (
                          <>
                            <Upload size={20} className="text-slate-400" />
                            <span className="text-slate-400">
                              Click to upload files
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Attachments List */}
                    {attachments.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No attachments yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment._id}
                            className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-indigo-500 transition"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {attachment.mimeType?.startsWith("image/") ? (
                                <div
                                  className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center cursor-pointer hover:opacity-80 transition"
                                  onClick={() =>
                                    setSelectedImage(attachment.url)
                                  }
                                >
                                  <ImageIcon
                                    size={20}
                                    className="text-slate-400"
                                  />
                                </div>
                              ) : (
                                getFileIcon(attachment.mimeType)
                              )}
                              <div className="flex-1">
                                <p className="text-white text-sm">
                                  {attachment.originalName}
                                </p>
                                <p className="text-slate-500 text-xs">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleDownloadAttachment(attachment)
                                }
                                className="p-2 text-slate-400 hover:text-indigo-400 transition"
                                title="Download"
                              >
                                <Download size={16} />
                              </button>
                              {(canManage ||
                                attachment.uploadedBy?._id === user?._id) && (
                                <button
                                  onClick={() =>
                                    handleDeleteAttachment(attachment._id)
                                  }
                                  className="p-2 text-slate-400 hover:text-rose-400 transition"
                                  title="Delete"
                                >
                                  <Trash size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Reviews Section */}
              {reviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden"
                >
                  <button
                    onClick={() => setShowReviews(!showReviews)}
                    className="w-full p-5 flex items-center justify-between hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-lg font-semibold text-white">
                        Reviews ({reviews.length})
                      </h3>
                      {reviewStats.averageRating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white text-sm">
                            {reviewStats.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    {showReviews ? (
                      <ChevronUp size={20} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400" />
                    )}
                  </button>

                  {showReviews && (
                    <div className="p-5 pt-0 space-y-4 max-h-[400px] overflow-y-auto">
                      {reviews.map((review) => (
                        <div
                          key={review._id}
                          className="bg-slate-900 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {review.reviewer?.fullName?.charAt(0) || "?"}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {review.reviewer?.fullName}
                                </p>
                                <p className="text-slate-500 text-xs">
                                  {formatDateTime(review.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-slate-600"
                                    }
                                  />
                                ))}
                              </div>
                              {(canManage ||
                                review.reviewer?._id === user?._id) && (
                                <button
                                  onClick={() => handleDeleteReview(review._id)}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-300 text-sm">
                            {review.comment}
                          </p>
                          {review.response && (
                            <div className="mt-3 pl-4 border-l-2 border-indigo-500">
                              <p className="text-indigo-400 text-xs font-medium">
                                Response from{" "}
                                {review.response.respondedBy?.fullName}
                              </p>
                              <p className="text-slate-400 text-sm mt-1">
                                {review.response.content}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 rounded-2xl border border-indigo-500/20 p-6 sticky top-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  Actions
                </h3>
                <div className="space-y-3">
                  {task.status === "pending" && (
                    <button
                      onClick={() => updateTaskStatus("in_progress")}
                      disabled={updating}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {updating ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Play size={16} />
                      )}
                      Start Task
                    </button>
                  )}

                  {task.status === "in_progress" && (
                    <button
                      onClick={() => updateTaskStatus("submitted")}
                      disabled={updating}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {updating ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      Submit for Review
                    </button>
                  )}

                  {task.status === "submitted" && canApprove && (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={updating}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center justify-center gap-2"
                      >
                        {updating ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ThumbsUp size={16} />
                        )}
                        Approve & Complete
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <ThumbsDown size={16} />
                        Reject Task
                      </button>
                    </>
                  )}

                  {task.status === "rejected" && (
                    <button
                      onClick={() => updateTaskStatus("pending")}
                      disabled={updating}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {updating ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Send for Rework
                    </button>
                  )}

                  {task.status === "submitted" && !canApprove && (
                    <div className="text-center py-4 bg-slate-800/50 rounded-xl">
                      <p className="text-slate-400 text-sm">
                        Waiting for approval from manager
                      </p>
                    </div>
                  )}

                  {(task.status === "completed" ||
                    task.status === "rejected") && (
                    <div className="text-center py-4 bg-slate-800/50 rounded-xl">
                      <p className="text-slate-400 text-sm">
                        {task.status === "completed"
                          ? "✅ Task Completed"
                          : "❌ Task Rejected"}
                      </p>
                    </div>
                  )}

                  {canReview &&
                    !reviews.some((r) => r.reviewer?._id === user?._id) && (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <Star size={16} />
                        Leave a Review
                      </button>
                    )}
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/30 rounded-2xl border border-slate-700 p-6"
              >
                <h3 className="text-sm font-semibold text-white mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Created</span>
                    <span className="text-white text-sm">
                      {formatDateTime(task.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Last Updated</span>
                    <span className="text-white text-sm">
                      {formatDateTime(task.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Comments</span>
                    <span className="text-white text-sm">
                      {comments.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Attachments</span>
                    <span className="text-white text-sm">
                      {attachments.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Reviews</span>
                    <span className="text-white text-sm">{reviews.length}</span>
                  </div>
                  {reviewStats.averageRating > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Avg Rating</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white text-sm">
                          {reviewStats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={`https://taskify-server-5gat.onrender.com${selectedImage}`}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition"
            >
              <X size={24} />
            </button>
            https://taskify-server-5gat.onrender.com{selectedImage}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Task</h3>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Reject Task</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Please provide a reason for rejecting this task.
              </p>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  {rejecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ThumbsDown size={14} />
                  )}
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Leave a Review</h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={
                          star <= reviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-600"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Comment
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this task..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddReview}
                  disabled={submittingReview}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  {submittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star size={14} />
                  )}
                  Submit Review
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
