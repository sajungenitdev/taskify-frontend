// app/(dashboard)/tasks/[id]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
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
  Link2,
  Copy,
  Check,
  Printer,
  Share2,
  Users,
  TimerIcon,
  History,
  MessageCircle,
  Video,
  Music,
  AlertTriangle as AlertTriangleIcon,
  Pause,
  Square,
  Text,
  CheckCircle,
  CalendarClock,
  Save,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
  rejectionReason?: string;
  approvalNote?: string;
  evidenceRequired?: boolean;
  evidenceSubmitted?: boolean;
  evidenceSubmittedAt?: string;
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

interface ExtensionRequest {
  _id: string;
  requestedDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: { _id: string; fullName: string };
  createdAt: string;
}

// Rejection Reason Modal Component
function RejectionReasonModal({
  isOpen,
  onClose,
  rejectionReason,
  onRework,
}: {
  isOpen: boolean;
  onClose: () => void;
  rejectionReason: string;
  onRework: () => void;
}) {
  if (!isOpen) return null;

  return (
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
  );
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Use global timer context
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
    formatTimeShort,
    getDisplayTimeForTask,
    isTimerActiveForTask,
    isTimerRunning,
    activeTimerTaskId,
    syncTimerWithBackend,
  } = useTimer();

  // State
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittingForReview, setSubmittingForReview] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
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
  const [isStoppingTimer, setIsStoppingTimer] = useState(false);
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

  // Approval/Rejection note state
  const [approvalNote, setApprovalNote] = useState("");
  const [showApprovalNoteModal, setShowApprovalNoteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false);

  // Evidence submission state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [hasSubmittedEvidence, setHasSubmittedEvidence] = useState(false);

  // Extension Request state
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionData, setExtensionData] = useState({
    requestedDate: "",
    reason: "",
  });
  const [submittingExtension, setSubmittingExtension] = useState(false);
  const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);

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
  const canRequestExtension =
    isAssignee && task?.status !== "completed" && task?.status !== "submitted";

  // Helper Functions
  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return <ImageIcon size={20} />;
    if (mimeType === "application/pdf") return <FileText size={20} />;
    if (mimeType?.startsWith("video/")) return <Video size={20} />;
    if (mimeType?.startsWith("audio/")) return <Music size={20} />;
    if (mimeType === "application/zip" || mimeType?.includes("zip")) return <File size={20} />;
    return <File size={20} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Check if evidence is provided
  const hasEvidence = () => {
    return (
      (task?.evidenceUrls && task.evidenceUrls.length > 0) ||
      attachments.length > 0 ||
      hasSubmittedEvidence
    );
  };

  // In TaskDetailPage.tsx - Updated getTotalTime

  const getTotalTime = useCallback(() => {
    if (!task) return { minutes: 0, display: "0m" };

    // ✅ If timer is active and running, show task time + current session time
    if (isTimerActiveForTask(task._id) && isTimerRunning) {
      const currentSeconds = timerState.elapsedSeconds;
      const currentMinutes = currentSeconds / 60;
      const totalMinutes = (task.actualMinutes || 0) + currentMinutes;
      return {
        minutes: totalMinutes,
        display: formatTimeShort(totalMinutes * 60),
      };
    }

    // ✅ If timer is paused but active, show task time only (the paused time is already saved)
    if (isTimerActiveForTask(task._id) && !isTimerRunning) {
      // The timer is paused, but the elapsed time is not yet saved
      // We should show task time + paused time
      const currentSeconds = timerState.elapsedSeconds;
      const currentMinutes = currentSeconds / 60;
      const totalMinutes = (task.actualMinutes || 0) + currentMinutes;
      return {
        minutes: totalMinutes,
        display: formatTimeShort(totalMinutes * 60),
      };
    }

    // ✅ If timer is not active, show only the task's saved time
    return {
      minutes: task.actualMinutes || 0,
      display: formatTimeShort((task.actualMinutes || 0) * 60),
    };
  }, [task, timerState.elapsedSeconds, isTimerActiveForTask, isTimerRunning, formatTimeShort]);

  // ✅ Keep ONLY this version
  const totalTime = useMemo(() => getTotalTime(), [getTotalTime]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);



  // Fetch Task - with better error handling
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
          rejectionReason: taskData.rejectionReason || "",
          approvalNote: taskData.approvalNote || "",
          evidenceRequired: taskData.evidenceRequired || false,
          evidenceUrls: taskData.evidenceUrls || [],
          evidenceSubmitted: taskData.evidenceSubmitted || false,
          evidenceSubmittedAt: taskData.evidenceSubmittedAt || "",
        };

        setTask(formattedTask);

        if (taskData.evidenceUrls && taskData.evidenceUrls.length > 0) {
          setHasSubmittedEvidence(true);
        }
      } else {
        throw new Error("Invalid task data received");
      }
    } catch (error: any) {
      console.error("Error fetching task:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch task";
      setError(errorMessage);

      // Don't show toast for 403 (handled by the parent)
      if (error.response?.status !== 403) {
        toast.error(errorMessage);
      }

      if (error.response?.status === 404) {
        setTimeout(() => router.push("/tasks/task-board"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };
  // Replace the problematic useEffect with this:

  useEffect(() => {
    // ✅ Only check if task is completed/submitted on mount
    if (task && isTimerActiveForTask(task._id)) {
      if (task.status === "completed" || task.status === "submitted") {
        console.log("⚠️ Timer active but task is completed/submitted, resetting");
        stopTimer(task._id).then(() => {
          console.log("✅ Timer reset due to task status");
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Empty dependency array

  // Fetch Extension Requests - with proper 403 handling

  const fetchExtensionRequests = async () => {
    try {
      const response = await api.get(`/tasks/${id}/extension-requests`);
      if (response.data.success) {
        setExtensionRequests(response.data.data || []);
      } else {
        setExtensionRequests([]);
      }
    } catch (error: any) {
      // Handle 403 gracefully - user doesn't have permission
      if (error.response?.status === 403) {
        console.log("⚠️ User doesn't have permission to view extension requests");
        setExtensionRequests([]);
        return;
      }
      console.error("Error fetching extension requests:", error);
      // Don't show toast for 403 errors
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.message || "Failed to fetch extension requests");
      }
      setExtensionRequests([]);
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
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
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
      const response = await api.post(`/tasks/${id}/comments/${commentId}/like`);
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
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await api.get(`/tasks/${id}/attachments/${attachment._id}/download`, {
        responseType: "blob",
      });

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
      const response = await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
      if (response.data.success) {
        toast.success("Attachment deleted successfully");
        fetchAttachments();
        fetchTask();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete attachment");
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

  // In TaskDetailPage.tsx - Fixed updateTaskStatus

  const updateTaskStatus = async (newStatus: string, data?: any) => {
    setUpdating(true);
    try {
      // ✅ If status is changing to submitted or completed, stop timer
      if ((newStatus === "submitted" || newStatus === "completed") && task) {
        // Check if timer is active for this task
        const isActive = isTimerActiveForTask(task._id);
        console.log(`🔍 Timer active for task ${task._id}:`, isActive);
        console.log(`🔍 isTimerRunning:`, isTimerRunning);
        console.log(`🔍 activeTimerTaskId:`, activeTimerTaskId);

        if (isActive) {
          const result = await stopTimer(task._id);
          console.log(`⏹️ Timer stop result:`, result);
          if (result.success && result.minutes > 0) {
            toast.success(`⏱️ Time tracked: ${result.displayTime}`);
          }
          // Update actualMinutes in the payload
          data = { ...data, actualMinutes: result.minutes || task.actualMinutes || 0 };
        } else if (activeTimerTaskId === task._id) {
          // Fallback: stop using activeTimerTaskId
          const result = await stopTimer(task._id);
          if (result.success && result.minutes > 0) {
            toast.success(`⏱️ Time tracked: ${result.displayTime}`);
          }
          data = { ...data, actualMinutes: result.minutes || task.actualMinutes || 0 };
        }
      }

      const payload = { status: newStatus, ...data };
      const response = await api.patch(`/tasks/${id}/status`, payload);

      if (response.data.success) {
        const statusMessages: Record<string, string> = {
          in_progress: "🚀 Task started! Moving to In Progress",
          submitted: "📤 Task submitted for review!",
          pending: "🔄 Task sent back for rework",
          completed: "🎉 Task completed! Great job!",
          rejected: "❌ Task rejected",
        };
        toast.success(statusMessages[newStatus] || "Task status updated");

        // ✅ Force refresh task data
        await fetchTask();

        // ✅ Also refresh timer state from context
        // The stopTimer should already reset the timer state
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Mark Complete
  // In TaskDetailPage - Updated handleMarkComplete

  const handleMarkComplete = async () => {
    if (!task) return;

    // ✅ Stop timer first if running
    if (isTimerActiveForTask(task._id)) {
      const result = await stopTimer(task._id);
      if (result.success && result.minutes > 0) {
        toast.success(`⏱️ Time tracked: ${result.displayTime}`);
      }
    }

    if (task.evidenceRequired && !hasEvidence()) {
      toast.error("Please upload evidence before marking as complete");
      return;
    }

    if (!confirm("Are you sure you want to mark this task as complete?")) {
      return;
    }

    setUpdating(true);
    try {
      let actualMinutes = task.actualMinutes || 0;
      if (isTimerActiveForTask(task._id)) {
        const timerResult = await stopTimer(task._id);
        if (timerResult.success && timerResult.minutes > 0) {
          actualMinutes = timerResult.minutes;
        }
      }

      const response = await api.patch(`/tasks/${id}/status`, {
        status: "completed",
        actualMinutes: actualMinutes,
        approvalNote: "Task marked as complete by assignee",
      });

      if (response.data.success) {
        toast.success(`✅ Task marked as complete!`);
        await fetchTask();
      }
    } catch (error: any) {
      console.error("Error marking task complete:", error);
      toast.error(error.response?.data?.message || "Failed to mark task as complete");
    } finally {
      setUpdating(false);
    }
  };

  // Time Extension
  const handleRequestExtension = async () => {
    if (!extensionData.requestedDate) {
      toast.error("Please select a new deadline");
      return;
    }

    if (!extensionData.reason.trim()) {
      toast.error("Please provide a reason for extension");
      return;
    }

    setSubmittingExtension(true);
    try {
      const response = await api.post(`/tasks/${id}/request-extension`, {
        requestedDate: extensionData.requestedDate,
        reason: extensionData.reason.trim(),
      });

      if (response.data.success) {
        toast.success("Extension request submitted successfully!");
        setShowExtensionModal(false);
        setExtensionData({
          requestedDate: "",
          reason: "",
        });
        fetchExtensionRequests();
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error requesting extension:", error);
      toast.error(error.response?.data?.message || "Failed to request extension");
    } finally {
      setSubmittingExtension(false);
    }
  };

  // Approve Extension
  const handleApproveExtension = async (extensionId: string, newDeadline: string) => {
    if (!confirm("Approve this extension request?")) return;

    try {
      const response = await api.post(`/tasks/${id}/approve-extension/${extensionId}`, {
        newDeadline: newDeadline,
      });

      if (response.data.success) {
        toast.success("Extension approved successfully!");
        fetchExtensionRequests();
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error approving extension:", error);
      toast.error(error.response?.data?.message || "Failed to approve extension");
    }
  };

  // Submit for Review
  const handleSubmitForReview = () => {
    if (task?.evidenceRequired && !hasEvidence()) {
      toast.error("Please upload evidence before submitting for review");
      return;
    }

    // ✅ If there's an active timer, show info message
    if (isTimerActiveForTask(task!._id) && isTimerRunning) {
      toast.error("⏹️ Timer will be stopped before submission");
    }

    setShowEvidenceModal(true);
  };

  // In TaskDetailPage - Updated handleSubmitWithEvidence

  const handleSubmitWithEvidence = async () => {
    if (!evidenceText.trim()) {
      toast.error("Please provide evidence details");
      return;
    }

    setSubmittingEvidence(true);
    try {
      const evidenceUrls = evidenceText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (evidenceUrls.length === 0) {
        toast.error("Please provide at least one evidence item");
        setSubmittingEvidence(false);
        return;
      }

      // ✅ STOP THE TIMER FIRST if it's running
      let actualMinutes = task?.actualMinutes || 0;
      if (isTimerActiveForTask(task!._id)) {
        const timerResult = await stopTimer(task!._id);
        if (timerResult.success && timerResult.minutes > 0) {
          toast.success(`⏱️ Time tracked: ${timerResult.displayTime}`);
          actualMinutes = timerResult.minutes;
        }
      }

      const response = await api.patch(`/tasks/${id}/status`, {
        status: "submitted",
        evidenceUrls: evidenceUrls,
        actualMinutes: actualMinutes,
      });

      if (response.data.success) {
        toast.success("✅ Task submitted with evidence!");
        setShowEvidenceModal(false);
        setEvidenceText("");
        setHasSubmittedEvidence(true);

        // ✅ Refetch task to get updated data
        await fetchTask();
        await fetchAttachments();
      } else {
        throw new Error("Failed to submit task");
      }
    } catch (error: any) {
      console.error("Error submitting evidence:", error);
      toast.error(error.response?.data?.message || "Failed to submit evidence");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  // Approval/Rejection
  const openApprovalNoteModal = (action: "approve" | "reject") => {
    setPendingAction(action);
    setApprovalNote("");
    setShowApprovalNoteModal(true);
  };

  const handleApproveWithNote = async () => {
    if (!approvalNote.trim()) {
      toast.error("Please provide feedback for approval");
      return;
    }

    setUpdating(true);
    try {
      const response = await api.patch(`/tasks/${id}/status`, {
        status: "completed",
        approvalNote: approvalNote.trim(),
      });
      if (response.data.success) {
        toast.success("✅ Task approved and completed!");
        setShowApprovalNoteModal(false);
        setApprovalNote("");
        setPendingAction(null);
        fetchTask();
        setShowReviewModal(true);
      }
    } catch (error: any) {
      console.error("Error approving task:", error);
      toast.error(error.response?.data?.message || "Failed to approve task");
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectWithNote = async () => {
    if (!approvalNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setRejecting(true);
    try {
      const response = await api.patch(`/tasks/${id}/status`, {
        status: "rejected",
        rejectionReason: approvalNote.trim(),
      });
      if (response.data.success) {
        toast.success("❌ Task rejected. Feedback sent to assignee");
        setShowApprovalNoteModal(false);
        setApprovalNote("");
        setPendingAction(null);
        fetchTask();
      }
    } catch (error: any) {
      console.error("Error rejecting task:", error);
      toast.error(error.response?.data?.message || "Failed to reject task");
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      if (response.data.success) {
        toast.success("Task deleted successfully");
        router.push("/tasks/task-board");
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handleStartTimer = async () => {
    if (!task) {
      toast.error("Task not found");
      return;
    }

    console.log("🔍 Starting timer - Task:", task._id);
    console.log("👤 User ID:", user?._id);
    console.log("📋 Assigned To:", task.assignedTo?._id);
    console.log("📋 isAssignee:", isAssignee);

    // Check if user is the assignee
    if (!isAssignee && !canManage) {
      toast.error("You don't have permission to start timer for this task");
      return;
    }

    // If there's an active timer on another task, stop it first
    if (activeTimerTaskId && activeTimerTaskId !== task._id) {
      try {
        await stopTimer(activeTimerTaskId);
      } catch (error) {
        console.error("Error stopping other timer:", error);
      }
    }

    const baselineSeconds = (task.actualMinutes || 0) * 60;

    try {
      // Start the timer
      startTimer(task._id, baselineSeconds);

      // Show success message immediately
      toast.success(`⏱️ Timer started for "${task.title}"`);

      // Refresh task after a short delay
      setTimeout(() => {
        fetchTask();
      }, 500);

    } catch (error: any) {
      console.error("Error starting timer:", error);
      toast.error(error?.message || "Failed to start timer");
    }
  };

  const handlePauseTimer = () => {
    if (!task) {
      toast.error("Task not found");
      return;
    }

    if (!isAssignee && !canManage) {
      toast.error("You don't have permission to pause timer for this task");
      return;
    }

    try {
      pauseTimer();
      toast.success("⏸️ Timer paused");
      setTimeout(() => fetchTask(), 300);
    } catch (error: any) {
      console.error("Error pausing timer:", error);
      toast.error(error?.message || "Failed to pause timer");
    }
  };

  const handleResumeTimer = () => {
    if (!task) {
      toast.error("Task not found");
      return;
    }

    if (!isAssignee && !canManage) {
      toast.error("You don't have permission to resume timer for this task");
      return;
    }

    try {
      resumeTimer();
      toast.success("▶️ Timer resumed");
    } catch (error: any) {
      console.error("Error resuming timer:", error);
      toast.error(error?.message || "Failed to resume timer");
    }
  };

  // In TaskDetailPage - Updated handleStopTimer

  const handleStopTimer = async () => {
    if (!task) {
      toast.error("Task not found");
      return;
    }

    if (!isAssignee && !canManage) {
      toast.error("You don't have permission to stop timer for this task");
      return;
    }

    if (activeTimerTaskId !== task._id) {
      toast.error("Timer is not active for this task");
      return;
    }

    setIsStoppingTimer(true);

    try {
      const result = await stopTimer(task._id);

      if (result.success) {
        const trackedMinutes = result.minutes;
        const displayTime = result.displayTime;

        if (trackedMinutes > 0) {
          toast.success(`⏱️ Time tracked: ${displayTime}`);
        } else {
          toast.success("⏱️ Timer stopped.");
        }

        await fetchTask();
      } else {
        toast.error("Timer was not active. Please try again.");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to stop timer. Please try again.");
    } finally {
      setIsStoppingTimer(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: task?.title,
          text: `Check out this task: ${task?.title}`,
          url: window.location.href,
        })
        .catch(() => { });
    } else {
      handleCopyLink();
    }
  };

  useEffect(() => {
    if (isAuthenticated && id) {
      const fetchAllData = async () => {
        try {
          // Fetch task first
          await fetchTask();

          // Always fetch other data after task is fetched
          // Don't check if (task) - just fetch everything
          await Promise.all([
            fetchComments(),
            fetchAttachments(),
            fetchReviews(),
            fetchExtensionRequests().catch(() => {
              // Silently handle 403 for extension requests
              return [];
            })
          ]);
        } catch (error: any) {
          // If task fetch fails with 403, redirect to tasks page
          if (error.response?.status === 403) {
            toast.error("You don't have permission to view this task");
            setTimeout(() => router.push("/tasks/task-board"), 1500);
            return;
          }
          console.error("Error fetching data:", error);
        }
      };

      fetchAllData();
    }
  }, [isAuthenticated, id]); // ✅ Dependencies are correct

  const getPriorityConfig = (priority: string) => {
    const config = {
      low: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🟢", label: "Low" },
      normal: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: "🔵", label: "Normal" },
      high: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: "🟠", label: "High" },
      urgent: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: "🔴", label: "Urgent" },
    };
    return config[priority as keyof typeof config] || config.normal;
  };

  const getStatusConfig = (status: string) => {
    const config = {
      pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳", label: "Pending" },
      in_progress: { color: "bg-sky-50 text-sky-700 border-sky-200", icon: "🔄", label: "In Progress" },
      submitted: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: "📬", label: "Submitted" },
      completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✅", label: "Completed" },
      overdue: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: "⚠️", label: "Overdue" },
      rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: "❌", label: "Rejected" },
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

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "?";
  };

  // Render rejection note
  const renderRejectionNote = () => {
    if (task?.status !== "rejected" || !task?.rejectionReason) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-200 cursor-pointer hover:bg-rose-100 transition"
        onClick={() => setShowRejectionReasonModal(true)}
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
    );
  };

  // Render approval note
  const renderApprovalNote = () => {
    if (task?.status !== "completed" || !task?.approvalNote) return null;

    return (
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
    );
  };

  // Replace the renderExtensionRequests function with this:

  const renderExtensionRequests = () => {
    if (extensionRequests.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-medium text-blue-800">Extension Requests ({extensionRequests.length})</p>
        </div>
        <div className="space-y-3">
          {extensionRequests.map((req) => (
            <div key={req._id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${req.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : req.status === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700 animate-pulse"
                        }`}
                    >
                      {req.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      Requested: {formatDateTime(req.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">
                    New Deadline: {formatDate(req.requestedDate)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg">
                    <span className="text-gray-400 text-xs font-medium">Reason:</span> {req.reason}
                  </p>
                  {req.approvedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Approved by: {req.approvedBy.fullName}
                    </p>
                  )}
                </div>
                {canApprove && req.status === "pending" && (
                  <button
                    onClick={() => handleApproveExtension(req._id, req.requestedDate)}
                    className="ml-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg transition shadow-sm flex items-center gap-1"
                  >
                    <Check size={12} />
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render evidence badge
  const renderEvidenceBadge = () => {
    if (!task?.evidenceRequired) return null;

    const hasEvidence =
      (task.evidenceUrls && task.evidenceUrls.length > 0) ||
      attachments.length > 0 ||
      hasSubmittedEvidence;

    return (
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${hasEvidence
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
      >
        <Paperclip size={12} />
        {hasEvidence ? "Evidence Submitted" : "Evidence Required"}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6 lg:p-8">
          <div className="container mx-auto">
            <Link
              href="/tasks/my"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              Back to Tasks
            </Link>
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
              <p className="text-gray-500 mb-6">
                {error || "The task you're looking for doesn't exist or has been deleted."}
              </p>
              <Link
                href="/tasks/my"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
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

  const isTimerActive = isTimerActiveForTask(task._id);
  const isTimerRunningForTask = isTimerActive && isTimerRunning;
  const displayTime = getDisplayTimeForTask(task._id, task.actualMinutes);
  const timerDisplay = isTimerActive ? timerState.elapsedSeconds : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {/* Back Button & Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between mb-6 flex-wrap gap-3"
          >
            <Link
              href="/tasks/my"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Tasks
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Copy link"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Link2 size={18} />}
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Share"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Print"
              >
                <Printer size={18} />
              </button>
              {canManage && (
                <button
                  onClick={() => router.push(`/tasks/${id}/edit`)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
              )}
              {canManage && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Task Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Header with Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color}`}
                      >
                        {getPriorityConfig(task.priority).icon} {task.priority.toUpperCase()}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color}`}
                      >
                        {getStatusConfig(task.status).icon}{" "}
                        {task.status.replace("_", " ").toUpperCase()}
                      </span>
                      {isOverdue && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          ⚠️ OVERDUE
                        </span>
                      )}
                      {task.averageRating && task.averageRating > 0 && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Star size={12} className="fill-amber-500 text-amber-500" />
                          {task.averageRating.toFixed(1)}
                        </span>
                      )}
                      {renderEvidenceBadge()}
                      {isTimerActive && (
                        <div
                          className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full ${isTimerRunningForTask
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                        >
                          <TimerIcon size={12} />
                          <span>{formatTimeShort(timerDisplay)}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isTimerRunningForTask ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                              }`}
                          />
                        </div>
                      )}
                      {task.actualMinutes && task.actualMinutes > 0 && !isTimerActive && (
                        <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          <History size={12} />
                          <span>{task.actualMinutes}m tracked</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-3">{task.title}</h1>
                  <p className="text-gray-600 leading-relaxed">
                    {task.description || "No description provided."}
                  </p>

                  {/* Rejection Note */}
                  {renderRejectionNote()}

                  {/* Approval Note */}
                  {renderApprovalNote()}

                  {/* Extension Requests */}
                  {renderExtensionRequests()}

                  {/* Task Meta Tags */}
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
                    {task.projectId && task.projectId.name && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Briefcase size={12} />
                        {task.projectId.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Clock size={12} />
                      {task.estimatedHours}h estimated
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <Users size={12} />
                      Assigned to {task.assignedTo?.fullName}
                    </div>
                    {task.createdAt && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Calendar size={12} />
                        Created {formatDate(task.createdAt)}
                      </div>
                    )}
                  </div>

                  {/* Timer Controls */}
                  {task.status !== "completed" && task.status !== "submitted" && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <TimerIcon size={16} className="text-indigo-500" />
                          <span className="text-sm font-medium text-gray-700">Time Tracking</span>
                        </div>
                        {/* Time Tracking section - Update this part */}
                        <div className="flex-1">
                          {isTimerActive ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-mono font-semibold text-indigo-700 tabular-nums">
                                {formatTime(timerState.elapsedSeconds)}
                              </span>
                              <span
                                className={`text-xs font-medium ${isTimerRunningForTask ? "text-emerald-600" : "text-amber-600"
                                  }`}
                              >
                                {isTimerRunningForTask ? "● Running" : "● Paused"}
                              </span>
                              {task.actualMinutes && task.actualMinutes > 0 && (
                                <span className="text-[10px] text-gray-400 ml-2">
                                  (Saved: {task.actualMinutes.toFixed(2)}m)
                                </span>
                              )}
                              {isTimerRunningForTask && (
                                <span className="text-[10px] text-indigo-500 ml-2">
                                  Total: {((task.actualMinutes || 0) + (timerState.elapsedSeconds / 60)).toFixed(2)}m
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              {task.actualMinutes ? `${task.actualMinutes.toFixed(2)}m logged` : "No time tracked"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isTimerActive ? (
                            <>
                              {isTimerRunningForTask ? (
                                <button
                                  onClick={handlePauseTimer}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition flex items-center gap-1 shadow-sm"
                                >
                                  <Pause size={14} />
                                  Pause
                                </button>
                              ) : (
                                <button
                                  onClick={handleResumeTimer}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition flex items-center gap-1 shadow-sm"
                                >
                                  <Play size={14} />
                                  Resume
                                </button>
                              )}
                              <button
                                onClick={handleStopTimer}
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg transition flex items-center gap-1 shadow-sm"
                              >
                                <Square size={14} />
                                Stop
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleStartTimer}
                              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition flex items-center gap-1 shadow-sm"
                              disabled={activeTimerTaskId !== null && activeTimerTaskId !== task._id}
                            >
                              <Play size={14} />
                              Start Timer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Task Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-500" />
                  Task Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Assigned To</p>
                        <p className="text-gray-800 font-medium">
                          {task.assignedTo?.fullName || "Unassigned"}
                        </p>
                        <p className="text-gray-400 text-sm">{task.assignedTo?.email || ""}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Assigned By</p>
                        <p className="text-gray-800 font-medium">
                          {task.assignedBy?.fullName || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Deadline</p>
                        <p className={`font-medium ${isOverdue ? "text-rose-600" : "text-gray-800"}`}>
                          {formatDate(task.deadline)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ClockIcon size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Estimated Hours</p>
                        <p className="text-gray-800 font-medium">{task.estimatedHours} hours</p>
                      </div>
                    </div>
                    {task.projectId && task.projectId.name && (
                      <div className="flex items-start gap-3">
                        <Briefcase size={18} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Project</p>
                          <p className="text-gray-800 font-medium">{task.projectId.name}</p>
                          {task.projectId.code && (
                            <p className="text-gray-400 text-sm">Code: {task.projectId.code}</p>
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
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-gray-800">Comments ({comments.length})</h3>
                  </div>
                  {showComments ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {showComments && (
                  <div className="p-5 pt-0 space-y-5">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-white text-sm font-bold">
                          {getInitials(user?.fullName || "?")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          rows={3}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleAddComment}
                            disabled={submittingComment || !newComment.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                          >
                            {submittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                      {comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No comments yet. Be the first to comment!</div>
                      ) : (
                        comments.map((comment) => (
                          <CommentItem
                            key={comment._id}
                            comment={comment}
                            onCommentUpdate={() => {
                              fetchComments();
                              fetchTask();
                            }}
                          />
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
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                id="attachments-section"
              >
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Attachments ({attachments.length})
                      {task?.evidenceRequired && task?.status === "in_progress" && (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full ml-2">
                          Evidence Required
                        </span>
                      )}
                    </h3>
                  </div>
                  {showAttachments ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {showAttachments && (
                  <div className="p-5 pt-0">
                    {task?.evidenceRequired && task?.status === "in_progress" && (
                      <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Evidence Required</p>
                          <p className="text-xs text-amber-700">
                            Please upload evidence before submitting this task for review or marking as complete.
                          </p>
                        </div>
                      </div>
                    )}

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
                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition bg-gray-50"
                      >
                        {uploadingFiles ? (
                          <Loader2 size={20} className="animate-spin text-indigo-500" />
                        ) : (
                          <>
                            <Upload size={20} className="text-gray-400" />
                            <span className="text-gray-500">
                              {task?.evidenceRequired ? "Upload evidence (Required)" : "Upload files"}
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    {attachments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {task?.evidenceRequired ? "No evidence uploaded yet." : "No attachments yet."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment._id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition group"
                          >
                            {attachment.mimeType?.startsWith("image/") ? (
                              <div
                                className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition overflow-hidden"
                                onClick={() => setSelectedImage(attachment.url)}
                              >
                                {attachment.thumbnailUrl ? (
                                  <img src={attachment.thumbnailUrl} alt={attachment.originalName} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={20} className="text-gray-400" />
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                {getFileIcon(attachment.mimeType)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-800 text-sm font-medium truncate">{attachment.originalName}</p>
                              <p className="text-gray-400 text-xs">{formatFileSize(attachment.size)}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Download"
                              >
                                <Download size={14} />
                              </button>
                              {(canManage || attachment.uploadedBy?._id === user?._id) && (
                                <button
                                  onClick={() => handleDeleteAttachment(attachment._id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  <Trash size={14} />
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
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setShowReviews(!showReviews)}
                    className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-indigo-500" />
                      <h3 className="text-lg font-semibold text-gray-800">Reviews ({reviews.length})</h3>
                      {reviewStats.averageRating > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                          <Star size={14} className="fill-amber-500 text-amber-500" />
                          <span className="text-gray-800 text-sm font-medium">
                            {reviewStats.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    {showReviews ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </button>

                  {showReviews && (
                    <div className="p-5 pt-0 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {reviews.map((review) => (
                        <div key={review._id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-sm font-bold">
                                  {getInitials(review.reviewer?.fullName)}
                                </span>
                              </div>
                              <div>
                                <p className="text-gray-800 font-medium">{review.reviewer?.fullName}</p>
                                <p className="text-gray-400 text-xs">{formatDateTime(review.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                                  />
                                ))}
                              </div>
                              {(canManage || review.reviewer?._id === user?._id) && (
                                <button
                                  onClick={() => handleDeleteReview(review._id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                          {review.response && (
                            <div className="mt-3 pl-4 border-l-2 border-indigo-400">
                              <p className="text-indigo-600 text-xs font-medium">
                                Response from {review.response.respondedBy?.fullName}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">{review.response.content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right Column - Actions & Stats */}
            <div className="space-y-6">
              {/* Actions Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sticky top-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  Actions
                </h3>
                <div className="space-y-3">
                  {task.status === "pending" && (
                    <button
                      onClick={() => updateTaskStatus("in_progress")}
                      disabled={updating}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      {updating ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                      Start Task
                    </button>
                  )}

                  {task.status === "in_progress" && (
                    <>
                      <button
                        onClick={handleMarkComplete}
                        disabled={updating}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Mark Complete
                      </button>
                      <button
                        onClick={handleSubmitForReview}
                        disabled={updating || submittingForReview}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                      >
                        {updating || submittingForReview ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                        Submit for Review
                        {task?.evidenceRequired && (
                          <span className="text-xs bg-purple-400/30 px-2 py-0.5 rounded-full">Evidence Required</span>
                        )}
                      </button>
                    </>
                  )}

                  {canRequestExtension && (
                    <button
                      onClick={() => setShowExtensionModal(true)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CalendarClock size={16} />
                      Request Extension
                    </button>
                  )}

                  {task.status === "submitted" && canApprove && (
                    <>
                      <button
                        onClick={() => openApprovalNoteModal("approve")}
                        disabled={updating}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {updating ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                        Approve & Complete
                      </button>
                      <button
                        onClick={() => openApprovalNoteModal("reject")}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ThumbsDown size={16} />
                        Reject Task
                      </button>
                    </>
                  )}

                  {task.status === "rejected" && (
                    <>
                      <div
                        className="text-center py-3 bg-rose-50 rounded-xl border border-rose-200 cursor-pointer hover:bg-rose-100 transition"
                        onClick={() => setShowRejectionReasonModal(true)}
                      >
                        <p className="text-rose-600 text-sm font-medium">❌ Task Rejected</p>
                        {task.rejectionReason && (
                          <p className="text-rose-500 text-xs mt-1 line-clamp-2 px-2">{task.rejectionReason}</p>
                        )}
                        <p className="text-xs text-rose-400 mt-1">Click to view full reason</p>
                      </div>
                      <button
                        onClick={() => updateTaskStatus("pending")}
                        disabled={updating}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {updating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Send for Rework
                      </button>
                    </>
                  )}

                  {task.status === "submitted" && !canApprove && (
                    <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-gray-500 text-sm">Waiting for approval from manager</p>
                    </div>
                  )}

                  {task.status === "completed" && (
                    <div className="text-center py-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <p className="text-emerald-600 text-sm font-medium">✅ Task Completed</p>
                      {task.approvalNote && (
                        <p className="text-emerald-500 text-xs mt-1 line-clamp-2 px-2">Note: {task.approvalNote}</p>
                      )}
                    </div>
                  )}

                  {canReview && !reviews.some((r) => r.reviewer?._id === user?._id) && task.status === "completed" && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
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
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Created</span>
                    <span className="text-gray-800 text-sm">{formatDateTime(task.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Last Updated</span>
                    <span className="text-gray-800 text-sm">{formatDateTime(task.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Time Tracked</span>
                    <span className="text-gray-800 text-sm font-medium">{totalTime.display}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Comments</span>
                    <span className="text-gray-800 text-sm font-medium">{comments.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Attachments</span>
                    <span className="text-gray-800 text-sm font-medium">{attachments.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">Reviews</span>
                    <span className="text-gray-800 text-sm font-medium">{reviews.length}</span>
                  </div>
                  {reviewStats.averageRating > 0 && (
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-gray-500 text-sm">Avg Rating</span>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-amber-500 text-amber-500" />
                        <span className="text-gray-800 text-sm font-medium">
                          {reviewStats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Timer Status Card */}
              {/* Timer Status Card - Replace the entire card with this */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`bg-linear-to-br from-indigo-50 to-purple-50 rounded-2xl border p-6 shadow-sm ${isTimerRunningForTask ? "border-indigo-300" : "border-gray-200"
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <TimerIcon size={16} className="text-indigo-600" />
                    Timer Status
                  </h3>
                  {isTimerActive && (
                    <span
                      className={`text-xs font-medium ${isTimerRunningForTask ? "text-emerald-600" : "text-amber-600"
                        }`}
                    >
                      {isTimerRunningForTask ? "● Running" : "● Paused"}
                    </span>
                  )}
                </div>

                {/* Timer Status Card */}
                <div className="text-center py-4">
                  {isTimerActive ? (
                    <>
                      <div className="text-3xl font-mono font-bold text-indigo-700 tabular-nums">
                        {formatTime(timerState.elapsedSeconds)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {isTimerRunningForTask ? "Timer is running" : "Timer is paused"}
                        {task.actualMinutes && task.actualMinutes > 0 && (
                          <span className="text-[10px] text-gray-400 ml-2">
                            (Saved: {task.actualMinutes.toFixed(2)}m)
                          </span>
                        )}
                        {/* Show total with current session */}
                        {isTimerRunningForTask && (
                          <span className="text-[10px] text-indigo-500 ml-2">
                            Total: {((task.actualMinutes || 0) + (timerState.elapsedSeconds / 60)).toFixed(2)}m
                          </span>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-mono font-bold text-gray-400">
                        {task.actualMinutes ? formatTime(task.actualMinutes * 60) : "--:--:--"}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {task.actualMinutes ? `${task.actualMinutes.toFixed(2)}m tracked` : "No timer active"}
                      </p>
                    </>
                  )}
                </div>
                {task.actualMinutes && task.actualMinutes > 0 && !isTimerActive && (
                  <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3 mt-2">
                    Total tracked: {task.actualMinutes} minutes
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Extension Request Modal */}
      <AnimatePresence>
        {showExtensionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">📅</span>
                  <h3 className="text-xl font-bold text-gray-900">Request Extension</h3>
                </div>

                {/* Task info subtitle */}
                <p className="text-xs text-gray-500 mb-4">
                  {task.title || "Task"} · Due: {formatDate(task.deadline)}
                  {/* Optional dynamic overdue text if applicable */}
                </p>

                {/* Conditional Overdue Warning Box */}
                {/* You can replace `isOverdue` with your actual logic condition */}
                {isOverdue && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
                    <span className="text-red-500 text-sm mt-0.5">⚠️</span>
                    <p className="text-xs text-red-600 leading-relaxed">
                      This task is overdue. An extension will be logged against your KPI timeliness score.
                    </p>
                  </div>
                )}

                {/* New Requested Deadline */}
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    New Requested Deadline
                  </label>
                  <input
                    type="date"
                    value={extensionData.requestedDate}
                    onChange={(e) =>
                      setExtensionData({
                        ...extensionData,
                        requestedDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm"
                    min={task.deadline || new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Reason for Extension */}
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Reason for Extension <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={extensionData.reason}
                    onChange={(e) =>
                      setExtensionData({
                        ...extensionData,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Explain why you need an extension..."
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExtensionModal(false);
                      setExtensionData({ requestedDate: "", reason: "" });
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition text-sm shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestExtension}
                    disabled={submittingExtension}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 text-sm"
                  >
                    {submittingExtension ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Send Request
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition border border-white/20"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Evidence Submission Modal */}
      <AnimatePresence>
        {showEvidenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Text className="w-5 h-5 text-indigo-500" />
                    Submit Evidence
                  </h2>
                  <p className="text-xs text-gray-500">Evidence is required to submit this task</p>
                </div>
                <button
                  onClick={() => {
                    setShowEvidenceModal(false);
                    setEvidenceText("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Evidence Required</p>
                    <p className="text-xs text-amber-700">
                      Please provide evidence details below. You can add URLs or describe the evidence.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    rows={6}
                    placeholder="Enter evidence details or URLs...\n\nExample:\n- https://drive.google.com/file/evidence1\n- https://docs.google.com/document/evidence2\n- Screenshots attached in comments\n- Source code: https://github.com/..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none text-gray-800 placeholder:text-gray-400 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Enter one URL or detail per line.{" "}
                    {evidenceText.split("\n").filter((l) => l.trim()).length} items added
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSubmitWithEvidence}
                    disabled={submittingEvidence || !evidenceText.trim()}
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingEvidence ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit with Evidence
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setEvidenceText("");
                    }}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Task</h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
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

      {/* Approval/Rejection Note Modal */}
      <AnimatePresence>
        {showApprovalNoteModal && (
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${pendingAction === "approve" ? "bg-emerald-50" : "bg-rose-50"
                      }`}
                  >
                    {pendingAction === "approve" ? (
                      <ThumbsUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ThumbsDown className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {pendingAction === "approve" ? "Approve" : "Reject"} Task
                  </h3>
                </div>

                <p className="text-gray-500 text-sm mb-4">
                  {pendingAction === "approve"
                    ? "Provide feedback for approving this task. This will be sent to the assignee."
                    : "Please provide a reason for rejecting this task. This will be sent to the assignee for rework."}
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {pendingAction === "approve" ? "Approval Note" : "Rejection Reason"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder={
                      pendingAction === "approve" ? "Enter approval feedback..." : "Enter rejection reason..."
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={pendingAction === "approve" ? handleApproveWithNote : handleRejectWithNote}
                    disabled={!approvalNote.trim() || updating || rejecting}
                    className={`flex-1 px-4 py-2.5 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${pendingAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                      }`}
                  >
                    {updating || rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : pendingAction === "approve" ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                    Confirm {pendingAction === "approve" ? "Approval" : "Rejection"}
                  </button>
                  <button
                    onClick={() => {
                      setShowApprovalNoteModal(false);
                      setApprovalNote("");
                      setPendingAction(null);
                    }}
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

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        isOpen={showRejectionReasonModal}
        onClose={() => setShowRejectionReasonModal(false)}
        rejectionReason={task?.rejectionReason || ""}
        onRework={() => {
          setShowRejectionReasonModal(false);
          updateTaskStatus("pending");
        }}
      />

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Leave a Review</h3>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition hover:scale-110"
                      >
                        <Star
                          size={32}
                          className={star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this task..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddReview}
                    disabled={submittingReview}
                    className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star size={14} />}
                    Submit Review
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}

// Comment Item Component
function CommentItem({
  comment,
  depth = 0,
  onCommentUpdate,
}: {
  comment: Comment;
  depth?: number;
  onCommentUpdate: () => void;
}) {
  const { user } = useAuth();
  const { id } = useParams();
  const [showReply, setShowReply] = useState(false);
  const [localReplyContent, setLocalReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const isLiked = comment.likes?.includes(user?._id || "");

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await api.post(`/tasks/${id}/comments/${commentId}/like`);
      if (response.data.success) {
        onCommentUpdate();
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
        onCommentUpdate();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete comment");
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
        onCommentUpdate();
      }
    } catch (error: any) {
      console.error("Error updating comment:", error);
      toast.error(error.response?.data?.message || "Failed to update comment");
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

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "?";
  };

  const canManage = user?.role === "admin" || user?.role === "super_admin" || user?.role === "hr_manager";

  return (
    <div className={`${depth > 0 ? "ml-8 mt-3" : "mb-4"}`}>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">{getInitials(comment.author?.fullName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
              <div>
                <span className="text-gray-800 text-sm font-medium">{comment.author?.fullName}</span>
                <span className="text-gray-400 text-xs ml-2">{formatDateTime(comment.createdAt)}</span>
                {comment.isEdited && <span className="text-gray-400 text-xs ml-2">(edited)</span>}
              </div>
              {(comment.author?._id === user?._id || canManage) && (
                <div className="flex items-center gap-1">
                  {comment.author?._id === user?._id && (
                    <button
                      onClick={() => {
                        setEditingComment(comment._id);
                        setEditContent(comment.content);
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleUpdateComment(comment._id)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition shadow-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent("");
                    }}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 text-sm">{comment.content}</p>
            )}

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLikeComment(comment._id)}
                className={`flex items-center gap-1 text-xs transition ${isLiked ? "text-indigo-600" : "text-gray-400 hover:text-indigo-600"
                  }`}
              >
                <ThumbsUp size={12} />
                {comment.likes?.length || 0} Likes
              </button>
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition"
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
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
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
                    onCommentUpdate();
                  }
                } catch (error: any) {
                  toast.error(error.response?.data?.message || "Failed to add reply");
                }
              }}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              onCommentUpdate={onCommentUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}