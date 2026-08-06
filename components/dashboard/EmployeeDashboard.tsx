// app/(dashboard)/dashboard/components/EmployeeDashboard.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Calendar,
  User,
  Timer,
  Gift,
  Crown,
  AlertTriangle,
  Users,
  Target,
  Plus,
  Pause,
  Play,
  ChevronRight,
  Gauge,
  Paperclip,
  X,
  Text,
  AlertTriangle as AlertTriangleIcon,
  Send,
  Eye as EyeIcon,
  Bell,
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
  dueDate: string;
  projectId?: {
    _id: string;
    name: string;
  };
  assignedTo: {
    _id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
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

export default function EmployeeDashboard() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // Filter state
  const [taskFilter, setTaskFilter] = useState<"all" | "running" | "pending">("all");

  // Evidence Modal state
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceTask, setEvidenceTask] = useState<Task | null>(null);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // ============ TIMER STATE WITH PERSISTENCE ============
  const [activeTimer, setActiveTimer] = useState<Task | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trial state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const calculateTimeLeft = useCallback(() => {
    if (!user?.trial?.endDate) return null;
    const now = new Date().getTime();
    const endDate = new Date(user.trial.endDate).getTime();
    const difference = endDate - now;
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  }, [user]);

  useEffect(() => {
    if (user?.trial?.isActive && user?.trial?.endDate) {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [user?.trial?.isActive, user?.trial?.endDate, calculateTimeLeft]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ============ TIMER INTERVAL ============
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTimerRunning]);

  const formatTimerTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes] = await Promise.all([api.get(`/tasks?assignedTo=${user?._id}`)]);
      const tasks = tasksRes.data.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTasks = tasks.filter((t: any) => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime() || (t.status !== "completed" && t.status !== "cancelled");
      });

      const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
      const pendingTasks = tasks.filter((t: any) => t.status === "pending").length;
      const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
      const overdueTasks = tasks.filter((t: any) => {
        if (t.status === "completed") return false;
        const dueDate = new Date(t.dueDate);
        const now = new Date();
        return dueDate < now;
      }).length;

      const todayLoggedHours = tasks
        .filter((t: any) => {
          const updatedAt = new Date(t.updatedAt);
          return updatedAt.toDateString() === today.toDateString() && t.status === "completed" && t.timeSpent;
        })
        .reduce((sum: number, t: any) => sum + (t.timeSpent || 0), 0);

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
        projectsCount: 0,
        teamMembersCount: 0,
        upcomingDeadlines: tasks.filter((t: any) => {
          if (t.status === "completed") return false;
          const dueDate = new Date(t.dueDate);
          const now = new Date();
          const diff = dueDate.getTime() - now.getTime();
          return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
        }).length,
        hoursLoggedToday: Math.round(todayLoggedHours * 10) / 10,
        hoursTarget: 8,
        todayTasks: todayTasks.length,
        todayRemaining: todayTasks.filter((t: any) => t.status !== "completed").length,
        weeklyProgress: 0,
        monthlyProgress: 0,
      });

      setAllTasks(tasks);
      setRecentTasks(tasks.slice(0, 5));

      // ============ RESTORE TIMER STATE FROM BACKEND ============
      const runningTask = tasks.find((t: any) => t.isTimerRunning === true);
      if (runningTask) {
        // Calculate elapsed time including current session
        let currentElapsed = runningTask.elapsedTime || 0;

        // If timer was running, calculate additional time since start
        if (runningTask.timerStartTime) {
          const startTimestamp = new Date(runningTask.timerStartTime).getTime();
          const nowTimestamp = new Date().getTime();
          const additionalSeconds = Math.floor((nowTimestamp - startTimestamp) / 1000);
          if (additionalSeconds > 0) currentElapsed += additionalSeconds;
        }

        setActiveTimer(runningTask);
        setTimerSeconds(currentElapsed);
        setIsTimerRunning(true);
      } else {
        setActiveTimer(null);
        setTimerSeconds(0);
        setIsTimerRunning(false);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await refreshUser();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  // ============ TIMER CONTROLS WITH PERSISTENCE ============

  const startTimer = async (task: Task) => {
    try {
      // Call API to start timer
      const response = await api.post(`/tasks/${task._id}/timer/start`);
      if (response.data.success) {
        const updatedTask = response.data.data;
        setActiveTimer(updatedTask);
        setTimerSeconds(0);
        setIsTimerRunning(true);
        toast.success(`⏱️ Timer started for "${task.title}"`);
        await fetchDashboardData();
      } else {
        toast.error(response.data.message || "Failed to start timer");
      }
    } catch (error: any) {
      console.error("Start timer error:", error);
      // Fallback: local timer
      setActiveTimer(task);
      setTimerSeconds(0);
      setIsTimerRunning(true);
      toast.warning("Timer started locally. Syncing with server...");
      // Try to sync after a moment
      setTimeout(async () => {
        try {
          await api.post(`/tasks/${task._id}/timer/start`);
        } catch (e) {
          console.error("Sync failed:", e);
        }
      }, 1000);
    }
  };

  const pauseTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await api.post(`/tasks/${activeTimer._id}/timer/pause`, {
        elapsedTime: timerSeconds
      });
      if (response.data.success) {
        setIsTimerRunning(false);
        toast.success(`⏱️ Timer paused for "${activeTimer.title}"`);
        await fetchDashboardData();
      } else {
        toast.error(response.data.message || "Failed to pause timer");
      }
    } catch (error: any) {
      console.error("Pause timer error:", error);
      // Fallback: pause locally
      setIsTimerRunning(false);
      toast.warning("Timer paused locally. Syncing with server...");
      setTimeout(async () => {
        try {
          await api.post(`/tasks/${activeTimer._id}/timer/pause`, {
            elapsedTime: timerSeconds
          });
        } catch (e) {
          console.error("Sync failed:", e);
        }
      }, 1000);
    }
  };

  const resumeTimer = async () => {
    if (!activeTimer) return;

    try {
      const response = await api.post(`/tasks/${activeTimer._id}/timer/resume`);
      if (response.data.success) {
        setIsTimerRunning(true);
        toast.success(`⏱️ Timer resumed for "${activeTimer.title}"`);
        await fetchDashboardData();
      } else {
        toast.error(response.data.message || "Failed to resume timer");
      }
    } catch (error: any) {
      console.error("Resume timer error:", error);
      // Fallback: resume locally
      setIsTimerRunning(true);
      toast.warning("Timer resumed locally. Syncing with server...");
      setTimeout(async () => {
        try {
          await api.post(`/tasks/${activeTimer._id}/timer/resume`);
        } catch (e) {
          console.error("Sync failed:", e);
        }
      }, 1000);
    }
  };

  const completeTaskLocal = async (taskId: string) => {
    setIsTimerRunning(false);

    try {
      const response = await api.patch(`/tasks/${taskId}/complete`);
      if (response.data.success) {
        toast.success(`✅ Task completed!`);
        setActiveTimer(null);
        setTimerSeconds(0);
        await fetchDashboardData();
        return;
      }
    } catch (error: any) {
      console.error("Complete task error:", error);
    }

    // Fallback
    toast.success(`✅ Task completed locally!`);
    setActiveTimer(null);
    setTimerSeconds(0);
    setAllTasks(prev => prev.map(t =>
      t._id === taskId ? { ...t, status: "completed", isTimerRunning: false } : t
    ));
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
      const evidenceUrls = evidenceText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (evidenceUrls.length === 0) {
        toast.error("Please provide at least one evidence item");
        setSubmittingEvidence(false);
        return;
      }

      const response = await api.patch(`/tasks/${evidenceTask._id}/status`, {
        status: "completed",
        evidenceUrls: evidenceUrls,
        approvalNote: "Task completed with evidence",
      });

      if (response.data.success) {
        toast.success("✅ Task completed with evidence!");
        setShowEvidenceModal(false);
        setEvidenceTask(null);
        setEvidenceText("");
        setActiveTimer(null);
        setTimerSeconds(0);
        setIsTimerRunning(false);
        await fetchDashboardData();
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

  const handleViewTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

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
      message: `Enjoy your free trial features.`,
      color: "from-emerald-500 to-teal-600",
    };
  };

  const trialStatus = getTrialStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!stats) return null;

  const getFilteredTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let filtered = allTasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime() || (task.status !== "completed" && task.status !== "cancelled");
    });
    if (taskFilter === "running") {
      filtered = filtered.filter((task) => task.isTimerRunning === true || task.status === "in_progress");
    } else if (taskFilter === "pending") {
      filtered = filtered.filter((task) => task.status === "pending" || task.status === "overdue");
    }
    return filtered.slice(0, 5);
  };

  const todaysTasksList = getFilteredTasks();

  const renderEvidenceBadge = (task: Task) => {
    if (!task?.evidenceRequired) return null;

    const hasEvidence = (task.evidenceUrls && task.evidenceUrls.length > 0);

    return (
      <span
        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${hasEvidence
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
      >
        <Paperclip size={10} />
        {hasEvidence ? "Evidence Submitted" : "Evidence Required"}
      </span>
    );
  };

  return (
    <div className="space-y-6 container mx-auto px-4 sm:px-6 py-6 bg-gray-50/50 min-h-screen">
      {/* Trial Banner */}
      <AnimatePresence>
        {user?.trial && trialStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${trialStatus.color} p-4 shadow-lg`}
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
          Good morning, {user?.fullName?.split(" ")[0] || "Tanvir"} 👋
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-sm"
          >
            <Plus size={16} />
            Add Task
          </button>
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition shadow-sm relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">{stats.todayTasks}</div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">TODAY'S TASKS</div>
          </div>
          <div className="text-xs font-semibold text-blue-600 mt-2">{stats.todayRemaining} remaining</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">{stats.completedTasks}</div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">COMPLETED</div>
          </div>
          <div className="text-xs font-semibold text-emerald-600 mt-2">↑ {stats.completionRate}% done</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900 tracking-tight">{stats.hoursLoggedToday || "0h"}</div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">HOURS TODAY</div>
          </div>
          <div className="text-xs font-medium text-gray-400 mt-2">of {stats.hoursTarget}h target</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-2xl font-black text-rose-600 tracking-tight">{stats.overdueTasks}</div>
            <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">OVERDUE</div>
          </div>
          <div className="text-xs font-semibold text-rose-500 mt-2">Needs action</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base">Today's Tasks</h2>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition ${taskFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTaskFilter("running")}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition ${taskFilter === "running" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  Running
                </button>
                <button
                  onClick={() => setTaskFilter("pending")}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition ${taskFilter === "pending" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {todaysTasksList.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No tasks for today! 🎉</div>
              ) : (
                todaysTasksList.map((task) => {
                  const isRunning = task.isTimerRunning || activeTimer?._id === task._id;
                  const isCompleted = task.status === "completed";
                  const isOverdue = task.status === "overdue" || new Date(task.dueDate) < new Date();

                  return (
                    <div
                      key={task._id}
                      className={`flex items-center justify-between px-6 py-3.5 transition hover:bg-gray-50/80 ${isRunning ? "bg-blue-50/40" : ""
                        }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : isRunning ? (
                          <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          </div>
                        ) : isOverdue ? (
                          <div className="w-5 h-5 rounded-full border-2 border-rose-500 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${isCompleted ? "text-gray-400 line-through" : isOverdue ? "text-rose-600 font-semibold" : "text-gray-800"
                                }`}
                            >
                              {task.title}
                            </span>
                            {renderEvidenceBadge(task)}
                          </div>
                          {task.dueDate && (
                            <span className="text-xs text-gray-400">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isCompleted && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                            Done
                          </span>
                        )}
                        {isRunning && (
                          <span className="text-xs font-semibold px-2 py-0.5 text-blue-600 flex items-center gap-1">
                            ▶ {formatTimerTime(timerSeconds)}
                          </span>
                        )}
                        {!isRunning && !isCompleted && (
                          <button
                            onClick={() => startTimer(task)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                            title="Start timer"
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
                        {task.priority && !isCompleted && !isRunning && (
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
                          <span className="text-xs font-medium text-rose-500">Overdue</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Active Timer & Workload */}
        <div className="space-y-6">
          {/* Active Timer Box */}
          <div className="bg-[#0B132B] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">ACTIVE TIMER</span>
              <div className={`w-2 h-2 rounded-full ${isTimerRunning ? "bg-emerald-400 animate-pulse" : activeTimer ? "bg-amber-400" : "bg-gray-500"
                }`} />
            </div>

            <div className="text-sm font-medium text-gray-200 truncate mb-2">
              {activeTimer ? activeTimer.title : "No active timer running"}
            </div>

            <div className="text-4xl font-black font-mono tracking-tight my-3">
              {activeTimer ? formatTimerTime(timerSeconds) : "00:00:00"}
            </div>

            {activeTimer && (
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden my-4">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min((timerSeconds / 28800) * 100, 100)}%`
                  }}
                />
              </div>
            )}

            {activeTimer ? (
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={isTimerRunning ? pauseTimer : resumeTimer}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
                  {isTimerRunning ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => activeTimer && handleCompleteTask(activeTimer)}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle size={16} />
                  Done
                </button>
                <button
                  onClick={() => activeTimer && handleViewTaskDetail(activeTimer)}
                  className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <EyeIcon size={16} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2">Start a timer from any task list item on the left.</p>
            )}
          </div>

          {/* My Workload Section */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">My Workload</h3>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
                <span className="px-2.5 py-1 bg-white text-gray-900 rounded-md shadow-sm">Week</span>
                <span className="px-2.5 py-1 text-gray-400">Month</span>
              </div>
            </div>

            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.hoursLoggedToday / stats.hoursTarget) * 100, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 font-medium mb-4">
              <span>{stats.hoursLoggedToday || 0}h done</span>
              <span>{Math.max(0, stats.hoursTarget - (stats.hoursLoggedToday || 0)).toFixed(1)}h free</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-50">
              {recentTasks.slice(0, 3).map((task) => (
                <div key={task._id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-medium truncate max-w-[150px]">✓ {task.title}</span>
                  <span className="text-gray-400">{task.status === "completed" ? "done" : `${task.estimatedHours || 8}h est.`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Submission Modal */}
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
                  <AlertTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
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
                        <Send className="w-4 h-4" />
                        Submit with Evidence & Complete
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

      {/* Create Task Modal */}
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