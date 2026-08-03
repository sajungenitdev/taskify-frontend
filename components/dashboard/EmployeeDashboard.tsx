// app/(dashboard)/dashboard/components/EmployeeDashboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Loader2,
  RefreshCw,
  ArrowRight,
  Calendar,
  TrendingUp,
  User,
  Timer,
  Gift,
  Crown,
  AlertTriangle,
  Zap,
  Users,
  FolderKanban,
  Briefcase,
  Target,
  Award,
  Medal,
  Star,
  TrendingDown,
  Activity,
  PieChart,
  Calendar as CalendarIcon,
  ChevronRight,
  Eye,
  MessageSquare,
  Bell,
  UserPlus,
  GitBranch,
  Layers,
  FileText,
  Settings,
  HelpCircle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

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
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  deadline: string;
  teamMembers: Array<{
    userId: {
      _id: string;
      fullName: string;
      avatar?: string;
    };
    role: string;
  }>;
}

interface TeamMember {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  department?: {
    _id: string;
    name: string;
  };
}

interface KPIStats {
  overallScore: number;
  categories: Array<{
    name: string;
    score: number;
    target: number;
    status: "on_track" | "at_risk" | "behind";
  }>;
  rank: number;
  totalEmployees: number;
  trends: Array<{
    month: string;
    score: number;
  }>;
}

interface LeaveBalance {
  remaining: number;
  used: number;
  annual: number;
  sick: number;
  casual: number;
  earned: number;
  balances?: {
    casual: number;
    earned: number;
    sick: number;
    maternity: number;
    paternity: number;
    unpaid: number;
    other: number;
  };
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
}

