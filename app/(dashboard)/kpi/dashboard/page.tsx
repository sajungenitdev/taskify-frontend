"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Search,
  Loader2,
  Download,
  RefreshCw,
  Eye,
  ChevronRight,
  X,
  Crown,
  Medal,
  Settings,
  Home,
  Shield,
  Users as UsersIcon,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface KPIScore {
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
  percentile: number;
  rank: number;
  totalEmployees: number;
  scores: {
    taskCompletion: { score: number; weight: number; weightedScore: number };
    qualityScore: { score: number; weight: number; weightedScore: number };
    efficiency: { score: number; weight: number; weightedScore: number };
    collaboration: { score: number; weight: number; weightedScore: number };
    innovation: { score: number; weight: number; weightedScore: number };
    attendance: { score: number; weight: number; weightedScore: number };
  };
  calculatedAt: string;
  comments?: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  isActive: boolean;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  lastLogin?: string;
  createdAt: string;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  averageScore: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
  departmentAverages: Array<{
    department: string;
    departmentId: string;
    averageScore: number;
    employeeCount: number;
  }>;
  topPerformers: KPIScore[];
  serverStatus: "healthy" | "degraded" | "down";
  scoreRangeDistribution: {
    "0-20": number;
    "21-40": number;
    "41-60": number;
    "61-80": number;
    "81-100": number;
  };
}

interface CombinedEmployeeData {
  user: User;
  kpi: KPIScore | null;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface ScoreRangeDataItem {
  range: string;
  count: number;
}

export default function KPIDashboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [kpiScores, setKpiScores] = useState<KPIScore[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [sortBy, setSortBy] = useState<"score" | "name" | "rank">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [userDepartmentId, setUserDepartmentId] = useState<string | null>(null);
  const userDeptInitialized = useRef(false);

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

  const currentMonth = months[new Date().getMonth()];

  // Refs to prevent multiple initialization
  const isInitialized = useRef(false);
  const isFetching = useRef(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  // Combined data - merge users with their KPI scores
  const combinedData = useMemo(() => {
    const kpiMap = new Map<string, KPIScore>();

    kpiScores.forEach((kpi) => {
      if (!kpi || !kpi.userId) return;
      const userId = kpi.userId._id;
      if (userId) {
        kpiMap.set(userId, kpi);
      }
    });

    return allUsers.map((user) => ({
      user,
      kpi: kpiMap.get(user._id) || null
    }));
  }, [allUsers, kpiScores]);

  // Chart data
  const chartData = useMemo<ChartDataItem[]>(() => {
    if (!stats) return [];
    return [
      { name: "Excellent", value: stats.distribution.excellent },
      { name: "Good", value: stats.distribution.good },
      { name: "Average", value: stats.distribution.average },
      { name: "Needs Improvement", value: stats.distribution.needs_improvement },
    ];
  }, [stats]);

  // ============================================================
  // ROLE-BASED FILTERING - Check if user can view all data
  // ============================================================
  const canViewAllData = useMemo(() => {
    if (!user) return false;
    return (
      user.role === "super_admin" ||
      user.role === "admin" ||
      user.role === "hr_manager"
    );
  }, [user]);

  const canViewDepartmentData = useMemo(() => {
    if (!user) return false;
    return (
      user.role === "dept_manager" ||
      user.role === "project_manager" ||
      user.role === "line_manager"
    );
  }, [user]);

  const canViewOwnData = useMemo(() => {
    if (!user) return false;
    return user.role === "employee";
  }, [user]);

  // ============================================================
  // CALCULATE STATS
  // ============================================================
  const calculateStats = useCallback((scores: KPIScore[], users: User[]) => {
    // Department extraction (only from filtered users)
    const depts = [
      ...new Set(users.map((u) => u.departmentId?.name || "Unassigned")),
    ];
    setDepartments(depts);

    // Calculate score range distribution
    const scoreRanges = {
      "0-20": 0,
      "21-40": 0,
      "41-60": 0,
      "61-80": 0,
      "81-100": 0,
    };
    scores.forEach((s) => {
      const score = s.totalScore;
      if (score <= 20) scoreRanges["0-20"]++;
      else if (score <= 40) scoreRanges["21-40"]++;
      else if (score <= 60) scoreRanges["41-60"]++;
      else if (score <= 80) scoreRanges["61-80"]++;
      else scoreRanges["81-100"]++;
    });

    // Calculate department averages (only from filtered data)
    const deptMap = new Map<string, { total: number; count: number; deptId: string }>();
    scores.forEach((s) => {
      const deptName = s.departmentId.name;
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, {
          total: 0,
          count: 0,
          deptId: s.departmentId._id,
        });
      }
      const data = deptMap.get(deptName)!;
      data.total += s.totalScore;
      data.count++;
    });

    const departmentAverages = Array.from(deptMap.entries()).map(
      ([name, data]) => ({
        department: name,
        departmentId: data.deptId,
        averageScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
        employeeCount: data.count,
      }),
    );

    // Distribution
    const distribution = {
      excellent: scores.filter((s) => s.performanceLevel === "excellent")
        .length,
      good: scores.filter((s) => s.performanceLevel === "good").length,
      average: scores.filter((s) => s.performanceLevel === "average").length,
      needs_improvement: scores.filter(
        (s) => s.performanceLevel === "needs_improvement",
      ).length,
    };

    const totalScore = scores.reduce((sum, s) => sum + s.totalScore, 0);
    const averageScore =
      scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

    // Get top performers (sorted by score)
    const topPerformers = [...scores]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    setStats({
      totalEmployees: users.length,
      activeEmployees: users.filter((u) => u.isActive).length,
      inactiveEmployees: users.filter((u) => !u.isActive).length,
      averageScore,
      distribution,
      departmentAverages,
      topPerformers,
      serverStatus: "healthy",
      scoreRangeDistribution: scoreRanges,
    });
  }, []);

