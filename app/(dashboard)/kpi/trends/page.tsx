// app/(dashboard)/kpi/trends/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  ChevronRight,
  Home,
  Filter,
  Search,
  User,
  Building2,
  Award,
  Crown,
  Medal,
  Target,
  Activity,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Flame,
  BarChart3,
  LineChart,
  PieChart,
  FileText,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  HelpCircle,
  Settings,
  Printer,
  Share2,
  Mail,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
  Label,
  Brush,
} from "recharts";

interface KPIHistory {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    role: string;
    avatar?: string;
  };
  departmentId: {
    _id: string;
    name: string;
    code: string;
  };
  month: string;
  year: number;
  totalScore: number;
  performanceLevel: "excellent" | "good" | "average" | "needs_improvement";
  scores: {
    taskCompletion: { score: number; weight: number; weightedScore: number };
    qualityScore: { score: number; weight: number; weightedScore: number };
    efficiency: { score: number; weight: number; weightedScore: number };
    collaboration: { score: number; weight: number; weightedScore: number };
    innovation: { score: number; weight: number; weightedScore: number };
    attendance: { score: number; weight: number; weightedScore: number };
  };
  calculatedAt: string;
}

interface TrendData {
  month: string;
  monthIndex: number;
  year: number;
  [key: string]: any; // Dynamic employee scores
}

interface EmployeeTrend {
  userId: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  scores: {
    month: string;
    score: number;
    level: string;
  }[];
  averageScore: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  bestMonth: {
    month: string;
    score: number;
  };
  worstMonth: {
    month: string;
    score: number;
  };
  consistencyScore: number;
}

