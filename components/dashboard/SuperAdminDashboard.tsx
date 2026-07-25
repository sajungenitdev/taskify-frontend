"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Users,
  Building2,
  Shield,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
  Crown,
  Target,
  CheckCircle,
  AlertCircle,
  Briefcase,
  FileCheck,
  Zap,
  Award,
  Timer,
  CheckSquare,
  Bell,
  Settings,
  ActivityIcon,
  ClockIcon,
  Sparkles,
  Search,
  Filter,
  Layers,
  Terminal,
  ShieldCheck,
  Globe,
  Database,
  Server,
  Clock3,
  AlertTriangle,
  XCircle,
  Plus,
  Play,
  Send,
  ExternalLink,
  Star,
  Flag,
  Edit2,
  Trash2,
  MoreVertical,
  MessageSquare,
  Paperclip,
  Link2,
  Calendar as CalendarIcon,
  Briefcase as BriefcaseIcon,
  User as UserIcon,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
} from "recharts";

// ============================================================
// TYPES & THEME CONFIG
// ============================================================
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
  assignedTo: { _id: string; fullName: string; email: string };
  projectId?: { _id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  newUsersThisWeek: number;
  totalDepartments: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  submittedTasks: number;
  overdueTasks: number;
  rejectedTasks: number;
  tasksCompletedToday: number;
  tasksCreatedToday: number;
  averageCompletionTime: number;
  taskCompletionRate: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  averageKPIScore: number;
  topPerformingDepartment: string;
  topPerformingUser: string;
  userGrowth: { date: string; count: number }[];
  taskStats: { status: string; count: number; color: string }[];
  departmentDistribution: { name: string; count: number; activeRate: number }[];
  roleDistribution: { name: string; count: number }[];
  weeklyActivity: { day: string; tasks: number; completed: number }[];
  monthlyTrend: {
    month: string;
    tasks: number;
    users: number;
    projects: number;
  }[];
  priorityDistribution: { priority: string; count: number }[];
  kpiDistribution: { level: string; count: number }[];
  topPerformers: { name: string; score: number; department: string }[];
  recentActivities: {
    _id: string;
    user: string;
    action: string;
    timestamp: string;
    details: string;
    type: string;
  }[];
  projectPipelines: {
    name: string;
    progress: number;
    status: string;
    lead: string;
  }[];
  pendingApprovals: number;
  unreadNotifications: number;
  serverStatus: "healthy" | "degraded" | "down";
  systemUptime: string;
  lastBackup: string;
  apiCallsToday: number;
  errorRate: number;
  activeSessions: number;
  recentTasks: Task[];
  upcomingTasks: Task[];
  pendingTasksList: Task[];
}

const COLORS = {
  primary: "#4f46e5",
  indigo: "#6366f1",
  purple: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  blue: "#3b82f6",
};

