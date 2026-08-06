// app/(dashboard)/tasks/my/EmployeeTasksPage.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  Flag,
  User,
  FolderKanban,
  Timer,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Grid,
  AlertTriangle,
  Paperclip,
  Plus,
  Home,
  Download,
  Activity,
  Send,
  Play,
  Pause,
  Square,
  EyeIcon,
  Sparkles,
  Layers,
  Filter as FilterIcon,
  History,
  Timer as TimerIcon,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue" | "rejected";
  deadline: string;
  estimatedHours: number;
  actualMinutes: number;
  projectId?: {
    _id: string;
    name: string;
    code: string;
  };
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  isStarred?: boolean;
  evidenceRequired?: boolean;
  evidenceUrls?: string[];
  rejectionReason?: string;
  approvalNote?: string;
  isTimerRunning?: boolean;
  timerStartTime?: string;
  elapsedTime?: number;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },
  high: {
    label: "High",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  normal: {
    label: "Normal",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  low: {
    label: "Low",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
} as const;

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  overdue: {
    label: "Overdue",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
  },
} as const;

const getPriorityConfig = (priority: string) => {
  const key = priority as keyof typeof PRIORITY_CONFIG;
  return PRIORITY_CONFIG[key] || PRIORITY_CONFIG.normal;
};

const getStatusConfig = (status: string) => {
  const key = status as keyof typeof STATUS_CONFIG;
  return STATUS_CONFIG[key] || STATUS_CONFIG.pending;
};

export default function EmployeeTasksPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    stopTimerAutomatically,
    formatTime,
    formatTimeShort,
    getDisplayTimeForTask,
    isTimerActiveForTask,
    isTimerRunning,
    activeTimerTaskId,
    resetTimer,
    isTimerValidForUser,
  } = useTimer();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "grid">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy] = useState<"deadline" | "priority" | "title">("deadline");
  const [sortOrder] = useState<"asc" | "desc">("asc");
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "today" | "overdue" | "done">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isReworking, setIsReworking] = useState<string | null>(null);

  const itemsPerPage = 10;

  const isTaskAssignee = useCallback((task: Task): boolean => {
    if (!user || !task) return false;
    if (task.assignedTo && typeof task.assignedTo === 'object') {
      const assigneeId = task.assignedTo._id || (task.assignedTo as any).id;
      const userId = user._id || (user as any).id;
      return assigneeId === userId;
    }
    if (typeof task.assignedTo === 'string') {
      return task.assignedTo === (user._id || (user as any).id);
    }
    return false;
  }, [user]);

  const isTimerValidForCurrentUser = useCallback((): boolean => {
    if (!user) return false;
    const userId = user._id || (user as any).id || '';
    return isTimerValidForUser(userId);
  }, [user, isTimerValidForUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchMyTasks();
  }, [isAuthenticated, router]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks/my-tasks");
      if (response.data.success) {
        const enrichedTasks = (response.data.data || []).map((task: Task) => ({
          ...task,
          isStarred: false,
        }));
        setTasks(enrichedTasks);
      } else if (Array.isArray(response.data)) {
        const enrichedTasks = response.data.map((task: Task) => ({
          ...task,
          isStarred: false,
        }));
        setTasks(enrichedTasks);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      if (error.response?.status === 404) {
        setTasks([]);
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    if (isCompleting === taskId) return;
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    if (task.evidenceRequired && (!task.evidenceUrls || task.evidenceUrls.length === 0)) {
      toast.error("⚠️ Evidence required! Please upload evidence before completing this task.");
      return;
    }

    setIsCompleting(taskId);
    try {
      let actualMinutes = task.actualMinutes || 0;
      if (isTimerActiveForTask(taskId)) {
        const timerResult = await stopTimerAutomatically(taskId);
        if (timerResult.success && timerResult.minutes > 0) {
          actualMinutes = timerResult.minutes;
        }
      }

      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "completed",
        actualMinutes: actualMinutes,
        approvalNote: "Task marked as complete by assignee",
      });

      if (response.data.success) {
        toast.success(`✅ Task completed!`);
        await fetchMyTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to mark task as complete");
    } finally {
      setIsCompleting(null);
    }
  };

  const handleSubmitForReview = async (taskId: string) => {
    if (isSubmitting === taskId) return;
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    if (task.evidenceRequired && (!task.evidenceUrls || task.evidenceUrls.length === 0)) {
      toast.error("⚠️ Evidence required! Please upload evidence before submitting.");
      return;
    }

    setIsSubmitting(taskId);
    try {
      if (isTimerActiveForTask(taskId)) {
        await stopTimerAutomatically(taskId);
      }

      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "submitted",
      });

      if (response.data.success) {
        toast.success(`✅ Task submitted for review!`);
        await fetchMyTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit task");
    } finally {
      setIsSubmitting(null);
    }
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
        await fetchMyTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send for rework");
    } finally {
      setIsReworking(null);
    }
  };

  const handleStartTimer = async (taskId: string) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) {
      toast.error("Task not found");
      return;
    }

    if (!isTaskAssignee(task)) {
      toast.error("You don't have permission to start timer for this task");
      return;
    }

    if (activeTimerTaskId && activeTimerTaskId !== taskId) {
      if (isTimerValidForCurrentUser()) {
        toast.error(
          `⚠️ A timer is already running for another task. Please stop that timer first.`,
          { duration: 4000 }
        );
        return;
      } else {
        resetTimer();
      }
    }

    const baselineSeconds = (task.actualMinutes || 0) * 60;
    startTimer(taskId, baselineSeconds);
    toast.success(`⏱️ Timer started for "${task.title}"`);
  };

  const handlePauseTimer = () => {
    pauseTimer();
    toast.success("⏸️ Timer paused");
  };

  const handleResumeTimer = () => {
    resumeTimer();
    toast.success("▶️ Timer resumed");
  };

  const handleStopTimer = async (taskId: string) => {
    try {
      const result = await stopTimer(taskId);
      if (result.success && result.minutes > 0) {
        toast.success(`⏱️ Time tracked: ${result.displayTime}`);
        await fetchMyTasks();
      } else if (result.success) {
        toast.success("⏱️ Timer stopped");
      }
      return result;
    } catch (error) {
      toast.error("Failed to stop timer");
      return { success: false, minutes: 0, displayTime: "0m" };
    }
  };

  const getTotalTimeForTask = useCallback((task: Task) => {
    if (!task) return { minutes: 0, display: "0m" };
    let totalMinutes = task.actualMinutes || 0;
    if (isTimerActiveForTask(task._id)) {
      const currentMinutes = Math.floor(timerState.elapsedSeconds / 60);
      totalMinutes = (task.actualMinutes || 0) + currentMinutes;
    }
    return {
      minutes: totalMinutes,
      display: formatTimeShort(totalMinutes * 60)
    };
  }, [timerState, isTimerActiveForTask, formatTimeShort]);

  // Helper functions for filtering
  const filterByType = useCallback((task: Task, filterType: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.deadline);
    dueDate.setHours(0, 0, 0, 0);

    switch (filterType) {
      case "today": {
        const matchesToday = dueDate.getTime() === today.getTime() ||
          (task.status !== 'completed' && task.status !== 'submitted' && task.status !== 'rejected');
        return matchesToday;
      }
      case "overdue": {
        if (task.status === "completed" || task.status === "submitted") return false;
        return dueDate < today;
      }
      case "done": {
        return task.status === "completed";
      }
      default:
        return true;
    }
  }, []);

  const matchesSearch = useCallback((task: Task, search: string) => {
    if (!search) return true;
    return task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
  }, []);

  const matchesPriority = useCallback((task: Task, priority: string) => {
    if (!priority) return true;
    return task.priority === priority;
  }, []);

  const matchesStatus = useCallback((task: Task, status: string) => {
    if (!status) return true;
    return task.status === status;
  }, []);

  const sortTasks = useCallback((tasks: Task[], sortBy: string, sortOrder: string) => {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "deadline":
          aVal = new Date(a.deadline).getTime();
          bVal = new Date(b.deadline).getTime();
          break;
        case "priority": {
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        }
        case "title":
          aVal = a.title;
          bVal = b.title;
          break;
        default:
          aVal = a.title;
          bVal = b.title;
      }
      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, []);

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const searchMatch = matchesSearch(task, searchTerm);
      const priorityMatch = matchesPriority(task, selectedPriority);
      const statusMatch = matchesStatus(task, selectedStatus);
      const typeMatch = filterByType(task, filterType);
      return searchMatch && priorityMatch && statusMatch && typeMatch;
    });

    return sortTasks(filtered, sortBy, sortOrder);
  }, [
    tasks,
    searchTerm,
    selectedPriority,
    selectedStatus,
    filterType,
    sortBy,
    sortOrder,
    matchesSearch,
    matchesPriority,
    matchesStatus,
    filterByType,
    sortTasks,
  ]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    submitted: tasks.filter((t) => t.status === "submitted").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
    rejected: tasks.filter((t) => t.status === "rejected").length,
  };

  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 w-full max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-700 transition flex items-center gap-1">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-gray-900 font-medium">My Tasks</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage and track tasks assigned to you</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg flex items-center gap-2 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
            <button
              onClick={fetchMyTasks}
              className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterType("today")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === "today"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Today ({stats.pending + stats.inProgress})
          </button>
          <button
            onClick={() => setFilterType("overdue")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === "overdue"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Overdue ({stats.overdue})
          </button>
          <button
            onClick={() => setFilterType("done")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === "done"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            Done ({stats.completed})
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-md transition ${showFilters ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:bg-gray-100"
                }`}
            >
              <FilterIcon className="w-4 h-4" />
            </button>
            <div className="flex bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition ${view === "list" ? "bg-white shadow-sm" : ""
                  }`}
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition ${view === "grid" ? "bg-white shadow-sm" : ""
                  }`}
              >
                <Grid className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 relative min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            />
          </div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
          >
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Filters Expand */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex flex-wrap gap-2 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedPriority("");
                    setSelectedStatus("");
                    setFilterType("all");
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasks List View */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {paginatedTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tasks found</p>
              </div>
            ) : (
              paginatedTasks.map((task) => {
                const isTimerActive = isTimerActiveForTask(task._id);
                const isRunning = isTimerActive && timerState.isRunning;
                const displayTime = getDisplayTimeForTask(task._id, task.actualMinutes);
                const totalTime = getTotalTimeForTask(task);
                const isAssignee = isTaskAssignee(task);
                const isTaskTimerValid = isAssignee && isTimerValidForCurrentUser();
                const isCompleted = task.status === "completed";
                const isOverdue = task.status === "overdue";
                const dueDateStr = formatDateFull(task.deadline);

                return (
                  <div
                    key={task._id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer group ${isCompleted ? "bg-gray-50/50" : ""
                      }`}
                    onClick={() => setSelectedTask(task)}
                  >
                    {/* Checkbox/Status indicator */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-indigo-400 transition" />
                      )}
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {task.title}
                        </p>
                        {isTimerActive && isTaskTimerValid && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                            {displayTime}
                          </span>
                        )}
                        {task.status === "in_progress" && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Running
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityConfig(task.priority).bg} ${getPriorityConfig(task.priority).border} ${getPriorityConfig(task.priority).text}`}>
                          {task.priority}
                        </span>
                        {dueDateStr && (
                          <span className={`text-xs ${isOverdue ? "text-rose-500" : isCompleted ? "text-gray-400" : "text-gray-500"}`}>
                            {dueDateStr}
                          </span>
                        )}
                        {task.evidenceRequired && (
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            Evidence
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isCompleted && isAssignee && (
                        <>
                          {isTimerActive && isTaskTimerValid ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  isRunning ? handlePauseTimer() : handleResumeTimer();
                                }}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStopTimer(task._id);
                                }}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTimer(task._id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              disabled={!!activeTimerTaskId && activeTimerTaskId !== task._id}
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkComplete(task._id);
                            }}
                            disabled={isCompleting === task._id}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-40"
                          >
                            {isCompleting === task._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubmitForReview(task._id);
                            }}
                            disabled={isSubmitting === task._id}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition disabled:opacity-40"
                          >
                            {isSubmitting === task._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedTask.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityConfig(selectedTask.priority).bg} ${getPriorityConfig(selectedTask.priority).border} ${getPriorityConfig(selectedTask.priority).text}`}>
                      {selectedTask.priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusConfig(selectedTask.status).bg} ${getStatusConfig(selectedTask.status).border} ${getStatusConfig(selectedTask.status).text}`}>
                      {selectedTask.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-gray-600 text-sm">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Project</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {selectedTask.projectId?.name || "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {new Date(selectedTask.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Time Tracked</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {getDisplayTimeForTask(selectedTask._id, selectedTask.actualMinutes)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Assigned By</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {selectedTask.assignedBy?.fullName || "-"}
                    </p>
                  </div>
                </div>

                {/* Timer Controls */}
                {isTaskAssignee(selectedTask) && selectedTask.status !== "completed" && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                    <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <TimerIcon className="w-4 h-4 text-indigo-600" />
                      Time Tracking
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {isTimerActiveForTask(selectedTask._id) && isTimerValidForCurrentUser() ? (
                        <>
                          <div className="flex-1">
                            <span className="text-2xl font-mono font-bold text-indigo-700">
                              {formatTime(timerState.elapsedSeconds)}
                            </span>
                            <span className={`text-xs font-medium ml-2 ${isTimerRunning ? "text-emerald-600" : "text-amber-600"}`}>
                              {isTimerRunning ? "● Running" : "● Paused"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {isTimerRunning ? (
                              <button onClick={handlePauseTimer} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition">
                                <Pause className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={handleResumeTimer} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition">
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleStopTimer(selectedTask._id)} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg transition">
                              <Square className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <span className="text-sm text-gray-500">
                              {selectedTask.actualMinutes ? `${selectedTask.actualMinutes}m logged` : "No time tracked"}
                            </span>
                          </div>
                          <button
                            onClick={() => handleStartTimer(selectedTask._id)}
                            disabled={!!activeTimerTaskId && activeTimerTaskId !== selectedTask._id}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition disabled:opacity-50"
                          >
                            <Play className="w-4 h-4" />
                            Start Timer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200 flex-wrap">
                  {isTaskAssignee(selectedTask) && selectedTask.status !== "completed" && selectedTask.status !== "submitted" && selectedTask.status !== "rejected" && (
                    <>
                      <button
                        onClick={() => handleSubmitForReview(selectedTask._id)}
                        disabled={isSubmitting === selectedTask._id}
                        className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting === selectedTask._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit Review
                      </button>
                      <button
                        onClick={() => handleMarkComplete(selectedTask._id)}
                        disabled={isCompleting === selectedTask._id}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCompleting === selectedTask._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Complete
                      </button>
                    </>
                  )}
                  {selectedTask.status === "rejected" && isTaskAssignee(selectedTask) && (
                    <button
                      onClick={() => handleSendForRework(selectedTask._id)}
                      disabled={isReworking === selectedTask._id}
                      className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isReworking === selectedTask._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Send for Rework
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={() => {
          fetchMyTasks();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}