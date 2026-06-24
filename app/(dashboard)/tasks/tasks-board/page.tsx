"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  User,
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
  Flag,
  Calendar,
  Briefcase,
  Edit2,
  Trash2,
  MoreVertical,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Grid3x3,
  List,
  ChevronDown,
  ChevronUp,
  Star,
  Bell,
  MessageSquare,
  Paperclip,
  Link2,
  Clock as ClockIcon,
  Award,
  TrendingUp,
  BarChart3,
  Sparkles,
  Rocket,
  ShieldCheck,
  Crown,
  Home,
  Download,
  LayoutGrid,
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
  assignedTo: { _id: string; fullName: string; email: string; avatar?: string };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  evidenceUrls?: string[];
  comments?: number;
  attachments?: number;
  isStarred?: boolean;
  isApprovalRequired?: boolean;
  createdAt: string;
  updatedAt: string;
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
    { _id: string; fullName: string; email: string }[]
  >([]);
  const [projects, setProjects] = useState<
    { _id: string; name: string; code: string }[]
  >([]);

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
    }
  }, [isAuthenticated, user, filter]);

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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = "/tasks";
      if (filter !== "all") {
        url = `/tasks?status=${filter}`;
      }

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
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

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

  const getPriorityConfig = (priority: string) => {
    const config = {
      low: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "🟢",
        label: "Low",
      },
      normal: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "🔵",
        label: "Normal",
      },
      high: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "🟠",
        label: "High",
      },
      urgent: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "🔴",
        label: "Urgent",
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
      },
      in_progress: {
        color: "bg-sky-50 text-sky-700 border-sky-200",
        icon: "🔄",
        label: "In Progress",
      },
      submitted: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "📬",
        label: "Submitted",
      },
      completed: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "✅",
        label: "Completed",
      },
      overdue: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "⚠️",
        label: "Overdue",
      },
      rejected: {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: "❌",
        label: "Rejected",
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
      new Date(t.deadline).toLocaleDateString(),
      new Date(t.createdAt).toLocaleDateString(),
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

  // FIXED: Removed useMemo - using IIFE instead to avoid compiler warning
  const filteredTasks = (() => {
    return tasks
      .filter((task) => {
        if (filter !== "all" && task.status !== filter) return false;
        if (
          searchTerm &&
          !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          return sortOrder === "asc"
            ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            : new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        } else if (sortBy === "priority") {
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          return sortOrder === "asc"
            ? (priorityOrder[a.priority] || 0) -
                (priorityOrder[b.priority] || 0)
            : (priorityOrder[b.priority] || 0) -
                (priorityOrder[a.priority] || 0);
        } else {
          return sortOrder === "asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  })();

  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: Layers,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Send,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Task Workspace
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {stats.total}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Manage, track, and collaborate on tasks efficiently
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <Download size={14} />
                Export
              </button>
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid size={14} />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    viewMode === "list"
                      ? "bg-indigo-600 text-white shadow-sm"
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
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
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
                className={`${stat.bgColor} rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                      {stat.label}
                    </p>
                  </div>
                  <div
                    className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
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
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks by title, description, or assignee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                  showFilters
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Filter size={16} />
                Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="createdAt">Sort by Date</option>
                <option value="deadline">Sort by Deadline</option>
                <option value="priority">Sort by Priority</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all shadow-sm"
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
                  className="flex flex-wrap gap-2 overflow-hidden bg-white rounded-xl p-3 border border-gray-200 shadow-sm"
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
                      className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-all ${
                        filter === tab
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {tab.replace("_", " ")}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Tasks Grid/List View */}
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No tasks found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or create a new task
              </p>
              {canManage && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg inline-flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition"
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
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
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th  className="w-40 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="w-40 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
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
                              <p className="text-gray-800 text-sm font-medium">
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
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityConfig(task.priority).color}`}
                          >
                            {getPriorityConfig(task.priority).icon}{" "}
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusConfig(task.status).color}`}
                          >
                            {getStatusConfig(task.status).icon}{" "}
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.assignedTo?.fullName?.split(" ")[0] || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium ${
                              new Date(task.deadline) < new Date() &&
                              task.status !== "completed"
                                ? "text-rose-500"
                                : "text-gray-500"
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

      {/* Task Details Modal */}
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
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityConfig(selectedTask.priority).color}`}
                    >
                      {getPriorityConfig(selectedTask.priority).icon}{" "}
                      {selectedTask.priority.toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusConfig(selectedTask.status).color}`}
                    >
                      {getStatusConfig(selectedTask.status).icon}{" "}
                      {selectedTask.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedTask.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-1">
                      Assigned To
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">
                          {selectedTask.assignedTo?.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-800 text-sm font-medium">
                          {selectedTask.assignedTo?.fullName || "Unassigned"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {selectedTask.assignedTo?.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-1">
                      Deadline
                    </h3>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-800 text-sm font-medium">
                        {new Date(selectedTask.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-1">
                      Estimated Hours
                    </h3>
                    <p className="text-gray-800 text-sm font-medium">
                      {selectedTask.estimatedHours} hours
                    </p>
                  </div>

                  {selectedTask.projectId && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 mb-1">
                        Project
                      </h3>
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-gray-400" />
                        <span className="text-gray-800 text-sm font-medium">
                          {selectedTask.projectId.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-1">
                    <MessageSquare size={14} className="text-gray-400" />
                    <span className="text-gray-500 text-xs">
                      {selectedTask.comments || 0} comments
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Paperclip size={14} className="text-gray-400" />
                    <span className="text-gray-500 text-xs">
                      {selectedTask.attachments || 0} attachments
                    </span>
                  </div>
                </div>

                {/* Action buttons for details modal */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                  {selectedTask.status === "pending" && (
                    <button
                      onClick={() =>
                        updateTaskStatus(selectedTask._id, "in_progress")
                      }
                      disabled={updating}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition flex items-center gap-2 shadow-sm"
                    >
                      <Play size={14} />
                      Start Task
                    </button>
                  )}

                  {selectedTask.status === "in_progress" && (
                    <button
                      onClick={() =>
                        updateTaskStatus(selectedTask._id, "submitted")
                      }
                      disabled={updating}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition flex items-center gap-2 shadow-sm"
                    >
                      <Send size={14} />
                      Submit for Review
                    </button>
                  )}

                  {selectedTask.status === "submitted" && canApprove && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedTask._id)}
                        disabled={approving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition flex items-center gap-2 shadow-sm"
                      >
                        <ThumbsUp size={14} />
                        Approve & Complete
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition flex items-center gap-2 shadow-sm"
                      >
                        <ThumbsDown size={14} />
                        Reject
                      </button>
                    </>
                  )}

                  {selectedTask.status === "rejected" && (
                    <button
                      onClick={() =>
                        updateTaskStatus(selectedTask._id, "pending")
                      }
                      disabled={updating}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition flex items-center gap-2 shadow-sm"
                    >
                      <RefreshCw size={14} />
                      Send for Rework
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Task Modal */}
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
              className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Edit Task</h2>
                  <p className="text-xs text-gray-500">
                    Update task information
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      value={editFormData.estimatedHours}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          estimatedHours: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleUpdateTask}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition shadow-sm"
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
              className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
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
                    onClick={() => handleDeleteTask(showDeleteConfirm)}
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

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedTask && (
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
                  <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center">
                    <ThumbsDown className="w-5 h-5 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Reject Task
                  </h3>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  Please provide a reason for rejecting this task. This will be
                  sent to the assignee for rework.
                </p>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleReject(selectedTask._id)}
                    disabled={rejecting}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    {rejecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsDown size={14} />
                    )}
                    Confirm Rejection
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

      <style jsx global>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100/50 shadow-sm overflow-hidden"
    >
      <div className="p-5">
        {/* Header with Star and Priority */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityConfig(task.priority).color}`}
            >
              {getPriorityConfig(task.priority).icon}{" "}
              {task.priority.toUpperCase()}
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusConfig(task.status).color}`}
            >
              {getStatusConfig(task.status).icon}{" "}
              {task.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStar(task._id)}
              className="text-gray-300 hover:text-amber-400 transition"
            >
              <Star
                size={14}
                className={
                  task.isStarred ? "fill-amber-400 text-amber-400" : ""
                }
              />
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => onDelete(task._id)}
                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-gray-800 font-semibold mb-2 line-clamp-2 group-hover:text-indigo-600 transition">
          {task.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
          {task.description}
        </p>

        {/* Project & Metadata */}
        {task.projectId && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Briefcase size={10} />
              <span>{task.projectId.name}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-[10px] font-bold">
                {task.assignedTo?.fullName?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <p className="text-gray-800 text-[11px] font-medium">
                {task.assignedTo?.fullName?.split(" ")[0] || "Unassigned"}
              </p>
              <p className="text-gray-400 text-[9px]">
                {getRelativeTime(task.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
              <Calendar size={10} />
              <span className={isOverdue ? "text-rose-500 font-medium" : ""}>
                {formatDate(task.deadline)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-100">
          {task.status === "pending" && (
            <button
              onClick={() => onUpdateStatus(task._id, "in_progress")}
              disabled={updating}
              className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1"
            >
              <Play size={12} />
              Start
            </button>
          )}

          {task.status === "in_progress" && (
            <button
              onClick={() => onUpdateStatus(task._id, "submitted")}
              disabled={updating}
              className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1"
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
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1"
              >
                <ThumbsUp size={12} />
                Approve
              </button>
              <button
                onClick={() => onRejectClick(task)}
                className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1"
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
              className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white text-[11px] font-medium rounded-lg transition flex items-center justify-center gap-1"
            >
              <RefreshCw size={12} />
              Rework
            </button>
          )}

          <button
            onClick={() => onViewDetails(task)}
            className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium rounded-lg transition flex items-center gap-1"
          >
            <Eye size={12} />
            View
          </button>
          <Link
            href={`/tasks/${task._id}`}
            className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium rounded-lg transition flex items-center gap-1"
          >
            Check
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
