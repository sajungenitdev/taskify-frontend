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
  LayoutGrid,
  List,
  Zap,
  AlertTriangle,
  Star,
  MessageSquare,
  Paperclip,
  Plus,
  Upload,
  Home,
  Grid,
  Download,
  TrendingUp,
  BarChart3,
  Activity,
  Award,
  Target,
  Rocket,
  Play,
  Pause,
  Square,
  StopCircle,
  Clock as ClockIcon,
  Timer as TimerIcon,
  History,
  PlayCircle,
  EyeIcon,
  Sparkles,
  Gauge,
  Layers,
  Orbit,
  Gem,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { BiTask } from "react-icons/bi";

// ============ TYPES ============
interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue";
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
}

// ============ CONSTANTS ============
const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgent",
    color: "rose",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-gradient-to-br from-rose-50 to-pink-50",
    border: "border-rose-200",
    icon: AlertTriangle,
  },
  high: {
    label: "High",
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    border: "border-amber-200",
    icon: Flag,
  },
  normal: {
    label: "Normal",
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    border: "border-blue-200",
    icon: Flag,
  },
  low: {
    label: "Low",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    border: "border-emerald-200",
    icon: Flag,
  },
} as const;

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "amber",
    gradient: "from-amber-500 to-yellow-600",
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
    border: "border-amber-200",
    icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    color: "sky",
    gradient: "from-sky-500 to-blue-600",
    bg: "bg-gradient-to-br from-sky-50 to-blue-50",
    border: "border-sky-200",
    icon: Activity,
  },
  submitted: {
    label: "Submitted",
    color: "purple",
    gradient: "from-purple-500 to-violet-600",
    bg: "bg-gradient-to-br from-purple-50 to-violet-50",
    border: "border-purple-200",
    icon: CheckCircle,
  },
  completed: {
    label: "Completed",
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-gradient-to-br from-emerald-50 to-green-50",
    border: "border-emerald-200",
    icon: Award,
  },
  overdue: {
    label: "Overdue",
    color: "rose",
    gradient: "from-rose-500 to-red-600",
    bg: "bg-gradient-to-br from-rose-50 to-red-50",
    border: "border-rose-200",
    icon: AlertCircle,
  },
} as const;

// ============ COMPONENTS ============
const StatCard = ({
  icon: Icon,
  label,
  value,
  gradient,
  subtitle,
  delay = 0,
  pulse = false,
}: {
  icon: any;
  label: string;
  value: number | string;
  gradient: string;
  subtitle?: string;
  delay?: number;
  pulse?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, type: "spring", stiffness: 100 }}
    className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" />
    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-white/80 mt-0.5 font-medium">{label}</p>
        {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
      </div>
      <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {pulse && (
      <div className="absolute inset-0 rounded-2xl animate-pulse bg-white/5" />
    )}
  </motion.div>
);

