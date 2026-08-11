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
  Search,
  User,
  Building2,
  Award,
  Crown,
  Medal,
  Target,
  LineChart,
  FileText,
  X,
  Minus,
  AlertCircle,
  CheckCircle,
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
  ReferenceLine,
} from "recharts";

// ============================================================
// INTERFACES & TYPES
// ============================================================
interface EmployeeTrend {
  userId: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  scores: {
    month: string;
    monthIndex: number;
    year: number;
    score: number;
    level: string;
  }[];
  averageScore: number;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
  bestMonth: { month: string; score: number };
  worstMonth: { month: string; score: number };
  consistencyScore: number;
}

interface TrendDataPoint {
  month: string;
  monthIndex: number;
  year: number;
  label: string;
  [key: string]: any;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CHART_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

export default function KPITrendsPage() {
  const { hasRole } = useAuth();
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeTrends, setEmployeeTrends] = useState<EmployeeTrend[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthsToShow, setMonthsToShow] = useState<number>(6);
  const [showAllEmployees, setShowAllEmployees] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"name" | "average" | "trend">("average");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Refs to prevent duplicate concurrent network calls
  const isFetching = useRef<boolean>(false);
  const initialFetchDone = useRef<boolean>(false);

  const canManage = hasRole(["super_admin", "admin", "hr_manager", "dept_manager"]);

