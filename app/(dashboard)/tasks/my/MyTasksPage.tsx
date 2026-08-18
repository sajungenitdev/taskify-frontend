"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
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
  AlertTriangle,
  Star,
  Paperclip,
  Plus,
  Home,
  Download,
  Award,
  Activity,
  Play,
  Pause,
  Square,
  Send,
  Check,
  GitBranch,
  Gem,
  Layers,
  Sparkles,
  ChevronDown,
  History,
  EyeIcon,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

// ============ TYPES ============
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
  isMilestone?: boolean;
  parentTaskId?: string | null | { _id: string; title: string; status: string };
  subTaskCount?: number;
  completedSubTaskCount?: number;
  subTasksProgress?: number;
  progress?: number;
}

// ============ CONFIGURATIONS ============
const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", badge: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
  high: { label: "High", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: Flag },
  normal: { label: "Normal", badge: "bg-blue-50 text-blue-700 border-blue-200", icon: Flag },
  low: { label: "Low", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Flag },
} as const;

const STATUS_CONFIG = {
  pending: { label: "Pending", badge: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  in_progress: { label: "In Progress", badge: "bg-sky-50 text-sky-700 border-sky-200", icon: Activity },
  submitted: { label: "Submitted", badge: "bg-purple-50 text-purple-700 border-purple-200", icon: Send },
  completed: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Award },
  overdue: { label: "Overdue", badge: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertCircle },
  rejected: { label: "Rejected", badge: "bg-red-50 text-red-700 border-red-200", icon: X },
} as const;

const getPriorityConfig = (p: string) => PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.normal;
const getStatusConfig = (s: string) => STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;

// ============ STAT CARD ============
const StatCard = ({
  icon: Icon,
  label,
  value,
  gradient,
  subtitle,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: number | string;
  gradient: string;
  subtitle?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={`relative overflow-hidden rounded-2xl p-4 bg-linear-to-br ${gradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-xs text-white/80 mt-0.5 font-medium">{label}</p>
        {subtitle && <p className="text-[10px] text-white/60 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </motion.div>
);

// ============ SUB-TASK TREE COMPONENT ============
const SubTaskTree = ({ task, onTaskClick, level = 0 }: { task: Task; onTaskClick: (t: Task) => void; level?: number }) => {
  const [showSubTasks, setShowSubTasks] = useState(false);
  const [subTasks, setSubTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const hasSubTasks = (task.subTaskCount || 0) > 0;

  const fetchSubTasks = async () => {
    if (!task._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/tasks/${task._id}/subtasks`);
      if (res.data.success) {
        setSubTasks(res.data.data || []);
        setShowSubTasks(true);
      }
    } catch {
      toast.error("Failed to fetch sub-tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer group border border-transparent hover:border-slate-100 ${task.isMilestone ? "bg-purple-50/40 border-purple-100" : ""
          }`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={() => onTaskClick(task)}
      >
        {hasSubTasks && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!showSubTasks) fetchSubTasks();
              else setShowSubTasks(!showSubTasks);
            }}
            className="p-1 hover:bg-slate-200/60 rounded-lg transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : showSubTasks ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </button>
        )}
        <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          {task.isMilestone ? <Gem className="w-3.5 h-3.5 text-purple-600" /> : hasSubTasks ? <GitBranch className="w-3.5 h-3.5 text-indigo-600" /> : <CheckSquare className="w-3.5 h-3.5 text-slate-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-800 truncate">{task.title}</span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusConfig(task.status).badge}`}>
              {task.status.replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
          {task.deadline && <span>{new Date(task.deadline).toLocaleDateString()}</span>}
        </div>
      </div>
      {showSubTasks && subTasks.map((st) => <SubTaskTree key={st._id} task={st} onTaskClick={onTaskClick} level={level + 1} />)}
    </div>
  );
};

