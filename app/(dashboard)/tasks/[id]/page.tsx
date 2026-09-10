"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertCircle, Link2, Copy, Check, Share2,
  Printer, Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import DependencyEditor from "@/components/tasks/DependencyEditor";
import { useComments } from "@/hooks/useComments";
import { useAttachments } from "@/hooks/useAttachments";
import { useReviews } from "@/hooks/useReviews";
import { useExtensionRequests } from "@/hooks/useExtensionRequests";
import { useTaskTime } from "@/hooks/useTaskTime"; // 👈 NEW
import { TaskHeader } from "@/components/tasks/TaskHeader";
import { NotesSection } from "@/components/tasks/NotesSection";
import { SubTasksList } from "@/components/tasks/SubTasksList";
import { TaskActions } from "@/components/tasks/TaskActions";
import { TaskHistoryCard } from "@/components/tasks/TaskHistoryCard";
import { TaskTimerCard } from "@/components/tasks/TaskTimerCard";
import { CommentsSection } from "@/components/tasks/CommentsSection";
import { ReviewsSection } from "@/components/tasks/ReviewsSection";
import { EvidenceModal } from "@/components/modals/EvidenceModal";
import { ExtensionModal } from "@/components/tasks/ExtensionRequestModal";
import { ApprovalNoteModal } from "@/components/modals/ApprovalNoteModal";
import { RejectionReasonModal } from "@/components/modals/RejectionReasonModal";
import { ReviewModal } from "@/components/modals/ReviewModal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { useTaskDetail } from "@/hooks/useTaskDetail";


