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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
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
  Radar,
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

interface Employee {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId: string;
  departmentId?: { _id: string; name: string; code: string };
  isActive: boolean;
  createdAt: string;
}

interface EmployeeTaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  submitted: number;
  overdue: number;
  rejected: number;
  completionRate: number;
  onTimeRate: number;
  averageCompletionTime: number;
  tasksByPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  tasksByStatus: {
    pending: number;
    in_progress: number;
    submitted: number;
    completed: number;
    overdue: number;
    rejected: number;
  };
  tasksByProject: Array<{
    projectId: string;
    projectName: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  dailyTrend: Array<{
    date: string;
    created: number;
    completed: number;
  }>;
  monthlyStats: Array<{
    month: string;
    created: number;
    completed: number;
    avgCompletionTime: number;
  }>;
}

const PRIORITY_COLORS = {
  low: "#10b981",
  normal: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

export default function TasksReportsPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [employeeStatsMap, setEmployeeStatsMap] = useState<
    Map<string, EmployeeTaskStats>
  >(new Map());
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] =
    useState<Employee | null>(null);
  const [employeeDetailStats, setEmployeeDetailStats] =
    useState<EmployeeTaskStats | null>(null);
  const [dateRange, setDateRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "completionRate" | "total">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [overallStats, setOverallStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    submitted: 0,
    overdue: 0,
    rejected: 0,
  });

  // Role checks - Only Admin/Super Admin/HR can view
  const canViewReports = hasRole(["super_admin", "admin", "hr_manager"]);

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
      // Fetch all employees
      const usersRes = await api.get("/auth/users");
      let employeesList: Employee[] = [];
      if (usersRes.data.success) {
        employeesList = usersRes.data.data.filter(
          (u: any) => u.role === "employee" || u.role === "line_manager",
        );
        setEmployees(employeesList);
      }

      // Fetch all tasks
      const tasksRes = await api.get("/tasks");
      let allTasksData: Task[] = [];
      if (tasksRes.data.success) {
        allTasksData = tasksRes.data.data || [];
        setAllTasks(allTasksData);

        // Calculate overall stats
        const total = allTasksData.length;
        const completed = allTasksData.filter(
          (t) => t.status === "completed",
        ).length;
        const pending = allTasksData.filter(
          (t) => t.status === "pending",
        ).length;
        const inProgress = allTasksData.filter(
          (t) => t.status === "in_progress",
        ).length;
        const submitted = allTasksData.filter(
          (t) => t.status === "submitted",
        ).length;
        const overdue = allTasksData.filter(
          (t) => t.status === "overdue",
        ).length;
        const rejected = allTasksData.filter(
          (t) => t.status === "rejected",
        ).length;

        setOverallStats({
          total,
          completed,
          pending,
          inProgress,
          submitted,
          overdue,
          rejected,
        });
      }

      // Calculate stats for each employee
      const statsMap = new Map<string, EmployeeTaskStats>();
      for (const emp of employeesList) {
        const empTasks = allTasksData.filter(
          (t: any) => t.assignedTo?._id === emp._id,
        );
        const stats = calculateEmployeeStats(empTasks);
        statsMap.set(emp._id, stats);
      }
      setEmployeeStatsMap(statsMap);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const calculateEmployeeStats = (tasks: Task[]): EmployeeTaskStats => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const submitted = tasks.filter((t) => t.status === "submitted").length;
    const overdue = tasks.filter((t) => t.status === "overdue").length;
    const rejected = tasks.filter((t) => t.status === "rejected").length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const completedTasks = tasks.filter((t) => t.status === "completed");
    const onTimeTasks = completedTasks.filter(
      (t) => new Date(t.deadline) >= new Date(t.updatedAt),
    );
    const onTimeRate =
      completedTasks.length > 0
        ? (onTimeTasks.length / completedTasks.length) * 100
        : 0;

    let averageCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, t) => {
        const created = new Date(t.createdAt);
        const completedDate = new Date(t.updatedAt);
        const diffHours =
          (completedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);
      averageCompletionTime = totalTime / completedTasks.length / 24;
    }

    const tasksByPriority = {
      low: tasks.filter((t) => t.priority === "low").length,
      normal: tasks.filter((t) => t.priority === "normal").length,
      high: tasks.filter((t) => t.priority === "high").length,
      urgent: tasks.filter((t) => t.priority === "urgent").length,
    };

    const tasksByStatus = {
      pending,
      in_progress: inProgress,
      submitted,
      completed,
      overdue,
      rejected,
    };

    // Tasks by project
    const projectMap = new Map();
    for (const task of tasks) {
      const projectId = task.projectId?._id?.toString() || "unassigned";
      const projectName = task.projectId?.name || "Unassigned";

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectName,
          total: 0,
          completed: 0,
        });
      }
      const proj = projectMap.get(projectId);
      proj.total++;
      if (task.status === "completed") proj.completed++;
    }

    const tasksByProject = Array.from(projectMap.values()).map((p: any) => ({
      ...p,
      completionRate:
        p.total > 0 ? Math.round((p.completed / p.total) * 100 * 10) / 10 : 0,
    }));

    // Daily trend
    const dailyMap = new Map();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const dayName = dayNames[date.getDay()];
      dailyMap.set(dateKey, {
        date: dayName,
        created: 0,
        completed: 0,
      });
    }

    for (const task of tasks) {
      const createdAt = new Date(task.createdAt);
      const dateKey = createdAt.toISOString().split("T")[0];
      if (dailyMap.has(dateKey)) {
        const data = dailyMap.get(dateKey);
        data.created++;
        if (task.status === "completed") data.completed++;
        dailyMap.set(dateKey, data);
      }
    }

    const dailyTrend = Array.from(dailyMap.values()).reverse();

    // Monthly stats
    const monthNames = [
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
    const monthMap = new Map();

    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.getFullYear() + "-" + date.getMonth();
      monthMap.set(monthKey, {
        month: monthNames[date.getMonth()],
        created: 0,
        completed: 0,
        totalHours: 0,
        taskCount: 0,
      });
    }

    for (const task of tasks) {
      const createdAt = new Date(task.createdAt);
      const monthKey = createdAt.getFullYear() + "-" + createdAt.getMonth();
      if (monthMap.has(monthKey)) {
        const data = monthMap.get(monthKey);
        data.created++;
        if (task.status === "completed") data.completed++;
        data.totalHours += task.estimatedHours || 0;
        data.taskCount++;
        monthMap.set(monthKey, data);
      }
    }

    const monthlyStats = Array.from(monthMap.values())
      .reverse()
      .map((data: any) => ({
        month: data.month,
        created: data.created,
        completed: data.completed,
        avgCompletionTime:
          data.taskCount > 0
            ? Math.round((data.totalHours / data.taskCount / 24) * 10) / 10
            : 0,
      }));

    return {
      total,
      completed,
      pending,
      inProgress,
      submitted,
      overdue,
      rejected,
      completionRate: Math.round(completionRate * 10) / 10,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      tasksByPriority,
      tasksByStatus,
      tasksByProject,
      dailyTrend,
      monthlyStats,
    };
  };

  const fetchEmployeeDetails = async (employee: Employee) => {
    setLoadingEmployee(true);
    setSelectedEmployeeForDetail(employee);
    setShowEmployeeModal(true);

    try {
      const empTasks = allTasks.filter(
        (t: any) => t.assignedTo?._id === employee._id,
      );
      const stats = calculateEmployeeStats(empTasks);
      setEmployeeDetailStats(stats);
    } catch (error: any) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to load employee details");
    } finally {
      setLoadingEmployee(false);
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    fetchEmployeeDetails(employee);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(
        `/reports/tasks/export?range=${dateRange}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `tasks_report_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field: "name" | "completionRate" | "total") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getEmployeeStats = (employeeId: string): EmployeeTaskStats | null => {
    return employeeStatsMap.get(employeeId) || null;
  };

  const filteredEmployees = useMemo(() => {
    let filtered = employees.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      const aStats = getEmployeeStats(a._id);
      const bStats = getEmployeeStats(b._id);

      switch (sortBy) {
        case "name":
          aVal = a.fullName;
          bVal = b.fullName;
          break;
        case "completionRate":
          aVal = aStats?.completionRate || 0;
          bVal = bStats?.completionRate || 0;
          break;
        case "total":
          aVal = aStats?.total || 0;
          bVal = bStats?.total || 0;
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
  }, [employees, searchTerm, sortBy, sortOrder]);

  const displayStats = [
    {
      label: "Total Employees",
      value: employees.length,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Total Tasks",
      value: overallStats.total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Completed",
      value: overallStats.completed,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Pending",
      value: overallStats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "In Progress",
      value: overallStats.inProgress,
      icon: Activity,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
    },
    {
      label: "Submitted",
      value: overallStats.submitted,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Overdue",
      value: overallStats.overdue,
      icon: AlertCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      label: "Rejected",
      value: overallStats.rejected,
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading employee reports...</p>
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
        <div className="container mx-auto space-y-6">
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
              Employee Task Report
            </span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Employee Task Report
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {employees.length}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                View task performance for all employees
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
                        ? "bg-indigo-600 text-white shadow-sm"
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

          {/* Stats Cards - Now showing all statuses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4"
          >
            {displayStats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Search and Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="total">Sort by Total Tasks</option>
                <option value="completionRate">Sort by Completion Rate</option>
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
          </motion.div>

          {/* Employees Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
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
                        {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("total")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Total
                        {sortBy === "total" &&
                          (sortOrder === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Progress
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overdue
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("completionRate")}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Rate %
                        {sortBy === "completionRate" &&
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
                    const stats = getEmployeeStats(employee._id);
                    return (
                      <motion.tr
                        key={employee._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => handleEmployeeClick(employee)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <span className="text-white text-xs font-bold">
                                {employee.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-800 text-sm font-medium">
                                {employee.fullName}
                              </p>
                              <p className="text-gray-400 text-xs flex items-center gap-1">
                                <Mail size={10} />
                                {employee.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                            {employee.role.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 font-medium">
                          {stats?.total || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-emerald-600 font-medium">
                          {stats?.completed || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-amber-600">
                          {stats?.pending || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-sky-600">
                          {stats?.inProgress || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-purple-600">
                          {stats?.submitted || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-rose-600 font-medium">
                          {stats?.overdue || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  (stats?.completionRate || 0) > 70
                                    ? "bg-emerald-500"
                                    : (stats?.completionRate || 0) > 50
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                }`}
                                style={{
                                  width: `${Math.min(stats?.completionRate || 0, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              {stats?.completionRate || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmployeeClick(employee);
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
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
                <p className="text-gray-500 font-medium">No employees found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try adjusting your search
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Employee Details Modal */}
      <AnimatePresence>
        {showEmployeeModal && selectedEmployeeForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xl font-bold">
                      {selectedEmployeeForDetail.fullName
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedEmployeeForDetail.fullName}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {selectedEmployeeForDetail.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} />
                        {selectedEmployeeForDetail.role
                          .replace(/_/g, " ")
                          .toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        ID: {selectedEmployeeForDetail.employeeId}
                      </span>
                      <span className="flex items-center gap-1">
                        {selectedEmployeeForDetail.isActive ? (
                          <UserCheck size={14} className="text-emerald-500" />
                        ) : (
                          <UserX size={14} className="text-rose-500" />
                        )}
                        {selectedEmployeeForDetail.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
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

              {loadingEmployee ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : employeeDetailStats ? (
                <div className="p-5 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                      <p className="text-2xl font-bold text-gray-800">
                        {employeeDetailStats.total}
                      </p>
                      <p className="text-xs text-gray-500">Total Tasks</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-100">
                      <p className="text-2xl font-bold text-emerald-600">
                        {employeeDetailStats.completed}
                      </p>
                      <p className="text-xs text-emerald-500">Completed</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                      <p className="text-2xl font-bold text-amber-600">
                        {employeeDetailStats.pending}
                      </p>
                      <p className="text-xs text-amber-500">Pending</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-3 text-center border border-rose-100">
                      <p className="text-2xl font-bold text-rose-600">
                        {employeeDetailStats.overdue}
                      </p>
                      <p className="text-xs text-rose-500">Overdue</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-100">
                      <p className="text-2xl font-bold text-indigo-600">
                        {employeeDetailStats.completionRate}%
                      </p>
                      <p className="text-xs text-indigo-500">Completion Rate</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                      <p className="text-2xl font-bold text-amber-600">
                        {employeeDetailStats.onTimeRate}%
                      </p>
                      <p className="text-xs text-amber-500">On-Time Rate</p>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Flag size={14} className="text-indigo-500" />
                        Priority Distribution
                      </h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={Object.entries(
                                employeeDetailStats.tasksByPriority || {},
                              ).map(([name, value]) => ({
                                name:
                                  name.charAt(0).toUpperCase() + name.slice(1),
                                value,
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {Object.entries(
                                employeeDetailStats.tasksByPriority || {},
                              ).map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    Object.values(PRIORITY_COLORS)[index] ||
                                    "#6366f1"
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500" />
                        Status Distribution
                      </h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={Object.entries(
                              employeeDetailStats.tasksByStatus || {},
                            ).map(([name, value]) => ({
                              name: name.replace("_", " ").toUpperCase(),
                              value,
                            }))}
                            layout="vertical"
                            margin={{ left: 60 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              type="number"
                              stroke="#9ca3af"
                              fontSize={11}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              stroke="#9ca3af"
                              fontSize={11}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                              }}
                            />
                            <Bar
                              dataKey="value"
                              fill="#6366f1"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Daily Trend */}
                  {employeeDetailStats.dailyTrend &&
                    employeeDetailStats.dailyTrend.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <TrendingUp size={14} className="text-blue-500" />
                          Daily Task Trend
                        </h4>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={employeeDetailStats.dailyTrend}>
                              <defs>
                                <linearGradient
                                  id="empCreatedGrad"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#6366f1"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#6366f1"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                                <linearGradient
                                  id="empCompletedGrad"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#10b981"
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#10b981"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                              />
                              <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                fontSize={11}
                              />
                              <YAxis stroke="#9ca3af" fontSize={11} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                }}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="created"
                                stroke="#6366f1"
                                fill="url(#empCreatedGrad)"
                                name="Created"
                              />
                              <Area
                                type="monotone"
                                dataKey="completed"
                                stroke="#10b981"
                                fill="url(#empCompletedGrad)"
                                name="Completed"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  {/* Monthly Stats */}
                  {employeeDetailStats.monthlyStats &&
                    employeeDetailStats.monthlyStats.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Calendar size={14} className="text-indigo-500" />
                          Monthly Performance
                        </h4>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={employeeDetailStats.monthlyStats}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                              />
                              <XAxis
                                dataKey="month"
                                stroke="#9ca3af"
                                fontSize={11}
                              />
                              <YAxis stroke="#9ca3af" fontSize={11} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                }}
                              />
                              <Legend />
                              <Bar
                                dataKey="created"
                                fill="#6366f1"
                                name="Created"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="completed"
                                fill="#10b981"
                                name="Completed"
                                radius={[4, 4, 0, 0]}
                              />
                              <Line
                                type="monotone"
                                dataKey="avgCompletionTime"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                name="Avg Time (days)"
                                dot={{ fill: "#f59e0b" }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                  {/* Project Breakdown */}
                  {employeeDetailStats.tasksByProject &&
                    employeeDetailStats.tasksByProject.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <FolderKanban size={14} className="text-indigo-500" />
                          Project Breakdown
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 text-xs text-gray-500 font-medium">
                                  Project
                                </th>
                                <th className="text-center py-2 text-xs text-gray-500 font-medium">
                                  Total
                                </th>
                                <th className="text-center py-2 text-xs text-gray-500 font-medium">
                                  Completed
                                </th>
                                <th className="text-center py-2 text-xs text-gray-500 font-medium">
                                  Rate
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {employeeDetailStats.tasksByProject.map(
                                (project, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b border-gray-50"
                                  >
                                    <td className="py-2 text-gray-700">
                                      {project.projectName}
                                    </td>
                                    <td className="py-2 text-center text-gray-700">
                                      {project.total}
                                    </td>
                                    <td className="py-2 text-center text-emerald-600">
                                      {project.completed}
                                    </td>
                                    <td className="py-2 text-center">
                                      <div className="flex items-center gap-2 justify-center">
                                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                          <div
                                            className={`h-1.5 rounded-full ${
                                              project.completionRate > 70
                                                ? "bg-emerald-500"
                                                : project.completionRate > 50
                                                  ? "bg-amber-500"
                                                  : "bg-rose-500"
                                            }`}
                                            style={{
                                              width: `${Math.min(project.completionRate, 100)}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {project.completionRate}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowEmployeeModal(false)}
                      className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Export Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No tasks found for this employee
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
