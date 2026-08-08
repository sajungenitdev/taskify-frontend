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
  Sparkles,
  Layers,
  Filter as FilterIcon,
  History,
  Timer as TimerIcon,
  Check,
  Text,
  Send as SendIcon,
  PlayIcon,
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

const getPriorityConfig = (priority: string) => {
  const key = priority as keyof typeof PRIORITY_CONFIG;
  return PRIORITY_CONFIG[key] || PRIORITY_CONFIG.normal;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy] = useState<"deadline" | "priority" | "title">("deadline");
  const [sortOrder] = useState<"asc" | "desc">("asc");
  const [filterType, setFilterType] = useState<"all" | "today" | "overdue" | "done">("all");

  // Evidence Modal state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

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

  const openEvidenceModal = (task: Task) => {
    setEvidenceTask(task);
    setEvidenceText("");
    setShowEvidenceModal(true);
  };

  const closeEvidenceModal = () => {
    setShowEvidenceModal(false);
    setEvidenceTask(null);
    setEvidenceText("");
  };

  const handleSubmitWithEvidence = async () => {
    if (!evidenceTask) return;
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

      await api.post(`/tasks/${evidenceTask._id}/evidence`, {
        evidenceUrls: evidenceUrls,
      });

      let actualMinutes = evidenceTask.actualMinutes || 0;

      if (isTimerActiveForTask(evidenceTask._id)) {
        try {
          const timerResult = await stopTimerAutomatically(evidenceTask._id);
          if (timerResult.success && timerResult.minutes > 0) {
            actualMinutes = timerResult.minutes;
          }
        } catch (timerError) {
          console.warn("Timer stop error:", timerError);
        }
      }

      const response = await api.patch(`/tasks/${evidenceTask._id}/complete`, {
        actualMinutes: actualMinutes,
        approvalNote: "Task completed with evidence",
      });

      if (response.data.success) {
        toast.success("✅ Task completed with evidence!");
        setShowEvidenceModal(false);
        setEvidenceTask(null);
        setEvidenceText("");
        await fetchMyTasks();
      } else {
        throw new Error("Failed to complete task");
      }
    } catch (error: any) {
      console.error("Error submitting evidence:", error);
      toast.error(error.response?.data?.message || "Failed to complete task with evidence");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleCheckboxClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (task.status === "completed") {
      toast.info("Task is already completed");
      return;
    }

    openEvidenceModal(task);
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/tasks/${task._id}`);
  };

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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterType === "all"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterType("today")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterType === "today"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
          >
            Today ({stats.pending + stats.inProgress})
          </button>
          <button
            onClick={() => setFilterType("overdue")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterType === "overdue"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
          >
            Overdue ({stats.overdue})
          </button>
          <button
            onClick={() => setFilterType("done")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterType === "done"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
          >
            Done ({stats.completed})
          </button>
        </div>

        {/* Search Bar & Dropdowns */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-sm"
            />
          </div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-sm"
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
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-sm"
          >
            <option value="">Deadline: any</option>
            <option value="pending">Pending</option>
            <option value="in_progress">Running</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Tasks List View */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
                const isCompleted = task.status === "completed";
                const isSubmitted = task.status === "submitted";
                // Only mark as overdue if NOT completed and NOT submitted
                const isOverdue = !isCompleted && !isSubmitted && (task.status === "overdue" || new Date(task.deadline) < new Date());
                const dueDateStr = formatDateFull(task.deadline);
                const priorityConfig = getPriorityConfig(task.priority);
                const hasEvidence = task.evidenceUrls && task.evidenceUrls.length > 0;
                const needsEvidence = task.evidenceRequired && !hasEvidence;

                return (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition cursor-pointer group"
                  >
                    {/* Left: Checkbox & Title */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
                      <button
                        type="button"
                        onClick={(e) => handleCheckboxClick(task, e)}
                        disabled={isCompleted}
                        className="flex-shrink-0 focus:outline-none relative group/checkbox"
                        title={isCompleted ? "Completed" : "Click to submit evidence and complete"}
                      >
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center transition shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : needsEvidence ? (
                          <div className="w-5 h-5 rounded-full bg-amber-200 border-2 border-amber-400 flex items-center justify-center transition shadow-sm hover:bg-amber-300 cursor-pointer">
                            <Paperclip className="w-2.5 h-2.5 text-amber-700" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-blue-500 transition" />
                        )}
                        {needsEvidence && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                        )}
                      </button>
                      <div className="flex items-center gap-2 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}
                        >
                          {task.title}
                        </p>
                        {needsEvidence && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 flex-shrink-0">
                            <Paperclip className="w-2.5 h-2.5" />
                            Evidence
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Running status/Due date & Priority Badge */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {isCompleted ? (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md">
                          <Check className="w-3 h-3" />
                          Completed
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-xs font-medium text-purple-600 flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-md">
                          Submitted
                        </span>
                      ) : isRunning ? (
                        <span className="text-xs font-medium text-blue-600 flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          Running
                        </span>
                      ) : isTimerActive ? (
                        <span className="text-xs font-medium text-amber-600 flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Paused
                        </span>
                      ) : task.status === "in_progress" ? (
                        <span className="text-xs font-medium text-sky-600 flex items-center gap-1.5 bg-sky-50 px-2.5 py-1 rounded-md">
                          <PlayIcon className="w-3 h-3" />
                          Running
                        </span>
                      ) : task.status === "rejected" ? (
                        <span className="text-xs font-medium text-rose-600 flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-md">
                          Rejected
                        </span>
                      ) : dueDateStr ? (
                        <span className={`text-xs font-medium ${isOverdue ? "text-rose-500" : "text-gray-500"}`}>
                          {dueDateStr}
                        </span>
                      ) : null}

                      <span className={`text-xs font-medium px-2.5 py-1 rounded-xl border ${priorityConfig.bg} ${priorityConfig.border} ${priorityConfig.text}`}>
                        {priorityConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${currentPage === pageNum
                          ? "bg-blue-600 text-white shadow-sm"
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

      {/* ============ EVIDENCE SUBMISSION MODAL ============ */}
      <AnimatePresence>
        {showEvidenceModal && evidenceTask && (
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
                  <p className="text-xs text-gray-500">Evidence is required to complete this task</p>
                </div>
                <button
                  onClick={closeEvidenceModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Task</p>
                  <p className="text-sm font-medium text-gray-800">{evidenceTask.title}</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
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
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingEvidence ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <SendIcon className="w-4 h-4" />
                        Submit & Complete
                      </>
                    )}
                  </button>
                  <button
                    onClick={closeEvidenceModal}
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