export default function KPITrendsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [employeeTrends, setEmployeeTrends] = useState<EmployeeTrend[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthsToShow, setMonthsToShow] = useState(6);
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "average" | "trend">("average");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const isFetching = useRef(false);

  const canManage = hasRole([
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
  ]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get last 6 months
  const getLastMonths = useCallback(() => {
    const result = [];
    const now = new Date();
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: months[date.getMonth()],
        monthIndex: date.getMonth(),
        year: date.getFullYear(),
        key: `${months[date.getMonth()]} ${date.getFullYear()}`,
      });
    }
    return result;
  }, [monthsToShow, months]);

  // Fetch KPI history data
  const fetchTrendData = useCallback(async () => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      // Get all users
      let usersData: any[] = [];
      try {
        const usersRes = await api.get("/auth/users");
        if (usersRes.data.success) {
          usersData = usersRes.data.data || [];
        }
      } catch (userError) {
        console.error("Error fetching users:", userError);
      }

      // Get KPI history for each user
      const lastMonths = getLastMonths();
      const allTrendData: TrendData[] = lastMonths.map((m) => ({
        month: m.month,
        monthIndex: m.monthIndex,
        year: m.year,
      }));

      const employeeMap = new Map<string, any>();

      // Fetch KPI scores for each month
      for (const monthData of lastMonths) {
        try {
          const monthIndex = monthData.monthIndex + 1;
          const response = await api.get(`/kpi/report/monthly`, {
            params: {
              month: monthIndex,
              year: monthData.year,
            },
          });

          if (response.data.success && response.data.data) {
            const scores = response.data.data.allScores || [];
            
            // Create a map for quick lookup
            const scoreMap = new Map();
            scores.forEach((s: any) => {
              const userId = s.userId._id;
              scoreMap.set(userId, s);
              
              if (!employeeMap.has(userId)) {
                employeeMap.set(userId, {
                  userId: s.userId,
                  departmentId: s.departmentId,
                  scores: [],
                });
              }
              
              const empData = employeeMap.get(userId);
              empData.scores.push({
                month: monthData.month,
                monthIndex: monthData.monthIndex,
                year: monthData.year,
                score: s.totalScore,
                level: s.performanceLevel,
                details: s.scores,
              });
            });

            // Add data for users who don't have scores
            usersData.forEach((user) => {
              if (!scoreMap.has(user._id)) {
                if (!employeeMap.has(user._id)) {
                  employeeMap.set(user._id, {
                    userId: user,
                    departmentId: user.departmentId,
                    scores: [],
                  });
                }
              }
            });

            // Update trend data with scores
            const monthKey = `${monthData.month} ${monthData.year}`;
            const trendEntry = allTrendData.find(
              (t) => t.month === monthData.month && t.year === monthData.year
            );
            
            if (trendEntry) {
              scoreMap.forEach((score, userId) => {
                const empData = employeeMap.get(userId);
                if (empData) {
                  trendEntry[userId] = score.totalScore || 0;
                }
              });
            }
          }
        } catch (e) {
          console.error(`Error fetching data for ${monthData.month}:`, e);
          // Add empty data for missing months
          const trendEntry = allTrendData.find(
            (t) => t.month === monthData.month && t.year === monthData.year
          );
          if (trendEntry) {
            usersData.forEach((user) => {
              trendEntry[user._id] = 0;
            });
          }
        }
      }

      // Process employee trends
      const processedTrends: EmployeeTrend[] = [];
      employeeMap.forEach((data, userId) => {
        const scores = data.scores || [];
        const sortedScores = scores.sort(
          (a: any, b: any) => a.monthIndex - b.monthIndex || a.year - b.year
        );

        // Calculate average
        const validScores = sortedScores.filter((s: any) => s.score > 0);
        const avg = validScores.length > 0
          ? validScores.reduce((sum: number, s: any) => sum + s.score, 0) / validScores.length
          : 0;

        // Calculate trend
        let trend: "up" | "down" | "stable" = "stable";
        let trendPercentage = 0;
        if (validScores.length >= 2) {
          const first = validScores[0].score;
          const last = validScores[validScores.length - 1].score;
          const diff = last - first;
          trendPercentage = first > 0 ? (diff / first) * 100 : 0;
          if (diff > 2) trend = "up";
          else if (diff < -2) trend = "down";
        }

        // Find best and worst months
        let bestMonth = { month: "", score: 0 };
        let worstMonth = { month: "", score: 100 };
        validScores.forEach((s: any) => {
          if (s.score > bestMonth.score) {
            bestMonth = { month: s.month, score: s.score };
          }
          if (s.score < worstMonth.score) {
            worstMonth = { month: s.month, score: s.score };
          }
        });

        // Calculate consistency score (lower is better - less variation)
        const consistencyScore = validScores.length > 1
          ? Math.round(
              (validScores.reduce((sum: number, s: any) => sum + Math.pow(s.score - avg, 2), 0) /
                validScores.length) *
                100
            ) / 100
          : 0;

        processedTrends.push({
          userId: data.userId._id,
          fullName: data.userId.fullName,
          email: data.userId.email,
          employeeId: data.userId.employeeId || "N/A",
          department: data.departmentId?.name || "Unassigned",
          scores: sortedScores.map((s: any) => ({
            month: s.month,
            score: s.score,
            level: s.level || "needs_improvement",
          })),
          averageScore: Math.round(avg),
          trend,
          trendPercentage: Math.round(trendPercentage),
          bestMonth,
          worstMonth,
          consistencyScore,
        });
      });

      setTrendData(allTrendData);
      setEmployeeTrends(processedTrends);

      // Auto-select top performers
      const topPerformers = processedTrends
        .filter((t) => t.averageScore > 0)
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5);
      
      if (selectedEmployees.length === 0 && topPerformers.length > 0) {
        setSelectedEmployees(topPerformers.map((t) => t.userId));
      }

    } catch (error: any) {
      console.error("Error fetching trend data:", error);
      setError(error.response?.data?.message || "Failed to fetch trend data");
      toast.error(error.response?.data?.message || "Failed to fetch trend data");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [getLastMonths, monthsToShow]);

  useEffect(() => {
    if (canManage) {
      fetchTrendData();
    }
  }, [canManage, fetchTrendData, monthsToShow, selectedYear]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let filtered = employeeTrends;

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by department
    if (departmentFilter !== "all") {
      filtered = filtered.filter((e) => e.department === departmentFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name":
          aVal = a.fullName;
          bVal = b.fullName;
          break;
        case "average":
          aVal = a.averageScore;
          bVal = b.averageScore;
          break;
        case "trend":
          aVal = a.trendPercentage;
          bVal = b.trendPercentage;
          break;
        default:
          aVal = a.averageScore;
          bVal = b.averageScore;
      }
      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    if (!showAllEmployees) {
      filtered = filtered.slice(0, 10);
    }

    return filtered;
  }, [employeeTrends, searchTerm, departmentFilter, sortBy, sortOrder, showAllEmployees]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(employeeTrends.map((e) => e.department));
    return Array.from(depts).filter(Boolean);
  }, [employeeTrends]);

  // Toggle employee selection
  const toggleEmployee = (userId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all visible employees
  const selectAllVisible = () => {
    const allIds = filteredEmployees.map((e) => e.userId);
    setSelectedEmployees(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // Get chart data
  const chartData = useMemo(() => {
    const data = trendData.map((t) => {
      const entry: any = {
        month: t.month,
        monthIndex: t.monthIndex,
        year: t.year,
        label: `${t.month.slice(0, 3)} ${t.year}`,
      };
      
      selectedEmployees.forEach((userId) => {
        const employee = employeeTrends.find((e) => e.userId === userId);
        if (employee) {
          const score = employee.scores.find(
            (s) => s.month === t.month && new Date(t.year, t.monthIndex).getFullYear() === t.year
          );
          entry[employee.fullName] = score?.score || 0;
        }
      });
      
      return entry;
    });

    return data;
  }, [trendData, selectedEmployees, employeeTrends]);

  // Get summary stats
  const stats = useMemo(() => {
    const selected = employeeTrends.filter((e) => selectedEmployees.includes(e.userId));
    const valid = selected.filter((e) => e.averageScore > 0);
    
    return {
      totalEmployees: employeeTrends.length,
      selectedCount: selected.length,
      averageScore: valid.length > 0 
        ? Math.round(valid.reduce((sum, e) => sum + e.averageScore, 0) / valid.length)
        : 0,
      topPerformer: valid.length > 0 
        ? valid.reduce((a, b) => a.averageScore > b.averageScore ? a : b)
        : null,
      improving: selected.filter((e) => e.trend === "up").length,
      declining: selected.filter((e) => e.trend === "down").length,
      stable: selected.filter((e) => e.trend === "stable").length,
    };
  }, [employeeTrends, selectedEmployees]);

  // Export data as CSV
  const handleExport = () => {
    if (trendData.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["Month", "Year", ...selectedEmployees.map((id) => {
        const emp = employeeTrends.find((e) => e.userId === id);
        return emp?.fullName || id;
      })];
      
      const rows = trendData.map((t) => [
        t.month,
        t.year,
        ...selectedEmployees.map((id) => {
          const value = t[id] || 0;
          return value.toFixed(1);
        }),
      ]);
      
      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KPI_Trends_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
      console.error("Export error:", error);
    }
  };

  // Get trend color and icon
  const getTrendInfo = (trend: string, percentage: number) => {
    if (trend === "up") {
      return {
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: TrendingUp,
        label: `+${percentage}%`,
      };
    } else if (trend === "down") {
      return {
        color: "text-rose-600",
        bg: "bg-rose-50",
        icon: TrendingDown,
        label: `${percentage}%`,
      };
    } else {
      return {
        color: "text-amber-600",
        bg: "bg-amber-50",
        icon: Minus,
        label: "Stable",
      };
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      excellent: "bg-emerald-100 text-emerald-700 border-emerald-200",
      good: "bg-blue-100 text-blue-700 border-blue-200",
      average: "bg-amber-100 text-amber-700 border-amber-200",
      needs_improvement: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return colors[level] || colors.needs_improvement;
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            You don't have permission to view this page
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading KPI trends...</p>
        </div>
      </div>
    );
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
              href="/kpi"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              KPI
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">Trends</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <LineChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    KPI Trends
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Employee performance trends over the last {monthsToShow} months
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                disabled={selectedEmployees.length === 0}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={fetchTrendData}
                disabled={loading}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalEmployees}
                  </p>
                  <p className="text-xs text-gray-500">Total Employees</p>
                </div>
                <Users className="w-8 h-8 text-indigo-400 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.selectedCount}
                </p>
                <p className="text-xs text-gray-500">Selected</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.averageScore}%
                </p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.improving}
                </p>
                <p className="text-xs text-gray-500">Improving</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-rose-600">
                  {stats.declining}
                </p>
                <p className="text-xs text-gray-500">Declining</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.stable}
                </p>
                <p className="text-xs text-gray-500">Stable</p>
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Months to Show
                </label>
                <select
                  value={monthsToShow}
                  onChange={(e) => setMonthsToShow(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={9}>9 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px] relative">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Search Employee
                </label>
                <Search className="absolute left-3 top-[34px] w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDepartmentFilter("all");
                  setShowAllEmployees(false);
                  clearSelection();
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm"
              >
                <X size={16} />
                Reset
              </button>
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <LineChart size={16} className="text-indigo-500" />
                  Performance Trends
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedEmployees.length} employees selected
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedEmployees.length === 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    Select employees to view trends
                  </span>
                )}
                <button
                  onClick={selectAllVisible}
                  className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    domain={[0, 100]}
                    label={{
                      value: "Score",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#6b7280", fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                    formatter={(value: any) => [`${value.toFixed(1)}%`, "Score"]}
                  />
                  <Legend />
                  <ReferenceLine
                    y={70}
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    label={{
                      value: "Target (70%)",
                      position: "right",
                      fill: "#f59e0b",
                      fontSize: 10,
                    }}
                  />
                  {selectedEmployees.map((userId, index) => {
                    const employee = employeeTrends.find((e) => e.userId === userId);
                    if (!employee) return null;
                    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6", "#8b5cf6", "#f472b6"];
                    return (
                      <Line
                        key={userId}
                        type="monotone"
                        dataKey={employee.fullName}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    );
                  })}
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            {selectedEmployees.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                {selectedEmployees.map((userId) => {
                  const employee = employeeTrends.find((e) => e.userId === userId);
                  if (!employee) return null;
                  return (
                    <div
                      key={userId}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="w-2 h-2 rounded-full" style={{
                        backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"][selectedEmployees.indexOf(userId) % 8]
                      }} />
                      <span className="text-xs font-medium text-gray-700">
                        {employee.fullName}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({employee.averageScore}%)
                      </span>
                      <button
                        onClick={() => toggleEmployee(userId)}
                        className="ml-1 text-gray-400 hover:text-rose-500 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Employee List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" />
                  Employee Trends
                </h3>
                <p className="text-xs text-gray-400">
                  {filteredEmployees.length} employees shown
                  {!showAllEmployees && filteredEmployees.length > 10 && ` (showing top 10)`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setSortBy("name")}
                    className={`px-2 py-1 text-xs rounded-md transition ${
                      sortBy === "name"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Name
                  </button>
                  <button
                    onClick={() => setSortBy("average")}
                    className={`px-2 py-1 text-xs rounded-md transition ${
                      sortBy === "average"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Score
                  </button>
                  <button
                    onClick={() => setSortBy("trend")}
                    className={`px-2 py-1 text-xs rounded-md transition ${
                      sortBy === "trend"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Trend
                  </button>
                </div>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
                {filteredEmployees.length > 10 && (
                  <button
                    onClick={() => setShowAllEmployees(!showAllEmployees)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 transition"
                  >
                    {showAllEmployees ? "Show Less" : "Show All"}
                  </button>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left py-2 px-3 font-medium w-8">
                        <input
                          type="checkbox"
                          checked={filteredEmployees.every((e) => selectedEmployees.includes(e.userId))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              selectAllVisible();
                            } else {
                              clearSelection();
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-medium">Employee</th>
                      <th className="text-left py-2 px-3 font-medium">Department</th>
                      <th className="text-center py-2 px-3 font-medium">Avg Score</th>
                      <th className="text-center py-2 px-3 font-medium">Trend</th>
                      <th className="text-center py-2 px-3 font-medium">Best</th>
                      <th className="text-center py-2 px-3 font-medium">Worst</th>
                      <th className="text-center py-2 px-3 font-medium">Consistency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.map((employee) => {
                      const isSelected = selectedEmployees.includes(employee.userId);
                      const trendInfo = getTrendInfo(employee.trend, employee.trendPercentage);
                      const TrendIcon = trendInfo.icon;
                      
                      return (
                        <tr
                          key={employee.userId}
                          className={`hover:bg-gray-50 transition cursor-pointer ${
                            isSelected ? "bg-indigo-50/50" : ""
                          }`}
                          onClick={() => toggleEmployee(employee.userId)}
                        >
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEmployee(employee.userId)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {employee.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {employee.fullName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {employee.employeeId} • {employee.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-600">
                            {employee.department}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-sm font-bold ${
                              employee.averageScore >= 80
                                ? "text-emerald-600"
                                : employee.averageScore >= 60
                                ? "text-amber-600"
                                : "text-rose-600"
                            }`}>
                              {employee.averageScore}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendInfo.bg} ${trendInfo.color}`}>
                              <TrendIcon size={12} />
                              {trendInfo.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-emerald-600 font-medium">
                            {employee.bestMonth.score}% ({employee.bestMonth.month})
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-rose-600 font-medium">
                            {employee.worstMonth.score}% ({employee.worstMonth.month})
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-xs font-medium ${
                              employee.consistencyScore < 10
                                ? "text-emerald-600"
                                : employee.consistencyScore < 20
                                ? "text-amber-600"
                                : "text-rose-600"
                            }`}>
                              {employee.consistencyScore.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}