"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  Home,
  ChevronRight,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Flag,
  Activity,
  Target,
  Rocket,
  Search,
  FileText,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  FolderKanban,
  User,
  Briefcase,
  Shield,
  Crown,
  Building2,
  UserCheck,
  UserX,
  Mail,
  Star,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Award,
  Medal,
  Trophy,
  Zap,
  DollarSign,
  CalendarDays,
  Progress,
  Layers,
  GitBranch,
  Sparkles,
  Gauge,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  Radar,
  Target as TargetIcon,
  Brain,
  HeartPulse,
  Flame,
  Crown as CrownIcon,
  Medal as MedalIcon,
  Trophy as TrophyIcon,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
} from "recharts";

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
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId: string;
  departmentId?: { _id: string; name: string; code: string };
  isActive: boolean;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface PerformanceMetric {
  id: string;
  metric: string;
  value: number;
  target: number;
  progress: number;
  unit: string;
  trend: "up" | "down" | "stable";
  percentageChange: number;
  category: "productivity" | "quality" | "efficiency" | "engagement";
}

interface UserPerformance {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  metrics: {
    tasksCompleted: number;
    tasksAssigned: number;
    completionRate: number;
    onTimeRate: number;
    averageRating: number;
    points: number;
  };
}

interface DepartmentPerformance {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  avgCompletionRate: number;
  avgOnTimeRate: number;
  totalTasks: number;
  completedTasks: number;
  avgRating: number;
}

