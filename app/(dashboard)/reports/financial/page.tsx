"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  DollarSign,
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
  DollarSign as DollarIcon,
  CalendarDays,
  Progress,
  Layers,
  GitBranch,
  Sparkles,
  Gauge,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  Target as TargetIcon,
  Brain,
  HeartPulse,
  Flame,
  Crown as CrownIcon,
  Medal as MedalIcon,
  Trophy as TrophyIcon,
  Receipt,
  CreditCard,
  Wallet,
  PiggyBank,
  Landmark,
  Coins,
  Banknote,
  ShoppingBag,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus,
  Plus,
  CircleDollarSign,
  HandCoins,
  ChartPie,
  ChartBar,
  ChartLine,
  Wallet as WalletIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
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
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Scatter,
} from "recharts";

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  budgetUtilization: number;
  projectsBudget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  departmentBudget: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  projectFinancials: Array<{
    projectId: string;
    projectName: string;
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
    status: string;
  }>;
  departmentFinancials: Array<{
    departmentId: string;
    departmentName: string;
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
  }>;
  budgetHistory: Array<{
    year: string;
    budget: number;
    spent: number;
  }>;
}

const CATEGORY_COLORS = {
  Salaries: "#6366f1",
  Infrastructure: "#10b981",
  Software: "#f59e0b",
  Hardware: "#ef4444",
  Marketing: "#ec4899",
  Training: "#8b5cf6",
  Operations: "#06b6d4",
  Other: "#6b7280",
};

