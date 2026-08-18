// hooks/useTaskData.ts
import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { Task, Stats } from "@/types/task";

export const useTaskData = (filter: string, departmentId: string | null, isDepartmentManager: boolean) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        submitted: 0,
        rejected: 0,
    });

    // Use ref to prevent infinite loops
    const isMounted = useRef(true);
    const fetchInProgress = useRef(false);

    const fetchTasks = useCallback(async () => {
        // Prevent multiple simultaneous fetches
        if (fetchInProgress.current) return;

        fetchInProgress.current = true;
        setLoading(true);

        try {
            const params = new URLSearchParams();

            if (filter !== "all") {
                params.append("status", filter);
            }

            if (isDepartmentManager && departmentId) {
                params.append("departmentId", departmentId);
            }

            const queryString = params.toString();
            const url = queryString ? `/tasks?${queryString}` : "/tasks";

            const response = await api.get(url);

            if (response.data.success) {
                if (response.data.stats) {
                    setStats(response.data.stats);
                }

                const tasksWithCounts = await Promise.all(
                    (response.data.data || []).map(async (task: Task) => {
                        try {
                            const [commentsResponse, attachmentsResponse] = await Promise.all([
                                api.get(`/tasks/${task._id}/comments`),
                                api.get(`/tasks/${task._id}/attachments`)
                            ]);

                            return {
                                ...task,
                                comments: commentsResponse.data.data?.length || 0,
                                attachments: attachmentsResponse.data.data?.length || 0,
                                isStarred: false,
                            };
                        } catch (error) {
                            console.error(`Error fetching counts for task ${task._id}:`, error);
                            return {
                                ...task,
                                comments: 0,
                                attachments: 0,
                                isStarred: false,
                            };
                        }
                    })
                );

                if (isMounted.current) {
                    setTasks(tasksWithCounts);
                }
            }
        } catch (error: any) {
            console.error("Error fetching tasks:", error);
            if (isMounted.current) {
                toast.error(error.response?.data?.message || "Failed to fetch tasks");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
            fetchInProgress.current = false;
        }
    }, [filter, departmentId, isDepartmentManager]);

    // Calculate stats whenever tasks change
    useEffect(() => {
        const total = tasks.length;
        const pending = tasks.filter(t => t.status === "pending").length;
        const inProgress = tasks.filter(t => t.status === "in_progress").length;
        const submitted = tasks.filter(t => t.status === "submitted").length;
        const completed = tasks.filter(t => t.status === "completed").length;
        const overdue = tasks.filter(t => t.status === "overdue").length;
        const rejected = tasks.filter(t => t.status === "rejected").length;

        setStats({ total, pending, inProgress, completed, overdue, submitted, rejected });
    }, [tasks]);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return {
        tasks,
        setTasks,
        loading,
        stats,
        fetchTasks,
    };
};