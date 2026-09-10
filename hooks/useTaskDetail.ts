"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import type { Task } from "@/types/tasks";

export function useTaskDetail() {
    const { id } = useParams();
    const [task, setTask] = useState<Task | null>(null);
    const [subTasks, setSubTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasSubmittedEvidence, setHasSubmittedEvidence] = useState(false);

    const fetchTask = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/tasks/${id}`);
            const taskData = response.data?.success
                ? response.data.data
                : response.data?.task ?? response.data;

            if (!taskData?._id) throw new Error("Invalid task data received");

            const formattedTask: Task = {
                ...taskData,
                priority: taskData.priority || "normal",
                status: taskData.status || "pending",
                title: taskData.title || "Untitled Task",
                description: taskData.description || "",
                estimatedHours: taskData.estimatedHours || 0,
                assignedTo:
                    taskData.assignedTo || {
                        _id: "",
                        fullName: "Unassigned",
                        email: "",
                    },
                assignedBy:
                    taskData.assignedBy || { _id: "", fullName: "Unknown" },
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
                isMilestone: taskData.isMilestone || false,
                parentTaskId: taskData.parentTaskId || null,
                subTaskCount: taskData.subTaskCount || 0,
                completedSubTaskCount: taskData.completedSubTaskCount || 0,
                progress: taskData.progress || 0,
                dependencies: taskData.dependencies || [],
            };

            setTask(formattedTask);

            if (taskData.evidenceUrls?.length > 0) setHasSubmittedEvidence(true);

            // ✅ Narrow optional fields before use
            const subTaskCount = formattedTask.subTaskCount ?? 0;
            const isMilestone = formattedTask.isMilestone ?? false;

            // Fetch sub-tasks
            if (subTaskCount > 0 && !isMilestone) {
                try {
                    const subResponse = await api.get(
                        `/tasks/${formattedTask._id}/subtasks`
                    );
                    if (subResponse.data.success) {
                        setSubTasks(subResponse.data.data || []);
                    } else {
                        // Reset subTaskCount to 0 on the task so we don't try again
                        setTask((prev) =>
                            prev ? { ...prev, subTaskCount: 0 } : null
                        );
                        setSubTasks([]);
                    }
                } catch (subError: any) {
                    if (subError.response?.status === 404) {
                        setTask((prev) =>
                            prev ? { ...prev, subTaskCount: 0 } : null
                        );
                    }
                    setSubTasks([]);
                }
            } else {
                setSubTasks([]);
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.message || "Failed to fetch task";
            setError(msg);
            if (err.response?.status !== 403) toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTask();
    }, [fetchTask]);

    return {
        id,
        task,
        subTasks,
        loading,
        error,
        hasSubmittedEvidence,
        setHasSubmittedEvidence,
        refetch: fetchTask,
    };
}