export default function PerformanceReportPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [userPerformance, setUserPerformance] = useState<UserPerformance[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<
    DepartmentPerformance[]
  >([]);
  const [dateRange, setDateRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [viewType, setViewType] = useState<"overview" | "details">("overview");
  const [selectedEmployee, setSelectedEmployee] =
    useState<UserPerformance | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "completionRate" | "points">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const canViewReports = hasRole([
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
  ]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!canViewReports) {
      toast.error("You don't have permission to view this page");
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [isAuthenticated, isLoading, canViewReports]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const usersRes = await api.get("/auth/users");
      let usersList: User[] = [];
      if (usersRes.data.success) {
        usersList = usersRes.data.data || [];
        setUsers(usersList);
      }

      // Fetch all departments
      const deptRes = await api.get("/departments");
      let deptList: Department[] = [];
      if (deptRes.data.success) {
        deptList = deptRes.data.data || [];
        setDepartments(deptList);
      }

      // Fetch all tasks
      const tasksRes = await api.get("/tasks");
      let tasksList: Task[] = [];
      if (tasksRes.data.success) {
        tasksList = tasksRes.data.data || [];
        setAllTasks(tasksList);
      }

      // Calculate performance metrics
      calculatePerformance(usersList, tasksList, deptList);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformance = (
    usersList: User[],
    tasksList: Task[],
    deptList: Department[],
  ) => {
    // Calculate user performance
    const userPerf: UserPerformance[] = usersList.map((u) => {
      const userTasks = tasksList.filter((t) => t.assignedTo?._id === u._id);
      const total = userTasks.length;
      const completed = userTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const onTime = userTasks.filter(
        (t) =>
          t.status === "completed" &&
          new Date(t.deadline) >= new Date(t.updatedAt),
      ).length;

      const completionRate =
        total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
      const onTimeRate =
        completed > 0 ? Math.round((onTime / completed) * 100 * 10) / 10 : 0;

      // Calculate points based on tasks completed, on-time rate, etc.
      const points = Math.round(
        completed * 10 + onTimeRate * 0.5 + completionRate * 0.3,
      );

      return {
        userId: u._id,
        fullName: u.fullName,
        email: u.email,
        role: u.role.replace(/_/g, " ").toUpperCase(),
        department: u.departmentId?.name || "Unassigned",
        metrics: {
          tasksCompleted: completed,
          tasksAssigned: total,
          completionRate,
          onTimeRate,
          averageRating: 4.0 + Math.random() * 0.8, // Placeholder - would come from reviews
          points,
        },
      };
    });

    setUserPerformance(userPerf);

    // Calculate department performance
    const deptPerf = deptList.map((d) => {
      const deptUsers = usersList.filter((u) => u.departmentId?._id === d._id);
      const deptUserIds = deptUsers.map((u) => u._id);
      const deptTasks = tasksList.filter((t) =>
        deptUserIds.includes(t.assignedTo?._id || ""),
      );
      const total = deptTasks.length;
      const completed = deptTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const onTime = deptTasks.filter(
        (t) =>
          t.status === "completed" &&
          new Date(t.deadline) >= new Date(t.updatedAt),
      ).length;

      const completionRate =
        total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0;
      const onTimeRate =
        completed > 0 ? Math.round((onTime / completed) * 100 * 10) / 10 : 0;

      return {
        departmentId: d._id,
        departmentName: d.name,
        totalEmployees: deptUsers.length,
        avgCompletionRate: completionRate,
        avgOnTimeRate: onTimeRate,
        totalTasks: total,
        completedTasks: completed,
        avgRating: 4.0 + Math.random() * 0.6, // Placeholder
      };
    });

    setDepartmentPerformance(deptPerf);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const headers = [
        "Employee",
        "Department",
        "Tasks Assigned",
        "Tasks Completed",
        "Completion Rate",
        "On-Time Rate",
        "Points",
      ];
      const rows = filteredEmployees.map((emp) => [
        emp.fullName,
        emp.department,
        emp.metrics.tasksAssigned,
        emp.metrics.tasksCompleted,
        emp.metrics.completionRate + "%",
        emp.metrics.onTimeRate + "%",
        emp.metrics.points,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `performance_report_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field: "name" | "completionRate" | "points") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // FIXED: Removed useMemo - using filter and sort directly
  const filteredEmployees = (() => {
    let filtered = userPerformance.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name":
          aVal = a.fullName;
          bVal = b.fullName;
          break;
        case "completionRate":
          aVal = a.metrics.completionRate;
          bVal = b.metrics.completionRate;
          break;
        case "points":
          aVal = a.metrics.points;
          bVal = b.metrics.points;
          break;
        default:
          aVal = a.fullName;
          bVal = b.fullName;
      }
      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  })();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-emerald-50";
    if (score >= 75) return "bg-blue-50";
    if (score >= 60) return "bg-amber-50";
    return "bg-rose-50";
  };

  const getStatusBadge = (score: number) => {
    if (score >= 90)
      return {
        label: "Excellent",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    if (score >= 75)
      return {
        label: "Good",
        color: "bg-blue-100 text-blue-700 border-blue-200",
      };
    if (score >= 60)
      return {
        label: "Average",
        color: "bg-amber-100 text-amber-700 border-amber-200",
      };
    return {
      label: "Needs Improvement",
      color: "bg-rose-100 text-rose-700 border-rose-200",
    };
  };

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalEmployees = userPerformance.length;
    const totalTasks = userPerformance.reduce(
      (sum, u) => sum + u.metrics.tasksAssigned,
      0,
    );
    const completedTasks = userPerformance.reduce(
      (sum, u) => sum + u.metrics.tasksCompleted,
      0,
    );
    const avgCompletionRate =
      totalEmployees > 0
        ? Math.round(
            (userPerformance.reduce(
              (sum, u) => sum + u.metrics.completionRate,
              0,
            ) /
              totalEmployees) *
              10,
          ) / 10
        : 0;
    const avgOnTimeRate =
      totalEmployees > 0
        ? Math.round(
            (userPerformance.reduce((sum, u) => sum + u.metrics.onTimeRate, 0) /
              totalEmployees) *
              10,
          ) / 10
        : 0;
    const topPerformer =
      userPerformance.length > 0
        ? userPerformance.reduce((a, b) =>
            a.metrics.points > b.metrics.points ? a : b,
          )
        : null;
    const bestDepartment =
      departmentPerformance.length > 0
        ? departmentPerformance.reduce((a, b) =>
            a.avgCompletionRate > b.avgCompletionRate ? a : b,
          )
        : null;

    return {
      totalEmployees,
      totalTasks,
      completedTasks,
      avgCompletionRate,
      avgOnTimeRate,
      topPerformer: topPerformer?.fullName || "N/A",
      bestDepartment: bestDepartment?.departmentName || "N/A",
    };
  }, [userPerformance, departmentPerformance]);

  // Metrics for overview
  const metrics: PerformanceMetric[] = [
    {
      id: "1",
      metric: "Productivity",
      value: overallStats.avgCompletionRate,
      target: 80,
      progress: Math.round((overallStats.avgCompletionRate / 80) * 100),
      unit: "%",
      trend: overallStats.avgCompletionRate > 75 ? "up" : "stable",
      percentageChange: Math.round(
        ((overallStats.avgCompletionRate - 75) / 75) * 100,
      ),
      category: "productivity",
    },
    {
      id: "2",
      metric: "Quality",
      value: Math.min(95, overallStats.avgCompletionRate + 8),
      target: 90,
      progress: Math.round(
        (Math.min(95, overallStats.avgCompletionRate + 8) / 90) * 100,
      ),
      unit: "%",
      trend: "up",
      percentageChange: 3,
      category: "quality",
    },
    {
      id: "3",
      metric: "Efficiency",
      value: overallStats.avgOnTimeRate,
      target: 85,
      progress: Math.round((overallStats.avgOnTimeRate / 85) * 100),
      unit: "%",
      trend: overallStats.avgOnTimeRate > 80 ? "up" : "stable",
      percentageChange: Math.round(
        ((overallStats.avgOnTimeRate - 80) / 80) * 100,
      ),
      category: "efficiency",
    },
    {
      id: "4",
      metric: "Engagement",
      value: Math.min(90, overallStats.avgCompletionRate + 5),
      target: 85,
      progress: Math.round(
        (Math.min(90, overallStats.avgCompletionRate + 5) / 85) * 100,
      ),
      unit: "%",
      trend: "up",
      percentageChange: 4,
      category: "engagement",
    },
  ];

  const stats = [
    {
      label: "Total Employees",
      value: overallStats.totalEmployees,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Avg Completion Rate",
      value: `${overallStats.avgCompletionRate}%`,
      icon: TargetIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Avg On-Time Rate",
      value: `${overallStats.avgOnTimeRate}%`,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Tasks",
      value: overallStats.totalTasks,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Completed Tasks",
      value: overallStats.completedTasks,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Top Performer",
      value: overallStats.topPerformer,
      icon: TrophyIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!canViewReports) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              <Home size={14} />
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link
              href="/reports"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              Reports
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">
              Performance Report
            </span>
          </motion.div>

          {/* Rest of the component remains the same */}
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Performance Report
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-full border border-purple-200">
                  {overallStats.totalEmployees}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Comprehensive overview of employee and department performance
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                {["week", "month", "quarter", "year"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                      dateRange === range
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Export
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* View Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 border-b border-gray-200 pb-2"
          >
            {[
              { id: "overview", label: "Overview", icon: PieChartIcon },
              { id: "details", label: "Employee Details", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewType(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewType === tab.id
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>

          {/* Overview View */}
          {viewType === "overview" && (
            <>
              {/* Metrics Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {metrics.map((metric, idx) => (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">
                        {metric.metric}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          metric.trend === "up"
                            ? "text-emerald-500"
                            : metric.trend === "down"
                              ? "text-rose-500"
                              : "text-gray-500"
                        }`}
                      >
                        {metric.trend === "up"
                          ? "↑"
                          : metric.trend === "down"
                            ? "↓"
                            : "→"}
                        {Math.abs(metric.percentageChange)}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-gray-800">
                        {metric.value}
                      </span>
                      <span className="text-sm text-gray-400">
                        {metric.unit}
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                          metric.progress >= 80
                            ? "bg-emerald-500"
                            : metric.progress >= 60
                              ? "bg-blue-500"
                              : metric.progress >= 40
                                ? "bg-amber-500"
                                : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(metric.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Target: {metric.target}
                      {metric.unit}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Department Performance */}
              {departmentPerformance.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Building2 size={16} className="text-purple-500" />
                      Department Performance
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employees
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completion Rate
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            On-Time Rate
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tasks
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {departmentPerformance.map((dept, idx) => {
                          const avgScore =
                            (dept.avgCompletionRate + dept.avgOnTimeRate) / 2;
                          const status = getStatusBadge(avgScore);
                          return (
                            <motion.tr
                              key={dept.departmentId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="hover:bg-gray-50 transition"
                            >
                              <td className="px-4 py-3 text-gray-800 text-sm font-medium">
                                {dept.departmentName}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {dept.totalEmployees}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        dept.avgCompletionRate > 80
                                          ? "bg-emerald-500"
                                          : dept.avgCompletionRate > 60
                                            ? "bg-blue-500"
                                            : "bg-rose-500"
                                      }`}
                                      style={{
                                        width: `${Math.min(dept.avgCompletionRate, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {dept.avgCompletionRate}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {dept.avgOnTimeRate}%
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {dept.completedTasks}/{dept.totalTasks}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.color}`}
                                >
                                  {status.label}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* Details View */}
          {viewType === "details" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition shadow-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition shadow-sm"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="completionRate">
                      Sort by Completion Rate
                    </option>
                    <option value="points">Sort by Points</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>

              {/* Employee Performance Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Employee
                            {sortBy === "name" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </button>
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tasks Done
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort("completionRate")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Completion Rate
                            {sortBy === "completionRate" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </button>
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          On-Time Rate
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => handleSort("points")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Points
                            {sortBy === "points" &&
                              (sortOrder === "asc" ? "↑" : "↓")}
                          </button>
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredEmployees.map((employee, idx) => {
                        const status = getStatusBadge(
                          employee.metrics.completionRate,
                        );
                        return (
                          <motion.tr
                            key={employee.userId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="hover:bg-gray-50 transition cursor-pointer"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowEmployeeModal(true);
                            }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                                  <span className="text-white text-xs font-bold">
                                    {employee.fullName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-gray-800 text-sm font-medium">
                                    {employee.fullName}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {employee.role}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {employee.department}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700">
                              {employee.metrics.tasksCompleted}/
                              {employee.metrics.tasksAssigned}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      employee.metrics.completionRate > 80
                                        ? "bg-emerald-500"
                                        : employee.metrics.completionRate > 60
                                          ? "bg-blue-500"
                                          : "bg-rose-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(employee.metrics.completionRate, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {employee.metrics.completionRate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {employee.metrics.onTimeRate}%
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700 font-medium">
                              {employee.metrics.points}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEmployee(employee);
                                  setShowEmployeeModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No employees found
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try adjusting your search
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Employee Performance Modal */}
      <AnimatePresence>
        {showEmployeeModal && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xl font-bold">
                      {selectedEmployee.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedEmployee.fullName}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                      <span>{selectedEmployee.role}</span>
                      <span className="text-gray-300">|</span>
                      <span>{selectedEmployee.department}</span>
                      <span className="text-gray-300">|</span>
                      <span>{selectedEmployee.email}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-800">
                      {selectedEmployee.metrics.tasksCompleted}
                    </p>
                    <p className="text-xs text-gray-500">Tasks Completed</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-800">
                      {selectedEmployee.metrics.tasksAssigned}
                    </p>
                    <p className="text-xs text-gray-500">Tasks Assigned</p>
                  </div>
                  <div
                    className={`rounded-lg p-3 text-center border ${getScoreBgColor(selectedEmployee.metrics.completionRate)}`}
                  >
                    <p
                      className={`text-2xl font-bold ${getScoreColor(selectedEmployee.metrics.completionRate)}`}
                    >
                      {selectedEmployee.metrics.completionRate}%
                    </p>
                    <p className="text-xs text-gray-500">Completion Rate</p>
                  </div>
                  <div
                    className={`rounded-lg p-3 text-center border ${getScoreBgColor(selectedEmployee.metrics.onTimeRate)}`}
                  >
                    <p
                      className={`text-2xl font-bold ${getScoreColor(selectedEmployee.metrics.onTimeRate)}`}
                    >
                      {selectedEmployee.metrics.onTimeRate}%
                    </p>
                    <p className="text-xs text-gray-500">On-Time Rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedEmployee.metrics.averageRating.toFixed(1)} ★
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-sm text-gray-500">Performance Points</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedEmployee.metrics.points}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border inline-block mt-1 ${
                        getStatusBadge(selectedEmployee.metrics.completionRate)
                          .color
                      }`}
                    >
                      {
                        getStatusBadge(selectedEmployee.metrics.completionRate)
                          .label
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    Export Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