export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const timer = useTimer();

  const { task, subTasks, loading, error, hasSubmittedEvidence, setHasSubmittedEvidence, refetch } = useTaskDetail();
  const { comments, refetch: refetchComments } = useComments(id as string);
  const { attachments, refetch: refetchAttachments } = useAttachments(id as string);
  const { reviews, stats: reviewStats, refetch: refetchReviews } = useReviews(id as string);
  const { extensionRequests, refetch: refetchExtensions } = useExtensionRequests(id as string);

  // 👈 NEW: persisted time from the backend
  const { persistedSeconds, refetch: refetchSavedTime } = useTaskTime(id as string);

  const [updating, setUpdating] = useState(false);
  const [submittingForReview, setSubmittingForReview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDependencyEditor, setShowDependencyEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);

  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  const userRole = user?.role;
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const isHrManager = userRole === "hr_manager";
  const canManage = isSuperAdmin || isAdmin || isHrManager;
  const canApprove =
    canManage ||
    userRole === "dept_manager" ||
    userRole === "project_manager" ||
    userRole === "line_manager";
  const isAssignee = task?.assignedTo?._id === user?._id;
  const canReview = task?.status === "completed" && (isAssignee || canManage);

  const isTimerActive = task ? timer.isTimerActiveForTask(task._id) : false;
  const isTimerRunningForTask = isTimerActive && timer.isTimerRunning;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && id) {
      refetch();
      refetchComments();
      refetchAttachments();
      refetchReviews();
      refetchExtensions();
      refetchSavedTime();
    }
  }, [
    isAuthenticated,
    id,
    refetch,
    refetchComments,
    refetchAttachments,
    refetchReviews,
    refetchExtensions,
    refetchSavedTime,
  ]);

  useEffect(() => {
    if (task && timer.isTimerActiveForTask(task._id) && (task.status === "completed" || task.status === "submitted")) {
      timer.stopTimer(task._id).then(() => refetchSavedTime());
    }
  }, [task, timer, refetchSavedTime]);

  const hasEvidence = () =>
    (task?.evidenceUrls && task.evidenceUrls.length > 0) ||
    attachments.length > 0 ||
    hasSubmittedEvidence;

  const handleUpdateStatus = async (newStatus: string, data?: any) => {
    setUpdating(true);
    try {
      if ((newStatus === "submitted" || newStatus === "completed") && task && timer.isTimerActiveForTask(task._id)) {
        const result = await timer.stopTimer(task._id);
        if (result.success && result.minutes > 0) {
          toast.success(`⏱️ Time tracked: ${result.displayTime}`);
        }
        data = { ...data, actualMinutes: result.minutes || task.actualMinutes || 0 };
      }
      const response = await api.patch(`/tasks/${id}/status`, { status: newStatus, ...data });
      if (response.data.success) {
        toast.success("Task status updated");
        await refetch();
        await refetchSavedTime();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitForReview = () => {
    if (!task) return;
    setShowEvidenceModal(true);
  };

  const handleSubmitWithEvidence = async () => {
    if (!task) return;
    setSubmittingEvidence(true);
    try {
      let actualMinutes = task.actualMinutes || 0;
      if (timer.isTimerActiveForTask(task._id)) {
        const r = await timer.stopTimer(task._id);
        if (r.success && r.minutes > 0) actualMinutes = r.minutes;
      }

      const evidenceUrls = evidenceText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (evidenceUrls.length === 0 && attachments.length === 0) {
        toast.error("Please provide evidence or upload files");
        setSubmittingEvidence(false);
        return;
      }

      const finalEvidenceUrls = [...evidenceUrls, ...attachments.map((a) => a.url).filter(Boolean)];

      await api.patch(`/tasks/${id}/status`, {
        status: "submitted",
        evidenceUrls: finalEvidenceUrls,
        actualMinutes,
      });

      toast.success("✅ Task submitted with evidence!");
      setShowEvidenceModal(false);
      setEvidenceText("");
      setHasSubmittedEvidence(true);
      await refetch();
      await refetchAttachments();
      await refetchSavedTime();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit evidence");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleApprove = async (note: string) => {
    setUpdating(true);
    try {
      await api.patch(`/tasks/${id}/status`, { status: "completed", approvalNote: note });
      toast.success("Task approved");
      setApprovalAction(null);
      await refetch();
      setShowReviewModal(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async (note: string) => {
    setUpdating(true);
    try {
      await api.patch(`/tasks/${id}/status`, { status: "rejected", rejectionReason: note });
      toast.success("Task rejected");
      setApprovalAction(null);
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted");
      router.push("/tasks/task-board");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => window.print();
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: task?.title, url: window.location.href }).catch(() => { });
    } else handleCopyLink();
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <Link href="/tasks/my" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6">
            <ArrowLeft size={18} /> Back to Tasks
          </Link>
          <div className="bg-white rounded-2xl border p-12 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
            <p className="text-gray-500 mb-6">{error || "This task doesn't exist."}</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX: total seconds = persisted + live session
  const liveSessionSeconds = isTimerActive ? timer.timerState.elapsedSeconds : 0;
  const totalUsedSeconds = persistedSeconds + liveSessionSeconds;

  const timerDisplay = liveSessionSeconds;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <Link href="/tasks/my" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
              <ArrowLeft size={18} /> Back to Tasks
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowDependencyEditor(true)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Dependencies">
                <Link2 size={18} />
              </button>
              <button onClick={handleCopyLink} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Copy link">
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
              <button onClick={handleShare} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Share">
                <Share2 size={18} />
              </button>
              <button onClick={handlePrint} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Print">
                <Printer size={18} />
              </button>
              {canManage && (
                <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            <TaskHeader task={task} attachments={attachments} hasSubmittedEvidence={hasSubmittedEvidence} />

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <div className="overflow-hidden">
                    {isTimerActive && (
                      <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full border ${isTimerRunningForTask ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        ⏱ {timer.formatTimeShort(totalUsedSeconds)}
                      </div>
                    )}

                    <NotesSection
                      task={task}
                      extensionRequests={extensionRequests}
                      canApprove={canApprove}
                      onShowRejection={() => setShowRejectionModal(true)}
                      onApproveExtension={async (extId, date) => {
                        if (!confirm("Approve this extension?")) return;
                        try {
                          await api.post(`/tasks/${id}/approve-extension/${extId}`, { newDeadline: date });
                          toast.success("Extension approved");
                          await refetch();
                          await refetchExtensions();
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || "Failed");
                        }
                      }}
                    />

                    <div className="p-5 pt-0 ps-0">
                      <span className="text-gray-500 text-[12px]">Description</span>
                      <p className="text-black leading-relaxed">{task.description || "No description provided."}</p>
                    </div>

                    <SubTasksList subTasks={subTasks} />
                  </div>
                </div>

                <div>
                  <div className="space-y-6">
                    <TaskActions
                      task={task}
                      user={user}
                      updating={updating}
                      submittingForReview={submittingForReview}
                      isTimerActive={isTimerActive}
                      isTimerRunningForTask={isTimerRunningForTask}
                      isTimerActiveForTask={timer.isTimerActiveForTask}
                      activeTimerTaskId={timer.activeTimerTaskId}
                      canReview={canApprove}
                      reviews={reviews}
                      onUpdateStatus={handleUpdateStatus}
                      onStartTimer={() => timer.startTimer(task._id)}
                      onResumeTimer={() => timer.resumeTimer()}
                      onPauseTimer={async () => {
                        timer.pauseTimer();
                        await refetch();
                      }}
                      // ✅ FIX: refetch persisted time after stop
                      onStopTimer={async () => {
                        await timer.stopTimer(task._id);
                        await refetch();
                        await refetchSavedTime();
                      }}
                      onSubmitForReview={handleSubmitForReview}
                      onOpenDependencyEditor={() => setShowDependencyEditor(true)}
                      onOpenExtensionModal={() => setShowExtensionModal(true)}
                      onOpenApprovalModal={setApprovalAction}
                      onOpenReviewModal={() => setShowReviewModal(true)}
                    />

                    <TaskHistoryCard
                      task={task}
                      isTimerActive={isTimerActive}
                      isTimerRunningForTask={isTimerRunningForTask}
                      formatTimeShort={timer.formatTimeShort}
                      timerSeconds={totalUsedSeconds}
                      formatTime={timer.formatTime}
                    />

                    <TaskTimerCard
                      task={task}
                      isTimerActive={isTimerActive}
                      isTimerRunningForTask={isTimerRunningForTask}
                      timerSeconds={totalUsedSeconds}
                      formatTime={timer.formatTime}
                    />
                  </div>
                </div>
              </div>

              <CommentsSection
                taskId={task._id}
                comments={comments}
                onCommentUpdate={() => {
                  refetchComments();
                  refetch();
                }}
              />

              <ReviewsSection
                reviews={reviews}
                reviewStats={reviewStats}
                currentUserId={user?._id}
                canManage={canManage}
                onDelete={async (rid) => {
                  if (!confirm("Delete this review?")) return;
                  await api.delete(`/tasks/${id}/reviews/${rid}`);
                  await refetchReviews();
                  await refetch();
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DependencyEditor
        taskId={task._id}
        isOpen={showDependencyEditor}
        onClose={() => {
          setShowDependencyEditor(false);
          refetch();
        }}
        onDependencyUpdated={() => {
          refetch();
          setShowDependencyEditor(false);
        }}
      />

      <EvidenceModal
        isOpen={showEvidenceModal}
        evidenceText={evidenceText}
        submitting={submittingEvidence}
        onClose={() => {
          setShowEvidenceModal(false);
          setEvidenceText("");
        }}
        onTextChange={setEvidenceText}
        onSubmit={handleSubmitWithEvidence}
      />

      <ExtensionModal
        isOpen={showExtensionModal}
        task={task}
        onClose={() => setShowExtensionModal(false)}
        onSubmitted={() => {
          refetchExtensions();
          refetch();
        }}
      />

      <ApprovalNoteModal
        action={approvalAction}
        isOpen={approvalAction !== null}
        loading={updating}
        onClose={() => setApprovalAction(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <RejectionReasonModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        rejectionReason={task.rejectionReason || ""}
        onRework={() => {
          setShowRejectionModal(false);
          handleUpdateStatus("pending");
        }}
      />

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmitted={() => {
          refetchReviews();
          refetch();
        }}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}