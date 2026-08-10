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
  GitBranch,
  ChevronDown,
  ChevronUp,
  Gem,
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
  // 🆕 NEW FIELDS
  isMilestone?: boolean;
  parentTaskId?: string | null | { _id: string; title: string; status: string };
  subTaskCount?: number;
  completedSubTaskCount?: number;
  progress?: number;
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

// ============ SUB-TASK TREE COMPONENT ============
const SubTaskTreeItem = ({
  task,
  onTaskClick,
  level = 0,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSubTasks, setShowSubTasks] = useState(false);

  const hasSubTasks = (task.subTaskCount || 0) > 0;
  const isMilestone = task.isMilestone === true;
  const isParent = !isMilestone && hasSubTasks;

  const fetchSubTasks = useCallback(async () => {
    if (!task._id) return;
    setLoading(true);
    try {
      const response = await api.get(`/tasks/${task._id}/subtasks`);
      if (response.data.success) {
        setSubTasks(response.data.data || []);
        setShowSubTasks(true);
      }
    } catch (error) {
      console.error("Error fetching sub-tasks:", error);
      toast.error("Failed to load sub-tasks");
    } finally {
      setLoading(false);
    }
  }, [task._id]);

  const toggleExpand = () => {
    if (!showSubTasks) {
      fetchSubTasks();
    } else {
      setShowSubTasks(!showSubTasks);
    }
  };

  const progress = task.progress || 0;
  const isCompleted = task.status === "completed";

  return (
    <div className="relative">
      {/* Task Row */}
      <div
        className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer group ${isMilestone ? "bg-purple-50/50 border-l-4 border-purple-400" : ""
          } ${isCompleted ? "opacity-70" : ""}`}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => onTaskClick(task)}
      >
        {/* Expand/Collapse Button */}
        {isParent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            className="p-1 hover:bg-gray-200 rounded-lg transition shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : showSubTasks ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}

        {/* Icon */}
        {isMilestone ? (
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <Gem className="w-4 h-4 text-purple-500" />
          </div>
        ) : isParent ? (
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <GitBranch className="w-4 h-4 text-blue-500" />
          </div>
        ) : (
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <CheckSquare className={`w-4 h-4 ${isCompleted ? "text-emerald-500" : "text-gray-400"}`} />
          </div>
        )}

        {/* Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${isMilestone ? "text-purple-700" : isCompleted ? "text-gray-400 line-through" : "text-gray-800"
              }`}>
              {task.title}
            </span>
            {isMilestone && (
              <span className="text-[8px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                MILESTONE
              </span>
            )}
            {isParent && (
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {task.completedSubTaskCount || 0}/{task.subTaskCount || 0} sub-tasks
              </span>
            )}
            {progress > 0 && !isMilestone && !isCompleted && (
              <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {progress}%
              </span>
            )}
            {/* Status Badge */}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${task.status === "completed" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
              task.status === "in_progress" ? "bg-sky-50 border-sky-200 text-sky-700" :
                task.status === "submitted" ? "bg-purple-50 border-purple-200 text-purple-700" :
                  task.status === "overdue" ? "bg-rose-50 border-rose-200 text-rose-700" :
                    task.status === "rejected" ? "bg-red-50 border-red-200 text-red-700" :
                      "bg-amber-50 border-amber-200 text-amber-700"
              }`}>
              {task.status.replace("_", " ")}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{task.description}</p>
          )}
        </div>

        {/* Project & Deadline */}
        <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
          {task.projectId && (
            <span className="flex items-center gap-1">
              <FolderKanban className="w-3 h-3" />
              {task.projectId.name}
            </span>
          )}
          {task.deadline && (
            <span className={`flex items-center gap-1 ${new Date(task.deadline) < new Date() && !isCompleted ? "text-rose-500" : ""}`}>
              <Calendar className="w-3 h-3" />
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {task.assignedTo?.fullName || 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Sub-tasks */}
      {isParent && showSubTasks && subTasks.length > 0 && (
        <div className="mt-1 space-y-1">
          {subTasks.map((subTask) => (
            <SubTaskTreeItem
              key={subTask._id}
              task={subTask}
              onTaskClick={onTaskClick}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* No sub-tasks message */}
      {isParent && showSubTasks && subTasks.length === 0 && !loading && (
        <div
          className="text-xs text-gray-400 italic p-2"
          style={{ marginLeft: `${(level + 1) * 24 + 40}px` }}
        >
          No sub-tasks found
        </div>
      )}
    </div>
  );
};

// ============ MAIN COMPONENT ============
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
  // 🆕 View mode
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [showParentOnly, setShowParentOnly] = useState(false);

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
      toast.error("Task is already completed");
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

    // 🆕 Filter: Show only parent tasks
    if (showParentOnly) {
      filtered = filtered.filter(task =>
        !task.parentTaskId || task.parentTaskId === null || task.parentTaskId === ''
      );
    }

    return sortTasks(filtered, sortBy, sortOrder);
  }, [
    tasks,
    searchTerm,
    selectedPriority,
    selectedStatus,
    filterType,
    sortBy,
    sortOrder,
    showParentOnly,
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
    milestoneCount: tasks.filter((t) => t.isMilestone === true).length,
    subTaskCount: tasks.filter((t) => t.parentTaskId && t.parentTaskId !== null && t.parentTaskId !== '').length,
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
      <div className=" mx-auto px-4 py-6 w-full container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                {stats.total} total tasks
              </span>
              {stats.milestoneCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200">
                  <Gem className="w-3 h-3" />
                  {stats.milestoneCount} milestones
                </span>
              )}
              {stats.subTaskCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                  <GitBranch className="w-3 h-3" />
                  {stats.subTaskCount} sub-tasks
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* 🆕 View Toggle */}
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${viewMode === "tree"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                <GitBranch className="w-4 h-4" />
                Tree
              </button>
            </div>
            {/* 🆕 Show Parents Only Toggle */}
            <button
              onClick={() => setShowParentOnly(!showParentOnly)}
              className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition shadow-sm ${showParentOnly
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800"
                }`}
            >
              <GitBranch className="w-4 h-4" />
              {showParentOnly ? "Parents Only" : "All Tasks"}
            </button>
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
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Tasks View */}
        {viewMode === "tree" ? (
          // 🆕 TREE VIEW
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">Task Hierarchy</h3>
                <span className="text-xs text-gray-400 ml-2">
                  {filteredTasks.filter(t => !t.parentTaskId || t.parentTaskId === null || t.parentTaskId === '').length} parent tasks
                </span>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16">
                  <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No tasks found</p>
                </div>
              ) : (
                filteredTasks
                  .filter(task => !task.parentTaskId || task.parentTaskId === null || task.parentTaskId === '')
                  .map((task) => (
                    <SubTaskTreeItem
                      key={task._id}
                      task={task}
                      onTaskClick={handleTaskClick}
                    />
                  ))
              )}
              {filteredTasks.filter(task => !task.parentTaskId || task.parentTaskId === null || task.parentTaskId === '').length === 0 && filteredTasks.length > 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <p>All your tasks are sub-tasks. No parent tasks found.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // LIST VIEW (with sub-task indicators)
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
                  const isOverdue = !isCompleted && !isSubmitted && (task.status === "overdue" || new Date(task.deadline) < new Date());
                  const dueDateStr = formatDateFull(task.deadline);
                  const priorityConfig = getPriorityConfig(task.priority);
                  const hasEvidence = task.evidenceUrls && task.evidenceUrls.length > 0;
                  const needsEvidence = task.evidenceRequired && !hasEvidence;
                  const isMilestone = task.isMilestone === true;
                  const isSubTask = task.parentTaskId && task.parentTaskId !== null && task.parentTaskId !== '';
                  const hasSubTasks = (task.subTaskCount || 0) > 0;

                  return (
                    <div
                      key={task._id}
                      onClick={() => handleTaskClick(task)}
                      className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition cursor-pointer group ${isMilestone ? "bg-purple-50/30" : ""} ${isSubTask ? "bg-blue-50/10 ml-6" : ""}`}
                    >
                      {/* Left: Checkbox & Title */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
                        <button
                          type="button"
                          onClick={(e) => handleCheckboxClick(task, e)}
                          disabled={isCompleted}
                          className="shrink-0 focus:outline-none relative group/checkbox"
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
                          {/* 🆕 Type Icon */}
                          {isMilestone && (
                            <Gem className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          )}
                          {isSubTask && (
                            <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                          {hasSubTasks && !isMilestone && (
                            <GitBranch className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <p
                            className={`text-sm font-medium truncate ${isCompleted ? "text-gray-400 line-through" : isMilestone ? "text-purple-700" : "text-gray-800"
                              }`}
                          >
                            {task.title}
                          </p>
                          {/* 🆕 Type Badge */}
                          {isMilestone && (
                            <span className="text-[8px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full shrink-0">
                              MILESTONE
                            </span>
                          )}
                          {isSubTask && (
                            <span className="text-[8px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                              SUB-TASK
                            </span>
                          )}
                          {hasSubTasks && !isMilestone && (
                            <span className="text-[8px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                              {task.completedSubTaskCount || 0}/{task.subTaskCount}
                            </span>
                          )}
                          {needsEvidence && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                              <Paperclip className="w-2.5 h-2.5" />
                              Evidence
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Priority */}
                      <div className="flex items-center gap-4 shrink-0">
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
                            In Progress
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
        )}
      </div>

      {/* ============ EVIDENCE SUBMISSION MODAL ============ */}
      <AnimatePresence>
        {showEvidenceModal && evidenceTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-[440px] p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xl font-bold">
                  📎
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Upload Evidence
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Attach proof of task completion. Required before submitting.
                  </p>
                </div>
              </div>

              <div className="space-y-5 mt-6">
                {/* 4 Options Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-blue-50/20 group">
                    <span className="text-2xl mb-1.5 block">📷</span>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 block">Photo / Image</span>
                  </div>
                  <div className="border border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-blue-50/20 group">
                    <span className="text-2xl mb-1.5 block">📄</span>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 block">PDF / Document</span>
                  </div>
                  <div className="border border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-blue-50/20 group">
                    <span className="text-2xl mb-1.5 block">🔗</span>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 block">URL / Link</span>
                  </div>
                  <div className="border border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 hover:bg-blue-50/20 group">
                    <span className="text-2xl mb-1.5 block">📍</span>
                    <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 block">GPS Location</span>
                  </div>
                </div>

                {/* Uploaded File Item Preview */}
                <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">🖼️</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-800 truncate">
                        completion_screenshot.png
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        1.2 MB · Uploaded ✓
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEvidenceText("")}
                    className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Note input */}
                <div>
                  <input
                    type="text"
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    placeholder="Add a note about this evidence (optional)"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={closeEvidenceModal}
                    className="flex-1 py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl transition-all text-sm shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitWithEvidence}
                    disabled={submittingEvidence}
                    className="flex-1 py-3 px-4 bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingEvidence ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Evidence"
                    )}
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