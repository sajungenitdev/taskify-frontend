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
  Layers,
  GitBranch,
  Sparkles,
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
  Scatter,
} from "recharts";

interface Project {
  _id: string;
  name: string;
  code: string;
  description: string;
  departmentId?: { _id: string; name: string; code: string };
  managerId?: { _id: string; fullName: string; email: string };
  createdBy?: { _id: string; fullName: string };
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "critical";
  startDate: string;
  endDate: string;
  budget?: { allocated: number; spent: number; currency: string };
  progress: number;
  tasksCount: number;
  completedTasks: number;
  teamMembers: Array<{ userId: { _id: string; fullName: string }; role: string }>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  completedAt?: string;
}

interface ProjectReport {
  total: number;
  active: number;
  planning: number;
  onHold: number;
  completed: number;
  cancelled: number;
  totalBudget: number;
  totalSpent: number;
  avgProgress: number;
  totalTasks: number;
  completedTasks: number;
  projectsByPriority: {
    low: number;
    normal: number;
    high: number;
    critical: number;
  };
  projectsByStatus: {
    planning: number;
    active: number;
    on_hold: number;
    completed: number;
    cancelled: number;
  };
  projectsByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  projectsByManager: Array<{
    managerId: string;
    managerName: string;
    total: number;
    completed: number;
    completionRate: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    created: number;
    completed: number;
  }>;
  progressDistribution: Array<{
    range: string;
    count: number;
  }>;
}

const PRIORITY_COLORS = {
  low: "#10b981",
  normal: "#3b82f6",
  high: "#f59e0b",
  critical: "#ef4444",
};

const STATUS_COLORS = {
  planning: "#f59e0b",
  active: "#3b82f6",
  on_hold: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#6b7280",
};

