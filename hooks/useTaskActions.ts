// hooks/useTaskActions.ts
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useTimer } from "@/contexts/TimerContext";

export const useTaskActions = (fetchTasks: () => Promise<void>) => {
    const { stopTimerAutomatically, isTimerActiveForTask } = useTimer();

    const [isCompleting, setIsCompleting] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
    const [isReworking, setIsReworking] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(false);

    const isMounted = useRef(true);

    const handleMarkComplete = useCallback(async (taskId: string) => {
        if (isCompleting === taskId) return;
        if (isMounted.current) setIsCompleting(taskId);

        try {
            let actualMinutes = 0;
            if (isTimerActiveForTask(taskId)) {
                const timerResult = await stopTimerAutomatically(taskId);
                if (timerResult.success && timerResult.minutes > 0) {
                    actualMinutes = timerResult.minutes;
                    toast.success(`⏱️ Time tracked: ${timerResult.displayTime}`);
                }
            }

            const response = await api.patch(`/tasks/${taskId}/status`, {
                status: "completed",
                actualMinutes: actualMinutes,
                approvalNote: "Task marked as complete by assignee",
            });

            if (response.data.success) {
                toast.success(`✅ Task marked as complete!`);
                await fetchTasks();
                return true;
            }
        } catch (error: any) {
            console.error("Error marking task complete:", error);
            toast.error(error.response?.data?.message || "Failed to mark task as complete");
        } finally {
            if (isMounted.current) setIsCompleting(null);
        }
        return false;
    }, [isCompleting, isTimerActiveForTask, stopTimerAutomatically, fetchTasks]);

    const handleSubmitForReview = async (taskId: string) => {
        if (isSubmitting === taskId) return;
        setIsSubmitting(taskId);
        try {
            if (isTimerActiveForTask(taskId)) {
                const timerResult = await stopTimerAutomatically(taskId);
                if (timerResult.success && timerResult.minutes > 0) {
                    toast.success(`⏱️ Time tracked: ${timerResult.displayTime}`);
                }
            }

            const response = await api.patch(`/tasks/${taskId}/status`, {
                status: "submitted",
            });

            if (response.data.success) {
                toast.success(`✅ Task submitted for review!`);
                await fetchTasks();
                return true;
            }
        } catch (error: any) {
            console.error("Error submitting task:", error);
            toast.error(error.response?.data?.message || "Failed to submit task");
        } finally {
            setIsSubmitting(null);
        }
        return false;
    };

    const handleSendForRework = async (taskId: string) => {
        if (isReworking === taskId) return;
        if (!confirm("Send this task back for rework?")) return;

        setIsReworking(taskId);
        try {
            const response = await api.patch(`/tasks/${taskId}/status`, {
                status: "pending",
            });

            if (response.data.success) {
                toast.success(`🔄 Task sent back for rework!`);
                await fetchTasks();
                return true;
            }
        } catch (error: any) {
            console.error("Error sending for rework:", error);
            toast.error(error.response?.data?.message || "Failed to send for rework");
        } finally {
            setIsReworking(null);
        }
        return false;
    };

    const handleApprove = async (taskId: string) => {
        setApproving(true);
        try {
            const response = await api.patch(`/tasks/${taskId}/status`, {
                status: "completed",
            });
            if (response.data.success) {
                toast.success("✅ Task approved and completed!");
                await fetchTasks();
                return true;
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to approve task");
        } finally {
            setApproving(false);
        }
        return false;
    };

    const handleReject = async (taskId: string) => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return false;
        }

        setRejecting(true);
        try {
            const response = await api.patch(`/tasks/${taskId}/status`, {
                status: "rejected",
                rejectionReason: rejectionReason.trim(),
            });
            if (response.data.success) {
                toast.success("Task rejected. Feedback sent to assignee");
                setShowRejectModal(false);
                setRejectionReason("");
                await fetchTasks();
                return true;
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to reject task");
        } finally {
            setRejecting(false);
        }
        return false;
    };

    // Cleanup
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);
    
    return {
        isCompleting,
        isSubmitting,
        isReworking,
        updatingStatus,
        approving,
        rejecting,
        rejectionReason,
        showRejectModal,
        setRejectionReason,
        setShowRejectModal,
        setUpdatingStatus,
        handleMarkComplete,
        handleSubmitForReview,
        handleSendForRework,
        handleApprove,
        handleReject,
    };
};