export default function EmployeeDashboard() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [kpiStats, setKpiStats] = useState<KPIStats | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [trialEndingSoon, setTrialEndingSoon] = useState(false);

  // Calculate trial time remaining
  const calculateTimeLeft = useCallback(() => {
    if (!user?.trial?.endDate) return null;

    const now = new Date().getTime();
    const endDate = new Date(user.trial.endDate).getTime();
    const difference = endDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }, [user?.trial?.endDate]);

  // Update time left every second
  useEffect(() => {
    if (user?.trial?.isActive && user?.trial?.endDate) {
      const timer = setInterval(() => {
        const newTimeLeft = calculateTimeLeft();
        setTimeLeft(newTimeLeft);

        if (newTimeLeft && newTimeLeft.days < 3) {
          setTrialEndingSoon(true);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [user?.trial?.isActive, user?.trial?.endDate, calculateTimeLeft]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        tasksRes,
        projectsRes,
        teamRes,
        kpiRes,
        leaveRes,
      ] = await Promise.all([
        api.get(`/tasks?assignedTo=${user?._id}&limit=10`),
        api.get(`/projects?memberId=${user?._id}`),
        api.get(`/users`),
        api.get(`/kpi/my-kpi`).catch(() => ({ data: { data: null } })),
        api.get(`/leaves/balances`).catch(() => ({ data: { data: null } })),
      ]);

      const tasks = tasksRes.data.data || [];
      const projects = projectsRes.data.data || [];
      const allUsers = teamRes.data.data || [];

      // Stats
      const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
      const pendingTasks = tasks.filter((t: any) => t.status === "pending").length;
      const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
      const overdueTasks = tasks.filter((t: any) => t.status === "overdue").length;

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
        projectsCount: projects.length,
        teamMembersCount: allUsers.filter((u: any) => u.department === user?.department).length || 0,
        upcomingDeadlines: tasks.filter((t: any) => {
          const dueDate = new Date(t.dueDate);
          const now = new Date();
          const diff = dueDate.getTime() - now.getTime();
          return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
        }).length,
      });

      // Recent tasks (last 5)
      setRecentTasks(tasks.slice(0, 5));

      // Projects
      setProjects(projects);

      // Team members (same department)
      const deptMembers = allUsers.filter((u: any) => u.department === user?.department);
      setTeamMembers(deptMembers);

      // KPI Stats
      if (kpiRes.data?.data) {
        setKpiStats(kpiRes.data.data);
      }

      // Leave Balance - ✅ Fix: Handle the nested balances object
      if (leaveRes.data?.data) {
        const leaveData = leaveRes.data.data;

        // Check if the data has a nested 'balances' object
        if (leaveData.balances && typeof leaveData.balances === 'object') {
          // Extract values from nested balances
          const balances = leaveData.balances;
          setLeaveBalance({
            remaining: leaveData.remaining || 0,
            used: leaveData.used || 0,
            annual: balances.annual || 0,
            sick: balances.sick || 0,
            casual: balances.casual || 0,
            earned: balances.earned || 0,
            balances: balances
          });
        } else {
          // Use flat structure
          setLeaveBalance({
            remaining: leaveData.remaining || 0,
            used: leaveData.used || 0,
            annual: leaveData.annual || 0,
            sick: leaveData.sick || 0,
            casual: leaveData.casual || 0,
            earned: leaveData.earned || 0,
          });
        }
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

  const getTrialStatus = () => {
    if (!user?.trial) return null;

    if (!user.trial.isActive) {
      return {
        type: "expired",
        icon: AlertTriangle,
        title: "Trial Expired",
        message: "Your free trial has ended. Upgrade to continue using all features.",
        color: "from-red-500 to-rose-600",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        borderColor: "border-red-200 dark:border-red-800",
        textColor: "text-red-700 dark:text-red-300",
      };
    }

    if (timeLeft && timeLeft.days < 1) {
      return {
        type: "ending_soon",
        icon: AlertTriangle,
        title: "Trial Ending Soon!",
        message: `Your free trial ends in ${timeLeft.hours}h ${timeLeft.minutes}m. Upgrade now to continue.`,
        color: "from-orange-500 to-red-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800",
        textColor: "text-orange-700 dark:text-orange-300",
      };
    }

    if (timeLeft && timeLeft.days < 3) {
      return {
        type: "ending_soon",
        icon: AlertTriangle,
        title: `${timeLeft.days} Days Left in Trial`,
        message: `Your free trial ends in ${timeLeft.days} days. Upgrade to continue using all features.`,
        color: "from-yellow-500 to-orange-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-700 dark:text-yellow-300",
      };
    }

    return {
      type: "active",
      icon: Gift,
      title: `${timeLeft?.days || 7} Days Free Trial`,
      message: `You have ${timeLeft?.days || 7} days left in your free trial. Enjoy all premium features!`,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      textColor: "text-emerald-700 dark:text-emerald-300",
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

  // ✅ Helper function to get leave balance values safely
  const getLeaveValue = (key: string): number => {
    if (!leaveBalance) return 0;
    // Check if value exists in balances object first
    if (leaveBalance.balances && leaveBalance.balances[key as keyof typeof leaveBalance.balances] !== undefined) {
      return leaveBalance.balances[key as keyof typeof leaveBalance.balances] as number;
    }
    // Fallback to flat structure
    return (leaveBalance as any)[key] || 0;
  };

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      <AnimatePresence>
        {user?.trial && trialStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${trialStatus.color} p-6 shadow-lg`}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  {trialStatus.type === "expired" ? (
                    <AlertTriangle className="w-6 h-6 text-white" />
                  ) : trialStatus.type === "ending_soon" ? (
                    <Timer className="w-6 h-6 text-white animate-pulse" />
                  ) : (
                    <Gift className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {trialStatus.title}
                    {trialStatus.type === "active" && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white">
                        {user.trial.plan || "Individual"} Plan
                      </span>
                    )}
                    {trialStatus.type === "ending_soon" && (
                      <Timer className="w-4 h-4 text-white animate-pulse" />
                    )}
                  </h3>
                  <p className="text-white/90 text-sm mt-0.5">
                    {trialStatus.message}
                  </p>
                  {timeLeft && trialStatus.type === "active" && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
                          <span className="text-xl font-bold text-white">
                            {timeLeft.days}
                          </span>
                          <span className="text-[10px] text-white/80 block">Days</span>
                        </div>
                        <span className="text-white/60 text-xl font-bold">:</span>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
                          <span className="text-xl font-bold text-white">
                            {String(timeLeft.hours).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] text-white/80 block">Hours</span>
                        </div>
                        <span className="text-white/60 text-xl font-bold">:</span>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
                          <span className="text-xl font-bold text-white">
                            {String(timeLeft.minutes).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] text-white/80 block">Mins</span>
                        </div>
                        <span className="text-white/60 text-xl font-bold">:</span>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
                          <span className="text-xl font-bold text-white">
                            {String(timeLeft.seconds).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] text-white/80 block">Secs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {trialStatus.type !== "expired" ? (
                  <>
                    <Link
                      href="/billing/plans"
                      className="px-4 py-2 bg-white text-gray-900 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade Now
                    </Link>
                    <Link
                      href="/settings/billing"
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-all duration-200 text-sm border border-white/20"
                    >
                      Manage Plan
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/billing/plans"
                    className="px-4 py-2 bg-white text-gray-900 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm animate-pulse"
                  >
                    <Zap className="w-4 h-4" />
                    Subscribe Now
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.fullName?.split(" ")[0]}!
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
            </div>
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completedTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completed</p>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pending</p>
            </div>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-rose-600">{stats.overdueTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
            </div>
            <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{stats.projectsCount}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{stats.teamMembersCount}</p>
              <p className="text-xs text-gray-500">Team Members</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{stats.completionRate}%</p>
              <p className="text-xs text-gray-500">Completion Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{stats.upcomingDeadlines}</p>
              <p className="text-xs text-gray-500">Upcoming Deadlines</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <h2 className="font-semibold text-gray-800">Recent Tasks</h2>
                <span className="text-xs text-gray-400">{recentTasks.length}</span>
              </div>
              <Link href="/tasks" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {recentTasks.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No tasks assigned yet
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${task.status === "completed" ? "bg-emerald-500" :
                          task.status === "in_progress" ? "bg-blue-500" :
                            task.status === "pending" ? "bg-amber-500" :
                              task.status === "overdue" ? "bg-red-500" : "bg-gray-300"
                        }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                              task.status === "in_progress" ? "bg-blue-50 text-blue-700" :
                                task.status === "pending" ? "bg-amber-50 text-amber-700" :
                                  task.status === "overdue" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                            }`}>
                            {task.status || "Unknown"}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-400">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/tasks/${task._id}`} className="text-gray-400 hover:text-indigo-600">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Projects */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-purple-500" />
                <h2 className="font-semibold text-gray-800">My Projects</h2>
                <span className="text-xs text-gray-400">{projects.length}</span>
              </div>
              <Link href="/projects" className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {projects.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No projects assigned yet
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project._id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{project.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {project.teamMembers?.length || 0} members
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {project.progress || 0}% complete
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${project.progress || 0}%` }}
                            />
                          </div>
                          <Link href={`/projects/${project._id}`} className="text-gray-400 hover:text-purple-600">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* KPI Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                <h2 className="font-semibold text-gray-800">KPI Performance</h2>
              </div>
              <Link href="/kpi/my-kpi" className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1">
                View Details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {!kpiStats ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No KPI data available
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{kpiStats.overallScore}%</p>
                      <p className="text-xs text-gray-500">Overall Performance</p>
                    </div>
                    {kpiStats.rank && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">#{kpiStats.rank}</p>
                        <p className="text-xs text-gray-500">of {kpiStats.totalEmployees}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {kpiStats.categories?.slice(0, 3).map((category) => (
                      <div key={category.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{category.name}</span>
                          <span className={`font-medium ${category.status === "on_track" ? "text-emerald-600" :
                              category.status === "at_risk" ? "text-amber-600" : "text-red-600"
                            }`}>
                            {category.score}% / {category.target}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${category.status === "on_track" ? "bg-emerald-500" :
                                category.status === "at_risk" ? "bg-amber-500" : "bg-red-500"
                              }`}
                            style={{ width: `${(category.score / category.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {kpiStats.trends && kpiStats.trends.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Last 6 months</span>
                        <div className="flex items-center gap-1">
                          {kpiStats.trends.slice(-3).map((trend, i) => (
                            <div key={i} className="flex items-center">
                              <div
                                className={`w-4 h-4 rounded-full ${trend.score > 70 ? "bg-emerald-500" :
                                    trend.score > 50 ? "bg-amber-500" : "bg-red-500"
                                  }`}
                              />
                              {i < kpiStats.trends.slice(-3).length - 1 && (
                                <div className="w-4 h-0.5 bg-gray-300" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Team Members */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-gray-800">Team Members</h2>
                <span className="text-xs text-gray-400">{teamMembers.length}</span>
              </div>
              <Link href="/team" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {teamMembers.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No team members found
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {teamMembers.slice(0, 6).map((member) => (
                    <div key={member._id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{member.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{member.role || "Member"}</p>
                      </div>
                    </div>
                  ))}
                  {teamMembers.length > 6 && (
                    <div className="col-span-2 text-center text-xs text-gray-400 mt-2">
                      +{teamMembers.length - 6} more members
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Leave Balance - ✅ FIXED */}
          {leaveBalance && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-green-500" />
                  <h2 className="font-semibold text-gray-800">Leave Balance</h2>
                </div>
                <Link href="/leaves" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-4">
                {/* ✅ Safely render leave balance */}
                {(() => {
                  // Get remaining and used values
                  const remaining = leaveBalance.remaining || 0;
                  const used = leaveBalance.used || 0;

                  // Get individual leave types
                  const annual = getLeaveValue('annual');
                  const sick = getLeaveValue('sick');
                  const casual = getLeaveValue('casual');
                  const earned = getLeaveValue('earned');

                  const hasData = remaining > 0 || used > 0 || annual > 0 || sick > 0;

                  if (!hasData) {
                    return (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        No leave balance data available
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-gray-800">{remaining}</p>
                          <p className="text-xs text-gray-500">Remaining</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xl font-bold text-gray-800">{used}</p>
                          <p className="text-xs text-gray-500">Used</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {annual > 0 && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-emerald-600">{annual}</p>
                            <p className="text-xs text-gray-500">Annual</p>
                          </div>
                        )}
                        {sick > 0 && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-blue-600">{sick}</p>
                            <p className="text-xs text-gray-500">Sick</p>
                          </div>
                        )}
                        {casual > 0 && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-purple-600">{casual}</p>
                            <p className="text-xs text-gray-500">Casual</p>
                          </div>
                        )}
                        {earned > 0 && (
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-indigo-600">{earned}</p>
                            <p className="text-xs text-gray-500">Earned</p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link href="/tasks/create" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Create Task</p>
              <p className="text-xs text-gray-400">Add a new task</p>
            </div>
          </div>
        </Link>

        <Link href="/leaves/create" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Request Leave</p>
              <p className="text-xs text-gray-400">Apply for leave</p>
            </div>
          </div>
        </Link>

        <Link href="/kpi/dashboard" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">View KPI</p>
              <p className="text-xs text-gray-400">Check performance</p>
            </div>
          </div>
        </Link>

        <Link href="/team" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Team</p>
              <p className="text-xs text-gray-400">View team members</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}