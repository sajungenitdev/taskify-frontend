// app/(dashboard)/dashboard/components/EmployeeDashboard.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import Link from "next/link";
import {
  CheckCircle,
  Loader2,
  RefreshCw,
  Gift,
  Crown,
  Plus,
  Pause,
  Play,
  Paperclip,
  X,
  Text,
  AlertTriangle as AlertTriangleIcon,
  Send,
  Eye as EyeIcon,
  Square,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  deadline?: string;
  projectId?: { _id: string; name: string };
  assignedTo?: { _id: string; fullName: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
  timeSpent?: number;
  estimatedHours?: number;
  isTimerRunning?: boolean;
  timerStartTime?: string;
  elapsedTime?: number;
  completedAt?: string;
  evidenceRequired?: boolean;
  evidenceUrls?: string[];
  actualMinutes?: number;
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
  projectsCount: number;
  teamMembersCount: number;
  upcomingDeadlines: number;
  hoursLoggedToday: number;
  hoursTarget: number;
  todayTasks: number;
  todayRemaining: number;
  weeklyProgress: number;
  monthlyProgress: number;
}

// Safe date parser — accepts any shape, returns null if invalid/missing
const safeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export default function EmployeeDashboard() {
  const { user, refreshUser } = useAuth();
  const timer = useTimer();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  const [taskFilter, setTaskFilter] = useState<"all" | "running" | "pending">("all");

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // ============ Trial countdown ============
  const calculateTimeLeft = useCallback(() => {
    if (!user?.trial?.endDate) return null;
    const diff = new Date(user.trial.endDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [user]);

  useEffect(() => {
    if (user?.trial?.isActive && user?.trial?.endDate) {
      const t = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
      return () => clearInterval(t);
    }
  }, [user?.trial?.isActive, user?.trial?.endDate, calculateTimeLeft]);

  // ============ Data loading ============
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tasks?assignedTo=${user?._id}`);
      const tasks: Task[] = data.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTasks = tasks.filter((t) => {
        const d = safeDate(t.dueDate || t.deadline);
        if (!d) return t.status !== "completed" && t.status !== "cancelled";
        d.setHours(0, 0, 0, 0);
        return (
          d.getTime() === today.getTime() ||
          (t.status !== "completed" && t.status !== "cancelled")
        );
      });

      const completedTasks = tasks.filter((t) => t.status === "completed").length;
      const pendingTasks = tasks.filter((t) => t.status === "pending").length;
      const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
      const overdueTasks = tasks.filter((t) => {
        if (t.status === "completed") return false;
        const d = safeDate(t.dueDate || t.deadline);
        return d ? d < new Date() : false;
      }).length;

      const todayLoggedHours = tasks
        .filter((t) => {
          const u = safeDate(t.updatedAt);
          if (!u) return false;
          return (
            u.toDateString() === today.toDateString() &&
            t.status === "completed" &&
            t.timeSpent
          );
        })
        .reduce((s, t) => s + (t.timeSpent || 0), 0);

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate:
          tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
        projectsCount: 0,
        teamMembersCount: 0,
        upcomingDeadlines: tasks.filter((t) => {
          if (t.status === "completed") return false;
          const d = safeDate(t.dueDate || t.deadline);
          if (!d) return false;
          const diff = d.getTime() - Date.now();
          return diff > 0 && diff < 7 * 86400000;
        }).length,
        hoursLoggedToday: Math.round(todayLoggedHours * 10) / 10,
        hoursTarget: 8,
        todayTasks: todayTasks.length,
        todayRemaining: todayTasks.filter((t) => t.status !== "completed").length,
        weeklyProgress: 0,
        monthlyProgress: 0,
      });

      setAllTasks(tasks);
      setRecentTasks(tasks.slice(0, 5));

      // Adopt any server-running timer
      const serverRunning = tasks.find((t) => t.isTimerRunning === true);
      if (serverRunning && !timer.isTimerActiveForTask(serverRunning._id)) {
        let base = serverRunning.elapsedTime || 0;
        if (serverRunning.timerStartTime) {
          const startTs = new Date(serverRunning.timerStartTime).getTime();
          const extra = Math.floor((Date.now() - startTs) / 1000);
          if (extra > 0) base += extra;
        }
        timer.startTimer(serverRunning._id, base);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) fetchDashboardData();
  }, [user?._id, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await refreshUser();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  // ============ Timer actions ============
  const startTimerForTask = useCallback(
    async (task: Task) => {
      if (timer.activeTimerTaskId && timer.activeTimerTaskId !== task._id) {
        toast.error("Another timer is already running. Stop it first.");
        return;
      }
      if (timer.isTimerActiveForTask(task._id)) {
        if (!timer.isTimerRunning) timer.resumeTimer();
        return;
      }
      timer.startTimer(task._id);
      try {
        const res = await api.post(`/tasks/${task._id}/timer/start`);
        if (!res.data.success) {
          toast.error(res.data.message || "Failed to start timer");
        }
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message;
        if (status !== 400) {
          toast.error(msg || "Timer started locally — will sync later");
        }
      }
    },
    [timer]
  );

  const pauseTimerForTask = useCallback(async () => {
    if (!timer.activeTimerTaskId) return;
    const taskId = timer.activeTimerTaskId;
    const frozen = timer.timerState.elapsedSeconds;

    timer.pauseTimer();

    try {
      await api.post(`/tasks/${taskId}/timer/pause`, { elapsedTime: frozen });
    } catch (err) {
      console.warn("Pause sync failed:", err);
    }
  }, [timer]);

  const resumeTimerForTask = useCallback(async () => {
    if (!timer.activeTimerTaskId) return;
    const taskId = timer.activeTimerTaskId;

    timer.resumeTimer();

    try {
      await api.post(`/tasks/${taskId}/timer/resume`);
    } catch (err) {
      console.warn("Resume sync failed:", err);
    }
  }, [timer]);

  const stopTimerForTask = useCallback(async () => {
    if (!timer.activeTimerTaskId) return;
    const taskId = timer.activeTimerTaskId;

    const result = await timer.stopTimer(taskId);
    if (result.success) {
      toast.success(`⏹️ Timer stopped • ${result.displayTime}`);
      await fetchDashboardData();
    }
  }, [timer, fetchDashboardData]);

  // ============ Task completion ============
  const completeTaskLocal = async (taskId: string) => {
    if (timer.isTimerActiveForTask(taskId)) {
      await timer.stopTimer(taskId);
    }

    try {
      const res = await api.patch(`/tasks/${taskId}/complete`);
      if (res.data.success) {
        toast.success("✅ Task completed!");
        await fetchDashboardData();
        return;
      }
    } catch (err) {
      console.error("Complete task error:", err);
    }

    toast.success("✅ Task completed locally!");
    setAllTasks((prev) =>
      prev.map((t) =>
        t._id === taskId ? { ...t, status: "completed", isTimerRunning: false } : t
      )
    );
    await fetchDashboardData();
  };

  const handleCompleteTask = (task: Task) => {
    const hasEvidence = task.evidenceUrls && task.evidenceUrls.length > 0;
    if (task.evidenceRequired && !hasEvidence) {
      setEvidenceTask(task);
      setEvidenceText("");
      setShowEvidenceModal(true);
      return;
    }
    completeTaskLocal(task._id);
  };

  const handleSubmitWithEvidence = async () => {
    if (!evidenceTask) return;
    if (!evidenceText.trim()) {
      toast.error("Please provide evidence details");
      return;
    }

    setSubmittingEvidence(true);
    try {
      const urls = evidenceText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (urls.length === 0) {
        toast.error("Please provide at least one evidence item");
        return;
      }

      if (timer.isTimerActiveForTask(evidenceTask._id)) {
        await timer.stopTimer(evidenceTask._id);
      }

      const res = await api.patch(`/tasks/${evidenceTask._id}/status`, {
        status: "completed",
        evidenceUrls: urls,
        approvalNote: "Task completed with evidence",
      });

      if (res.data.success) {
        toast.success("✅ Task completed with evidence!");
        setShowEvidenceModal(false);
        setEvidenceTask(null);
        setEvidenceText("");
        await fetchDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to complete task");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleViewTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  // ============ Derived: today's tasks ============
  const todaysTasksList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = allTasks.filter((task) => {
      const d = safeDate(task.dueDate || task.deadline);
      if (!d) return task.status !== "completed" && task.status !== "cancelled";
      d.setHours(0, 0, 0, 0);
      return (
        d.getTime() === today.getTime() ||
        (task.status !== "completed" && task.status !== "cancelled")
      );
    });

    if (taskFilter === "running") {
      filtered = filtered.filter(
        (t) => t.status === "in_progress" || timer.isTimerActiveForTask(t._id)
      );
    } else if (taskFilter === "pending") {
      filtered = filtered.filter(
        (t) => t.status === "pending" || t.status === "overdue"
      );
    }
    return filtered.slice(0, 5);
  }, [allTasks, taskFilter, timer]);

  const activeTimerTask = useMemo(() => {
    if (!timer.activeTimerTaskId) return null;
    return allTasks.find((t) => t._id === timer.activeTimerTaskId) || null;
  }, [timer.activeTimerTaskId, allTasks]);

  const activeTimerSeconds = timer.timerState.elapsedSeconds;
  const isActiveRunning = timer.isTimerRunning;

  const getTrialStatus = () => {
    if (!user?.trial) return null;
    if (!user.trial.isActive) {
      return {
        type: "expired",
        title: "Trial Expired",
        message: "Your free trial has ended. Upgrade to continue.",
        color: "from-red-500 to-rose-600",
      };
    }
    return {
      type: "active",
      title: `${timeLeft?.days || 7} Days Free Trial`,
      message: "Enjoy your free trial features.",
      color: "from-emerald-500 to-teal-600",
    };
  };

  const trialStatus = getTrialStatus();

  const formatTimer = (s: number) => {
    const safe = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    const sec = safe % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const renderEvidenceBadge = (task: Task) => {
    if (!task?.evidenceRequired) return null;
    const has = task.evidenceUrls && task.evidenceUrls.length > 0;
    return (
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${has
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
      >
        <Paperclip size={10} />
        {has ? "Evidence Submitted" : "Evidence Required"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 container mx-auto px-4 sm:px-6 py-6 bg-gray-50/50 min-h-screen">
      {/* Trial Banner */}
      <AnimatePresence>
        {user?.trial && trialStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`relative overflow-hidden rounded-2xl bg-linear-to-r ${trialStatus.color} p-4 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{trialStatus.title}</h3>
                  <p className="text-white/90 text-xs">{trialStatus.message}</p>
                </div>
              </div>
              <Link
                href="/billing/plans"
                className="px-3 py-1.5 bg-white text-gray-900 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow"
              >
                <Crown className="w-3.5 h-3.5" /> Upgrade
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          Good morning, {user?.fullName?.split(" ")[0] || "there"} 👋
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-sm"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {stats.todayTasks}
            </div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">
              TODAY'S TASKS
            </div>
          </div>
          <div className="text-xs font-semibold text-blue-600 mt-2">
            {stats.todayRemaining} remaining
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {stats.completedTasks}
            </div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">
              COMPLETED
            </div>
          </div>
          <div className="text-xs font-semibold text-emerald-600 mt-2">
            ↑ {stats.completionRate}% done
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              {stats.hoursLoggedToday || "0h"}
            </div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">
              HOURS TODAY
            </div>
          </div>
          <div className="text-xs font-medium text-gray-400 mt-2">
            of {stats.hoursTarget}h target
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {stats.overdueTasks}
            </div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">
              OVERDUE
            </div>
          </div>
          <div className="text-xs font-semibold text-rose-500 mt-2">Needs action</div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base">Today's Tasks</h2>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                {(["all", "running", "pending"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition capitalize ${taskFilter === f
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {todaysTasksList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No tasks for today! 🎉
                </div>
              ) : (
                todaysTasksList.map((task) => {
                  const taskIsActive = timer.isTimerActiveForTask(task._id);
                  const taskIsRunning = taskIsActive && timer.isTimerRunning;
                  const taskIsPaused = taskIsActive && !timer.isTimerRunning;
                  const isCompleted = task.status === "completed";
                  const dueDate = safeDate(task.dueDate || task.deadline);
                  const isOverdue =
                    task.status === "overdue" ||
                    (dueDate ? dueDate < new Date() : false);

                  return (
                    <div
                      key={task._id}
                      className={`flex items-center justify-between px-6 py-3.5 transition hover:bg-gray-50/80 ${taskIsActive ? "bg-blue-50/40" : ""
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : taskIsRunning ? (
                          <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center shrink-0">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          </div>
                        ) : taskIsPaused ? (
                          <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-3 bg-amber-500 rounded-sm" />
                          </div>
                        ) : isOverdue ? (
                          <div className="w-5 h-5 rounded-full border-2 border-rose-500 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${isCompleted
                                  ? "text-gray-400 line-through"
                                  : isOverdue
                                    ? "text-rose-600 font-semibold"
                                    : "text-gray-800"
                                }`}
                            >
                              {task.title}
                            </span>
                            {renderEvidenceBadge(task)}
                          </div>
                          {dueDate && (
                            <span className="text-xs text-gray-400">
                              Due {dueDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCompleted && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                            Done
                          </span>
                        )}

                        {taskIsRunning && (
                          <>
                            <span className="text-xs font-semibold px-2 py-0.5 text-blue-600 flex items-center gap-1 tabular-nums">
                              ▶ {formatTimer(activeTimerSeconds)}
                            </span>
                            <button
                              onClick={pauseTimerForTask}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                              title="Pause"
                            >
                              <Pause size={14} />
                            </button>
                          </>
                        )}

                        {taskIsPaused && (
                          <>
                            <span className="text-xs font-semibold px-2 py-0.5 text-amber-600 flex items-center gap-1 tabular-nums">
                              ⏸ {formatTimer(activeTimerSeconds)}
                            </span>
                            <button
                              onClick={resumeTimerForTask}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                              title="Resume"
                            >
                              <Play size={14} />
                            </button>
                            <button
                              onClick={stopTimerForTask}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              title="Stop"
                            >
                              <Square size={14} />
                            </button>
                          </>
                        )}

                        {!taskIsActive && !isCompleted && (
                          <button
                            onClick={() => startTimerForTask(task)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition disabled:opacity-40"
                            title="Start timer"
                            disabled={
                              timer.activeTimerTaskId !== null &&
                              timer.activeTimerTaskId !== task._id
                            }
                          >
                            <Play size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => handleViewTaskDetail(task)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                          title="View Details"
                        >
                          <EyeIcon size={14} />
                        </button>

                        {!isCompleted && (
                          <button
                            onClick={() => handleCompleteTask(task)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                            title="Complete task"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}

                        {task.priority && !isCompleted && !taskIsActive && (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${task.priority === "high" || task.priority === "urgent"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {task.priority}
                          </span>
                        )}

                        {isOverdue && !isCompleted && (
                          <span className="text-xs font-medium text-rose-500">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Active Timer + Workload */}
        <div className="space-y-6">
          <div className="bg-[#0B132B] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                {activeTimerTask
                  ? isActiveRunning
                    ? "ACTIVE TIMER"
                    : "TIMER PAUSED"
                  : "NO ACTIVE TIMER"}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${activeTimerTask && isActiveRunning
                    ? "bg-emerald-400 animate-pulse"
                    : activeTimerTask
                      ? "bg-amber-400"
                      : "bg-gray-500"
                  }`}
              />
            </div>

            <div className="text-sm font-medium text-gray-200 truncate mb-1">
              {activeTimerTask ? activeTimerTask.title : "Start a timer from any task"}
            </div>

            {activeTimerTask?.projectId?.name && (
              <div className="text-xs text-gray-400 mb-2 truncate">
                {activeTimerTask.projectId.name}
              </div>
            )}

            <div className="text-4xl font-black font-mono tracking-tight my-3 tabular-nums">
              {activeTimerTask ? formatTimer(activeTimerSeconds) : "00:00:00"}
            </div>

            {activeTimerTask && (
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden my-4">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isActiveRunning ? "bg-blue-500" : "bg-amber-500"
                    }`}
                  style={{
                    width: `${Math.min((activeTimerSeconds / 28800) * 100, 100)}%`,
                  }}
                />
              </div>
            )}

            {activeTimerTask ? (
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={isActiveRunning ? pauseTimerForTask : resumeTimerForTask}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${isActiveRunning
                      ? "bg-amber-500/90 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                      : "bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    }`}
                >
                  {isActiveRunning ? <Pause size={16} /> : <Play size={16} />}
                  {isActiveRunning ? "Pause" : "Resume"}
                </button>

                <button
                  onClick={stopTimerForTask}
                  className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
                  title="Stop"
                >
                  <Square size={16} />
                </button>

                <button
                  onClick={() =>
                    activeTimerTask && handleCompleteTask(activeTimerTask)
                  }
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle size={16} />
                  Done
                </button>

                <button
                  onClick={() =>
                    activeTimerTask && handleViewTaskDetail(activeTimerTask)
                  }
                  className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition"
                >
                  <EyeIcon size={16} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2">
                Start a timer from any task list item on the left.
              </p>
            )}
          </div>

          {/* Workload */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">My Workload</h3>
            </div>

            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (stats.hoursLoggedToday / stats.hoursTarget) * 100,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-4">
              <span>{stats.hoursLoggedToday || 0}h done</span>
              <span>
                {Math.max(
                  0,
                  stats.hoursTarget - (stats.hoursLoggedToday || 0)
                ).toFixed(1)}
                h free
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-50">
              {recentTasks.slice(0, 3).map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600 font-medium truncate max-w-[150px]">
                    ✓ {task.title}
                  </span>
                  <span className="text-gray-400">
                    {task.status === "completed"
                      ? "done"
                      : `${task.estimatedHours || 8}h est.`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {showTaskDetail && selectedTask && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowTaskDetail(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${selectedTask.status === "completed"
                          ? "bg-emerald-500"
                          : selectedTask.status === "in_progress"
                            ? "bg-blue-500"
                            : selectedTask.status === "overdue"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                        }`}
                    />
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {selectedTask.title}
                    </h3>
                  </div>
                  {selectedTask.projectId?.name && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Project: {selectedTask.projectId.name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition shrink-0 ml-2"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[calc(90vh-160px)] overflow-y-auto">
                {selectedTask.description && (
                  <p className="p-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-100 text-sm leading-relaxed">
                    {selectedTask.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Status
                    </span>
                    <p className="font-semibold text-gray-800 mt-0.5 capitalize">
                      {selectedTask.status.replace("_", " ")}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      Priority
                    </span>
                    <p className="font-semibold text-gray-800 mt-0.5 capitalize">
                      {selectedTask.priority || "normal"}
                    </p>
                  </div>
                </div>

                {selectedTask.assignedTo && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {selectedTask.assignedTo.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {selectedTask.assignedTo.fullName}
                      </p>
                      <p className="text-[11px] text-gray-400">Assignee</p>
                    </div>
                  </div>
                )}

                {selectedTask.evidenceRequired && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      Evidence is required to complete this task.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                <Link
                  href={`/tasks/${selectedTask._id}`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Open Full View
                </Link>
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Evidence Modal */}
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
                  <p className="text-xs text-gray-500">
                    Evidence is required to complete this task
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEvidenceModal(false);
                    setEvidenceText("");
                    setEvidenceTask(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Evidence Required
                    </p>
                    <p className="text-xs text-amber-700">
                      Please provide evidence details below. One item per line.
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
                    placeholder={`Enter evidence details or URLs...\n\nExample:\n- https://drive.google.com/file/evidence1\n- https://docs.google.com/document/evidence2\n- Source code: https://github.com/...`}
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
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingEvidence ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit with Evidence & Complete
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setEvidenceText("");
                      setEvidenceTask(null);
                    }}
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

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={() => {
          fetchDashboardData();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}