export default function FinancialReportsPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<"month" | "quarter" | "year">(
    "month",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [viewType, setViewType] = useState<"overview" | "details">("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const canViewReports = hasRole(["super_admin", "admin", "hr_manager"]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!canViewReports) {
      toast.error("You don't have permission to view financial reports");
      router.push("/dashboard");
      return;
    }
    fetchFinancialData();
  }, [isAuthenticated, isLoading, canViewReports, dateRange]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // Fetch projects to calculate financial data
      const projectsRes = await api.get("/projects");
      const departmentsRes = await api.get("/departments");
      const tasksRes = await api.get("/tasks");

      const projects = projectsRes.data.success ? projectsRes.data.data : [];
      const departments = departmentsRes.data.success
        ? departmentsRes.data.data
        : [];
      const tasks = tasksRes.data.success ? tasksRes.data.data : [];

      // Calculate financial data from real data
      const financialData = calculateFinancialData(
        projects,
        departments,
        tasks,
      );
      setFinancialData(financialData);
    } catch (error: any) {
      console.error("Error fetching financial data:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch financial data",
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialData = (
    projects: any[],
    departments: any[],
    tasks: any[],
  ): FinancialData => {
    // Calculate project budgets
    const projectBudget = projects.reduce(
      (acc, p) => ({
        allocated: acc.allocated + (p.budget?.allocated || 0),
        spent: acc.spent + (p.budget?.spent || 0),
        remaining:
          acc.remaining + ((p.budget?.allocated || 0) - (p.budget?.spent || 0)),
      }),
      { allocated: 0, spent: 0, remaining: 0 },
    );

    // Calculate department budgets (using projects as proxy)
    const deptBudget = departments.reduce(
      (acc, d) => {
        const deptProjects = projects.filter(
          (p) => p.departmentId?._id === d._id,
        );
        const allocated = deptProjects.reduce(
          (sum, p) => sum + (p.budget?.allocated || 0),
          0,
        );
        const spent = deptProjects.reduce(
          (sum, p) => sum + (p.budget?.spent || 0),
          0,
        );
        return {
          allocated: acc.allocated + allocated,
          spent: acc.spent + spent,
          remaining: acc.remaining + (allocated - spent),
        };
      },
      { allocated: 0, spent: 0, remaining: 0 },
    );

    // Generate monthly trend (mock data for demonstration)
    const months = [
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
    const currentMonth = new Date().getMonth();
    const monthlyTrend = months
      .slice(Math.max(0, currentMonth - 5), currentMonth + 1)
      .map((month, i) => ({
        month,
        revenue: 50000 + Math.random() * 30000,
        expenses: 30000 + Math.random() * 20000,
        profit: 20000 + Math.random() * 10000,
      }));

    // Category breakdown
    const categoryBreakdown = [
      {
        category: "Salaries",
        amount: 45000,
        percentage: 35,
        color: CATEGORY_COLORS.Salaries,
      },
      {
        category: "Infrastructure",
        amount: 25000,
        percentage: 20,
        color: CATEGORY_COLORS.Infrastructure,
      },
      {
        category: "Software",
        amount: 20000,
        percentage: 15,
        color: CATEGORY_COLORS.Software,
      },
      {
        category: "Hardware",
        amount: 15000,
        percentage: 12,
        color: CATEGORY_COLORS.Hardware,
      },
      {
        category: "Marketing",
        amount: 12000,
        percentage: 9,
        color: CATEGORY_COLORS.Marketing,
      },
      {
        category: "Training",
        amount: 8000,
        percentage: 6,
        color: CATEGORY_COLORS.Training,
      },
      {
        category: "Other",
        amount: 5000,
        percentage: 3,
        color: CATEGORY_COLORS.Other,
      },
    ];

    // Project financials
    const projectFinancials = projects.map((p) => ({
      projectId: p._id,
      projectName: p.name,
      allocated: p.budget?.allocated || 0,
      spent: p.budget?.spent || 0,
      remaining: (p.budget?.allocated || 0) - (p.budget?.spent || 0),
      utilization:
        p.budget?.allocated > 0
          ? ((p.budget?.spent || 0) / p.budget.allocated) * 100
          : 0,
      status: p.status || "planning",
    }));

    // Department financials
    const departmentFinancials = departments.map((d) => {
      const deptProjects = projects.filter(
        (p) => p.departmentId?._id === d._id,
      );
      const allocated = deptProjects.reduce(
        (sum, p) => sum + (p.budget?.allocated || 0),
        0,
      );
      const spent = deptProjects.reduce(
        (sum, p) => sum + (p.budget?.spent || 0),
        0,
      );
      return {
        departmentId: d._id,
        departmentName: d.name,
        allocated,
        spent,
        remaining: allocated - spent,
        utilization: allocated > 0 ? (spent / allocated) * 100 : 0,
      };
    });

    // Budget history
    const budgetHistory = [
      { year: "2022", budget: 200000, spent: 180000 },
      { year: "2023", budget: 250000, spent: 220000 },
      { year: "2024", budget: 300000, spent: 250000 },
    ];

    return {
      totalRevenue: 150000,
      totalExpenses: 90000,
      netProfit: 60000,
      profitMargin: 40,
      budgetUtilization: 75,
      projectsBudget: projectBudget,
      departmentBudget: deptBudget,
      monthlyTrend,
      categoryBreakdown,
      projectFinancials,
      departmentFinancials,
      budgetHistory,
    };
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const headers = ["Category", "Amount", "Percentage"];
      const rows =
        financialData?.categoryBreakdown.map((c) => [
          c.category,
          c.amount,
          c.percentage + "%",
        ]) || [];

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financial_report_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (utilization: number) => {
    if (utilization > 90) return "bg-rose-50 text-rose-700 border-rose-200";
    if (utilization > 75) return "bg-amber-50 text-amber-700 border-amber-200";
    if (utilization > 50) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const getStatusText = (utilization: number) => {
    if (utilization > 90) return "Over Budget";
    if (utilization > 75) return "High Utilization";
    if (utilization > 50) return "On Track";
    return "Low Utilization";
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(financialData?.totalRevenue || 0),
      icon: DollarIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: "+12%",
      trendUp: true,
    },
    {
      label: "Total Expenses",
      value: formatCurrency(financialData?.totalExpenses || 0),
      icon: CreditCardIcon,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      trend: "+8%",
      trendUp: false,
    },
    {
      label: "Net Profit",
      value: formatCurrency(financialData?.netProfit || 0),
      icon: WalletIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "+15%",
      trendUp: true,
    },
    {
      label: "Profit Margin",
      value: `${financialData?.profitMargin || 0}%`,
      icon: TrendingUpIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      trend: "+2%",
      trendUp: true,
    },
    {
      label: "Budget Utilization",
      value: `${financialData?.budgetUtilization || 0}%`,
      icon: TargetIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      trend: "-3%",
      trendUp: false,
    },
    {
      label: "Total Budget",
      value: formatCurrency(financialData?.projectsBudget.allocated || 0),
      icon: Landmark,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "+5%",
      trendUp: true,
    },
  ];

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading financial data...</p>
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
            <span className="text-gray-700 font-medium">Financial Report</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Financial Report
                </h1>
              </div>
              <p className="text-gray-500 text-sm">
                Comprehensive overview of financial performance and metrics
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                {["month", "quarter", "year"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                      dateRange === range
                        ? "bg-emerald-600 text-white shadow-sm"
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
                onClick={fetchFinancialData}
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
                    {stat.trend && (
                      <span
                        className={`text-[10px] font-medium flex items-center gap-0.5 ${
                          stat.trendUp ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {stat.trend}
                        {stat.trendUp ? (
                          <ArrowUpRight size={10} />
                        ) : (
                          <ArrowDownRight size={10} />
                        )}
                      </span>
                    )}
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
              { id: "details", label: "Details", icon: BarChart },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewType(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewType === tab.id
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
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
          {viewType === "overview" && financialData && (
            <>
              {/* Charts Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Monthly Trend */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" />
                    Monthly Financial Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={financialData.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar
                          dataKey="revenue"
                          fill="#6366f1"
                          name="Revenue"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          fill="#ef4444"
                          name="Expenses"
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Profit"
                          dot={{ fill: "#10b981" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <ChartPie size={16} className="text-purple-500" />
                    Expense Breakdown
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={financialData.categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="category"
                        >
                          {financialData.categoryBreakdown.map(
                            (entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ),
                          )}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>

              {/* Budget Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Project Budget */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FolderKanban size={16} className="text-indigo-500" />
                    Project Budget Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Allocated</span>
                      <span className="text-sm font-medium text-gray-800">
                        {formatCurrency(financialData.projectsBudget.allocated)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Spent</span>
                      <span className="text-sm font-medium text-rose-600">
                        {formatCurrency(financialData.projectsBudget.spent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Remaining</span>
                      <span className="text-sm font-medium text-emerald-600">
                        {formatCurrency(financialData.projectsBudget.remaining)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Utilization</span>
                        <span>
                          {financialData.projectsBudget.allocated > 0
                            ? Math.round(
                                (financialData.projectsBudget.spent /
                                  financialData.projectsBudget.allocated) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              financialData.projectsBudget.allocated > 0
                                ? (financialData.projectsBudget.spent /
                                    financialData.projectsBudget.allocated) *
                                    100
                                : 0,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Department Budget */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Building2 size={16} className="text-amber-500" />
                    Department Budget Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Allocated</span>
                      <span className="text-sm font-medium text-gray-800">
                        {formatCurrency(
                          financialData.departmentBudget.allocated,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Spent</span>
                      <span className="text-sm font-medium text-rose-600">
                        {formatCurrency(financialData.departmentBudget.spent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Remaining</span>
                      <span className="text-sm font-medium text-emerald-600">
                        {formatCurrency(
                          financialData.departmentBudget.remaining,
                        )}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Utilization</span>
                        <span>
                          {financialData.departmentBudget.allocated > 0
                            ? Math.round(
                                (financialData.departmentBudget.spent /
                                  financialData.departmentBudget.allocated) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-amber-500"
                          style={{
                            width: `${Math.min(
                              financialData.departmentBudget.allocated > 0
                                ? (financialData.departmentBudget.spent /
                                    financialData.departmentBudget.allocated) *
                                    100
                                : 0,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Budget History */}
              {financialData.budgetHistory &&
                financialData.budgetHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                  >
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CalendarDays size={16} className="text-blue-500" />
                      Budget History
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financialData.budgetHistory}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="year"
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
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar
                            dataKey="budget"
                            fill="#6366f1"
                            name="Budget"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="spent"
                            fill="#ef4444"
                            name="Spent"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
            </>
          )}

          {/* Details View */}
          {viewType === "details" && financialData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects or departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition shadow-sm"
                />
              </div>

              {/* Project Financials Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FolderKanban size={16} className="text-indigo-500" />
                    Project Financials
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocated
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Spent
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilization
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {financialData.projectFinancials
                        .filter((p) =>
                          p.projectName
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((project, idx) => (
                          <motion.tr
                            key={project.projectId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 text-gray-800 text-sm font-medium">
                              {project.projectName}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              {formatCurrency(project.allocated)}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-600">
                              {formatCurrency(project.spent)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600">
                              {formatCurrency(project.remaining)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      project.utilization > 90
                                        ? "bg-rose-500"
                                        : project.utilization > 75
                                          ? "bg-amber-500"
                                          : project.utilization > 50
                                            ? "bg-blue-500"
                                            : "bg-emerald-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(project.utilization, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round(project.utilization)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusColor(project.utilization)}`}
                              >
                                {getStatusText(project.utilization)}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Financials Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Building2 size={16} className="text-amber-500" />
                    Department Financials
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Allocated
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Spent
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remaining
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilization
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {financialData.departmentFinancials
                        .filter((d) =>
                          d.departmentName
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                        )
                        .map((dept, idx) => (
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
                            <td className="px-4 py-3 text-right text-gray-600">
                              {formatCurrency(dept.allocated)}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-600">
                              {formatCurrency(dept.spent)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600">
                              {formatCurrency(dept.remaining)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      dept.utilization > 90
                                        ? "bg-rose-500"
                                        : dept.utilization > 75
                                          ? "bg-amber-500"
                                          : dept.utilization > 50
                                            ? "bg-blue-500"
                                            : "bg-emerald-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(dept.utilization, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round(dept.utilization)}%
                                </span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
