"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Layers,
  Zap,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  Eye,
  Play,
  Send,
  RefreshCw,
  Calendar,
  Briefcase,
  Edit2,
  Trash2,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  List,
  Star,
  MessageSquare,
  Paperclip,
  Link2,
  Clock as ClockIcon,
  Home,
  Download,
  LayoutGrid,
  Square,
  Trash,
  ExternalLink,
  Upload,
  Users,
  Building2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
  assignedTo: { _id: string; fullName: string; email: string; avatar?: string; department?: { _id: string; name: string } };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  departmentId?: { _id: string; name: string; code: string };
  isStarred?: boolean;
  isApprovalRequired?: boolean;
  evidenceRequired?: boolean;
  evidenceUrls?: string[];
  rejectionReason?: string;
  approvalNote?: string;
  evidenceSubmitted?: boolean;
  evidenceSubmittedAt?: string;
  comments?: number;
  attachments?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Extended user type with department
interface ExtendedUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  departmentId?: string;
}

export default function TasksPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "createdAt">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [updating, setUpdating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    submitted: 0,
    rejected: 0,
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    status: "pending",
    deadline: "",
    estimatedHours: 0,
    assignedTo: "",
    projectId: "",
  });
  const [users, setUsers] = useState<
    { _id: string; fullName: string; email: string; department?: { _id: string; name: string } }[]
  >([]);
  const [projects, setProjects] = useState<
    { _id: string; name: string; code: string }[]
  >([]);
  const [departmentUsers, setDepartmentUsers] = useState<
    { _id: string; fullName: string; email: string }[]
  >([]);

  // Bulk selection state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const userRole = user?.role;
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const isHrManager = userRole === "hr_manager";
  const isDeptManager = userRole === "dept_manager";
  const isProjectManager = userRole === "project_manager";
  const isLineManager = userRole === "line_manager";

  const canManage = isSuperAdmin || isAdmin || isHrManager || isDeptManager || isProjectManager || isLineManager;
  const canApprove =
    isSuperAdmin ||
    isAdmin ||
    isHrManager ||
    isDeptManager ||
    isProjectManager ||
    isLineManager;

  // Get user's department ID
  const userDepartmentId = useMemo(() => {
    const extendedUser = user as ExtendedUser;
    return extendedUser?.department?._id || extendedUser?.departmentId || null;
  }, [user]);

  // Check if user is a department manager or project manager (should see department tasks)
  const isDepartmentManager = useMemo(() => {
    return isDeptManager || isProjectManager || isLineManager;
  }, [isDeptManager, isProjectManager, isLineManager]);



  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
      fetchUsers();
      fetchProjects();
      fetchDepartmentUsers();
    }
  }, [isAuthenticated, user, filter]);

  // In your tasks page component

  const fetchDepartmentUsers = async () => {
    try {
      if (!userDepartmentId) {
        console.log("⚠️ No department ID found for user");
        setDepartmentUsers([]);
        return;
      }

      console.log(`🔍 Fetching users for department: ${userDepartmentId}`);

      // Try the auth/users/department endpoint first
      try {
        const response = await api.get(`/auth/users/department/${userDepartmentId}`);
        if (response.data.success) {
          const users = response.data.data || [];
          setDepartmentUsers(users);
          console.log(`✅ Found ${users.length} users in department via auth endpoint`);
          return;
        }
      } catch (authError) {
        console.warn("⚠️ Auth endpoint failed, trying users endpoint:", authError);
      }

      // Fallback: Try the users/department endpoint
      try {
        const response = await api.get(`/users/department/${userDepartmentId}`);
        if (response.data.success) {
          const users = response.data.data || [];
          setDepartmentUsers(users);
          console.log(`✅ Found ${users.length} users in department via users endpoint`);
          return;
        }
      } catch (usersError) {
        console.warn("⚠️ Users endpoint also failed:", usersError);
      }

      // Last resort: Try fetching all users and filter
      try {
        const allUsersResponse = await api.get('/users');
        if (allUsersResponse.data.success) {
          const allUsers = allUsersResponse.data.data || [];
          const filteredUsers = allUsers.filter((u: any) => {
            const userDeptId = u.departmentId || u.department?._id || u.department;
            return userDeptId === userDepartmentId;
          });
          setDepartmentUsers(filteredUsers);
          console.log(`✅ Found ${filteredUsers.length} users in department via fallback`);
          return;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }

      // If all fails, extract from tasks
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
        const taskUsers = Array.from(userMap.values());
        setDepartmentUsers(taskUsers);
        console.log(`✅ Extracted ${taskUsers.length} users from tasks`);
        return;
      }

      setDepartmentUsers([]);
      console.warn("⚠️ No users found for department");
    } catch (error) {
      console.error("❌ Error fetching department users:", error);
      setDepartmentUsers([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };
  // In your tasks page component

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();

      if (filter !== "all") {
        params.append("status", filter);
      }

      // For project manager - send departmentId to get all department tasks
      if (isProjectManager && userDepartmentId) {
        params.append("departmentId", userDepartmentId);
        console.log(`📋 Project Manager - fetching all tasks for department: ${userDepartmentId}`);
      }
      // For department manager
      else if (isDeptManager && userDepartmentId) {
        params.append("departmentId", userDepartmentId);
        console.log(`🏢 Department Manager - filtering by departmentId: ${userDepartmentId}`);
      }

      const queryString = params.toString();
      const url = queryString ? `/tasks?${queryString}` : "/tasks";

      console.log(`🔍 Fetching tasks with URL: ${url}`);

      const response = await api.get(url);

      if (response.data.success) {
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        const tasksWithMeta = (response.data.data || []).map((task: Task) => ({
          ...task,
          comments: Math.floor(Math.random() * 10),
          attachments: Math.floor(Math.random() * 5),
          isStarred: false,
        }));
        setTasks(tasksWithMeta);
        console.log(`📊 Loaded ${tasksWithMeta.length} tasks for department`);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };
  // Filter users based on department for project managers
  // Replace the getAvailableUsers with this updated version
  const getAvailableUsers = useMemo(() => {
    // For super admin, admin, HR manager - show all users
    if (isSuperAdmin || isAdmin || isHrManager) {
      return users;
    }

    // For department managers - show users from their department
    if (isDepartmentManager && userDepartmentId) {
      // First try to get users from departmentUsers state
      if (departmentUsers.length > 0) {
        return departmentUsers;
      }

      // Fallback: filter from all users
      const filtered = users.filter(u =>
        (u as any).department?._id === userDepartmentId ||
        (u as any).departmentId === userDepartmentId
      );

      // If still no users, return all users (fallback)
      if (filtered.length === 0) {
        console.warn("⚠️ No department users found, showing all users as fallback");
        return users;
      }

      return filtered;
    }

    return users;
  }, [users, isSuperAdmin, isAdmin, isHrManager, isDepartmentManager, userDepartmentId, departmentUsers]);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
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
        toast.success(statusMessages[newStatus] || "Status updated");
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    setApproving(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "completed",
      });
      if (response.data.success) {
        toast.success("✅ Task approved and completed!");
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve task");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
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
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject task");
    } finally {
      setRejecting(false);
    }
  };

  // Evidence handlers
  const handleAddEvidence = () => {
    if (newEvidenceUrl && newEvidenceUrl.trim()) {
      setSelectedTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          evidenceUrls: [...(prev.evidenceUrls || []), newEvidenceUrl.trim()],
        };
      });
      setNewEvidenceUrl("");
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setSelectedTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        evidenceUrls: prev.evidenceUrls?.filter((_, i) => i !== index) || [],
      };
    });
  };

  const handleSaveEvidence = async () => {
    if (!selectedTask) return;

    setUploadingEvidence(true);
    try {
      const response = await api.put(`/tasks/${selectedTask._id}/evidence`, {
        evidenceUrls: selectedTask.evidenceUrls || [],
      });

      if (response.data.success) {
        toast.success("Evidence updated successfully");
        setShowEvidenceUpload(false);
        setNewEvidenceUrl("");
        fetchTasks();
        setSelectedTask((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            evidenceUrls: response.data.data?.evidenceUrls || [],
          };
        });
      } else {
        toast.error(response.data.message || "Failed to update evidence");
      }
    } catch (error: any) {
      console.error("Error updating evidence:", error);
      toast.error(error.response?.data?.message || "Failed to update evidence");
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleUpdateTask = async () => {
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
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully");
        setShowDeleteConfirm(null);
        fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  const toggleStar = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, isStarred: !task.isStarred } : task,
      ),
    );
    const task = tasks.find((t) => t._id === taskId);
    toast.success(task?.isStarred ? "Task unstarred" : "Task starred");
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline.split("T")[0],
      estimatedHours: task.estimatedHours,
      assignedTo: task.assignedTo?._id || "",
      projectId: task.projectId?._id || "",
    });
    setShowEditModal(true);
  };

  // Bulk selection handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) {
      toast.error("No tasks selected");
      return;
    }

    setIsBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedTasks).map((taskId) =>
        api.delete(`/tasks/${taskId}`),
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
  };

  const getPriorityConfig = (priority: string) => {
    const config = {
      low: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "🟢",
        label: "Low",
        gradient: "from-emerald-400 to-emerald-600",
        bg: "bg-emerald-500/10",
        border: "border-emerald-200",
      },
      normal: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "🔵",
        label: "Normal",
        gradient: "from-blue-400 to-blue-600",
        bg: "bg-blue-500/10",
        border: "border-blue-200",
      },
      high: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "🟠",
        label: "High",
        gradient: "from-amber-400 to-amber-600",
        bg: "bg-amber-500/10",
        border: "border-amber-200",
      },
      urgent: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "🔴",
        label: "Urgent",
        gradient: "from-rose-400 to-rose-600",
        bg: "bg-rose-500/10",
        border: "border-rose-200",
      },
    };
    return config[priority as keyof typeof config] || config.normal;
  };

  const getStatusConfig = (status: string) => {
    const config = {
      pending: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "⏳",
        label: "Pending",
        dot: "bg-amber-500",
        ring: "ring-amber-400",
      },
      in_progress: {
        color: "bg-sky-50 text-sky-700 border-sky-200",
        icon: "🔄",
        label: "In Progress",
        dot: "bg-sky-500",
        ring: "ring-sky-400",
      },
      submitted: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "📬",
        label: "Submitted",
        dot: "bg-purple-500",
        ring: "ring-purple-400",
      },
      completed: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "✅",
        label: "Done",
        dot: "bg-emerald-500",
        ring: "ring-emerald-400",
      },
      overdue: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "⚠️",
        label: "Overdue",
        dot: "bg-rose-500",
        ring: "ring-rose-400",
      },
      rejected: {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: "❌",
        label: "Rejected",
        dot: "bg-red-500",
        ring: "ring-red-400",
      },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days left`;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleExport = () => {
    const headers = [
      "Title",
      "Priority",
      "Status",
      "Assignee",
      "Deadline",
      "Created At",
    ];
    const rows = filteredTasks.map((t) => [
      t.title,
      t.priority,
      t.status.replace("_", " "),
      t.assignedTo?.fullName || "Unassigned",
      new Date(t.deadline ?? 0).toLocaleDateString(),
      new Date(t.createdAt ?? 0).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported successfully");
  };

  const getFilteredTasks = useCallback(() => {
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
            ? (priorityOrder[a.priority] || 0) -
            (priorityOrder[b.priority] || 0)
            : (priorityOrder[b.priority] || 0) -
            (priorityOrder[a.priority] || 0);
        } else {
          return sortOrder === "asc"
            ? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
            : new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        }
      });
  }, [tasks, filter, searchTerm, sortBy, sortOrder]);

  const filteredTasks = getFilteredTasks();

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: Layers,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      gradient: "from-gray-400 to-gray-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      gradient: "from-amber-400 to-amber-600",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      gradient: "from-sky-400 to-sky-600",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Send,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      gradient: "from-purple-400 to-purple-600",
    },
    {
      label: "Done",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      gradient: "from-emerald-400 to-emerald-600",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      gradient: "from-rose-400 to-rose-600",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-50",
      gradient: "from-red-400 to-red-600",
    },
  ];

  // Show department info for project managers
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

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              <Home size={14} />
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">Tasks</span>
          </motion.div>

          {/* Department Info Banner - For Project/Department Managers */}
          {isDepartmentManager && departmentInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-xl p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/25">
                  <Building2 size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {departmentInfo.name} Department
                    {departmentInfo.code && ` (${departmentInfo.code})`}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Users size={12} />
                    {departmentInfo.memberCount} members
                    {/* <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    {stats.total} tasks */}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-3 py-1 bg-white/80 rounded-full border border-indigo-200 text-indigo-700 shadow-sm">
                  {isProjectManager ? "Project Manager" : "Department Manager"}
                </span>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <CheckSquare className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Task Workspace
                </h1>
                <span className="ml-2 px-3 py-0.5 text-xs font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full border border-indigo-200 shadow-sm">
                  {stats.total}
                </span>
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                {isDepartmentManager && departmentInfo
                  ? `Managing tasks for ${departmentInfo.name} department`
                  : "Manage, track, and collaborate on tasks efficiently"}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Download size={14} />
                Export
              </button>
              <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-0.5 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${viewMode === "grid"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <LayoutGrid size={14} />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${viewMode === "list"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <List size={14} />
                  List
                </button>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                >
                  <Plus size={16} />
                  Create Task
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4"
          >
            {statCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`${stat.bgColor} rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                  <div
                    className={`w-9 h-9 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2 h-0.5 w-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              </motion.div>
            ))}
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tasks by title, description, or assignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm hover:shadow-md"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm ${showFilters
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50/80"
                  }`}
              >
                <Filter size={16} />
                Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm hover:shadow-md"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="deadline">Sort by Deadline</option>
                <option value="priority">Sort by Priority</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-50/80 transition-all shadow-sm hover:shadow-md"
              >
                {sortOrder === "asc" ? (
                  <SortAsc size={16} />
                ) : (
                  <SortDesc size={16} />
                )}
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200 shadow-sm"
                >
                  {[
                    "all",
                    "pending",
                    "in_progress",
                    "submitted",
                    "completed",
                    "overdue",
                    "rejected",
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-all ${filter === tab
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : "bg-gray-100/80 text-gray-600 hover:text-gray-800 hover:bg-gray-200/80"
                        }`}
                    >
                      {tab.replace("_", " ")}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Bulk Actions Bar */}
          {selectedTasks.size > 0 && viewMode === "list" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-xl p-3 flex items-center justify-between shadow-lg shadow-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-semibold text-indigo-700">
                    {selectedTasks.size}
                  </span>
                  <span className="text-xs text-indigo-600 ml-1">
                    task{selectedTasks.size > 1 ? "s" : ""} selected
                  </span>
                </div>
                <button
                  onClick={toggleAllTasks}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded-lg hover:bg-indigo-100/50 transition"
                >
                  {selectedTasks.size === filteredTasks.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium rounded-lg transition flex items-center gap-1 shadow-md shadow-rose-500/25"
                >
                  <Trash size={12} />
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedTasks(new Set())}
                  className="px-3 py-1.5 bg-white/80 hover:bg-gray-100 text-gray-600 text-xs font-medium rounded-lg transition flex items-center gap-1 border border-gray-200"
                >
                  <X size={12} />
                  Clear
                </button>
              </div>
            </motion.div>
          )}

          {/* Tasks Grid/List View */}
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-500">
                {isDepartmentManager && departmentInfo
                  ? `No tasks found for ${departmentInfo.name} department. Try adjusting your filters or create a new task.`
                  : "Try adjusting your filters or create a new task"}
              </p>
              {canManage && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg inline-flex items-center gap-2 shadow-md hover:shadow-lg transition"
                >
                  <Plus size={16} />
                  Create Task
                </button>
              )}
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filteredTasks.map((task, idx) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  idx={idx}
                  user={user}
                  canManage={canManage}
                  canApprove={canApprove}
                  updating={updating}
                  approving={approving}
                  rejecting={rejecting}
                  onUpdateStatus={updateTaskStatus}
                  onApprove={handleApprove}
                  onRejectClick={() => {
                    setSelectedTask(task);
                    setShowRejectModal(true);
                  }}
                  onEdit={openEditModal}
                  onDelete={(id: string) => setShowDeleteConfirm(id)}
                  onStar={toggleStar}
                  onViewDetails={setSelectedTask}
                  getPriorityConfig={getPriorityConfig}
                  getStatusConfig={getStatusConfig}
                  formatDate={formatDate}
                  getRelativeTime={getRelativeTime}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-indigo-50/80 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3">
                        <button
                          onClick={toggleAllTasks}
                          className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-indigo-600 transition"
                        >
                          {selectedTasks.size === filteredTasks.length &&
                            selectedTasks.size > 0 ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="w-36 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="w-44 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-56 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="w-36 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTasks.map((task) => (
                      <tr
                        key={task._id}
                        className={`hover:bg-indigo-50/30 transition-colors duration-200 ${selectedTasks.has(task._id)
                          ? "bg-indigo-50/50 border-l-4 border-indigo-500"
                          : ""
                          }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleTaskSelection(task._id)}
                            className="p-1 rounded-lg hover:bg-indigo-100 transition"
                          >
                            {selectedTasks.has(task._id) ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleStar(task._id)}
                              className="text-gray-400 hover:text-amber-400 transition"
                            >
                              <Star
                                size={14}
                                className={
                                  task.isStarred
                                    ? "fill-amber-400 text-amber-400"
                                    : ""
                                }
                              />
                            </button>
                            <div>
                              <p className="text-gray-800 text-sm font-medium hover:text-indigo-600 transition">
                                {task.title}
                              </p>
                              <p className="text-gray-400 text-xs line-clamp-1">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color} shadow-sm`}
                          >
                            <span className="mr-1">
                              {getPriorityConfig(task.priority).icon}
                            </span>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(task.status).dot}`}
                            />
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color}`}
                            >
                              {getStatusConfig(task.status).icon}{" "}
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <span className="text-white text-[10px] font-bold">
                                {task.assignedTo?.fullName?.charAt(0) || "?"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {task.assignedTo?.fullName ?? "Unassigned"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${new Date(task.deadline) < new Date() &&
                              task.status !== "completed"
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                              }`}
                          >
                            {formatDate(task.deadline)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Eye size={14} />
                            </button>
                            {canManage && (
                              <>
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(task._id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
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

      {/* Task Details Modal - Keep existing */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Task details content - same as before */}
              {/* ... (keep the existing task details modal content) ... */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                    <ThumbsDown className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Reject Task
                    </h3>
                    <p className="text-xs text-gray-500">
                      Provide feedback for the assignee
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this task is being rejected..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This feedback will be sent to the assignee.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (selectedTask) {
                        handleReject(selectedTask._id);
                      }
                    }}
                    disabled={rejecting || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {rejecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ThumbsDown size={14} />
                        Reject Task
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Delete Task
                </h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete this task? This action cannot
                  be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (showDeleteConfirm) {
                        handleDeleteTask(showDeleteConfirm);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {isBulkDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsBulkDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Delete Multiple Tasks
                </h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-rose-600">
                    {selectedTasks.size}
                  </span>{" "}
                  tasks? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isBulkDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Delete All"
                    )}
                  </button>
                  <button
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Edit Task
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={editFormData.priority}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            priority: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editFormData.status}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={editFormData.deadline}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            deadline: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        value={editFormData.estimatedHours}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            estimatedHours: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign To
                      </label>
                      <select
                        value={editFormData.assignedTo}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            assignedTo: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="">Select Assignee</option>
                        {getAvailableUsers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project
                      </label>
                      <select
                        value={editFormData.projectId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            projectId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleUpdateTask}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition shadow-md"
                  >
                    Update Task
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  idx,
  user,
  canManage,
  canApprove,
  updating,
  approving,
  rejecting,
  onUpdateStatus,
  onApprove,
  onRejectClick,
  onEdit,
  onDelete,
  onStar,
  onViewDetails,
  getPriorityConfig,
  getStatusConfig,
  formatDate,
  getRelativeTime,
}: any) {
  const isAssignee = task.assignedTo?._id === user?._id;
  const isOverdue =
    new Date(task.deadline) < new Date() && task.status !== "completed";
  const isRejected = task.status === "rejected";
  const hasEvidence = task.evidenceUrls && task.evidenceUrls.length > 0;
  const rejectionReason = task.rejectionReason || "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/50 shadow-md overflow-hidden ${isRejected
        ? "border-red-200 hover:border-red-300"
        : "border-gray-200 hover:border-indigo-300"
        }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-700 pointer-events-none" />

      <div
        className={`h-1 bg-gradient-to-r ${isRejected
          ? "from-red-400 to-red-600"
          : getPriorityConfig(task.priority).gradient
          }`}
      />

      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color} shadow-sm flex items-center gap-1`}
            >
              <span>{getPriorityConfig(task.priority).icon}</span>
              {task.priority.toUpperCase()}
            </span>
            <span
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color} shadow-sm flex items-center gap-1`}
            >
              <span>{getStatusConfig(task.status).icon}</span>
              {task.status.replace("_", " ").toUpperCase()}
            </span>

            {hasEvidence && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-1">
                <Paperclip size={10} />
                Evidence ({task.evidenceUrls.length})
              </span>
            )}

            {isRejected && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 flex items-center gap-1 animate-pulse">
                <X size={10} />
                Rejected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStar(task._id)}
              className="p-1.5 text-gray-300 hover:text-amber-400 transition-all hover:scale-110"
            >
              <Star
                size={14}
                className={`transition-all ${task.isStarred ? "fill-amber-400 text-amber-400" : ""
                  }`}
              />
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => onDelete(task._id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        <h3 className="text-gray-800 font-semibold text-base mb-2 line-clamp-2 group-hover:text-indigo-600 transition-all duration-300">
          {task.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>

        {isRejected && rejectionReason && (
          <div className="mb-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs font-medium text-red-700">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-600 mt-0.5 line-clamp-2">
                  {rejectionReason}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {task.projectId && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/50">
              <Briefcase size={10} />
              <span>{task.projectId.name}</span>
            </div>
          )}
          {isOverdue && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/50 animate-pulse">
              <AlertCircle size={10} />
              <span>Overdue</span>
            </div>
          )}
          {hasEvidence && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
              <Paperclip size={10} />
              <span>Has Evidence</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
                <span className="text-white text-[10px] font-bold">
                  {task.assignedTo?.fullName?.charAt(0) || "?"}
                </span>
              </div>
              {task.assignedTo?._id === user?._id && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <p className="text-gray-800 text-[11px] font-medium leading-tight">
                {task.assignedTo?.fullName || "Unassigned"}
              </p>
              <p className="text-gray-400 text-[9px] flex items-center gap-1">
                <ClockIcon size={8} />
                {getRelativeTime(task.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <Calendar size={10} />
              <span className={isOverdue ? "text-rose-500 font-semibold" : ""}>
                {formatDate(task.deadline)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100/80">
          {task.status === "pending" && (
            <button
              onClick={() => onUpdateStatus(task._id, "in_progress")}
              disabled={updating}
              className="flex-1 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 hover:from-indigo-600 hover:to-indigo-700 text-indigo-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-indigo-200/50 hover:border-transparent shadow-sm hover:shadow-md"
            >
              <Play size={12} />
              Start
            </button>
          )}

          {task.status === "in_progress" && (
            <button
              onClick={() => onUpdateStatus(task._id, "submitted")}
              disabled={updating}
              className="flex-1 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-600 hover:to-purple-700 text-purple-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-purple-200/50 hover:border-transparent shadow-sm hover:shadow-md"
            >
              <Send size={12} />
              Submit
            </button>
          )}

          {task.status === "submitted" && canApprove && (
            <>
              <button
                onClick={() => onApprove(task._id)}
                disabled={approving}
                className="flex-1 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 hover:from-emerald-600 hover:to-emerald-700 text-emerald-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-emerald-200/50 hover:border-transparent shadow-sm hover:shadow-md"
              >
                <ThumbsUp size={12} />
                Approve
              </button>
              <button
                onClick={() => onRejectClick(task)}
                className="flex-1 py-1.5 bg-gradient-to-r from-rose-50 to-rose-100/50 hover:from-rose-600 hover:to-rose-700 text-rose-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-rose-200/50 hover:border-transparent shadow-sm hover:shadow-md"
              >
                <ThumbsDown size={12} />
                Reject
              </button>
            </>
          )}

          {task.status === "rejected" && (
            <button
              onClick={() => onUpdateStatus(task._id, "pending")}
              disabled={updating}
              className="flex-1 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-600 hover:to-amber-700 text-amber-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-amber-200/50 hover:border-transparent shadow-sm hover:shadow-md"
            >
              <RefreshCw size={12} />
              Rework
            </button>
          )}

          <button
            onClick={() => onViewDetails(task)}
            className="py-1.5 px-3 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-gray-200/50 hover:border-transparent shadow-sm hover:shadow-md"
          >
            <Eye size={12} />
            View
          </button>
          <Link
            href={`/tasks/${task._id}`}
            className="py-1.5 px-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-600 hover:to-purple-600 text-indigo-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-indigo-200/50 hover:border-transparent shadow-sm hover:shadow-md"
          >
            <ExternalLink size={12} />
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}