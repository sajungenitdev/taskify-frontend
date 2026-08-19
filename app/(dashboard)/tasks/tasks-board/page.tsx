// app/(dashboard)/tasks/tasks-board/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  CheckSquare, ChevronRight, Home, Building2, Users,
  LayoutGrid, List, Plus, Download, CalendarClock,
  RefreshCw, Search, Filter,
  Star, Eye, Edit2, Trash2, Play, Send,
  Check, X, Loader2, ThumbsUp, ThumbsDown, AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

// Import types
import { ExtendedUser, Task, Stats, EditFormData, ExtensionRequest } from "@/types/task";

// Import utilities
import {
  getPriorityConfig,
  getStatusConfig,
  formatDate,
  formatDateTime,
  getRelativeTime
} from "@/utils/task-helpers";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import ExtensionRequestModal from "@/components/tasks/ExtensionRequestModal";

export default function TasksBoardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { formatTime, formatTimeShort, isTimerActiveForTask, isTimerRunning, timerState } = useTimer();

  // ============ ROLE CHECKS ============
  const userRole = user?.role;
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const isHrManager = userRole === "hr_manager";
  const isDeptManager = userRole === "dept_manager";
  const isProjectManager = userRole === "project_manager";
  const isLineManager = userRole === "line_manager";

  const canManage = isSuperAdmin || isAdmin || isHrManager || isDeptManager || isProjectManager || isLineManager;
  const canApprove = isSuperAdmin || isAdmin || isHrManager || isDeptManager || isProjectManager || isLineManager;
  const canManageExtensions = isSuperAdmin || isAdmin || isHrManager || isDeptManager || isProjectManager || isLineManager;
  const isDepartmentManager = isDeptManager || isProjectManager || isLineManager;

  const userDepartmentId = useMemo(() => {
    const extendedUser = user as ExtendedUser;
    return extendedUser?.department?._id || extendedUser?.departmentId || null;
  }, [user]);

  // ============ STATE ============
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "extensions">("tasks");
  const [extensionFilter, setExtensionFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Extension state
  const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);
  const [myExtensionRequests, setMyExtensionRequests] = useState<ExtensionRequest[]>([]);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedTaskForExtension, setSelectedTaskForExtension] = useState<Task | null>(null);
  const [extensionData, setExtensionData] = useState({ requestedDate: "", reason: "" });
  const [submittingExtension, setSubmittingExtension] = useState(false);
  const [loadingExtensions, setLoadingExtensions] = useState(false);
  const [approvingExtension, setApprovingExtension] = useState<string | null>(null);

  // Users and projects state
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0, submitted: 0, rejected: 0
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    title: "", description: "", priority: "normal", status: "pending",
    deadline: "", estimatedHours: 0, assignedTo: "", projectId: ""
  });

  // Loading flags
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [isReworking, setIsReworking] = useState<string | null>(null);

  // ============ FILTERED TASKS (Moved BEFORE useCallback that use it) ============
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter !== "all" && task.status !== filter) return false;
        if (
          searchTerm &&
          !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          return sortOrder === "asc"
            ? new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()
            : new Date(b.deadline ?? 0).getTime() - new Date(a.deadline ?? 0).getTime();
        } else if (sortBy === "priority") {
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          return sortOrder === "asc"
            ? (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
            : (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        } else {
          return sortOrder === "asc"
            ? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
            : new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        }
      });
  }, [tasks, filter, searchTerm, sortBy, sortOrder]);

  // ============ FETCH FUNCTIONS ============
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (isDepartmentManager && userDepartmentId) params.append("departmentId", userDepartmentId);

      const response = await api.get(`/tasks${params.toString() ? `?${params}` : ''}`);

      if (response.data.success) {
        if (response.data.stats) setStats(response.data.stats);

        const tasksWithCounts = await Promise.all(
          (response.data.data || []).map(async (task: Task) => {
            try {
              const [commentsRes, attachmentsRes] = await Promise.all([
                api.get(`/tasks/${task._id}/comments`),
                api.get(`/tasks/${task._id}/attachments`)
              ]);
              return {
                ...task,
                comments: commentsRes.data.data?.length || 0,
                attachments: attachmentsRes.data.data?.length || 0,
                isStarred: false,
              };
            } catch {
              return { ...task, comments: 0, attachments: 0, isStarred: false };
            }
          })
        );
        setTasks(tasksWithCounts);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [filter, isDepartmentManager, userDepartmentId]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      if (response.data.success) setUsers(response.data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) setProjects(response.data.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  const fetchDepartmentUsers = useCallback(async () => {
    try {
      if (!userDepartmentId) {
        setDepartmentUsers([]);
        return;
      }

      try {
        const response = await api.get(`/auth/users/department/${userDepartmentId}`);
        if (response.data.success) {
          setDepartmentUsers(response.data.data || []);
          return;
        }
      } catch {
        // Fall through
      }

      try {
        const response = await api.get(`/users/department/${userDepartmentId}`);
        if (response.data.success) {
          setDepartmentUsers(response.data.data || []);
          return;
        }
      } catch {
        // Fall through
      }

      // Fallback: extract from tasks
      if (tasks && tasks.length > 0) {
        const userMap = new Map();
        tasks.forEach(task => {
          if (task.assignedTo && task.assignedTo._id) {
            userMap.set(task.assignedTo._id, {
              _id: task.assignedTo._id,
              fullName: task.assignedTo.fullName,
              email: task.assignedTo.email
            });
          }
        });
        setDepartmentUsers(Array.from(userMap.values()));
        return;
      }

      setDepartmentUsers([]);
    } catch (error) {
      console.error("Error fetching department users:", error);
      setDepartmentUsers([]);
    }
  }, [userDepartmentId, tasks]);

  const fetchMyExtensionRequests = useCallback(async () => {
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
          } catch {
            continue;
          }
        }
      }
      const userId = user?._id || (user as any)?.id;
      const myRequests = allRequests.filter(req =>
        req.task && req.task.assignedTo?._id === userId
      );
      setMyExtensionRequests(myRequests);
    } catch (error) {
      console.error("Error fetching my extension requests:", error);
      setMyExtensionRequests([]);
    }
  }, [user]);

  const fetchAllExtensionRequests = useCallback(async () => {
    if (!canManageExtensions) {
      setExtensionRequests([]);
      return;
    }
    setLoadingExtensions(true);
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
          } catch {
            continue;
          }
        }
        setExtensionRequests(allRequests);
      } else {
        setExtensionRequests([]);
      }
    } catch (error) {
      console.error("Error fetching extension requests:", error);
      setExtensionRequests([]);
    } finally {
      setLoadingExtensions(false);
    }
  }, [canManageExtensions]);

  // ============ TASK ACTION HANDLERS ============
  const handleMarkComplete = useCallback(async (taskId: string) => {
    if (isCompleting === taskId) return;
    setIsCompleting(taskId);
    try {
      let actualMinutes = 0;
      if (isTimerActiveForTask(taskId)) {
        toast.success("⏱️ Timer stopped");
      }
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "completed",
        actualMinutes: actualMinutes,
        approvalNote: "Task marked as complete by assignee",
      });
      if (response.data.success) {
        toast.success("✅ Task marked as complete!");
        await fetchTasks();
        return true;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark task as complete");
    } finally {
      setIsCompleting(null);
    }
    return false;
  }, [isCompleting, isTimerActiveForTask, fetchTasks]);

  const handleSubmitForReview = useCallback(async (taskId: string) => {
    if (isSubmitting === taskId) return;
    setIsSubmitting(taskId);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status: "submitted" });
      if (response.data.success) {
        toast.success("✅ Task submitted for review!");
        await fetchTasks();
        return true;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit task");
    } finally {
      setIsSubmitting(null);
    }
    return false;
  }, [isSubmitting, fetchTasks]);

  const handleSendForRework = useCallback(async (taskId: string) => {
    if (isReworking === taskId) return;
    if (!confirm("Send this task back for rework?")) return;
    setIsReworking(taskId);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status: "pending" });
      if (response.data.success) {
        toast.success("🔄 Task sent back for rework!");
        await fetchTasks();
        return true;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send for rework");
    } finally {
      setIsReworking(null);
    }
    return false;
  }, [isReworking, fetchTasks]);

  const handleApprove = useCallback(async (taskId: string) => {
    setApproving(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status: "completed" });
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
  }, [fetchTasks]);

  const handleReject = useCallback(async (taskId: string) => {
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
  }, [rejectionReason, fetchTasks]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    if (updatingStatus === taskId) return;
    if (newStatus === "completed") {
      await handleMarkComplete(taskId);
      return;
    }
    if (newStatus === "submitted") {
      await handleSubmitForReview(taskId);
      return;
    }
    if (newStatus === "pending" && tasks.find(t => t._id === taskId)?.status === "rejected") {
      await handleSendForRework(taskId);
      return;
    }
    setUpdatingStatus(taskId);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        await fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  }, [updatingStatus, handleMarkComplete, handleSubmitForReview, handleSendForRework, tasks, fetchTasks]);

  // ============ EXTENSION HANDLERS ============
  const handleRequestExtension = useCallback(async () => {
    if (!extensionData.requestedDate) {
      toast.error("Please select a new deadline");
      return false;
    }
    if (!extensionData.reason.trim()) {
      toast.error("Please provide a reason for extension");
      return false;
    }
    if (!selectedTaskForExtension) return false;

    setSubmittingExtension(true);
    try {
      const response = await api.post(`/tasks/${selectedTaskForExtension._id}/request-extension`, {
        requestedDate: extensionData.requestedDate,
        reason: extensionData.reason.trim(),
      });
      if (response.data.success) {
        toast.success("✅ Extension request submitted successfully!");
        setShowExtensionModal(false);
        setExtensionData({ requestedDate: "", reason: "" });
        await fetchTasks();
        return true;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to request extension");
    } finally {
      setSubmittingExtension(false);
    }
    return false;
  }, [extensionData, selectedTaskForExtension, fetchTasks]);

  const handleApproveExtension = useCallback(async (extensionId: string, taskId: string, newDeadline: string) => {
    if (!confirm("Approve this extension request?")) return;
    setApprovingExtension(extensionId);
    try {
      const response = await api.post(`/tasks/${taskId}/approve-extension/${extensionId}`, {
        newDeadline: newDeadline,
      });
      if (response.data.success) {
        toast.success("✅ Extension approved successfully!");
        await fetchTasks();
        await fetchAllExtensionRequests();
        await fetchMyExtensionRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve extension");
    } finally {
      setApprovingExtension(null);
    }
  }, [fetchTasks, fetchAllExtensionRequests, fetchMyExtensionRequests]);

  const handleRejectExtension = useCallback(async (extensionId: string) => {
    if (!confirm("Reject this extension request?")) return;
    setApprovingExtension(extensionId);
    try {
      const response = await api.patch(`/tasks/extension-requests/${extensionId}/reject`);
      if (response.data.success) {
        toast.success("❌ Extension rejected");
        await fetchAllExtensionRequests();
        await fetchMyExtensionRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject extension");
    } finally {
      setApprovingExtension(null);
    }
  }, [fetchAllExtensionRequests, fetchMyExtensionRequests]);

  // ============ OTHER HANDLERS ============
  const handleUpdateTask = useCallback(async () => {
    if (!editingTask) return;
    try {
      const response = await api.put(`/tasks/${editingTask._id}`, editFormData);
      if (response.data.success) {
        toast.success("Task updated successfully");
        setShowEditModal(false);
        setEditingTask(null);
        fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  }, [editingTask, editFormData, fetchTasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!taskId) {
      toast.error("No task selected");
      return;
    }

    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully");
        setShowDeleteConfirm(null);
        // Refresh tasks
        await fetchTasks();
      } else {
        toast.error(response.data.message || "Failed to delete task");
      }
    } catch (error: any) {
      console.error("Delete task error:", error);
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  }, [fetchTasks]);

  const toggleStar = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, isStarred: !task.isStarred } : task
      )
    );
    const task = tasks.find((t) => t._id === taskId);
    toast.success(task?.isStarred ? "Task unstarred" : "Task starred");
  }, [tasks]);

  const openEditModal = useCallback((task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline ? task.deadline.split("T")[0] : "",
      estimatedHours: task.estimatedHours,
      assignedTo: task.assignedTo?._id || "",
      projectId: task.projectId?._id || "",
    });
    setShowEditModal(true);
  }, []);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  }, []);

  const toggleAllTasks = useCallback(() => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t._id)));
    }
  }, [selectedTasks, filteredTasks]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTasks.size === 0) {
      toast.error("No tasks selected");
      return;
    }
    setIsBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedTasks).map((taskId) =>
        api.delete(`/tasks/${taskId}`)
      );
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedTasks.size} tasks`);
      setSelectedTasks(new Set());
      setIsBulkDeleteModalOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete tasks");
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedTasks, fetchTasks]);

  const handleExport = useCallback(() => {
    const headers = ["Title", "Priority", "Status", "Assignee", "Deadline", "Created At"];
    const rows = filteredTasks.map((t) => [
      `"${t.title}"`,
      t.priority,
      t.status.replace("_", " "),
      `"${t.assignedTo?.fullName || "Unassigned"}"`,
      new Date(t.deadline ?? 0).toLocaleDateString(),
      new Date(t.createdAt ?? 0).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tasks_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported successfully");
  }, [filteredTasks]);

  // ============ TIMER HANDLERS ============
  const handleStartTimer = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) {
      toast.error("Task not found");
      return;
    }
    const isAssignee = task.assignedTo?._id === user?._id;
    if (!isAssignee) {
      toast.error("You don't have permission to start timer for this task");
      return;
    }
    toast.success(`⏱️ Timer started for "${task.title}"`);
  }, [tasks, user]);

  const handlePauseTimer = useCallback(() => {
    toast.success("⏸️ Timer paused");
  }, []);

  const handleResumeTimer = useCallback(() => {
    toast.success("▶️ Timer resumed");
  }, []);

  const handleStopTimer = useCallback(async (taskId: string) => {
    toast.success("⏱️ Timer stopped");
    await fetchTasks();
  }, [fetchTasks]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  }, []);

  // ============ EFFECTS ============
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let isMounted = true;
    const loadAllData = async () => {
      if (!isMounted) return;
      try {
        await fetchTasks();
        await Promise.all([
          fetchUsers(),
          fetchProjects(),
          fetchDepartmentUsers(),
          fetchMyExtensionRequests(),
          fetchAllExtensionRequests()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // ============ DEPENDENCY INFO ============
  const departmentInfo = useMemo(() => {
    const extendedUser = user as ExtendedUser;
    if (isDepartmentManager && extendedUser?.department) {
      return {
        name: extendedUser.department.name,
        code: extendedUser.department.code,
        memberCount: departmentUsers.length,
      };
    }
    return null;
  }, [user, isDepartmentManager, departmentUsers]);

  const extensionStats = useMemo(() => ({
    total: extensionRequests.length,
    pending: extensionRequests.filter(req => req.status === "pending").length,
    approved: extensionRequests.filter(req => req.status === "approved").length,
    rejected: extensionRequests.filter(req => req.status === "rejected").length,
  }), [extensionRequests]);

  const myExtensionStats = useMemo(() => ({
    total: myExtensionRequests.length,
    pending: myExtensionRequests.filter(req => req.status === "pending").length,
    approved: myExtensionRequests.filter(req => req.status === "approved").length,
    rejected: myExtensionRequests.filter(req => req.status === "rejected").length,
  }), [myExtensionRequests]);

  // ============ LOADING STATE ============
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium text-slate-400">Loading your tasks workspace...</p>
        </div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-600 transition flex items-center gap-1">
            <Home size={13} /> Dashboard
          </Link>
          <ChevronRight size={13} />
          <span className="text-slate-700">Tasks Board</span>
        </div>

        {/* Department Info Banner */}
        {isDepartmentManager && departmentInfo && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md text-white">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {departmentInfo.name} Department {departmentInfo.code && `(${departmentInfo.code})`}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <Users size={12} /> {departmentInfo.memberCount} team members
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-white rounded-full border border-indigo-200 text-indigo-700 shadow-xs">
              {isProjectManager ? "Project Manager View" : "Department Manager View"}
            </span>
          </motion.div>
        )}

        {/* Header Banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Tasks Board</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {stats.total} total
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Manage deliverables, oversee team workflows, and process extension applications.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Download size={14} /> Export CSV
            </button>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button onClick={() => setViewMode("grid")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                <LayoutGrid size={14} /> Grid
              </button>
              <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                <List size={14} /> List
              </button>
            </div>
            {canManage && (
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer">
                <Plus size={15} /> Create Task
              </button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards - Inline Implementation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {[
            { label: "Total", key: "total", icon: CheckSquare, color: "text-gray-700", bgColor: "bg-gray-50" },
            { label: "Pending", key: "pending", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50" },
            { label: "In Progress", key: "inProgress", icon: RefreshCw, color: "text-sky-600", bgColor: "bg-sky-50" },
            { label: "Submitted", key: "submitted", icon: Send, color: "text-purple-600", bgColor: "bg-purple-50" },
            { label: "Done", key: "completed", icon: Check, color: "text-emerald-600", bgColor: "bg-emerald-50" },
            { label: "Overdue", key: "overdue", icon: AlertCircle, color: "text-rose-600", bgColor: "bg-rose-50" },
            { label: "Rejected", key: "rejected", icon: X, color: "text-red-600", bgColor: "bg-red-50" },
          ].map((stat, idx) => (
            <div key={stat.label} className={`${stat.bgColor} rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {stats[stat.key as keyof Stats] || 0}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
                <div className={`w-9 h-9 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-5 py-3 text-xs font-bold transition-all relative cursor-pointer ${activeTab === "tasks" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare size={15} /> Tasks Directory
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{stats.total}</span>
            </div>
            {activeTab === "tasks" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("extensions");
              fetchAllExtensionRequests();
              fetchMyExtensionRequests();
            }}
            className={`px-5 py-3 text-xs font-bold transition-all relative cursor-pointer ${activeTab === "extensions" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            <div className="flex items-center gap-2">
              <CalendarClock size={15} /> Extension Requests
              {canManageExtensions && extensionStats.pending > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse font-extrabold">
                  {extensionStats.pending}
                </span>
              )}
              {!canManageExtensions && myExtensionStats.pending > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse font-extrabold">
                  {myExtensionStats.pending}
                </span>
              )}
            </div>
            {activeTab === "extensions" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
          </button>
        </div>

        {/* ============ TASKS TAB ============ */}
        {activeTab === "tasks" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm ${showFilters ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" : "bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 hover:text-gray-800"
                  }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronRight size={14} className={showFilters ? "rotate-90" : ""} />
              </button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="deadline">Sort by Deadline</option>
                  <option value="priority">Sort by Priority</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition"
                >
                  {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                </button>
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <CheckSquare size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">No tasks discovered</h3>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">Adjust your active filter parameters or create a new task assignment.</p>
                {canManage && (
                  <button onClick={() => setShowCreateModal(true)} className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-md cursor-pointer inline-flex items-center gap-2">
                    <Plus size={14} /> Create Task
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredTasks.map((task) => (
                  <div key={task._id} className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden hover:shadow-xl transition-all">
                    <div className={`h-1 bg-gradient-to-r ${getPriorityConfig(task.priority).gradient}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityConfig(task.priority).color}`}>
                            {getPriorityConfig(task.priority).icon} {task.priority}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusConfig(task.status).color}`}>
                            {getStatusConfig(task.status).icon} {task.status.replace("_", " ")}
                          </span>
                        </div>
                        <button onClick={() => toggleStar(task._id)} className="text-gray-300 hover:text-amber-400">
                          <Star size={14} className={task.isStarred ? "fill-amber-400 text-amber-400" : ""} />
                        </button>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{task.title}</h3>
                      <p className="text-gray-500 text-xs line-clamp-2 mb-2">{task.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Due: {formatDate(task.deadline)}</span>
                        <span className="text-gray-500">{task.assignedTo?.fullName || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100">
                        <button onClick={() => openEditModal(task)} className="p-1 text-gray-400 hover:text-blue-600">
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => setSelectedTask(task)} className="p-1 text-gray-400 hover:text-indigo-600">
                          <Eye size={12} />
                        </button>
                        {task.status === "pending" && (
                          <button onClick={() => handleStatusChange(task._id, "in_progress")} className="p-1 text-gray-400 hover:text-emerald-600">
                            <Play size={12} />
                          </button>
                        )}
                        {task.status === "in_progress" && (
                          <button onClick={() => handleStatusChange(task._id, "submitted")} className="p-1 text-gray-400 hover:text-purple-600">
                            <Send size={12} />
                          </button>
                        )}
                        {task.status === "submitted" && canApprove && (
                          <>
                            <button onClick={() => handleApprove(task._id)} className="p-1 text-gray-400 hover:text-emerald-600">
                              <Check size={12} />
                            </button>
                            <button onClick={() => { setSelectedTask(task); setShowRejectModal(true); }} className="p-1 text-gray-400 hover:text-rose-600">
                              <X size={12} />
                            </button>
                          </>
                        )}
                        {task.status === "rejected" && (
                          <button onClick={() => handleStatusChange(task._id, "pending")} className="p-1 text-gray-400 hover:text-amber-600">
                            <RefreshCw size={12} />
                          </button>
                        )}
                        <Link href={`/tasks/${task._id}`} className="p-1 text-gray-400 hover:text-purple-600">
                          <ExternalLink size={12} />
                        </Link>
                        <button
                          onClick={() => setShowDeleteConfirm(task._id)}
                          className="p-1 text-gray-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Task</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Assignee</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Deadline</th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{task.title}</p>
                              <p className="text-gray-400 text-xs line-clamp-1">{task.description}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getPriorityConfig(task.priority).color}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusConfig(task.status).color}`}>
                              {task.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{task.assignedTo?.fullName || "Unassigned"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(task.deadline)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setSelectedTask(task)} className="p-1 text-gray-400 hover:text-indigo-600">
                                <Eye size={14} />
                              </button>
                              <button onClick={() => openEditModal(task)} className="p-1 text-gray-400 hover:text-blue-600">
                                <Edit2 size={14} />
                              </button>
                              {task.status === "pending" && (
                                <button onClick={() => handleStatusChange(task._id, "in_progress")} className="p-1 text-gray-400 hover:text-emerald-600">
                                  <Play size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => setShowDeleteConfirm(task._id)}
                                className="p-1 text-gray-400 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ EXTENSIONS TAB ============ */}
        {activeTab === "extensions" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Total Requests</p>
                <p className="text-2xl font-bold text-indigo-700">
                  {canManageExtensions ? extensionStats.total : myExtensionStats.total}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-700">
                  {canManageExtensions ? extensionStats.pending : myExtensionStats.pending}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Approved</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {canManageExtensions ? extensionStats.approved : myExtensionStats.approved}
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-4 border border-rose-200 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">Rejected</p>
                <p className="text-2xl font-bold text-rose-700">
                  {canManageExtensions ? extensionStats.rejected : myExtensionStats.rejected}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {extensionRequests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <CalendarClock size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No extension requests</h3>
                  <p className="text-slate-400 text-xs">No applications match your active filtering parameters.</p>
                </div>
              ) : (
                extensionRequests.map((req) => (
                  <div key={req._id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${req.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            req.status === "rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                            {req.status}
                          </span>
                          <h4 className="font-bold text-slate-900">{req.taskTitle}</h4>
                        </div>
                        <p className="text-sm text-slate-600"><strong>Reason:</strong> {req.reason}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Requested: {formatDate(req.requestedDate)}</span>
                          <span>Submitted: {formatDateTime(req.createdAt)}</span>
                        </div>
                      </div>
                      {req.status === "pending" && canManageExtensions && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveExtension(req._id, req.taskId, req.requestedDate)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                          >
                            <Check size={13} className="inline mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectExtension(req._id)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                          >
                            <X size={13} className="inline mr-1" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={() => {
          fetchTasks();
          setShowCreateModal(false);
        }}
      />

      {/* Extension Request Modal */}
      <ExtensionRequestModal
        isOpen={showExtensionModal}
        onClose={() => {
          setShowExtensionModal(false);
          setSelectedTaskForExtension(null);
        }}
        task={selectedTaskForExtension}
        onSuccess={() => {
          fetchTasks();
          fetchMyExtensionRequests();
          fetchAllExtensionRequests();
        }}
      />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Reject Task</h3>
            <p className="text-sm text-slate-500 mb-4">Provide feedback for the assignee</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason</label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                placeholder="Explain why this task is being rejected..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { if (selectedTask) handleReject(selectedTask._id); }}
                disabled={rejecting || !rejectionReason.trim()}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Reject Task
              </button>
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Task</h3>
              <p className="text-slate-500 mb-6 text-sm">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (showDeleteConfirm) {
                      handleDeleteTask(showDeleteConfirm);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedTask.title}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityConfig(selectedTask.priority).color}`}>
                      {getPriorityConfig(selectedTask.priority).icon} {selectedTask.priority.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusConfig(selectedTask.status).color}`}>
                      {getStatusConfig(selectedTask.status).icon} {selectedTask.status.replace("_", " ").toUpperCase()}
                    </span>
                    {selectedTask.projectId && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                        {selectedTask.projectId.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">
                    {selectedTask.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Assigned To</h3>
                    <p className="text-gray-800 text-sm">{selectedTask.assignedTo?.fullName || "Unassigned"}</p>
                    {selectedTask.assignedTo?.email && (
                      <p className="text-xs text-gray-400">{selectedTask.assignedTo.email}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Deadline</h3>
                    <p className="text-gray-800 text-sm">{formatDate(selectedTask.deadline)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Estimated Hours</h3>
                    <p className="text-gray-800 text-sm">{selectedTask.estimatedHours || 0}h</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Created</h3>
                    <p className="text-gray-800 text-sm">
                      {selectedTask.createdAt ? formatDateTime(selectedTask.createdAt) : "N/A"}
                    </p>
                  </div>
                </div>

                {selectedTask.evidenceUrls && selectedTask.evidenceUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Evidence</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.evidenceUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                        >
                          📎 Evidence {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.rejectionReason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <h3 className="text-sm font-medium text-rose-700 mb-1">Rejection Reason</h3>
                    <p className="text-sm text-rose-600">{selectedTask.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    const task = selectedTask;
                    setSelectedTask(null);
                    openEditModal(task);
                  }}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit Task
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(selectedTask._id);
                    setSelectedTask(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Edit Task</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })}
                      className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input
                      type="date"
                      value={editFormData.deadline}
                      onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                      className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      value={editFormData.estimatedHours}
                      onChange={(e) => setEditFormData({ ...editFormData, estimatedHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>

                {canManage && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                      <select
                        value={editFormData.assignedTo}
                        onChange={(e) => setEditFormData({ ...editFormData, assignedTo: e.target.value })}
                        className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="">Select User</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>{u.fullName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                      <select
                        value={editFormData.projectId}
                        onChange={(e) => setEditFormData({ ...editFormData, projectId: e.target.value })}
                        className="w-full px-4 py-2 border text-black border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Update Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTask(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}