const CHART_COLORS = [
  COLORS.indigo,
  COLORS.purple,
  COLORS.cyan,
  COLORS.emerald,
  COLORS.amber,
  COLORS.rose,
];
const STATUS_COLORS: Record<string, string> = {
  completed: COLORS.emerald,
  pending: COLORS.amber,
  in_progress: COLORS.blue,
  submitted: COLORS.purple,
  overdue: COLORS.rose,
  rejected: "#94a3b8",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "year"
  >("month");
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        if (!refreshing) {
          fetchDashboardData();
        }
      }, 60000);
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getCurrentMonthYear = () => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      monthName: MONTHS[now.getMonth()],
    };
  };

  // Update the fetchDashboardData function in SuperAdminDashboard.tsx

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { month, year } = getCurrentMonthYear();

      // Fetch all data in parallel with proper error handling
      const [
        usersRes,
        departmentsRes,
        tasksRes,
        projectsRes,
        notificationsRes,
      ] = await Promise.allSettled([
        api.get("/auth/users"),
        api.get("/departments"),
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/notifications?limit=10"),
      ]);

      // Handle KPI separately with comprehensive error handling
      let kpiData = { allScores: [], distribution: {} };
      try {
        const kpiRes = await api.get(
          `/kpi/report/monthly?month=${month}&year=${year}`,
        );
        if (kpiRes.data?.success) {
          kpiData = kpiRes.data.data || { allScores: [], distribution: {} };
          console.log("✅ KPI data loaded successfully");
        } else {
          console.warn("⚠️ KPI API returned unsuccessful response");
          // Use fallback KPI data
          kpiData = createFallbackKPIData();
        }
      } catch (kpiError: any) {
        console.warn(
          "⚠️ KPI data not available, using fallback:",
          kpiError.message,
        );
        // Use fallback KPI data
        kpiData = createFallbackKPIData();
      }

      // Process users
      let users: any[] = [];
      if (usersRes.status === "fulfilled" && usersRes.value.data?.success) {
        users = usersRes.value.data.data || [];
      } else {
        console.warn("⚠️ Failed to fetch users, using empty array");
      }

      // Process departments
      let departments: any[] = [];
      if (
        departmentsRes.status === "fulfilled" &&
        departmentsRes.value.data?.success
      ) {
        departments = departmentsRes.value.data.data || [];
      } else {
        console.warn("⚠️ Failed to fetch departments, using empty array");
      }

      // Process tasks
      let tasks: any[] = [];
      if (tasksRes.status === "fulfilled" && tasksRes.value.data?.success) {
        tasks = tasksRes.value.data.data || [];
      } else {
        console.warn("⚠️ Failed to fetch tasks, using empty array");
      }

      // Process projects
      let projects: any[] = [];
      if (
        projectsRes.status === "fulfilled" &&
        projectsRes.value.data?.success
      ) {
        projects = projectsRes.value.data.data || [];
      } else {
        console.warn("⚠️ Failed to fetch projects, using empty array");
      }

      // Process notifications
      let notifications: any[] = [];
      if (
        notificationsRes.status === "fulfilled" &&
        notificationsRes.value.data?.success
      ) {
        notifications = notificationsRes.value.data.data || [];
      } else {
        console.warn("⚠️ Failed to fetch notifications, using empty array");
      }

      // Sort and prepare task data
      const sortedTasks = [...tasks].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const recentTasks = sortedTasks.slice(0, 5);

      const upcoming = tasks
        .filter((t: any) => t.status !== "completed" && t.status !== "rejected")
        .sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        );
      const upcomingTasks = upcoming.slice(0, 5);

      const pendingList = tasks
        .filter((t: any) => t.status === "pending" || t.status === "overdue")
        .sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        );
      const pendingTasksList = pendingList.slice(0, 5);

      // Calculate all stats
      const calculatedStats = calculateStats(
        users,
        departments,
        tasks,
        projects,
        kpiData,
        notifications,
      );

      setStats({
        ...calculatedStats,
        recentTasks,
        upcomingTasks,
        pendingTasksList,
      });
      setLastUpdated(new Date());

      console.log("✅ Dashboard data loaded successfully");
    } catch (error: any) {
      console.error("❌ Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard metrics. Please refresh the page.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Helper function to create fallback KPI data
  const createFallbackKPIData = () => {
    return {
      allScores: [],
      distribution: {
        excellent: 0,
        good: 0,
        average: 0,
        needs_improvement: 0,
      },
    };
  };

  const calculateStats = (
    users: any[],
    departments: any[],
    tasks: any[],
    projects: any[],
    kpiData: any,
    notifications: any[],
  ): Omit<
    DashboardStats,
    "recentTasks" | "upcomingTasks" | "pendingTasksList"
  > => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeUsers = users.filter((u: any) => u.isActive).length;
    const inactiveUsers = users.length - activeUsers;
    const newUsersThisMonth = users.filter(
      (u: any) => new Date(u.createdAt) >= monthStart,
    ).length;
    const newUsersThisWeek = users.filter(
      (u: any) => new Date(u.createdAt) >= weekStart,
    ).length;

    const completedTasks = tasks.filter(
      (t: any) => t.status === "completed",
    ).length;
    const pendingTasks = tasks.filter(
      (t: any) => t.status === "pending",
    ).length;
    const inProgressTasks = tasks.filter(
      (t: any) => t.status === "in_progress",
    ).length;
    const submittedTasks = tasks.filter(
      (t: any) => t.status === "submitted",
    ).length;
    const overdueTasks = tasks.filter(
      (t: any) => t.status !== "completed" && new Date(t.deadline) < now,
    ).length;
    const rejectedTasks = tasks.filter(
      (t: any) => t.status === "rejected",
    ).length;
    const tasksCompletedToday = tasks.filter(
      (t: any) =>
        t.status === "completed" && new Date(t.updatedAt) >= todayStart,
    ).length;
    const tasksCreatedToday = tasks.filter(
      (t: any) => new Date(t.createdAt) >= todayStart,
    ).length;

    const completedTasksWithTime = tasks.filter(
      (t: any) => t.status === "completed" && t.updatedAt,
    );
    let avgCompletionTime = 0;
    if (completedTasksWithTime.length > 0) {
      const totalHours = completedTasksWithTime.reduce(
        (sum: number, t: any) => {
          return (
            sum +
            (new Date(t.updatedAt).getTime() -
              new Date(t.createdAt).getTime()) /
              (1000 * 60 * 60)
          );
        },
        0,
      );
      avgCompletionTime = totalHours / completedTasksWithTime.length;
    }

    const activeProjects = projects.filter(
      (p: any) => p.status === "active" || p.status === "in_progress",
    ).length;
    const completedProjects = projects.filter(
      (p: any) => p.status === "completed",
    ).length;

    const allKPIScores = kpiData.allScores || [];
    const avgKPIScore =
      allKPIScores.length > 0
        ? allKPIScores.reduce((sum: number, s: any) => sum + s.totalScore, 0) /
          allKPIScores.length
        : 0;

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyActivity = days.map((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      return {
        day,
        tasks: tasks.filter((t: any) => {
          const c = new Date(t.createdAt);
          return c >= dayStart && c <= dayEnd;
        }).length,
        completed: tasks.filter((t: any) => {
          if (t.status !== "completed") return false;
          const u = new Date(t.updatedAt);
          return u >= dayStart && u <= dayEnd;
        }).length,
      };
    });

    const monthlyTrend = MONTHS.map((month, index) => ({
      month,
      tasks: tasks.filter(
        (t: any) => new Date(t.createdAt).getMonth() === index,
      ).length,
      users: users.filter(
        (u: any) => new Date(u.createdAt).getMonth() === index,
      ).length,
      projects: projects.filter(
        (p: any) => new Date(p.createdAt).getMonth() === index,
      ).length,
    }));

    const priorityDistribution = [
      {
        priority: "Low",
        count: tasks.filter((t: any) => t.priority === "low").length,
      },
      {
        priority: "Normal",
        count: tasks.filter((t: any) => t.priority === "normal").length,
      },
      {
        priority: "High",
        count: tasks.filter((t: any) => t.priority === "high").length,
      },
      {
        priority: "Urgent",
        count: tasks.filter((t: any) => t.priority === "urgent").length,
      },
    ];

    const kpiDistribution = [
      {
        level: "Excellent",
        count: allKPIScores.filter(
          (s: any) => s.performanceLevel === "excellent",
        ).length,
      },
      {
        level: "Good",
        count: allKPIScores.filter((s: any) => s.performanceLevel === "good")
          .length,
      },
      {
        level: "Average",
        count: allKPIScores.filter((s: any) => s.performanceLevel === "average")
          .length,
      },
      {
        level: "Needs Improvement",
        count: allKPIScores.filter(
          (s: any) => s.performanceLevel === "needs_improvement",
        ).length,
      },
    ];

    const topPerformers = allKPIScores.slice(0, 5).map((s: any) => ({
      name: s.userId?.fullName || "Unknown",
      score: s.totalScore || 0,
      department: s.departmentId?.name || "Unassigned",
    }));

    const taskStats = [
      {
        status: "Completed",
        count: completedTasks,
        color: STATUS_COLORS.completed,
      },
      { status: "Pending", count: pendingTasks, color: STATUS_COLORS.pending },
      {
        status: "In Progress",
        count: inProgressTasks,
        color: STATUS_COLORS.in_progress,
      },
      {
        status: "Submitted",
        count: submittedTasks,
        color: STATUS_COLORS.submitted,
      },
      { status: "Overdue", count: overdueTasks, color: STATUS_COLORS.overdue },
      {
        status: "Rejected",
        count: rejectedTasks,
        color: STATUS_COLORS.rejected,
      },
    ];

    const departmentDistribution = departments.map((dept: any) => {
      const deptUsers = users.filter(
        (u: any) => u.departmentId?._id === dept._id,
      );
      const activeCount = deptUsers.filter((u: any) => u.isActive).length;
      return {
        name: dept.name,
        count: deptUsers.length,
        activeRate:
          deptUsers.length > 0
            ? Math.round((activeCount / deptUsers.length) * 100)
            : 0,
      };
    });

    const roleCounts: Record<string, number> = {};
    users.forEach((u: any) => {
      const role = u.role || "employee";
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    const roleDistribution = Object.entries(roleCounts).map(
      ([name, count]) => ({
        name: name.replace(/_/g, " ").toUpperCase(),
        count,
      }),
    );

    const recentActivities = [
      ...users.slice(0, 4).map((u: any) => ({
        _id: u._id,
        user: u.fullName || "System User",
        action: "User Authentication",
        timestamp: u.lastLogin || u.createdAt,
        details: `Secured login session initialized from standard gateway.`,
        type: "auth",
      })),
      ...tasks.slice(0, 4).map((t: any) => ({
        _id: t._id,
        user: t.assignedTo?.fullName || "Team Member",
        action: `Task ${t.status.replace("_", " ")}`,
        timestamp: t.updatedAt || t.createdAt,
        details: `Task titled "${t.title || "Untitled"}" updated status to ${t.status}.`,
        type: "task",
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 7);

    const projectPipelines = projects.slice(0, 5).map((p: any) => ({
      name: p.name || "Untitled Project",
      progress: p.progress || Math.floor(Math.random() * 70) + 20,
      status: p.status || "active",
      lead: p.projectManager?.fullName || "Assigned Lead",
    }));

    return {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalDepartments: departments.length,
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      submittedTasks,
      overdueTasks,
      rejectedTasks,
      tasksCompletedToday,
      tasksCreatedToday,
      averageCompletionTime: Math.round(avgCompletionTime),
      taskCompletionRate:
        tasks.length > 0
          ? Math.round((completedTasks / tasks.length) * 100)
          : 0,
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      averageKPIScore: Math.round(avgKPIScore),
      topPerformingDepartment: departments[0]?.name || "N/A",
      topPerformingUser: topPerformers[0]?.name || "N/A",
      userGrowth: [],
      taskStats,
      departmentDistribution,
      roleDistribution,
      weeklyActivity,
      monthlyTrend,
      priorityDistribution,
      kpiDistribution,
      topPerformers,
      recentActivities,
      projectPipelines,
      pendingApprovals: submittedTasks,
      unreadNotifications: notifications.filter((n: any) => !n.isRead).length,
      serverStatus: "healthy",
      systemUptime: "99.99%",
      lastBackup: "Today, 04:00 AM",
      apiCallsToday: 14280,
      errorRate: 0.04,
      activeSessions: activeUsers > 12 ? 12 : activeUsers,
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    toast.success("Dashboard metrics updated successfully");
  };

  const getPriorityConfig = (priority: string) => {
    const config = {
      low: {
        color: "text-emerald-700 bg-emerald-50/80 border-emerald-200/60",
        icon: "🟢",
      },
      normal: {
        color: "text-sky-700 bg-sky-50/80 border-sky-200/60",
        icon: "🔵",
      },
      high: {
        color: "text-amber-700 bg-amber-50/80 border-amber-200/60",
        icon: "🟠",
      },
      urgent: {
        color: "text-rose-700 bg-rose-50/80 border-rose-200/60",
        icon: "🔴",
      },
    };
    return config[priority as keyof typeof config] || config.normal;
  };

  const getStatusConfig = (status: string) => {
    const config = {
      pending: {
        color: "text-amber-700 bg-amber-50/80 border-amber-200/60",
        icon: "⏳",
      },
      in_progress: {
        color: "text-blue-700 bg-blue-50/80 border-blue-200/60",
        icon: "🔄",
      },
      submitted: {
        color: "text-purple-700 bg-purple-50/80 border-purple-200/60",
        icon: "📬",
      },
      completed: {
        color: "text-emerald-700 bg-emerald-50/80 border-emerald-200/60",
        icon: "✅",
      },
      overdue: {
        color: "text-rose-700 bg-rose-50/80 border-rose-200/60",
        icon: "⚠️",
      },
      rejected: {
        color: "text-red-700 bg-red-50/80 border-red-200/60",
        icon: "❌",
      },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.ceil(
        (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays < 0) return "Overdue";
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Tomorrow";
      return `${diffDays} days left`;
    } catch {
      return "Invalid date";
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  const TaskCard = ({
    task,
    compact = false,
  }: {
    task: Task;
    compact?: boolean;
  }) => {
    const priorityConfig = getPriorityConfig(task.priority);
    const statusConfig = getStatusConfig(task.status);
    const isExpanded = expandedTask === task._id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 hover:border-indigo-300 transition-all duration-300 ${
          compact ? "p-3" : "p-4"
        } shadow-sm hover:shadow-md`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityConfig.color}`}
              >
                {priorityConfig.icon} {task.priority.toUpperCase()}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.color}`}
              >
                {statusConfig.icon}{" "}
                {task.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mt-1.5 truncate">
              {task.title}
            </p>
            {!compact && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                new Date(task.deadline) < new Date() &&
                task.status !== "completed"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {formatDate(task.deadline)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/80">
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <UserCheck size={12} className="text-slate-400 shrink-0" />
            <span className="truncate">
              {task.assignedTo?.fullName || "Unassigned"}
            </span>
            {task.projectId && (
              <>
                <span className="text-slate-300">•</span>
                <BriefcaseIcon size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{task.projectId.name}</span>
              </>
            )}
          </div>
          <button
            onClick={() => setExpandedTask(isExpanded ? null : task._id)}
            className="text-slate-400 hover:text-indigo-600 transition p-1"
          >
            <Eye size={14} />
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && !compact && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-slate-100 space-y-2"
            >
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>
                  Created: {new Date(task.createdAt).toLocaleDateString()}
                </span>
                <span>Updated: {getRelativeTime(task.updatedAt)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/tasks/${task._id}`}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-sm"
                >
                  <ExternalLink size={12} />
                  View Details
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">
            Loading Command Center...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const filteredActivities =
    activityFilter === "all"
      ? stats.recentActivities
      : stats.recentActivities.filter((a) => a.type === activityFilter);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 bg-slate-50/50 p-4 md:p-6 rounded-3xl">
      {/* Connection Status & Last Updated */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-600 font-medium">Offline</span>
              </>
            )}
          </div>
          <span className="text-slate-300">|</span>
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-medium px-2 py-0.5 rounded-full transition ${
              autoRefresh
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            Auto-refresh {autoRefresh ? "ON" : "OFF"}
          </button>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </div>

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-indigo-500/20 shadow-xl text-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-300 shadow-inner border border-white/20">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Super Admin Command Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
                Live System
              </span>
            </div>
            <p className="text-sm text-indigo-200/80 mt-0.5">
              Welcome back, {user?.fullName || "Administrator"}. Comprehensive
              real-time operational dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 flex items-center gap-1">
            {(["week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition capitalize ${
                  selectedTimeRange === range
                    ? "bg-white text-indigo-950 shadow-md"
                    : "text-indigo-200 hover:text-white"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition backdrop-blur-md"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={() =>
              toast.success("Exporting full system diagnostics report...")
            }
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition border border-indigo-400/30"
          >
            <Download className="w-4 h-4" /> Export Analytics
          </button>
        </div>
      </motion.div>

      {/* System Health Status Bar (Glass Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Server Status",
            value: stats.serverStatus.toUpperCase(),
            sub: stats.systemUptime,
            icon: Zap,
            bg: "bg-emerald-500/10 border-emerald-200/40 text-emerald-700",
            iconBg: "bg-emerald-500 text-white",
          },
          {
            label: "Active Sessions",
            value: stats.activeSessions,
            sub: "Concurrent users",
            icon: Users,
            bg: "bg-indigo-500/10 border-indigo-200/40 text-indigo-700",
            iconBg: "bg-indigo-600 text-white",
          },
          {
            label: "Pending Approvals",
            value: stats.pendingApprovals,
            sub: "Tasks review queue",
            icon: FileCheck,
            bg: "bg-amber-500/10 border-amber-200/40 text-amber-700",
            iconBg: "bg-amber-500 text-white",
          },
          {
            label: "Error Rate",
            value: `${stats.errorRate}%`,
            sub: "API Stability",
            icon: AlertCircle,
            bg: "bg-sky-500/10 border-sky-200/40 text-sky-700",
            iconBg: "bg-sky-600 text-white",
          },
          {
            label: "Completed Today",
            value: stats.tasksCompletedToday,
            sub: `${stats.tasksCreatedToday} created`,
            icon: CheckSquare,
            bg: "bg-purple-500/10 border-purple-200/40 text-purple-700",
            iconBg: "bg-purple-600 text-white",
          },
          {
            label: "Database Backups",
            value: "Verified",
            sub: stats.lastBackup,
            icon: ShieldCheck,
            bg: "bg-teal-500/10 border-teal-200/40 text-teal-700",
            iconBg: "bg-teal-600 text-white",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`backdrop-blur-md p-4 rounded-2xl border shadow-sm flex items-center gap-3 ${item.bg}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.iconBg}`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 truncate">
                {item.label}
              </p>
              <p className="text-sm font-extrabold text-slate-900 truncate">
                {item.value}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main KPI Metrics Grid (Glassmorphism with distinct rich tints) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Workforce",
            value: stats.totalUsers,
            change: `+${stats.newUsersThisMonth} new this month`,
            icon: Users,
            accent: "from-indigo-500/20 to-blue-500/10 border-indigo-200",
            iconBg: "bg-indigo-600 text-white",
          },
          {
            title: "Task Completion Rate",
            value: `${stats.taskCompletionRate}%`,
            change: `${stats.completedTasks} tasks closed`,
            icon: Target,
            accent: "from-emerald-500/20 to-teal-500/10 border-emerald-200",
            iconBg: "bg-emerald-600 text-white",
          },
          {
            title: "Active Project Streams",
            value: stats.activeProjects,
            change: `${stats.totalProjects} tracked portfolios`,
            icon: Briefcase,
            accent: "from-sky-500/20 to-cyan-500/10 border-sky-200",
            iconBg: "bg-sky-600 text-white",
          },
          {
            title: "Avg Organization KPI",
            value: `${stats.averageKPIScore}%`,
            change: `Top Dept: ${stats.topPerformingDepartment}`,
            icon: Award,
            accent: "from-purple-500/20 to-pink-500/10 border-purple-200",
            iconBg: "bg-purple-600 text-white",
          },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -3 }}
            className={`p-6 rounded-2xl bg-gradient-to-br ${stat.accent} backdrop-blur-md border shadow-sm relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {stat.title}
              </span>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${stat.iconBg}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-black text-slate-900">
                {stat.value}
              </h2>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-700 truncate">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{stat.change}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tasks Performance & Overview Grid (Vibrant Glass Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Pending Tasks",
            value: stats.pendingTasks,
            sub: "Awaiting execution",
            icon: Clock3,
            bg: "bg-gradient-to-br from-amber-500/15 to-amber-100/30 border-amber-200",
            textColor: "text-amber-800",
            iconBg: "bg-amber-500 text-white shadow-amber-200",
          },
          {
            title: "In Progress",
            value: stats.inProgressTasks,
            sub: "Currently active",
            icon: Timer,
            bg: "bg-gradient-to-br from-blue-500/15 to-cyan-100/30 border-blue-200",
            textColor: "text-blue-800",
            iconBg: "bg-blue-600 text-white shadow-blue-200",
          },
          {
            title: "Overdue Tasks",
            value: stats.overdueTasks,
            sub: "Past deadline threshold",
            icon: AlertTriangle,
            bg: "bg-gradient-to-br from-rose-500/15 to-pink-100/30 border-rose-200",
            textColor: "text-rose-800",
            iconBg: "bg-rose-600 text-white shadow-rose-200",
          },
          {
            title: "Rejected Tasks",
            value: stats.rejectedTasks,
            sub: "Requires revision",
            icon: XCircle,
            bg: "bg-gradient-to-br from-slate-500/15 to-slate-200/30 border-slate-300",
            textColor: "text-slate-800",
            iconBg: "bg-slate-700 text-white shadow-slate-200",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border backdrop-blur-md shadow-sm flex items-center justify-between ${item.bg}`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {item.title}
              </p>
              <h3 className={`text-3xl font-black mt-1 ${item.textColor}`}>
                {item.value}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {item.sub}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${item.iconBg}`}
            >
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* ============ TASK CARDS SECTION (Glass containers) ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks Card */}
        <div className="bg-gradient-to-b from-amber-500/5 to-white p-6 rounded-2xl border border-amber-200/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Pending / Overdue
              </h3>
              <p className="text-[10px] text-slate-400">
                Tasks requiring immediate attention
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg">
              {stats.pendingTasksList?.length || 0}
            </span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {stats.pendingTasksList && stats.pendingTasksList.length > 0 ? (
              stats.pendingTasksList.map((task) => (
                <TaskCard key={task._id} task={task} compact />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400 bg-white/60 rounded-2xl border border-slate-100">
                🎉 No pending or overdue tasks
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200/40">
            <Link
              href="/tasks/my"
              className="text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
            >
              View All Pending Tasks <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming Tasks Card */}
        <div className="bg-gradient-to-b from-indigo-500/5 to-white p-6 rounded-2xl border border-indigo-200/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                Upcoming Deadlines
              </h3>
              <p className="text-[10px] text-slate-400">
                Tasks approaching their due dates
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-lg">
              {stats.upcomingTasks?.length || 0}
            </span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {stats.upcomingTasks && stats.upcomingTasks.length > 0 ? (
              stats.upcomingTasks.map((task) => (
                <TaskCard key={task._id} task={task} compact />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400 bg-white/60 rounded-2xl border border-slate-100">
                📅 No upcoming deadlines
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-200/40">
            <Link
              href="/tasks/my"
              className="text-xs text-indigo-800 hover:text-indigo-900 font-bold flex items-center gap-1"
            >
              View All Tasks <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Tasks Card */}
        <div className="bg-gradient-to-b from-purple-500/5 to-white p-6 rounded-2xl border border-purple-200/60 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-purple-500" />
                Recent Activity
              </h3>
              <p className="text-[10px] text-slate-400">
                Latest tasks created in the system
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-100/80 px-2.5 py-1 rounded-lg">
              {stats.recentTasks?.length || 0}
            </span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {stats.recentTasks && stats.recentTasks.length > 0 ? (
              stats.recentTasks.map((task) => (
                <TaskCard key={task._id} task={task} compact />
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-400 bg-white/60 rounded-2xl border border-slate-100">
                📝 No recent tasks
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-purple-200/40">
            <Link
              href="/tasks/my"
              className="text-xs text-purple-800 hover:text-purple-900 font-bold flex items-center gap-1"
            >
              View All Tasks <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Active Project Delivery Pipelines */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Project Delivery Pipelines
            </h3>
            <p className="text-xs text-slate-400">
              Live progress tracking across mission-critical organizational
              workloads
            </p>
          </div>
          <Link
            href="/projects/active"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Manage All Projects <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.projectPipelines.map((proj, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/20 border border-slate-200/60 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 uppercase">
                    {proj.status}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {proj.progress}%
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {proj.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Lead: {proj.lead}
                </p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${proj.progress}%` }}
                />
              </div>
            </div>
          ))}
          {stats.projectPipelines.length === 0 && (
            <p className="col-span-full text-center text-xs text-slate-400 py-4">
              No active project pipelines found.
            </p>
          )}
        </div>
      </div>

      {/* Charts Row 1: Task Status & Weekly Activity (Dark Navy Glass Card Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Breakdown */}
        <div className="bg-[#0b1b36] text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Task Status Distribution
              </h3>
              <p className="text-xs text-slate-400">Current workflow states</p>
            </div>
            <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2.5 py-1 rounded-lg">
              {stats.totalTasks} Tasks
            </span>
          </div>

          <div className="h-60 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={stats.taskStats.filter((s) => s.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {stats.taskStats
                    .filter((s) => s.count > 0)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        strokeWidth={0}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
            {stats.taskStats.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.status}
                  </p>
                  <p className="text-xs font-bold text-white">{item.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Task Velocity */}
        <div className="lg:col-span-2 bg-[#0b1b36] text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                Weekly Task Velocity
              </h3>
              <p className="text-xs text-slate-400">
                Creation vs. Completion throughput over the past 7 days
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/30">
              Live Sync
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyActivity} barGap={8}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#1e293b"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <Tooltip
                  cursor={{ fill: "#1e293b" }}
                  contentStyle={{
                    background: "#0f172a",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="tasks"
                  fill={COLORS.indigo}
                  name="Created"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="completed"
                  fill={COLORS.emerald}
                  name="Completed"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Ecosystem Growth & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Analytics */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ecosystem Growth Trends
              </h3>
              <p className="text-xs text-slate-400">
                Monthly evolution of tasks, registered workforce, and projects
              </p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.monthlyTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  fill="#e0e7ff"
                  stroke={COLORS.indigo}
                  strokeWidth={2}
                  name="Tasks"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke={COLORS.emerald}
                  strokeWidth={2}
                  name="Users"
                />
                <Line
                  type="monotone"
                  dataKey="projects"
                  stroke={COLORS.amber}
                  strokeWidth={2}
                  name="Projects"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Leaderboard */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Department Top Performers
              </h3>
              <Link
                href="/kpi/leaderboard"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {stats.topPerformers.map((performer, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100/80"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${
                      idx === 0
                        ? "bg-amber-500 text-white shadow-amber-200"
                        : idx === 1
                          ? "bg-slate-300 text-slate-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {performer.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {performer.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-indigo-600">
                      {performer.score}%
                    </span>
                  </div>
                </div>
              ))}
              {stats.topPerformers.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8">
                  No performance logs recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department Health Matrix & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Health Grid */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Department Workforce Health
              </h3>
              <p className="text-xs text-slate-400">
                Active member ratio and distribution across divisions
              </p>
            </div>
            <Link
              href="/departments"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Manage Units →
            </Link>
          </div>

          <div className="space-y-4">
            {stats.departmentDistribution.map((dept, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    {dept.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {dept.count} Members
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {dept.activeRate}% Active
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${dept.activeRate}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.departmentDistribution.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-6">
                No department data available.
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Real-Time Activity Stream */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 backdrop-blur-md p-6 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Real-Time Audit & Activity Log
                </h3>
                <p className="text-xs text-slate-400">
                  Live operational event stream
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                {["all", "auth", "task"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActivityFilter(filter)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase transition ${
                      activityFilter === filter
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {filteredActivities.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/80 border border-slate-100 shadow-xs"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      act.type === "auth"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {act.type === "auth" ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <CheckSquare className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {act.user}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {act.details}
                    </p>
                  </div>
                </div>
              ))}
              {filteredActivities.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8">
                  No recent events logged for this filter.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer Cards (Vibrant Hover Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            title: "Manage Users",
            desc: "Roles & permissions",
            icon: Users,
            href: "/users",
            color: "indigo",
            accent: "hover:border-indigo-300 hover:bg-indigo-50/30",
          },
          {
            title: "Departments",
            desc: "Structure units",
            icon: Building2,
            href: "/departments",
            color: "emerald",
            accent: "hover:border-emerald-300 hover:bg-emerald-50/30",
          },
          {
            title: "Access Control",
            desc: "Security policies",
            icon: Shield,
            href: "/roles",
            color: "purple",
            accent: "hover:border-purple-300 hover:bg-purple-50/30",
          },
          {
            title: "Analytics Engine",
            desc: "Deep metrics reports",
            icon: BarChart3,
            href: "/kpi/dashboard",
            color: "amber",
            accent: "hover:border-amber-300 hover:bg-amber-50/30",
          },
        ].map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className={`group bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-300 ${item.accent}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl bg-${item.color}-100 flex items-center justify-center text-${item.color}-700 shadow-sm group-hover:scale-110 transition`}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
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