  // ============================================================
  // DATE CALCULATOR HELPER
  // ============================================================
  const getLastMonths = useCallback(() => {
    const result = [];
    const now = new Date();
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: MONTHS[date.getMonth()],
        monthIndex: date.getMonth(),
        year: date.getFullYear(),
      });
    }
    return result;
  }, [monthsToShow]);

  // ============================================================
  // DATA SYNCHRONIZATION FROM REAL API ENDPOINTS
  // ============================================================
  const fetchTrendData = useCallback(async () => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      // Fetch users and department metadata concurrently
      const [usersRes, deptRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: { success: false, data: [] } })),
        api.get("/departments").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const usersData: any[] = usersRes.data.success ? usersRes.data.data || [] : [];
      const lastMonths = getLastMonths();

      // Collect historical score data across all targeted months concurrently
      const monthlyPromises = lastMonths.map(async (m) => {
        try {
          const res = await api.get(`/kpi/report/monthly`, {
            params: { month: m.monthIndex + 1, year: m.year },
          });
          return {
            month: m.month,
            monthIndex: m.monthIndex,
            year: m.year,
            scores: res.data.success ? res.data.data?.allScores || [] : [],
          };
        } catch {
          return { month: m.month, monthIndex: m.monthIndex, year: m.year, scores: [] };
        }
      });

      const monthlyResults = await Promise.all(monthlyPromises);

      // Aggregate user performance logs across history
      const employeeMap = new Map<string, { user: any; history: Map<string, any> }>();

      usersData.forEach((u) => {
        employeeMap.set(u._id, { user: u, history: new Map() });
      });

      monthlyResults.forEach((res) => {
        res.scores.forEach((s: any) => {
          const uId = s.userId?._id || s.userId;
          if (employeeMap.has(uId)) {
            employeeMap.get(uId)?.history.set(`${res.month}-${res.year}`, {
              month: res.month,
              monthIndex: res.monthIndex,
              year: res.year,
              score: s.totalScore || 0,
              level: s.performanceLevel || "average",
            });
          }
        });
      });

      // Build consolidated employee trend arrays
      const processedTrends: EmployeeTrend[] = [];
      employeeMap.forEach((data, userId) => {
        const userObj = data.user;
        const deptName = userObj.department?.name || userObj.departmentId?.name || "Unassigned";

        const scoresList = lastMonths.map((m) => {
          const historyEntry = data.history.get(`${m.month}-${m.year}`);
          return {
            month: m.month,
            monthIndex: m.monthIndex,
            year: m.year,
            score: historyEntry ? historyEntry.score : 0,
            level: historyEntry ? historyEntry.level : "needs_improvement",
          };
        });

        const activeScores = scoresList.filter((s) => s.score > 0);
        const avg = activeScores.length > 0
          ? activeScores.reduce((sum, s) => sum + s.score, 0) / activeScores.length
          : 0;

        let trend: "up" | "down" | "stable" = "stable";
        let trendPercentage = 0;
        if (activeScores.length >= 2) {
          const first = activeScores[0].score;
          const last = activeScores[activeScores.length - 1].score;
          const diff = last - first;
          trendPercentage = first > 0 ? Math.round((diff / first) * 100) : 0;
          if (diff > 1) trend = "up";
          else if (diff < -1) trend = "down";
        }

        let bestMonth = { month: "N/A", score: 0 };
        let worstMonth = { month: "N/A", score: 100 };
        activeScores.forEach((s) => {
          if (s.score > bestMonth.score) bestMonth = { month: s.month, score: s.score };
          if (s.score < worstMonth.score) worstMonth = { month: s.month, score: s.score };
        });

        const variance = activeScores.length > 1
          ? activeScores.reduce((sum, s) => sum + Math.pow(s.score - avg, 2), 0) / activeScores.length
          : 0;

        processedTrends.push({
          userId,
          fullName: userObj.fullName || "Unknown",
          email: userObj.email || "",
          employeeId: userObj.employeeId || "N/A",
          department: deptName,
          scores: scoresList,
          averageScore: Math.round(avg),
          trend,
          trendPercentage,
          bestMonth: bestMonth.score > 0 ? bestMonth : { month: "None", score: 0 },
          worstMonth: worstMonth.score < 100 ? worstMonth : { month: "None", score: 0 },
          consistencyScore: Math.round(Math.sqrt(variance) * 10) / 10,
        });
      });

      setEmployeeTrends(processedTrends);

      // Auto-select top 5 performers on initial layout load
      if (!initialFetchDone.current && processedTrends.length > 0) {
        const topPerformers = [...processedTrends]
          .filter((e) => e.averageScore > 0)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 5);

        if (topPerformers.length > 0) {
          setSelectedEmployees(topPerformers.map((e) => e.userId));
        }
        initialFetchDone.current = true;
      }
    } catch (err: any) {
      console.error("Error synthesizing trend metrics:", err);
      setError(err.response?.data?.message || "Failed to load trend analytics.");
      toast.error("Failed to synchronize performance history");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [getLastMonths]);

  useEffect(() => {
    if (canManage) {
      fetchTrendData();
    }
  }, [canManage, fetchTrendData]);

  // ============================================================
  // MEMOIZED FILTERED DIRECTORY LISTINGS
  // ============================================================
  const filteredEmployees = useMemo(() => {
    let filtered = [...employeeTrends];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          e.employeeId.toLowerCase().includes(term)
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((e) => e.department === departmentFilter);
    }

    filtered.sort((a, b) => {
      let aVal: any = a.averageScore;
      let bVal: any = b.averageScore;

      if (sortBy === "name") {
        aVal = a.fullName;
        bVal = b.fullName;
      } else if (sortBy === "trend") {
        aVal = a.trendPercentage;
        bVal = b.trendPercentage;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return showAllEmployees ? filtered : filtered.slice(0, 10);
  }, [employeeTrends, searchTerm, departmentFilter, sortBy, sortOrder, showAllEmployees]);

  const departmentsList = useMemo(() => {
    const depts = new Set(employeeTrends.map((e) => e.department));
    return Array.from(depts).filter(Boolean);
  }, [employeeTrends]);

  // ============================================================
  // CHART DATA COMPILATION
  // ============================================================
  const chartData = useMemo(() => {
    const lastMonths = getLastMonths();
    return lastMonths.map((m) => {
      const dataPoint: TrendDataPoint = {
        month: m.month,
        monthIndex: m.monthIndex,
        year: m.year,
        label: `${m.month.slice(0, 3)} ${m.year}`,
      };

      selectedEmployees.forEach((uId) => {
        const emp = employeeTrends.find((e) => e.userId === uId);
        if (emp) {
          const match = emp.scores.find((s) => s.month === m.month && s.year === m.year);
          dataPoint[emp.fullName] = match ? match.score : 0;
        }
      });

      return dataPoint;
    });
  }, [getLastMonths, selectedEmployees, employeeTrends]);

  // ============================================================
  // SUMMARY METRICS CALCULATION
  // ============================================================
  const stats = useMemo(() => {
    const selected = employeeTrends.filter((e) => selectedEmployees.includes(e.userId));
    const activeScored = selected.filter((e) => e.averageScore > 0);

    return {
      totalEmployees: employeeTrends.length,
      selectedCount: selected.length,
      averageScore: activeScored.length > 0 ? Math.round(activeScored.reduce((sum, e) => sum + e.averageScore, 0) / activeScored.length) : 0,
      improving: selected.filter((e) => e.trend === "up").length,
      declining: selected.filter((e) => e.trend === "down").length,
      stable: selected.filter((e) => e.trend === "stable").length,
    };
  }, [employeeTrends, selectedEmployees]);

  const toggleEmployee = (userId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllVisible = () => {
    setSelectedEmployees(filteredEmployees.map((e) => e.userId));
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // CSV Export utility
  const handleExport = () => {
    if (trendData.length === 0 || selectedEmployees.length === 0) {
      toast.error("Please select at least one employee to export data");
      return;
    }

    try {
      const headers = ["Month", "Year", ...selectedEmployees.map((id) => employeeTrends.find((e) => e.userId === id)?.fullName || id)];
      const rows = chartData.map((t) => [
        t.month,
        t.year,
        ...selectedEmployees.map((id) => {
          const emp = employeeTrends.find((e) => e.userId === id);
          return emp ? (t[emp.fullName] || 0).toFixed(1) : "0";
        }),
      ]);

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `KPI_Trends_Report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Trend data exported successfully");
    } catch (err) {
      toast.error("Failed to generate CSV export");
    }
  };

  const getTrendInfo = (trend: string, percentage: number) => {
    if (trend === "up") return { color: "text-emerald-600", bg: "bg-emerald-50", icon: TrendingUp, label: `+${percentage}%` };
    if (trend === "down") return { color: "text-rose-600", bg: "bg-rose-50", icon: TrendingDown, label: `${percentage}%` };
    return { color: "text-amber-600", bg: "bg-amber-50", icon: Minus, label: "Stable" };
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm mb-6">You lack administrative clearance to view performance trend analytics.</p>
          <Link href="/dashboard" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20">
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading && !initialFetchDone.current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium text-slate-400">Synthesizing workforce trend analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-600 transition flex items-center gap-1">
            <Home size={13} /> Dashboard
          </Link>
          <ChevronRight size={13} />
          <Link href="/kpi" className="hover:text-slate-600 transition">KPI Analytics</Link>
          <ChevronRight size={13} />
          <span className="text-slate-700">Performance Trends</span>
        </div>

        {/* Header Banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Workforce Performance Trends</h1>
                <p className="text-slate-500 text-sm font-medium">Evaluate multi-month performance trajectories and trajectory markers across divisions.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              disabled={selectedEmployees.length === 0}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-40"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchTrendData}
              disabled={loading}
              title="Refresh Analytics"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Analytical Statistics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          {[
            { label: "Total Workforce", val: stats.totalEmployees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Selected Chart", val: stats.selectedCount, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Unit Average", val: `${stats.averageScore}%`, icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Improving", val: stats.improving, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Declining", val: stats.declining, icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Stable", val: stats.stable, icon: Minus, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center font-bold`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Filter and Control Toolbar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Time Horizon</label>
            <select
              value={monthsToShow}
              onChange={(e) => setMonthsToShow(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={9}>Last 9 Months</option>
              <option value={12}>Last 12 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Fiscal Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Division Unit</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Divisions</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          <div>
            <button
              onClick={() => { setSearchTerm(""); setDepartmentFilter("all"); clearSelection(); }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Longitudinal Line Chart Display */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <LineChart className="w-5 h-5 text-indigo-600" /> Multi-Month Score Trajectories
              </h3>
              <p className="text-xs text-slate-400 font-medium">Comparing {selectedEmployees.length} active employee profiles.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAllVisible} className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl transition cursor-pointer">
                Select All Visible
              </button>
              <button onClick={clearSelection} className="px-3.5 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-xs rounded-xl transition cursor-pointer">
                Clear Selection
              </button>
            </div>
          </div>

          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(val: any) => [`${Number(val).toFixed(1)}%`, "Score"]} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Target Benchmark (70%)", fill: "#d97706", fontSize: 10, position: "top" }} />
                {selectedEmployees.map((uId, idx) => {
                  const emp = employeeTrends.find((e) => e.userId === uId);
                  if (!emp) return null;
                  return (
                    <Line
                      key={uId}
                      type="monotone"
                      dataKey={emp.fullName}
                      stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 7 }}
                      connectNulls
                    />
                  );
                })}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          {/* Active Legend Pills */}
          {selectedEmployees.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              {selectedEmployees.map((uId, idx) => {
                const emp = employeeTrends.find((e) => e.userId === uId);
                if (!emp) return null;
                return (
                  <div key={uId} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span>{emp.fullName}</span>
                    <span className="text-slate-400 font-normal">({emp.averageScore}%)</span>
                    <button onClick={() => toggleEmployee(uId)} className="ml-1 text-slate-400 hover:text-rose-600 transition cursor-pointer">
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Employee Workforce Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Users size={18} className="text-indigo-600" /> Workforce Performance Ledger
              </h3>
              <p className="text-xs text-slate-400 font-medium">Click rows to toggle plotting on the trend graph above.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy("average")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${sortBy === "average" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Sort by Score
              </button>
              <button
                onClick={() => setSortBy("trend")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${sortBy === "trend" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                Sort by Trajectory
              </button>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {sortOrder === "asc" ? "ASC ↑" : "DESC ↓"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center">Plot</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Division</th>
                  <th className="px-6 py-4 text-center">Avg Score</th>
                  <th className="px-6 py-4 text-center">Trajectory</th>
                  <th className="px-6 py-4 text-center">Peak Month</th>
                  <th className="px-6 py-4 text-center">Lowest Month</th>
                  <th className="px-6 py-4 text-center">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmployees.includes(emp.userId);
                  const trend = getTrendInfo(emp.trend, emp.trendPercentage);
                  const TrendIcon = trend.icon;

                  return (
                    <tr
                      key={emp.userId}
                      onClick={() => toggleEmployee(emp.userId)}
                      className={`hover:bg-slate-50/50 transition cursor-pointer ${isSelected ? "bg-indigo-50/40" : ""}`}
                    >
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEmployee(emp.userId)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {emp.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.fullName}</p>
                            <p className="text-xs text-slate-400">{emp.employeeId} • {emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{emp.department}</td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-900">{emp.averageScore}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${trend.bg} ${trend.color}`}>
                          <TrendIcon size={12} /> {trend.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-emerald-600">{emp.bestMonth.score}% ({emp.bestMonth.month.slice(0, 3)})</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-rose-600">{emp.worstMonth.score}% ({emp.worstMonth.month.slice(0, 3)})</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">{emp.consistencyScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-xs">No employees found matching your filters.</div>
          )}

          {filteredEmployees.length > 10 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
              <button
                onClick={() => setShowAllEmployees(!showAllEmployees)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                {showAllEmployees ? "Show Top 10 Only" : `Show All (${employeeTrends.length} Employees)`}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}