const TaskCard = ({
  task,
  index,
  isTimerActive,
  isRunning,
  displayTime,
  totalTime,
  onSelect,
  onToggleStar,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onStatusChange,
  formatDate,
  formatTime,
  getPriorityColor,
  getStatusColor,
  getPriorityIcon,
  activeTimerTaskId,
  timerState,
  isTimerRunning,
}: any) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.04,
        duration: 0.3,
        type: "spring",
        stiffness: 120,
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelect(task)}
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:border-indigo-300/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-500/10"
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Priority bar */}
      <div
        className={`absolute top-0 left-4 right-4 h-1 rounded-full bg-gradient-to-r ${PRIORITY_CONFIG[task.priority].gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-black text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].border}`}
            >
              {getPriorityIcon(task.priority)}
              {task.priority.toUpperCase()}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-black text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${STATUS_CONFIG[task.status].bg} ${STATUS_CONFIG[task.status].border}`}
            >
              {task.status.replace("_", " ")}
            </span>
            {isTimerActive && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${isRunning ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}
              >
                <ClockIcon className="w-3 h-3" />
                {displayTime}
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                />
              </span>
            )}
            {totalTime > 0 && !isTimerActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 bg-gray-50 border-gray-200 text-gray-600">
                <History className="w-3 h-3" />
                {totalTime}m
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar(task._id);
            }}
            className={`transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <Star
              className={`w-4 h-4 transition-colors ${task.isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-gray-800 font-semibold text-base mb-1.5 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
          {task.description}
        </p>

        {/* Project badge */}
        {task.projectId && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border-2 bg-indigo-50 border-indigo-200 text-indigo-700">
              <FolderKanban className="w-3 h-3" />
              {task.projectId.name}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <span className="text-white text-[10px] font-bold">
                {task.assignedBy?.fullName?.charAt(0) || "?"}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
              Assigned by: {task.assignedBy?.fullName?.split(" ")[0]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {task.estimatedHours > 0 && (
              <div className="flex items-center gap-1 text-gray-400">
                <Timer className="w-3 h-3" />
                <span className="text-[10px] font-medium text-gray-500">
                  {task.estimatedHours}h
                </span>
              </div>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span
                  className={`text-[10px] font-medium ${formatDate(task.deadline) === "Overdue" ? "text-rose-500" : "text-gray-500"}`}
                >
                  {formatDate(task.deadline)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timer Controls */}
        {task.status !== "completed" && task.status !== "submitted" && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {isTimerActive ? (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-xs font-mono font-semibold text-gray-700 tabular-nums">
                        {formatTime(timerState.elapsedSeconds)}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${isRunning ? "text-emerald-600" : "text-amber-600"}`}
                      >
                        {isRunning ? "● Running" : "● Paused"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isRunning ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPauseTimer();
                        }}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs rounded-lg transition-all font-medium hover:scale-105"
                      >
                        <Pause className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResumeTimer();
                        }}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded-lg transition-all font-medium hover:scale-105"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStopTimer(task._id);
                      }}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs rounded-lg transition-all font-medium hover:scale-105"
                    >
                      <Square className="w-3 h-3" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="text-xs text-gray-400">
                      {task.actualMinutes
                        ? `${task.actualMinutes}m logged`
                        : "No time tracked"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartTimer(task._id);
                    }}
                    className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs rounded-lg transition-all font-medium shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50"
                    disabled={activeTimerTaskId !== null}
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </button>
                </>
              )}
              <Link
                href={`/tasks/${task._id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg transition-all font-medium hover:scale-105">
                  <EyeIcon className="w-3 h-3" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============ MAIN COMPONENT ============
export default function MyTasksPage() {
  const { user, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
    formatTimeShort,
    getDisplayTimeForTask,
    isTimerActiveForTask,
    isTimerRunning,
    activeTimerTaskId,
  } = useTimer();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "title">(
    "deadline",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const itemsPerPage = 9;

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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (updatingStatus === taskId) return;
    setUpdatingStatus(taskId);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId
              ? { ...task, status: newStatus as Task["status"] }
              : task,
          ),
        );
        if (newStatus === "completed" && activeTimerTaskId === taskId) {
          await handleStopTimer(taskId);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
      await fetchMyTasks();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleStar = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, isStarred: !task.isStarred } : task,
      ),
    );
    const task = tasks.find((t) => t._id === taskId);
    toast.success(task?.isStarred ? "Unstarred" : "Starred ⭐");
  };

  const handleStartTimer = async (taskId: string) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;
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

  const handleStopTimer = useCallback(
    async (taskId: string) => {
      try {
        const result = stopTimer(taskId);

        if (result.success) {
          if (result.minutes > 0) {
            toast.success(`⏱️ Time tracked: ${result.displayTime}`);
            // Update the task in the UI with the new time
            setTasks((prev) =>
              prev.map((task) =>
                task._id === taskId
                  ? {
                      ...task,
                      actualMinutes: (task.actualMinutes || 0) + result.minutes,
                    }
                  : task,
              ),
            );
          } else {
            toast.success("⏱️ Timer stopped - no time tracked");
          }
          return result;
        } else {
          toast.error("Failed to stop timer");
          return result;
        }
      } catch (error) {
        console.error("Error stopping timer:", error);
        toast.error("Failed to stop timer");
        return { success: false, minutes: 0, displayTime: "0m" };
      }
    },
    [stopTimer, setTasks],
  );

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        !selectedPriority || task.priority === selectedPriority;
      const matchesStatus = !selectedStatus || task.status === selectedStatus;
      return matchesSearch && matchesPriority && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "deadline":
          aVal = new Date(a.deadline).getTime();
          bVal = new Date(b.deadline).getTime();
          break;
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
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

    return filtered;
  }, [tasks, searchTerm, selectedPriority, selectedStatus, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getPriorityColor = (priority: string) =>
    PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]?.bg || "";
  const getStatusColor = (status: string) =>
    STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.bg || "";
  const getPriorityIcon = (priority: string) => {
    const Icon =
      PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]?.icon || Flag;
    return <Icon className="w-3 h-3" />;
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

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    submitted: tasks.filter((t) => t.status === "submitted").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  };

  const totalTimeTracked = tasks.reduce(
    (sum, task) => sum + (task.actualMinutes || 0),
    0,
  );
  const totalHours = Math.floor(totalTimeTracked / 60);
  const totalMinutes = totalTimeTracked % 60;

  const handleExport = () => {
    const headers = [
      "Title",
      "Priority",
      "Status",
      "Project",
      "Deadline",
      "Time Tracked (minutes)",
      "Assigned By",
      "Created At",
    ];
    const rows = filteredTasks.map((t) => [
      t.title,
      t.priority,
      t.status.replace("_", " "),
      t.projectId?.name || "N/A",
      new Date(t.deadline).toLocaleDateString(),
      t.actualMinutes || 0,
      t.assignedBy?.fullName || "N/A",
      new Date(t.createdAt).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my_tasks_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported successfully");
  };

  const activeTask = tasks.find((t) => t._id === activeTimerTaskId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-white/80 p-3" />
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading your tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
      <div className="container mx-auto px-4 py-6 md:py-8 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500">
          <Link
            href="/dashboard"
            className="hover:text-gray-700 transition flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-gray-900 font-medium">My Tasks</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Tasks
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              View and manage all tasks assigned to you
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-semibold border border-indigo-200">
                {stats.total} total
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 backdrop-blur-sm">
              <TimerIcon className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                {totalHours > 0
                  ? `${totalHours}h ${totalMinutes}m`
                  : `${totalMinutes}m`}{" "}
                tracked
              </span>
            </div> */}
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200 shadow-sm">
              <button
                onClick={() => setView("grid")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                  view === "grid"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                  view === "list"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
            </div>
            <Link href="/tasks/bulk-upload">
              <button className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:scale-105">
                <Upload className="w-4 h-4" />
                Bulk Upload
              </button>
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-500/25 hover:shadow-lg hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
            <button
              onClick={fetchMyTasks}
              className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          <StatCard
            icon={Layers}
            label="Total Tasks"
            value={stats.total}
            gradient="from-slate-600 to-gray-700"
            delay={0}
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            gradient="from-amber-500 to-yellow-600"
            delay={0.05}
          />
          <StatCard
            icon={Activity}
            label="In Progress"
            value={stats.inProgress}
            gradient="from-sky-500 to-blue-600"
            delay={0.1}
          />
          <StatCard
            icon={CheckCircle}
            label="Submitted"
            value={stats.submitted}
            gradient="from-purple-500 to-violet-600"
            delay={0.15}
          />
          <StatCard
            icon={Award}
            label="Completed"
            value={stats.completed}
            gradient="from-emerald-500 to-green-600"
            delay={0.2}
          />
          <StatCard
            icon={AlertCircle}
            label="Overdue"
            value={stats.overdue}
            gradient="from-rose-500 to-red-600"
            delay={0.25}
          />
          <div
            className={`bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 border border-indigo-300 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isTimerRunning ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                {isTimerRunning ? (
                  <>
                    <p className="text-2xl font-bold text-white">
                      {formatTimeShort(timerState.elapsedSeconds)}
                    </p>
                    <p className="text-[10px] text-indigo-200 mt-0.5 truncate max-w-[100px]">
                      {activeTask?.title || "No task"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                      <span className="text-[8px] text-indigo-200 font-medium">
                        Running
                      </span>
                    </div>
                  </>
                ) : activeTimerTaskId ? (
                  <>
                    <p className="text-2xl font-bold text-white">
                      {formatTimeShort(timerState.elapsedSeconds)}
                    </p>
                    <p className="text-[10px] text-indigo-200 mt-0.5 truncate max-w-[100px]">
                      {activeTask?.title || "No task"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                      <span className="text-[8px] text-indigo-200 font-medium">
                        Paused
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-white">--:--</p>
                    <p className="text-[10px] text-indigo-200 mt-0.5">
                      No timer
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <span className="text-[8px] text-indigo-200 font-medium">
                        Inactive
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            {activeTimerTaskId && (
              <div className="mt-2 flex gap-1">
                {isTimerRunning ? (
                  <button
                    onClick={handlePauseTimer}
                    className="flex-1 py-0.5 bg-white/20 hover:bg-white/30 text-white text-[10px] rounded transition"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumeTimer}
                    className="flex-1 py-0.5 bg-white/20 hover:bg-white/30 text-white text-[10px] rounded transition"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => handleStopTimer(activeTimerTaskId)}
                  className="flex-1 py-0.5 bg-white/20 hover:bg-white/30 text-white text-[10px] rounded transition"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
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
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm ${
              showFilters
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                : "bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 hover:text-gray-800"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="deadline">Sort by Deadline</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="title">Sort by Title</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition"
                >
                  {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                </button>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedPriority("");
                    setSelectedStatus("");
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                >
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasks Grid View */}
        {view === "grid" ? (
          filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckSquare className="w-12 h-12 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No tasks assigned yet
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                You don't have any tasks assigned to you. Click the button below
                to create your first task.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Create Single Task
                </button>
                <Link href="/tasks/bulk-upload">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-105">
                    <Upload className="w-4 h-4" />
                    Bulk Upload Tasks
                  </button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {paginatedTasks.map((task, index) => {
                  const isTimerActive = isTimerActiveForTask(task._id);
                  const isRunning = isTimerActive && timerState.isRunning;
                  const displayTime = getDisplayTimeForTask(
                    task._id,
                    task.actualMinutes,
                  );
                  const totalTime = task.actualMinutes || 0;

                  return (
                    <TaskCard
                      key={task._id}
                      task={task}
                      index={index}
                      isTimerActive={isTimerActive}
                      isRunning={isRunning}
                      displayTime={displayTime}
                      totalTime={totalTime}
                      onSelect={setSelectedTask}
                      onToggleStar={toggleStar}
                      onStartTimer={handleStartTimer}
                      onPauseTimer={handlePauseTimer}
                      onResumeTimer={handleResumeTimer}
                      onStopTimer={handleStopTimer}
                      onStatusChange={handleStatusChange}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      getPriorityIcon={getPriorityIcon}
                      activeTimerTaskId={activeTimerTaskId}
                      timerState={timerState}
                      isTimerRunning={isTimerRunning}
                    />
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between pt-6 flex-wrap gap-3"
                >
                  <p className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredTasks.length)}{" "}
                    of {filteredTasks.length} tasks
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition shadow-sm disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2)
                        pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                              : "bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50 transition shadow-sm disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )
        ) : (
          // List View
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50/50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Tracked
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          No tasks assigned yet
                        </p>
                        <div className="flex gap-3 justify-center mt-4">
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl transition shadow-md hover:shadow-lg"
                          >
                            <Plus className="w-4 h-4" />
                            Create Task
                          </button>
                          <Link href="/tasks/bulk-upload">
                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm rounded-xl transition shadow-md hover:shadow-lg">
                              <Upload className="w-4 h-4" />
                              Bulk Upload
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((task) => {
                      const isTimerActive = isTimerActiveForTask(task._id);
                      const isRunning = isTimerActive && timerState.isRunning;
                      const displayTime = getDisplayTimeForTask(
                        task._id,
                        task.actualMinutes,
                      );
                      const totalTime = task.actualMinutes || 0;

                      return (
                        <motion.tr
                          key={task._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="hover:bg-indigo-50/30 transition cursor-pointer group"
                          onClick={() => setSelectedTask(task)}
                        >
                          <td className="px-4 py-3">
                            <p className="text-gray-800 text-sm font-medium line-clamp-1">
                              {task.title}
                            </p>
                            <p className="text-gray-400 text-xs line-clamp-1">
                              {task.description}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].border}`}
                            >
                              {getPriorityIcon(task.priority)}
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={task.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(task._id, e.target.value);
                              }}
                              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${STATUS_CONFIG[task.status].bg} ${STATUS_CONFIG[task.status].border} bg-white cursor-pointer outline-none focus:ring-2 focus:ring-indigo-300`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="submitted">Submitted</option>
                              <option value="completed">Completed</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {task.projectId?.name || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium ${formatDate(task.deadline) === "Overdue" ? "text-rose-500" : "text-gray-500"}`}
                            >
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isTimerActive ? (
                                <>
                                  <span
                                    className={`text-xs font-medium ${isRunning ? "text-emerald-600" : "text-amber-600"}`}
                                  >
                                    {displayTime}
                                  </span>
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                                  />
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  {totalTime > 0 ? `${totalTime}m` : "-"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {task.status !== "completed" &&
                                task.status !== "submitted" && (
                                  <>
                                    {isTimerActive ? (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            isRunning
                                              ? handlePauseTimer()
                                              : handleResumeTimer();
                                          }}
                                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                        >
                                          {isRunning ? (
                                            <Pause className="w-4 h-4" />
                                          ) : (
                                            <Play className="w-4 h-4" />
                                          )}
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
                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-40"
                                        disabled={activeTimerTaskId !== null}
                                      >
                                        <Play className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 sticky top-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${PRIORITY_CONFIG[selectedTask.priority].gradient} shadow-md`}
                  >
                    {getPriorityIcon(selectedTask.priority)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedTask.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${PRIORITY_CONFIG[selectedTask.priority].bg} ${PRIORITY_CONFIG[selectedTask.priority].border}`}
                      >
                        {selectedTask.priority.toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${STATUS_CONFIG[selectedTask.status].bg} ${STATUS_CONFIG[selectedTask.status].border}`}
                      >
                        {selectedTask.status.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 bg-gray-50 border-gray-200 text-gray-600">
                        <History className="w-3 h-3" />
                        {getDisplayTimeForTask(
                          selectedTask._id,
                          selectedTask.actualMinutes,
                        )}
                      </span>
                    </div>
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
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-xl p-4 border border-gray-100">
                  <p className="text-gray-500 text-sm mb-2 font-medium">
                    Description
                  </p>
                  <p className="text-gray-800">{selectedTask.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Project</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {selectedTask.projectId?.name || "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Assigned By
                    </p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {selectedTask.assignedBy?.fullName || "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Deadline
                    </p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {new Date(selectedTask.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Estimated Hours
                    </p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {selectedTask.estimatedHours}h
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">
                      Time Logged
                    </p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {getDisplayTimeForTask(
                        selectedTask._id,
                        selectedTask.actualMinutes,
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Created</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {new Date(selectedTask.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Timer Controls in Modal */}
                {selectedTask.status !== "completed" &&
                  selectedTask.status !== "submitted" && (
                    <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-xl p-4 border border-indigo-100">
                      <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <TimerIcon className="w-4 h-4 text-indigo-600" />
                        Time Tracking
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {isTimerActiveForTask(selectedTask._id) ? (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-mono font-bold text-indigo-700 tabular-nums">
                                  {formatTime(timerState.elapsedSeconds)}
                                </span>
                                <span
                                  className={`text-xs font-medium ${isTimerRunning ? "text-emerald-600" : "text-amber-600"}`}
                                >
                                  {isTimerRunning ? "● Running" : "● Paused"}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isTimerRunning ? (
                                <button
                                  onClick={() => {
                                    handlePauseTimer();
                                    setSelectedTask(null);
                                  }}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                  <Pause className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleResumeTimer();
                                    setSelectedTask(null);
                                  }}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleStopTimer(selectedTask._id);
                                  setSelectedTask(null);
                                }}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <span className="text-sm text-gray-500">
                                {selectedTask.actualMinutes
                                  ? `${selectedTask.actualMinutes} minutes logged`
                                  : "No time tracked yet"}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                handleStartTimer(selectedTask._id);
                                setSelectedTask(null);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                              disabled={activeTimerTaskId !== null}
                            >
                              <Play className="w-4 h-4" />
                              Start Timer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      handleStatusChange(selectedTask._id, e.target.value);
                      setSelectedTask(null);
                    }}
                    disabled={updatingStatus === selectedTask._id}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl transition"
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
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
