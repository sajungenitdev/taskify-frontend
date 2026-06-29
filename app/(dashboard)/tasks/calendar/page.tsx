"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Flag,
  Sparkles,
  User,
  Mail,
  Briefcase,
  Filter,
  X,
  Loader2,
  Home,
  ChevronRight as ChevronRightIcon,
  LayoutGrid,
  List,
  CalendarDays,
  Star,
  Bell,
  MessageSquare,
  Paperclip,
  Eye,
  Play,
  Send,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
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
  createdAt: string;
  updatedAt: string;
}

type ViewMode = "month" | "week" | "day";

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-sky-100 text-sky-700 border-sky-200",
  submitted: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-100 text-rose-700 border-rose-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  pending: "To Do",
  in_progress: "In Progress",
  submitted: "Submitted",
  completed: "Completed",
  overdue: "Overdue",
  rejected: "Rejected",
};

const priorityColors = {
  urgent: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  normal: "bg-blue-100 text-blue-700 border-blue-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const priorityLabels = {
  urgent: "🔴 Urgent",
  high: "🟠 High",
  normal: "🔵 Normal",
  low: "🟢 Low",
};

export default function MyCalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    submitted: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyTasks();
    }
  }, [isAuthenticated, user]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks/my-tasks");
      if (response.data.success) {
        const tasksWithMeta = (response.data.data || []).map((task: Task) => ({
          ...task,
          comments: Math.floor(Math.random() * 10),
          attachments: Math.floor(Math.random() * 5),
          isStarred: false,
        }));
        setTasks(tasksWithMeta);
        calculateStats(tasksWithMeta);
      } else {
        setTasks([]);
        calculateStats([]);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      // Try fallback to all tasks
      try {
        const fallbackResponse = await api.get("/tasks");
        if (fallbackResponse.data.success) {
          const allTasks = fallbackResponse.data.data || [];
          // Filter tasks assigned to current user
          const myTasks = allTasks.filter(
            (task: Task) =>
              task.assignedTo?._id === user?._id ||
              task.assignedTo === user?._id,
          );
          setTasks(myTasks);
          calculateStats(myTasks);
        } else {
          setTasks([]);
          calculateStats([]);
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        setTasks([]);
        calculateStats([]);
        toast.error("Failed to load your tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (taskList: Task[]) => {
    setStats({
      total: taskList.length,
      pending: taskList.filter((t) => t.status === "pending").length,
      inProgress: taskList.filter((t) => t.status === "in_progress").length,
      completed: taskList.filter((t) => t.status === "completed").length,
      overdue: taskList.filter((t) => t.status === "overdue").length,
      submitted: taskList.filter((t) => t.status === "submitted").length,
    });
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
        fetchMyTasks();
        setSelectedTask(null);
        setShowTaskDetail(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityConfig = (priority: string) => {
    return {
      color:
        priorityColors[priority as keyof typeof priorityColors] ||
        priorityColors.normal,
      label:
        priorityLabels[priority as keyof typeof priorityLabels] || priority,
    };
  };

  const getStatusConfig = (status: string) => {
    return {
      color:
        statusColors[status as keyof typeof statusColors] ||
        statusColors.pending,
      label: statusLabels[status as keyof typeof statusLabels] || status,
      icon:
        status === "pending"
          ? Circle
          : status === "in_progress"
            ? Clock
            : status === "submitted"
              ? AlertCircle
              : status === "completed"
                ? CheckCircle
                : AlertCircle,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
  };

  // Check if a date has tasks
  const hasTasksOnDate = (date: Date) => {
    return getTasksForDate(date).length > 0;
  };

  // Get filtered tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    let filtered = getTasksForDate(selectedDate);
    if (filterStatus !== "all") {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }
    if (filterPriority !== "all") {
      filtered = filtered.filter(
        (task) => (task.priority || "normal") === filterPriority,
      );
    }
    return filtered;
  }, [selectedDate, tasks, filterStatus, filterPriority]);

  // Calendar navigation
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Generate calendar days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  // Generate week days
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      )
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.toISOString().split("T")[0] === today.toISOString().split("T")[0]
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.toISOString().split("T")[0] ===
      selectedDate.toISOString().split("T")[0]
    );
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm mb-6"
        >
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
          >
            <Home size={14} />
            Dashboard
          </Link>
          <ChevronRightIcon size={14} className="text-gray-300" />
          <Link
            href="/tasks"
            className="text-gray-400 hover:text-gray-600 transition"
          >
            Tasks
          </Link>
          <ChevronRightIcon size={14} className="text-gray-300" />
          <span className="text-gray-700 font-medium">My Calendar</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <CalendarIcon className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                My Calendar
              </h1>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                {stats.total} tasks
              </span>
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              View and manage your personal task schedule
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
            >
              <CalendarDays size={16} />
              Today
            </button>
            <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                  viewMode === "month"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <LayoutGrid size={14} />
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                  viewMode === "week"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List size={14} />
                Week
              </button>
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                  viewMode === "day"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CalendarDays size={14} />
                Day
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6"
        >
          {[
            {
              label: "Total",
              value: stats.total,
              icon: CheckSquare,
              color: "text-gray-700",
              bg: "bg-gray-50",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: Zap,
              color: "text-sky-600",
              bg: "bg-sky-50",
            },
            {
              label: "Submitted",
              value: stats.submitted,
              icon: Send,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Overdue",
              value: stats.overdue,
              icon: AlertCircle,
              color: "text-rose-600",
              bg: "bg-rose-50",
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`${stat.bg} rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                  <p className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
                <div
                  className={`w-7 h-7 ${stat.bg} rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Calendar Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === "month") navigateMonth(-1);
                  else if (viewMode === "week") navigateWeek(-1);
                  else navigateDay(-1);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
                {viewMode === "month" && (
                  <>
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </>
                )}
                {viewMode === "week" && (
                  <>
                    Week {getWeekNumber(currentDate)},{" "}
                    {currentDate.getFullYear()}
                  </>
                )}
                {viewMode === "day" && (
                  <>
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  if (viewMode === "month") navigateMonth(1);
                  else if (viewMode === "week") navigateWeek(1);
                  else navigateDay(1);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ||
                  filterStatus !== "all" ||
                  filterPriority !== "all"
                    ? "bg-indigo-100 text-indigo-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3"
              >
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-black px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm"
                >
                  <option value="all">All Status</option>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="text-black px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="normal">🔵 Normal</option>
                  <option value="low">🟢 Low</option>
                </select>
                {(filterStatus !== "all" || filterPriority !== "all") && (
                  <button
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterPriority("all");
                    }}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden"
        >
          {viewMode === "month" && (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getMonthDays().map(({ date, isCurrentMonth }, index) => {
                  const dayTasks = getTasksForDate(date);
                  const hasTasks = dayTasks.length > 0;
                  const isTodayDate = isToday(date);
                  const isSelectedDate = isSelected(date);

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedDate(date);
                        if (dayTasks.length > 0) {
                          // Scroll to tasks section
                        }
                      }}
                      className={`
                        min-h-[80px] p-2 rounded-xl cursor-pointer transition-all
                        ${isCurrentMonth ? "hover:bg-gray-50" : "opacity-40"}
                        ${isTodayDate ? "ring-2 ring-indigo-500 ring-offset-2" : ""}
                        ${isSelectedDate ? "bg-indigo-50" : ""}
                        ${hasTasks ? "hover:shadow-sm" : ""}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`
                            text-sm font-medium
                            ${isTodayDate ? "text-indigo-600" : "text-gray-700"}
                            ${!isCurrentMonth ? "text-gray-400" : ""}
                          `}
                        >
                          {date.getDate()}
                        </span>
                        {hasTasks && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayTasks.slice(0, 3).map((task) => {
                          const statusConfig = getStatusConfig(task.status);
                          const StatusIcon = statusConfig.icon;
                          return (
                            <div
                              key={task._id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setShowTaskDetail(true);
                              }}
                              className={`
                                text-xs px-1.5 py-0.5 rounded truncate cursor-pointer flex items-center gap-0.5
                                ${statusConfig.color}
                                hover:opacity-80 transition-opacity
                              `}
                            >
                              <StatusIcon className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{task.title}</span>
                            </div>
                          );
                        })}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-400 pl-1.5">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "week" && (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((date, index) => {
                  const dayTasks = getTasksForDate(date);
                  const isTodayDate = isToday(date);
                  const isSelectedDate = isSelected(date);

                  return (
                    <div key={index} className="min-h-[200px]">
                      <div
                        onClick={() => setSelectedDate(date)}
                        className={`
                          text-center py-2 rounded-xl cursor-pointer transition-all
                          ${isTodayDate ? "bg-indigo-50" : "hover:bg-gray-50"}
                          ${isSelectedDate ? "bg-indigo-100" : ""}
                        `}
                      >
                        <div className="text-xs text-gray-500">
                          {date.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div
                          className={`
                            text-lg font-semibold
                            ${isTodayDate ? "text-indigo-600" : "text-gray-700"}
                          `}
                        >
                          {date.getDate()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {dayTasks.length} tasks
                        </div>
                      </div>
                      <div className="mt-2 space-y-1.5 max-h-[300px] overflow-y-auto">
                        {dayTasks.map((task) => {
                          const statusConfig = getStatusConfig(task.status);
                          const StatusIcon = statusConfig.icon;
                          const priorityConfig = getPriorityConfig(
                            task.priority,
                          );
                          return (
                            <div
                              key={task._id}
                              onClick={() => {
                                setSelectedTask(task);
                                setShowTaskDetail(true);
                              }}
                              className={`
                                text-xs p-2 rounded-lg cursor-pointer transition-all
                                ${statusConfig.color}
                                hover:shadow-md hover:scale-[1.02]
                              `}
                            >
                              <div className="font-medium truncate flex items-center gap-1">
                                <StatusIcon className="w-3 h-3 flex-shrink-0" />
                                {task.title}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-75">
                                <span>{priorityConfig.label}</span>
                                {task.projectId && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                                    <span>{task.projectId.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {dayTasks.length === 0 && (
                          <div className="text-xs text-gray-400 text-center py-4">
                            ✨ No tasks
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "day" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedDateTasks.length} tasks due
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateDay(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateDay(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {selectedDateTasks.length > 0 ? (
                  selectedDateTasks.map((task) => {
                    const statusConfig = getStatusConfig(task.status);
                    const StatusIcon = statusConfig.icon;
                    const priorityConfig = getPriorityConfig(task.priority);
                    const isOverdue =
                      new Date(task.deadline) < new Date() &&
                      task.status !== "completed";

                    return (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group border border-transparent hover:border-indigo-200"
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskDetail(true);
                        }}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <StatusIcon
                            className={`w-4 h-4 flex-shrink-0 ${statusConfig.color.split(" ")[1]}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate flex items-center gap-2">
                              {task.title}
                              {task.isStarred && (
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                              )}
                            </p>
                            {task.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig.color}`}
                            >
                              {priorityConfig.label}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                            {task.assignedTo && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                  {getInitials(task.assignedTo.fullName)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h4 className="text-xl font-medium text-gray-800">
                      No tasks due this day
                    </h4>
                    <p className="text-gray-400 text-sm mt-2">
                      Enjoy a free day! 🎉
                    </p>
                    <button
                      onClick={goToToday}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-sm"
                    >
                      Go to Today
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Task Detail Modal */}
        <AnimatePresence>
          {showTaskDetail && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowTaskDetail(false);
                setSelectedTask(null);
              }}
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
                        {getPriorityConfig(selectedTask.priority).label}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusConfig(selectedTask.status).color}`}
                      >
                        {getStatusConfig(selectedTask.status).label}
                      </span>
                      {selectedTask.isStarred && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          ⭐ Starred
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedTask.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowTaskDetail(false);
                      setSelectedTask(null);
                    }}
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
                      {selectedTask.description || "No description provided."}
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
                            {getInitials(
                              selectedTask.assignedTo?.fullName || "?",
                            )}
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
                        <CalendarIcon size={14} className="text-gray-400" />
                        <span className="text-gray-800 text-sm font-medium">
                          {formatDate(selectedTask.deadline)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          at {formatTime(selectedTask.deadline)}
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
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-gray-500 text-xs">
                        {getRelativeTime(selectedTask.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
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

                    {selectedTask.status === "submitted" && (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-400 cursor-not-allowed text-white text-sm rounded-lg flex items-center gap-2"
                      >
                        <Clock size={14} />
                        Awaiting Approval
                      </button>
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

                    <Link
                      href={`/tasks/${selectedTask._id}`}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition flex items-center gap-2"
                    >
                      <ArrowRight size={14} />
                      View Full Details
                    </Link>
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
        `}</style>
      </div>
    </div>
  );
}