  // ============================================================
  // FETCH DATA WITH ROLE-BASED FILTERING
  // ============================================================
  const fetchAllData = useCallback(async () => {
    if (isFetching.current || !isMounted.current) return;

    try {
      isFetching.current = true;
      setLoading(true);

      // Fetch all users
      const usersResponse = await api.get("/users");
      let usersData = usersResponse.data.success ? usersResponse.data.data : [];

      // Apply role-based filtering
      if (!canViewAllData && canViewDepartmentData && userDepartmentId) {
        usersData = usersData.filter(
          (u: User) => u.departmentId?._id === userDepartmentId,
        );
      } else if (canViewOwnData && user) {
        usersData = usersData.filter((u: User) => u._id === user._id);
      }

      if (!isMounted.current) return;
      setAllUsers(usersData);

      // Fetch KPI scores for the selected month
      const monthIndex = months.indexOf(selectedMonth) + 1;
      try {
        const kpiResponse = await api.get(`/kpi/report/monthly`, {
          params: {
            month: monthIndex,
            year: selectedYear,
          },
        });

        if (!isMounted.current) return;

        if (kpiResponse.data.success) {
          const data = kpiResponse.data.data;
          let scoresData = data.allScores || [];

          // Apply role-based filtering to scores
          if (!canViewAllData && canViewDepartmentData && userDepartmentId) {
            scoresData = scoresData.filter(
              (s: KPIScore) => s.departmentId._id === userDepartmentId,
            );
          } else if (canViewOwnData && user) {
            scoresData = scoresData.filter(
              (s: KPIScore) => s.userId._id === user._id,
            );
          }

          setKpiScores(scoresData);
          calculateStats(scoresData, usersData);
        }
      } catch (kpiError) {
        console.log("No KPI data found, showing users only");
        if (isMounted.current) {
          setKpiScores([]);
          calculateStats([], usersData);
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (isMounted.current) {
        toast.error(error.response?.data?.message || "Failed to fetch data");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        isFetching.current = false;
      }
    }
  }, [
    canViewAllData,
    canViewDepartmentData,
    canViewOwnData,
    user,
    userDepartmentId,
    selectedMonth,
    selectedYear,
    months,
    calculateStats,
  ]);

  const fetchEmployeeDetail = useCallback(async (userId: string) => {
    try {
      setEmployeeLoading(true);
      const response = await api.get(`/kpi/employee/${userId}`);
      if (response.data.success) {
        const kpiHistory = response.data.data || [];
        const currentKPI = kpiHistory[0] || null;

        const userData = allUsers.find((u) => u._id === userId);

        setSelectedEmployee({
          ...userData,
          kpiHistory,
          currentKPI,
        });
        setShowEmployeeModal(true);
      }
    } catch (error: any) {
      console.error("Error fetching employee details:", error);
      toast.error("Failed to load employee details");
    } finally {
      setEmployeeLoading(false);
    }
  }, [allUsers]);

  const handleExport = useCallback(() => {
    if (combinedData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Employee",
      "Employee ID",
      "Department",
      "Role",
      "Status",
      "Total Score",
      "Performance Level",
      "Task Completion",
      "Quality Score",
      "Efficiency",
      "Collaboration",
      "Innovation",
      "Attendance",
      "Rank",
    ];

    const rows = combinedData.map((item) => {
      const score = item.kpi;
      return [
        item.user.fullName,
        item.user.employeeId || "N/A",
        item.user.departmentId?.name || "N/A",
        item.user.role || "N/A",
        item.user.isActive ? "Active" : "Inactive",
        score ? score.totalScore.toFixed(1) : "N/A",
        score ? score.performanceLevel.replace("_", " ") : "N/A",
        score ? score.scores.taskCompletion.score.toFixed(1) : "N/A",
        score ? score.scores.qualityScore.score.toFixed(1) : "N/A",
        score ? score.scores.efficiency.score.toFixed(1) : "N/A",
        score ? score.scores.collaboration.score.toFixed(1) : "N/A",
        score ? score.scores.innovation.score.toFixed(1) : "N/A",
        score ? score.scores.attendance.score.toFixed(1) : "N/A",
        score ? score.rank || "N/A" : "N/A",
      ];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KPI_Dashboard_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  }, [combinedData, selectedMonth, selectedYear]);

  // ============================================================
  // UI HELPERS
  // ============================================================
  const getPerformanceConfig = useCallback((level: string) => {
    const config = {
      excellent: {
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: Crown,
        label: "Excellent",
        emoji: "🌟",
        badge: "bg-emerald-100 text-emerald-700",
      },
      good: {
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Award,
        label: "Good",
        emoji: "⭐",
        badge: "bg-blue-100 text-blue-700",
      },
      average: {
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Medal,
        label: "Average",
        emoji: "📊",
        badge: "bg-amber-100 text-amber-700",
      },
      needs_improvement: {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: AlertCircle,
        label: "Needs Improvement",
        emoji: "📈",
        badge: "bg-red-100 text-red-700",
      },
    };
    return config[level as keyof typeof config] || config.average;
  }, []);

  const formatScore = useCallback((score: number) => {
    return score.toFixed(1);
  }, []);

  const getRoleDisplayName = useCallback((role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      hr_manager: "HR Manager",
      dept_manager: "Department Manager",
      project_manager: "Project Manager",
      line_manager: "Line Manager",
      employee: "Employee",
    };
    return roleMap[role] || role.replace(/_/g, " ");
  }, []);

  // Custom hook for combining user and KPI data
  function useCombinedData(users: User[], kpiScores: KPIScore[]) {
    return useMemo(() => {
      const kpiMap = new Map<string, KPIScore>();

      kpiScores.forEach((kpi) => {
        if (!kpi || !kpi.userId) return;
        const userId = kpi.userId._id;
        if (userId) {
          kpiMap.set(userId, kpi);
        }
      });

      return users.map((user) => ({
        user,
        kpi: kpiMap.get(user._id) || null
      }));
    }, [users, kpiScores]);
  }


  const scoreRangeData = useMemo<ScoreRangeDataItem[]>(() => {
    if (!stats) return [];
    return Object.entries(stats.scoreRangeDistribution).map(
      ([range, count]) => ({ range, count })
    );
  }, [stats]);

  // Filter and sort combined data
  const filteredData = useMemo(() => {
    let filtered = [...combinedData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.user.fullName.toLowerCase().includes(term) ||
          item.user.email.toLowerCase().includes(term) ||
          item.user.employeeId?.toLowerCase().includes(term),
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (item) => item.user.departmentId?.name === selectedDepartment,
      );
    }

    if (selectedLevel !== "all") {
      filtered = filtered.filter(
        (item) => item.kpi?.performanceLevel === selectedLevel,
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "score":
          comparison = (a.kpi?.totalScore || 0) - (b.kpi?.totalScore || 0);
          break;
        case "name":
          comparison = a.user.fullName.localeCompare(b.user.fullName);
          break;
        case "rank":
          comparison = (a.kpi?.rank || 999) - (b.kpi?.rank || 999);
          break;
        default:
          comparison = (a.kpi?.totalScore || 0) - (b.kpi?.totalScore || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    combinedData,
    searchTerm,
    selectedDepartment,
    selectedLevel,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Initialize selected month
  useEffect(() => {
    if (!selectedMonth && !isInitialized.current) {
      isInitialized.current = true;
      setSelectedMonth(currentMonth);
    }
  }, [selectedMonth, currentMonth]);

  // Get user department info
  useEffect(() => {
    if (user && !userDeptInitialized.current) {
      userDeptInitialized.current = true;
      const deptId = user.departmentId?._id || null;
      setUserDepartmentId(deptId);
    }
  }, [user]);

  // Load data when filters change
  useEffect(() => {
    if (selectedMonth && canManage && !isFetching.current) {
      fetchAllData();
    }
  }, [canManage, selectedMonth, selectedYear, fetchAllData]);

  // ============================================================
  // ACCESS DENIED
  // ============================================================
  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            You don't have permission to view this page
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
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
            <span className="text-gray-700 font-medium">KPI Dashboard</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                    KPI Dashboard
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {selectedMonth} {selectedYear} •{" "}
                    {stats?.totalEmployees || 0} employees
                    {!canViewAllData && userDepartmentId && (
                      <span className="ml-2 text-indigo-600">
                        • Department View
                      </span>
                    )}
                    {canViewOwnData && (
                      <span className="ml-2 text-indigo-600">
                        • Personal View
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <Download size={16} />
              </button>
              <button
                onClick={fetchAllData}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
              <Link
                href="/kpi/management"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
              >
                <Settings size={16} />
                Configure
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4"
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {stats.totalEmployees}
                    </p>
                    <p className="text-xs text-gray-500">Total Employees</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-indigo-400 opacity-50" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.activeEmployees}
                  </p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div>
                  <p className="text-2xl font-bold text-rose-600">
                    {stats.inactiveEmployees}
                  </p>
                  <p className="text-xs text-gray-500">Inactive</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">
                    {stats.averageScore}%
                  </p>
                  <p className="text-xs text-gray-500">Avg Score</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.distribution.excellent}
                  </p>
                  <p className="text-xs text-gray-500">Excellent</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Charts Row */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Distribution Chart */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Performance Distribution
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Score Range Distribution */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Score Distribution
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreRangeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Averages */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Department Averages
                </h3>
                <div className="space-y-2">
                  {stats.departmentAverages
                    .sort((a, b) => b.averageScore - a.averageScore)
                    .slice(0, 5)
                    .map((dept) => (
                      <div
                        key={dept.departmentId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600 truncate max-w-[120px]">
                          {dept.department}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500"
                              style={{ width: `${dept.averageScore}%` }}
                            />
                          </div>
                          <span className="font-medium text-gray-800">
                            {dept.averageScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Top Performers */}
          {stats?.topPerformers && stats.topPerformers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Crown size={16} className="text-amber-500" />
                Top Performers
                {!canViewAllData && (
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Filtered View
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {stats.topPerformers.slice(0, 5).map((performer, index) => {
                  const perfConfig = getPerformanceConfig(
                    performer.performanceLevel,
                  );

                  const userId = performer.userId._id;
                  const userName = performer.userId.fullName || "No Name";
                  const deptName = performer.departmentId.name || "No Department";

                  return (
                    <div
                      key={performer._id || index}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:shadow-md transition"
                      onClick={() => {
                        if (userId) {
                          fetchEmployeeDetail(userId);
                        }
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {deptName}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatScore(performer.totalScore ?? 0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Role Info Banner for non-admin users */}
          {!canViewAllData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3"
            >
              <Shield size={18} className="text-indigo-600" />
              <p className="text-sm text-indigo-700">
                {canViewDepartmentData && userDepartmentId && (
                  <>Showing data for your department only</>
                )}
                {canViewOwnData && <>Showing your personal KPI data only</>}
              </p>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 items-center bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="all">All Levels</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="needs_improvement">Needs Improvement</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
              <option value="rank">Sort by Rank</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
            <button
              onClick={() =>
                setViewMode(viewMode === "table" ? "cards" : "table")
              }
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition flex items-center gap-2"
            >
              {viewMode === "table" ? "Cards" : "Table"}
            </button>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedDepartment("all");
                setSelectedLevel("all");
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition"
            >
              <X size={16} />
            </button>
          </motion.div>

          {/* Employee Table/Cards */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : combinedData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-500">
                {canViewDepartmentData &&
                  "No employees found in your department"}
                {canViewOwnData && "No personal KPI data found"}
                {canViewAllData && "No employees found in the system"}
              </p>
            </div>
          ) : viewMode === "table" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Components
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentItems.map((item) => {
                      const perfConfig = item.kpi
                        ? getPerformanceConfig(item.kpi.performanceLevel)
                        : null;
                      return (
                        <tr
                          key={item.user._id}
                          className="hover:bg-gray-50 transition cursor-pointer"
                          onClick={() => fetchEmployeeDetail(item.user._id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {item.user.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {item.user.fullName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {item.user.email}
                                </p>
                                <span className="text-[10px] text-gray-400">
                                  {getRoleDisplayName(item.user.role)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.user.departmentId?.name || "Unassigned"}
                          </td>
                          <td className="px-4 py-3">
                            {item.kpi ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-800">
                                  {formatScore(item.kpi.totalScore)}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${item.kpi.totalScore >= 90
                                      ? "bg-emerald-500"
                                      : item.kpi.totalScore >= 75
                                        ? "bg-blue-500"
                                        : item.kpi.totalScore >= 60
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                      }`}
                                    style={{ width: `${item.kpi.totalScore}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No Data
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.kpi && perfConfig ? (
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                              >
                                {perfConfig.emoji} {perfConfig.label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.kpi ? (
                              <div className="flex items-center gap-0.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.kpi.scores.taskCompletion.score >= 70
                                        ? "#10b981"
                                        : "#ef4444",
                                  }}
                                  title={`Task Completion: ${item.kpi.scores.taskCompletion.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.kpi.scores.qualityScore.score >= 70
                                        ? "#3b82f6"
                                        : "#ef4444",
                                  }}
                                  title={`Quality Score: ${item.kpi.scores.qualityScore.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.kpi.scores.efficiency.score >= 70
                                        ? "#8b5cf6"
                                        : "#ef4444",
                                  }}
                                  title={`Efficiency: ${item.kpi.scores.efficiency.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.kpi.scores.collaboration.score >= 70
                                        ? "#f59e0b"
                                        : "#ef4444",
                                  }}
                                  title={`Collaboration: ${item.kpi.scores.collaboration.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.kpi.scores.innovation.score >= 70
                                        ? "#ec4899"
                                        : "#ef4444",
                                  }}
                                  title={`Innovation: ${item.kpi.scores.innovation.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      item.kpi.scores.attendance.score >= 70
                                        ? "#14b8a6"
                                        : "#ef4444",
                                  }}
                                  title={`Attendance: ${item.kpi.scores.attendance.score}%`}
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {item.kpi
                              ? `#${item.kpi.rank || "N/A"} of ${item.kpi.totalEmployees}`
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchEmployeeDetail(item.user._id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredData.length)} of{" "}
                    {filteredData.length} employees
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm transition ${currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            // Card View
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {currentItems.map((item) => {
                const perfConfig = item.kpi
                  ? getPerformanceConfig(item.kpi.performanceLevel)
                  : null;
                return (
                  <motion.div
                    key={item.user._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 cursor-pointer"
                    onClick={() => fetchEmployeeDetail(item.user._id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {item.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {item.user.fullName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.user.departmentId?.name || "Unassigned"}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            {getRoleDisplayName(item.user.role)}
                          </span>
                        </div>
                      </div>
                      {item.kpi && perfConfig ? (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                        >
                          {perfConfig.emoji} {perfConfig.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No Data</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      {item.kpi ? (
                        <span className="text-2xl font-bold text-gray-800">
                          {formatScore(item.kpi.totalScore)}%
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-gray-400">
                          N/A
                        </span>
                      )}
                      {item.kpi && (
                        <span className="text-xs text-gray-400">
                          Rank #{item.kpi.rank || "N/A"} of{" "}
                          {item.kpi.totalEmployees}
                        </span>
                      )}
                    </div>

                    {item.kpi && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className={`h-2 rounded-full ${item.kpi.totalScore >= 90
                              ? "bg-emerald-500"
                              : item.kpi.totalScore >= 75
                                ? "bg-blue-500"
                                : item.kpi.totalScore >= 60
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            style={{ width: `${item.kpi.totalScore}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Task:{" "}
                            {formatScore(item.kpi.scores.taskCompletion.score)}%
                          </span>
                          <span>
                            Quality:{" "}
                            {formatScore(item.kpi.scores.qualityScore.score)}%
                          </span>
                          <span>
                            Efficiency:{" "}
                            {formatScore(item.kpi.scores.efficiency.score)}%
                          </span>
                        </div>
                      </>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchEmployeeDetail(item.user._id);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Pagination for card view */}
          {viewMode === "cards" && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredData.length)} of{" "}
                {filteredData.length} employees
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm transition ${currentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {showEmployeeModal && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {employeeLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                        {selectedEmployee.fullName?.charAt(0).toUpperCase() ||
                          "?"}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {selectedEmployee.fullName}
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{selectedEmployee.email}</span>
                          <span>•</span>
                          <span>
                            {selectedEmployee.departmentId?.name ||
                              "No Department"}
                          </span>
                          <span>•</span>
                          <span>ID: {selectedEmployee.employeeId}</span>
                          <span>•</span>
                          <span>
                            {getRoleDisplayName(selectedEmployee.role)}
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

                  <div className="p-5 space-y-6">
                    {/* Current KPI Score */}
                    {selectedEmployee.currentKPI && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm text-gray-500">Total Score</p>
                          <p
                            className={`text-2xl font-bold ${selectedEmployee.currentKPI.totalScore >= 90
                              ? "text-emerald-600"
                              : selectedEmployee.currentKPI.totalScore >= 75
                                ? "text-blue-600"
                                : selectedEmployee.currentKPI.totalScore >= 60
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                          >
                            {formatScore(
                              selectedEmployee.currentKPI.totalScore,
                            )}
                            %
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm text-gray-500">
                            Performance Level
                          </p>
                          <p className="text-lg font-semibold">
                            {
                              getPerformanceConfig(
                                selectedEmployee.currentKPI.performanceLevel,
                              ).emoji
                            }{" "}
                            {
                              getPerformanceConfig(
                                selectedEmployee.currentKPI.performanceLevel,
                              ).label
                            }
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm text-gray-500">Rank</p>
                          <p className="text-2xl font-bold text-gray-800">
                            #{selectedEmployee.currentKPI.rank} of{" "}
                            {selectedEmployee.currentKPI.totalEmployees}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm text-gray-500">Percentile</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            {selectedEmployee.currentKPI.percentile}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Component Scores */}
                    {selectedEmployee.currentKPI && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Component Scores
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(
                            selectedEmployee.currentKPI.scores,
                          ).map(([key, value]) => {
                            const labels: Record<string, string> = {
                              taskCompletion: "Task Completion",
                              qualityScore: "Quality Score",
                              efficiency: "Efficiency",
                              collaboration: "Collaboration",
                              innovation: "Innovation",
                              attendance: "Attendance",
                            };
                            return (
                              <div
                                key={key}
                                className="bg-white rounded-lg p-3 border border-gray-200"
                              >
                                <p className="text-xs text-gray-500">
                                  {labels[key as keyof typeof labels] || key}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-lg font-bold text-gray-800">
                                    {formatScore((value as any).score)}%
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    Weight: {(value as any).weight}%
                                  </span>
                                </div>
                                <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="h-1.5 rounded-full"
                                    style={{ width: `${(value as any).score}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <Link
                        href={`/kpi/employee/${selectedEmployee._id}`}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ExternalLink size={16} />
                        View Full Profile
                      </Link>
                      <button
                        onClick={() => setShowEmployeeModal(false)}
                        className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}