export default function ProjectsReportPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reportData, setReportData] = useState<ProjectReport | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "progress" | "budget">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [viewType, setViewType] = useState<"overview" | "details">("overview");

  const canViewReports = hasRole(["super_admin", "admin", "dept_manager", "project_manager", "hr_manager"]);

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
    fetchProjects();
  }, [isAuthenticated, isLoading, canViewReports]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        const projectsData = response.data.data || [];
        setProjects(projectsData);
        generateReport(projectsData);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      toast.error(error.response?.data?.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (projectsData: Project[]) => {
    const total = projectsData.length;
    const active = projectsData.filter(p => p.status === "active").length;
    const planning = projectsData.filter(p => p.status === "planning").length;
    const onHold = projectsData.filter(p => p.status === "on_hold").length;
    const completed = projectsData.filter(p => p.status === "completed").length;
    const cancelled = projectsData.filter(p => p.status === "cancelled").length;

    const totalBudget = projectsData.reduce((sum, p) => sum + (p.budget?.allocated || 0), 0);
    const totalSpent = projectsData.reduce((sum, p) => sum + (p.budget?.spent || 0), 0);
    const avgProgress = total > 0 ? Math.round(projectsData.reduce((sum, p) => sum + p.progress, 0) / total) : 0;
    const totalTasks = projectsData.reduce((sum, p) => sum + p.tasksCount, 0);
    const completedTasks = projectsData.reduce((sum, p) => sum + p.completedTasks, 0);

    const projectsByPriority = {
      low: projectsData.filter(p => p.priority === "low").length,
      normal: projectsData.filter(p => p.priority === "normal").length,
      high: projectsData.filter(p => p.priority === "high").length,
      critical: projectsData.filter(p => p.priority === "critical").length,
    };

    const projectsByStatus = {
      planning,
      active,
      on_hold: onHold,
      completed,
      cancelled,
    };

    // Projects by department
    const deptMap = new Map();
    for (const project of projectsData) {
      const deptId = project.departmentId?._id || "unassigned";
      const deptName = project.departmentId?.name || "Unassigned";
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          departmentId: deptId,
          departmentName: deptName,
          total: 0,
          completed: 0,
        });
      }
      const dept = deptMap.get(deptId);
      dept.total++;
      if (project.status === "completed") dept.completed++;
    }
    const projectsByDepartment = Array.from(deptMap.values()).map((d: any) => ({
      ...d,
      completionRate: d.total > 0 ? Math.round((d.completed / d.total) * 100 * 10) / 10 : 0,
    }));

    // Projects by manager
    const managerMap = new Map();
    for (const project of projectsData) {
      const managerId = project.managerId?._id || "unassigned";
      const managerName = project.managerId?.fullName || "Unassigned";
      if (!managerMap.has(managerId)) {
        managerMap.set(managerId, {
          managerId: managerId,
          managerName: managerName,
          total: 0,
          completed: 0,
        });
      }
      const manager = managerMap.get(managerId);
      manager.total++;
      if (project.status === "completed") manager.completed++;
    }
    const projectsByManager = Array.from(managerMap.values()).map((m: any) => ({
      ...m,
      completionRate: m.total > 0 ? Math.round((m.completed / m.total) * 100 * 10) / 10 : 0,
    }));

    // Monthly trend
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap = new Map();
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.getFullYear() + "-" + date.getMonth();
      monthMap.set(monthKey, {
        month: monthNames[date.getMonth()],
        created: 0,
        completed: 0,
      });
    }
    for (const project of projectsData) {
      const createdAt = new Date(project.createdAt);
      const monthKey = createdAt.getFullYear() + "-" + createdAt.getMonth();
      if (monthMap.has(monthKey)) {
        const data = monthMap.get(monthKey);
        data.created++;
        if (project.status === "completed") data.completed++;
        monthMap.set(monthKey, data);
      }
    }
    const monthlyTrend = Array.from(monthMap.values()).reverse();

    // Progress distribution
    const ranges = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "21-40%", min: 21, max: 40 },
      { range: "41-60%", min: 41, max: 60 },
      { range: "61-80%", min: 61, max: 80 },
      { range: "81-100%", min: 81, max: 100 },
    ];
    const progressDistribution = ranges.map((r) => ({
      range: r.range,
      count: projectsData.filter(p => p.progress >= r.min && p.progress <= r.max).length,
    }));

    setReportData({
      total,
      active,
      planning,
      onHold,
      completed,
      cancelled,
      totalBudget,
      totalSpent,
      avgProgress,
      totalTasks,
      completedTasks,
      projectsByPriority,
      projectsByStatus,
      projectsByDepartment,
      projectsByManager,
      monthlyTrend,
      progressDistribution,
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/reports/projects/export?range=${dateRange}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `projects_report_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (field: "name" | "progress" | "budget") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "progress":
          aVal = a.progress;
          bVal = b.progress;
          break;
        case "budget":
          aVal = a.budget?.allocated || 0;
          bVal = b.budget?.allocated || 0;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [projects, searchTerm, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    const colors = {
      planning: "bg-amber-50 text-amber-700 border-amber-200",
      active: "bg-blue-50 text-blue-700 border-blue-200",
      on_hold: "bg-purple-50 text-purple-700 border-purple-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      normal: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-amber-50 text-amber-700 border-amber-200",
      critical: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const priorityData = useMemo(() => {
    if (!reportData) return [];
    return Object.entries(reportData.projectsByPriority).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [reportData]);

  const statusData = useMemo(() => {
    if (!reportData) return [];
    return Object.entries(reportData.projectsByStatus).map(([name, value]) => ({
      name: name.replace("_", " ").toUpperCase(),
      value,
    }));
  }, [reportData]);

  const stats = [
    {
      label: "Total Projects",
      value: reportData?.total || 0,
      icon: FolderKanban,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Active",
      value: reportData?.active || 0,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Completed",
      value: reportData?.completed || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "On Hold",
      value: reportData?.onHold || 0,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Avg Progress",
      value: `${reportData?.avgProgress || 0}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Total Tasks",
      value: reportData?.totalTasks || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Completed Tasks",
      value: reportData?.completedTasks || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Total Budget",
      value: formatCurrency(reportData?.totalBudget || 0),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading projects report...</p>
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
            <span className="text-gray-700 font-medium">Projects Report</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Projects Report
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {projects.length}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Comprehensive overview of project performance and analytics
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
                onClick={fetchProjects}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4"
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
                  <p className="text-lg font-bold text-gray-800">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate">{stat.label}</p>
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
              { id: "overview", label: "Overview", icon: PieChart },
              { id: "details", label: "Details", icon: FolderKanban },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewType(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewType === tab.id
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
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
          {viewType === "overview" && reportData && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Priority Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Flag size={16} className="text-indigo-500" />
                    Priority Distribution
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={Object.values(PRIORITY_COLORS)[index] || "#6366f1"}
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

                {/* Status Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" />
                    Status Distribution
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={statusData}
                        layout="vertical"
                        margin={{ left: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Trend */}
              {reportData.monthlyTrend && reportData.monthlyTrend.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    Monthly Project Trend
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.monthlyTrend}>
                        <defs>
                          <linearGradient id="projCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="projCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
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
                          fill="url(#projCreatedGrad)"
                          name="Created"
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="#10b981"
                          fill="url(#projCompletedGrad)"
                          name="Completed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* Progress Distribution */}
              {reportData.progressDistribution && reportData.progressDistribution.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Target size={16} className="text-purple-500" />
                    Progress Distribution
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.progressDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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
                    placeholder="Search projects by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                >
                  <option value="name">Sort by Name</option>
                  <option value="progress">Sort by Progress</option>
                  <option value="budget">Sort by Budget</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>

              {/* Projects Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Manager
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tasks
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProjects.map((project, idx) => (
                        <motion.tr
                          key={project._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-gray-50 transition cursor-pointer"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectModal(true);
                          }}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-gray-800 text-sm font-medium">
                                {project.name}
                              </p>
                              <p className="text-gray-400 text-xs font-mono">
                                {project.code}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(project.priority)}`}>
                              {project.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}>
                              {project.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {project.managerId?.fullName || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    project.progress > 70
                                      ? "bg-emerald-500"
                                      : project.progress > 40
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${Math.min(project.progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{project.progress}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {project.completedTasks}/{project.tasksCount}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-emerald-600">
                            {formatCurrency(project.budget?.allocated || 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(project);
                                setShowProjectModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No projects found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {showProjectModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedProject.name}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                      <span className="font-mono">{selectedProject.code}</span>
                      <span className="text-gray-300">|</span>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getStatusColor(selectedProject.status)}`}>
                        {selectedProject.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Description */}
                {selectedProject.description && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-sm text-gray-700">{selectedProject.description}</p>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-gray-800">{selectedProject.progress}%</p>
                    <p className="text-xs text-gray-500">Progress</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-emerald-600">{selectedProject.completedTasks}</p>
                    <p className="text-xs text-gray-500">Completed Tasks</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-blue-600">{selectedProject.tasksCount}</p>
                    <p className="text-xs text-gray-500">Total Tasks</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className="text-2xl font-bold text-emerald-600">{formatCurrency(selectedProject.budget?.allocated || 0)}</p>
                    <p className="text-xs text-gray-500">Budget</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {selectedProject.departmentId?.name || "Not assigned"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Project Manager</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {selectedProject.managerId?.fullName || "Not assigned"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {formatDate(selectedProject.startDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {formatDate(selectedProject.endDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Priority</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5 inline-block ${getPriorityColor(selectedProject.priority)}`}>
                      {selectedProject.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Team Size</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {selectedProject.teamMembers?.length || 0} members
                    </p>
                  </div>
                </div>

                {/* Team Members */}
                {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Users size={14} className="text-blue-500" />
                      Team Members ({selectedProject.teamMembers.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.teamMembers.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
                          <span className="text-gray-800">{member.userId?.fullName || "Unknown"}</span>
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowProjectModal(false)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Close
                  </button>
                  <Link
                    href={`/projects/${selectedProject._id}`}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Project
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}