// hooks/useExtensionRequests.ts
import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { ExtensionRequest } from "@/types/task";

export const useExtensionRequests = (
    fetchTasks: () => Promise<void>,
    canManageExtensions: boolean
) => {
    const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);
    const [myExtensionRequests, setMyExtensionRequests] = useState<ExtensionRequest[]>([]);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [selectedTaskForExtension, setSelectedTaskForExtension] = useState<any>(null);
    const [extensionData, setExtensionData] = useState({
        requestedDate: "",
        reason: "",
    });
    const [submittingExtension, setSubmittingExtension] = useState(false);
    const [loadingExtensions, setLoadingExtensions] = useState(false);
    const [approvingExtension, setApprovingExtension] = useState<string | null>(null);

    const isMounted = useRef(true);

    const fetchMyExtensionRequests = useCallback(async (user: any) => {
        try {
            const allRequests: ExtensionRequest[] = [];
            const tasksResponse = await api.get("/tasks");
            if (tasksResponse.data.success) {
                const tasks = tasksResponse.data.data || [];
                for (const task of tasks) {
                    try {
                        const response = await api.get(`/tasks/${task._id}/extension-requests`);
                        if (response.data.success && response.data.data) {
                            const requests = response.data.data.map((req: any) => ({
                                ...req,
                                task: {
                                    _id: task._id,
                                    title: task.title,
                                    priority: task.priority,
                                    status: task.status,
                                    deadline: task.deadline,
                                    assignedTo: task.assignedTo,
                                }
                            }));
                            allRequests.push(...requests);
                        }
                    } catch (err) {
                        continue;
                    }
                }
            }

            const userId = user?._id || (user as any)?.id;
            const myRequests = allRequests.filter(req =>
                req.task && (req.task as any).assignedTo?._id === userId
            );

            if (isMounted.current) {
                setMyExtensionRequests(myRequests);
            }
        } catch (error: any) {
            console.error("Error fetching my extension requests:", error);
            if (isMounted.current) {
                setMyExtensionRequests([]);
            }
        }
    }, []);

    const fetchAllExtensionRequests = useCallback(async () => {
        if (!canManageExtensions) {
            if (isMounted.current) setExtensionRequests([]);
            return;
        }

        if (isMounted.current) setLoadingExtensions(true);
        try {
            const tasksResponse = await api.get("/tasks");
            if (tasksResponse.data.success) {
                const tasks = tasksResponse.data.data || [];
                const allRequests: ExtensionRequest[] = [];

                for (const task of tasks) {
                    try {
                        const response = await api.get(`/tasks/${task._id}/extension-requests`);
                        if (response.data.success && response.data.data) {
                            const requests = response.data.data.map((req: any) => ({
                                ...req,
                                task: {
                                    _id: task._id,
                                    title: task.title,
                                    priority: task.priority,
                                    status: task.status,
                                    deadline: task.deadline,
                                    assignedTo: task.assignedTo,
                                }
                            }));
                            allRequests.push(...requests);
                        }
                    } catch (err) {
                        continue;
                    }
                }

                if (isMounted.current) {
                    setExtensionRequests(allRequests);
                }
            } else {
                if (isMounted.current) setExtensionRequests([]);
            }
        } catch (error: any) {
            console.error("Error fetching extension requests:", error);
            if (isMounted.current) setExtensionRequests([]);
        } finally {
            if (isMounted.current) setLoadingExtensions(false);
        }
    }, [canManageExtensions]);

    const handleRequestExtension = useCallback(async (selectedTaskForExtension: any) => {
        if (!extensionData.requestedDate) {
            toast.error("Please select a new deadline");
            return false;
        }

        if (!extensionData.reason.trim()) {
            toast.error("Please provide a reason for extension");
            return false;
        }

        if (!selectedTaskForExtension) return false;

        if (isMounted.current) setSubmittingExtension(true);
        try {
            const response = await api.post(`/tasks/${selectedTaskForExtension._id}/request-extension`, {
                requestedDate: extensionData.requestedDate,
                reason: extensionData.reason.trim(),
            });

            if (response.data.success) {
                toast.success("✅ Extension request submitted successfully!");
                if (isMounted.current) {
                    setShowExtensionModal(false);
                    setExtensionData({ requestedDate: "", reason: "" });
                }
                await fetchTasks();
                return true;
            }
        } catch (error: any) {
            console.error("Error requesting extension:", error);
            toast.error(error.response?.data?.message || "Failed to request extension");
        } finally {
            if (isMounted.current) setSubmittingExtension(false);
        }
        return false;
    }, [extensionData, fetchTasks]);

    const updateExtensionStatus = useCallback((extensionId: string, status: "approved" | "rejected") => {
        if (isMounted.current) {
            setExtensionRequests(prev =>
                prev.map(req =>
                    req._id === extensionId ? { ...req, status: status } : req
                )
            );
            setMyExtensionRequests(prev =>
                prev.map(req =>
                    req._id === extensionId ? { ...req, status: status } : req
                )
            );
        }
    }, []);

    const handleApproveExtension = useCallback(async (extensionId: string, taskId: string, newDeadline: string) => {
        if (!confirm("Approve this extension request?")) return;

        if (isMounted.current) setApprovingExtension(extensionId);
        try {
            const extension = extensionRequests.find(req => req._id === extensionId) ||
                myExtensionRequests.find(req => req._id === extensionId);

            const actualTaskId = extension?.taskId || taskId;

            if (!actualTaskId) {
                toast.error("Could not find task ID for this extension request");
                if (isMounted.current) setApprovingExtension(null);
                return;
            }

            try {
                const response = await api.post(`/tasks/${actualTaskId}/approve-extension/${extensionId}`, {
                    newDeadline: newDeadline,
                });

                if (response.data.success) {
                    toast.success("✅ Extension approved successfully!");
                    updateExtensionStatus(extensionId, "approved");
                    await fetchTasks();
                    return;
                }
            } catch (primaryError: any) {
                console.warn("Primary approve endpoint failed:", primaryError);
            }

            try {
                const response = await api.patch(`/tasks/extension-requests/${extensionId}/approve`, {
                    newDeadline: newDeadline,
                    taskId: actualTaskId,
                });

                if (response.data.success) {
                    toast.success("✅ Extension approved successfully!");
                    updateExtensionStatus(extensionId, "approved");
                    await fetchTasks();
                    return;
                }
            } catch (altError: any) {
                console.warn("Alternative approve endpoint failed:", altError);
            }

            toast.error("Could not approve extension. Please try again.");
        } catch (error: any) {
            console.error("Error approving extension:", error);
            toast.error(error.response?.data?.message || "Failed to approve extension. Please try again.");
        } finally {
            if (isMounted.current) setApprovingExtension(null);
        }
    }, [extensionRequests, myExtensionRequests, updateExtensionStatus, fetchTasks]);

    const handleRejectExtension = useCallback(async (extensionId: string) => {
        if (!confirm("Reject this extension request?")) return;

        if (isMounted.current) setApprovingExtension(extensionId);
        try {
            const extension = extensionRequests.find(req => req._id === extensionId) ||
                myExtensionRequests.find(req => req._id === extensionId);

            const actualTaskId = extension?.taskId;

            if (!actualTaskId) {
                toast.error("Could not find task for this extension request");
                if (isMounted.current) setApprovingExtension(null);
                return;
            }

            try {
                const response = await api.patch(`/tasks/extension-requests/${extensionId}/reject`);
                if (response.data.success) {
                    toast.success("❌ Extension rejected");
                    updateExtensionStatus(extensionId, "rejected");
                    return;
                }
            } catch (primaryError: any) {
                console.warn("Primary reject endpoint failed:", primaryError);
            }

            toast.error("Could not reject extension. Please try again.");
        } catch (error: any) {
            console.error("Error rejecting extension:", error);
            toast.error(error.response?.data?.message || "Failed to reject extension. Please try again.");
        } finally {
            if (isMounted.current) setApprovingExtension(null);
        }
    }, [extensionRequests, myExtensionRequests, updateExtensionStatus]);

    // Cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return {
        extensionRequests,
        myExtensionRequests,
        showExtensionModal,
        selectedTaskForExtension,
        extensionData,
        submittingExtension,
        loadingExtensions,
        approvingExtension,
        setShowExtensionModal,
        setSelectedTaskForExtension,
        setExtensionData,
        fetchMyExtensionRequests,
        fetchAllExtensionRequests,
        handleRequestExtension,
        handleApproveExtension,
        handleRejectExtension,
    };
};