// ============ MAIN COMPONENT ============
export default function MyTasksPage() {
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
  const [view, setView] = useState<"grid" | "list" | "tree">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "title">("deadline");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [isReworking, setIsReworking] = useState<string | null>(null);
  const [showParentOnly, setShowParentOnly] = useState(false);

  const itemsPerPage = 9;

  // ============ PERMISSIONS & ASSIGNMENT HELPERS ============
  const isTaskAssignee = useCallback((task: Task): boolean => {
    if (!user || !task) return false;
    const assigneeId = typeof task.assignedTo === 'object' ? task.assignedTo?._id : task.assignedTo;
    const userId = user._id || (user as any).id;
    return assigneeId === userId;
  }, [user]);

  const isTimerValidForCurrentUser = useCallback((): boolean => {
    if (!user) return false;
    return isTimerValidForUser(user._id || (user as any).id || '');
  }, [user, isTimerValidForUser]);

  const hasAssignedTasks = useMemo(() => tasks.some(t => isTaskAssignee(t)), [tasks, isTaskAssignee]);

  const hasValidActiveTimer = useCallback((): boolean => {
    if (!activeTimerTaskId) return false;
    const task = tasks.find(t => t._id === activeTimerTaskId);
    return task ? isTaskAssignee(task) && isTimerValidForCurrentUser() : false;
  }, [activeTimerTaskId, tasks, isTaskAssignee, isTimerValidForCurrentUser]);

  // ============ FETCH TASKS ============
  const fetchMyTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/tasks/my-tasks");
      const taskList = res.data.success ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setTasks(taskList.map((t: Task) => ({ ...t, isStarred: false })));
    } catch (err: any) {
      if (err.response?.status === 404) setTasks([]);
      else toast.error(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchMyTasks();
  }, [isAuthenticated, router, fetchMyTasks]);

  // ============ ACTIONS: COMPLETE / SUBMIT / STATUS ============
  const handleMarkComplete = async (taskId: string) => {
    if (isCompleting === taskId) return;
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    if (task.evidenceRequired && (!task.evidenceUrls || task.evidenceUrls.length === 0)) {
      toast.error("⚠️ Evidence required before completing this task.");
      return;
    }

    setIsCompleting(taskId);
    try {
      let actualMinutes = task.actualMinutes || 0;
      if (isTimerActiveForTask(taskId)) {
        const timerResult = await stopTimerAutomatically(taskId);
        if (timerResult.success && timerResult.minutes > 0) actualMinutes = timerResult.minutes;
      }

      const res = await api.patch(`/tasks/${taskId}/status`, {
        status: "completed",
        actualMinutes,
        approvalNote: "Completed by assignee",
      });

      if (res.data.success) {
        toast.success("✅ Task marked as completed successfully!");
        await fetchMyTasks();
        setSelectedTask(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete task");
    } finally {
      setIsCompleting(null);
    }
  };

  const handleSubmitForReview = async (taskId: string) => {
    if (isSubmitting === taskId) return;
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    if (task.evidenceRequired && (!task.evidenceUrls || task.evidenceUrls.length === 0)) {
      toast.error("⚠️ Evidence required before submitting.");
      return;
    }

    setIsSubmitting(taskId);
    try {
      if (isTimerActiveForTask(taskId)) await stopTimerAutomatically(taskId);
      const res = await api.patch(`/tasks/${taskId}/status`, { status: "submitted" });
      if (res.data.success) {
        toast.success("🚀 Task submitted for review!");
        await fetchMyTasks();
        setSelectedTask(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit task");
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleSendForRework = async (taskId: string) => {
    if (isReworking === taskId || !confirm("Send this task back for rework?")) return;
    setIsReworking(taskId);
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: "pending" });
      if (res.data.success) {
        toast.success("🔄 Task sent back for rework!");
        await fetchMyTasks();
        setSelectedTask(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update task");
    } finally {
      setIsReworking(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (updatingStatus === taskId) return;
    if (newStatus === "completed") { await handleMarkComplete(taskId); return; }
    if (newStatus === "submitted") { await handleSubmitForReview(taskId); return; }

    setUpdatingStatus(taskId);
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus as Task["status"] } : t));
        if (newStatus === "completed" && activeTimerTaskId === taskId) await stopTimerAutomatically(taskId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
      await fetchMyTasks();
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ============ TIMER ACTIONS ============
  const handleStartTimer = async (taskId: string) => {
    const task = tasks.find(t => t._id === taskId);
    if (!task || !isTaskAssignee(task)) {
      toast.error("Permission denied or task not found");
      return;
    }
    if (activeTimerTaskId && activeTimerTaskId !== taskId && isTimerValidForCurrentUser()) {
      toast.error("Another timer is currently active. Stop it before starting a new one.");
      return;
    }
    if (timerState.taskId === null && timerState.elapsedSeconds > 0) resetTimer();

    startTimer(taskId, (task.actualMinutes || 0) * 60);
    toast.success(`⏱️ Timer started for "${task.title}"`);
  };

  const handleStopTimer = useCallback(async (taskId: string) => {
    try {
      const result = await stopTimer(taskId);
      if (result.success) {
        toast.success(`⏱️ Time tracked: ${result.displayTime}`);
        await fetchMyTasks();
      }
      return result;
    } catch {
      toast.error("Failed to stop timer");
      return { success: false, minutes: 0, displayTime: "0m" };
    }
  }, [stopTimer, fetchMyTasks]);

  const toggleStar = (taskId: string) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, isStarred: !t.isStarred } : t));
    toast.success("Star updated ⭐");
  };

  // ============ FILTERING & MEMOIZED COMPUTATIONS ============
  const filteredTasks = useMemo(() => {
    let list = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = !selectedPriority || task.priority === selectedPriority;
      const matchesStatus = !selectedStatus || task.status === selectedStatus;
      return matchesSearch && matchesPriority && matchesStatus;
    });

    if (showParentOnly) {
      list = list.filter(t => !t.parentTaskId || t.parentTaskId === null || t.parentTaskId === '');
    }

    list.sort((a, b) => {
      if (sortBy === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortBy === "priority") {
        const order = { urgent: 4, high: 3, normal: 2, low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      return a.title.localeCompare(b.title);
    });

    return sortOrder === "asc" ? list : list.reverse();
  }, [tasks, searchTerm, selectedPriority, selectedStatus, showParentOnly, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = useMemo(() => filteredTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredTasks, currentPage, itemsPerPage]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    submitted: tasks.filter(t => t.status === "submitted").length,
    completed: tasks.filter(t => t.status === "completed").length,
    overdue: tasks.filter(t => t.status === "overdue").length,
    rejected: tasks.filter(t => t.status === "rejected").length,
    milestoneCount: tasks.filter(t => t.isMilestone === true).length,
    subTaskCount: tasks.filter(t => t.parentTaskId && t.parentTaskId !== null && t.parentTaskId !== '').length,
  }), [tasks]);

  const totalTimeTracked = useMemo(() => tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0), [tasks]);
  const totalHours = Math.floor(totalTimeTracked / 60);
  const totalMinutes = totalTimeTracked % 60;

  const getTotalTimeForTask = useCallback((task: Task) => {
    let mins = task.actualMinutes || 0;
    if (isTimerActiveForTask(task._id)) mins += Math.floor(timerState.elapsedSeconds / 60);
    return { minutes: mins, display: formatTimeShort(mins * 60) };
  }, [timerState, isTimerActiveForTask, formatTimeShort]);

  const handleExport = () => {
    const headers = ["Title", "Priority", "Status", "Project", "Deadline", "Time Tracked (mins)"];
    const rows = filteredTasks.map((t) => [
      `"${t.title}"`,
      t.priority,
      t.status,
      `"${t.projectId?.name || "N/A"}"`,
      new Date(t.deadline).toLocaleDateString(),
      t.actualMinutes || 0,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tasks_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium text-slate-400">Loading your workspace tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-600 transition flex items-center gap-1">
            <Home size={13} /> Dashboard
          </Link>
          <ChevronRight size={13} />
          <span className="text-slate-700">My Tasks</span>
        </div>

        {/* Header Banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Assigned Tasks Hub</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {stats.total} total
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Track operational deliverables, log active hours, and manage sub-tasks seamlessly.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button onClick={() => setView("grid")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${view === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                <LayoutGrid size={14} /> Grid
              </button>
              <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${view === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                <List size={14} /> List
              </button>
              <button onClick={() => setView("tree")} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${view === "tree" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}>
                <GitBranch size={14} /> Tree
              </button>
            </div>

            <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer">
              <Download size={14} /> Export CSV
            </button>

            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 cursor-pointer">
              <Plus size={15} /> Create Task
            </button>
          </div>
        </motion.div>

        {/* Statistical Counter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", val: stats.total, color: "text-slate-700", bg: "bg-slate-50" },
            { label: "Pending", val: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "In Progress", val: stats.inProgress, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "Submitted", val: stats.submitted, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Completed", val: stats.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Overdue", val: stats.overdue, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Rejected", val: stats.rejected, color: "text-red-600", bg: "bg-red-50" },
            { label: "Milestones", val: stats.milestoneCount, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((item, idx) => (
            <div key={idx} className={`${item.bg} p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between`}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{item.label}</span>
              <p className={`text-xl font-black mt-2 ${item.color}`}>{item.val}</p>
            </div>
          ))}
        </div>

        {/* Toolbar & Search */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deliverables by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
            >
              <Filter size={14} /> Filter Options
            </button>
            <button
              onClick={() => setShowParentOnly(!showParentOnly)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${showParentOnly ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
            >
              <GitBranch size={14} /> {showParentOnly ? "Parents Only" : "All Tasks"}
            </button>
          </div>
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap gap-3 items-center">
                <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none">
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none">
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none">
                  <option value="deadline">Sort by Deadline</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="title">Sort by Title</option>
                </select>
                <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                  {sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
                </button>
                <button onClick={() => { setSearchTerm(""); setSelectedPriority(""); setSelectedStatus(""); }} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Viewport */}
        {view === "tree" ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-2">
            {filteredTasks.filter((t) => !t.parentTaskId || t.parentTaskId === null || t.parentTaskId === '').length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">No hierarchical parent tasks found.</div>
            ) : (
              filteredTasks.filter((t) => !t.parentTaskId || t.parentTaskId === null || t.parentTaskId === '').map((task) => (
                <SubTaskTree key={task._id} task={task} onTaskClick={(t) => setSelectedTask(t)} />
              ))
            )}
          </div>
        ) : view === "list" ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Deliverable Title</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {paginatedTasks.map((task) => (
                    <tr key={task._id} onClick={() => setSelectedTask(task)} className="hover:bg-slate-50/50 transition cursor-pointer">
                      <td className="px-6 py-4 font-bold text-slate-900">{task.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getPriorityConfig(task.priority).badge}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusConfig(task.status).badge}`}>
                          {task.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(task.deadline).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition cursor-pointer">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedTasks.map((task, index) => {
              const isMilestone = task.isMilestone === true;

              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedTask(task)}
                  className={`bg-white rounded-3xl border p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer relative group flex flex-col justify-between ${isMilestone ? "border-purple-200 bg-purple-50/20" : "border-slate-100 hover:border-slate-200"
                    }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isMilestone && (
                          <span className="px-2.5 py-0.5 text-[9px] font-black bg-purple-100 text-purple-700 rounded-full">MILESTONE</span>
                        )}
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getPriorityConfig(task.priority).badge}`}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${getStatusConfig(task.status).badge}`}>
                          {task.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleStar(task._id); }} className="text-slate-300 hover:text-amber-400 transition cursor-pointer">
                        <Star size={15} className={task.isStarred ? "fill-amber-400 text-amber-400" : ""} />
                      </button>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition line-clamp-1">{task.title}</h3>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2">{task.description || "No description provided."}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar size={13} /> {new Date(task.deadline).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={12} /> View
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-xs">
            <p className="text-xs font-semibold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 text-xs font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-slate-200 disabled:opacity-40 cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Task Details Modal with "Check Details" Page Link */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{selectedTask.title}</h2>
                  <p className="text-xs text-slate-400 font-medium">{selectedTask.projectId?.name || "General Task"}</p>
                </div>
                <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs font-medium text-slate-600">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p className="text-slate-700">{selectedTask.description || "No description provided."}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div><span>Priority:</span> <p className="font-bold text-slate-900 uppercase">{selectedTask.priority}</p></div>
                  <div><span>Status:</span> <p className="font-bold text-slate-900 uppercase">{selectedTask.status.replace("_", " ")}</p></div>
                  <div><span>Deadline:</span> <p className="font-bold text-slate-900">{new Date(selectedTask.deadline).toLocaleDateString()}</p></div>
                  <div><span>Assigned By:</span> <p className="font-bold text-slate-900">{selectedTask.assignedBy?.fullName || "N/A"}</p></div>
                </div>

                {/* Task Details Page Link */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <Link
                    href={`/tasks/${selectedTask._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Eye size={15} /> Check Details Page
                  </Link>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Creation Modal */}
      <CreateTaskModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onTaskCreated={() => { fetchMyTasks(); setShowCreateModal(false); }} />
    </div>
  );
}