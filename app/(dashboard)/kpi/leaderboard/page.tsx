// app/(dashboard)/kpi/leaderboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Crown,
  Medal,
  Trophy,
  Star,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Loader2,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Target,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  X,
  PieChart,
  LineChart,
  User,
  Building2,
  Award,
  Sparkles,
  Settings,
  Home,
  Filter,
  Printer,
  Mail,
  Flame,
  Gauge,
  Shield,
  Users as UsersIcon,
  Briefcase,
  ExternalLink,
  Zap,
  Rocket,
  Star as StarIcon,
  Medal as MedalIcon,
  Crown as CrownIcon,
  Trophy as TrophyIcon,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
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
}

interface LeaderboardStats {
  totalEmployees: number;
  averageScore: number;
  topScore: number;
  excellentCount: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
}

export default function KPLeaderboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();

  const [scores, setScores] = useState<KPIScore[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [sortBy, setSortBy] = useState<"rank" | "score" | "name">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [currentMonth]);

  useEffect(() => {
    if (canManage) {
      fetchAllData();
    }
  }, [canManage, selectedMonth, selectedYear]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users first
      let usersData: User[] = [];
      try {
        const usersResponse = await api.get("/users");
        if (usersResponse.data.success) {
          usersData = usersResponse.data.data || [];
          setAllUsers(usersData);
        }
      } catch (userError) {
        console.error("Error fetching users:", userError);
      }

      // Try to fetch KPI data
      const monthIndex = months.indexOf(selectedMonth) + 1;
      try {
        const response = await api.get(`/kpi/report/monthly`, {
          params: {
            month: monthIndex,
            year: selectedYear,
          },
        });

        if (response.data.success) {
          const data = response.data.data;
          const allScores = data.allScores || [];
          setScores(allScores);

          // Extract departments from scores or users
          const depts =
            allScores.length > 0
              ? [
                  ...new Set(
                    allScores.map((s: KPIScore) => s.departmentId.name),
                  ),
                ]
              : [
                  ...new Set(
                    usersData.map(
                      (u: User) => u.departmentId?.name || "Unassigned",
                    ),
                  ),
                ];
          setDepartments(depts);

          // Calculate stats
          const total = allScores.length || usersData.length;
          const topScore =
            allScores.length > 0 ? allScores[0]?.totalScore || 0 : 0;
          const avgScore =
            allScores.length > 0
              ? Math.round(
                  allScores.reduce(
                    (sum: number, s: KPIScore) => sum + s.totalScore,
                    0,
                  ) / allScores.length,
                )
              : 0;

          setStats({
            totalEmployees: total,
            averageScore: avgScore,
            topScore: topScore,
            excellentCount: allScores.filter(
              (s: KPIScore) => s.performanceLevel === "excellent",
            ).length,
            distribution: data.distribution || {
              excellent: 0,
              good: 0,
              average: 0,
              needs_improvement: 0,
            },
          });
        } else {
          // If KPI data fetch fails but we have users, show users with no scores
          setScores([]);
          const depts = [
            ...new Set(
              usersData.map((u: User) => u.departmentId?.name || "Unassigned"),
            ),
          ];
          setDepartments(depts);
          setStats({
            totalEmployees: usersData.length,
            averageScore: 0,
            topScore: 0,
            excellentCount: 0,
            distribution: {
              excellent: 0,
              good: 0,
              average: 0,
              needs_improvement: 0,
            },
          });
        }
      } catch (kpiError: any) {
        console.error("Error fetching KPI data:", kpiError);
        // If KPI data fetch fails, use user data
        setScores([]);
        const depts = [
          ...new Set(
            usersData.map((u: User) => u.departmentId?.name || "Unassigned"),
          ),
        ];
        setDepartments(depts);
        setStats({
          totalEmployees: usersData.length,
          averageScore: 0,
          topScore: 0,
          excellentCount: 0,
          distribution: {
            excellent: 0,
            good: 0,
            average: 0,
            needs_improvement: 0,
          },
        });

        if (usersData.length === 0) {
          setError(
            "No data available. Please ensure KPI scores are calculated.",
          );
        }
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.response?.data?.message || "Failed to fetch data");
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (filteredScores.length === 0 && filteredUsers.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Rank",
      "Employee",
      "Department",
      "Total Score",
      "Performance Level",
      "Task Completion",
      "Quality Score",
      "Efficiency",
      "Collaboration",
      "Innovation",
      "Attendance",
      "Percentile",
    ];

    const dataToExport =
      filteredScores.length > 0
        ? filteredScores
        : filteredUsers.map((user, index) => ({
            rank: index + 1,
            userId: user,
            departmentId: user.departmentId || {
              name: "Unassigned",
              code: "NA",
            },
            totalScore: 0,
            performanceLevel: "not_calculated",
            percentile: 0,
            scores: {
              taskCompletion: { score: 0, weight: 0, weightedScore: 0 },
              qualityScore: { score: 0, weight: 0, weightedScore: 0 },
              efficiency: { score: 0, weight: 0, weightedScore: 0 },
              collaboration: { score: 0, weight: 0, weightedScore: 0 },
              innovation: { score: 0, weight: 0, weightedScore: 0 },
              attendance: { score: 0, weight: 0, weightedScore: 0 },
            },
          }));

    const rows = dataToExport.map((item: any) => [
      item.rank || "N/A",
      item.userId?.fullName || item.userId?.fullName || "Unknown",
      item.departmentId?.name || "N/A",
      item.totalScore?.toFixed(1) || "N/A",
      item.performanceLevel?.replace("_", " ") || "Not Calculated",
      item.scores?.taskCompletion?.score?.toFixed(1) || "N/A",
      item.scores?.qualityScore?.score?.toFixed(1) || "N/A",
      item.scores?.efficiency?.score?.toFixed(1) || "N/A",
      item.scores?.collaboration?.score?.toFixed(1) || "N/A",
      item.scores?.innovation?.score?.toFixed(1) || "N/A",
      item.scores?.attendance?.score?.toFixed(1) || "N/A",
      item.percentile || "N/A",
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KPI_Leaderboard_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leaderboard exported successfully");
  };

  const getPerformanceConfig = (level: string) => {
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
      not_calculated: {
        color: "text-gray-600",
        bg: "bg-gray-50",
        border: "border-gray-200",
        icon: User,
        label: "Not Calculated",
        emoji: "📋",
        badge: "bg-gray-100 text-gray-700",
      },
    };
    return config[level as keyof typeof config] || config.not_calculated;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
    if (rank === 2)
      return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
    if (rank === 3)
      return "bg-gradient-to-r from-amber-600 to-amber-700 text-white";
    return "bg-gray-100 text-gray-600";
  };

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  // Filtered scores with ranking
  const filteredScores = useMemo(() => {
    let filtered = [...scores];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (score) =>
          score.userId.fullName.toLowerCase().includes(term) ||
          score.userId.email.toLowerCase().includes(term) ||
          score.userId.employeeId?.toLowerCase().includes(term),
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (score) => score.departmentId.name === selectedDepartment,
      );
    }

    // Sort by rank by default
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "rank":
          comparison = (a.rank || 999) - (b.rank || 999);
          break;
        case "score":
          comparison = a.totalScore - b.totalScore;
          break;
        case "name":
          comparison = a.userId.fullName.localeCompare(b.userId.fullName);
          break;
        default:
          comparison = (a.rank || 999) - (b.rank || 999);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [scores, searchTerm, selectedDepartment, sortBy, sortOrder]);

  // Filtered users (for when no KPI data exists)
  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.employeeId?.toLowerCase().includes(term),
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (user) => user.departmentId?.name === selectedDepartment,
      );
    }

    return filtered;
  }, [allUsers, searchTerm, selectedDepartment]);

  // Determine what to display
  const hasScores = scores.length > 0;
  const displayData = hasScores ? filteredScores : filteredUsers;
  const displayDepartments = hasScores
    ? departments
    : [
        ...new Set(
          allUsers.map((u: User) => u.departmentId?.name || "Unassigned"),
        ),
      ];

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayData.length / itemsPerPage);

  // Top 3 performers (only if scores exist)
  const topThree = hasScores ? scores.slice(0, 3) : [];

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-rose-500" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-375 mx-auto space-y-6">
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
            <span className="text-gray-700 font-medium">KPI Leaderboard</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                    KPI Leaderboard
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {selectedMonth} {selectedYear} •{" "}
                    {stats?.totalEmployees || 0} employees ranked
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
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
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
                  <p className="text-2xl font-bold text-indigo-600">
                    {stats.averageScore}%
                  </p>
                  <p className="text-xs text-gray-500">Average Score</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.excellentCount}
                  </p>
                  <p className="text-xs text-gray-500">Excellent Performers</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.topScore}%
                  </p>
                  <p className="text-xs text-gray-500">Top Score</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600" />
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={fetchAllData}
                className="mt-2 text-sm text-amber-600 hover:text-amber-800 font-medium"
              >
                Click here to retry
              </button>
            </div>
          )}

          {/* Top 3 Podium - Only show if scores exist */}
          {hasScores && topThree.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <h3 className="text-center text-sm font-medium text-gray-500 mb-6">
                🏆 Top Performers
              </h3>
              <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center order-2 md:order-1">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {topThree[1]?.userId.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-800">
                      {topThree[1]?.userId.fullName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {topThree[1]?.departmentId.name}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <MedalIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-lg font-bold text-gray-700">
                        {formatScore(topThree[1]?.totalScore)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-24 h-12 bg-gradient-to-b from-gray-300 to-gray-200 rounded-t-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">2nd</span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center order-1 md:order-2 transform scale-110">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-amber-500/30">
                    {topThree[0]?.userId.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-800">
                      {topThree[0]?.userId.fullName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {topThree[0]?.departmentId.name}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <CrownIcon className="w-4 h-4 text-amber-500" />
                      <span className="text-lg font-bold text-amber-600">
                        {formatScore(topThree[0]?.totalScore)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-28 h-14 bg-gradient-to-b from-amber-400 to-amber-500 rounded-t-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <span className="text-sm font-bold text-white">🥇 1st</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center order-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-700 to-amber-800 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {topThree[2]?.userId.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-800">
                      {topThree[2]?.userId.fullName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {topThree[2]?.departmentId.name}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <MedalIcon className="w-4 h-4 text-amber-700" />
                      <span className="text-lg font-bold text-gray-700">
                        {formatScore(topThree[2]?.totalScore)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 w-24 h-10 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">3rd</span>
                  </div>
                </div>
              </div>
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
              {displayDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="rank">Sort by Rank</option>
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedDepartment("all");
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition"
            >
              <X size={16} />
            </button>
          </motion.div>

          {/* Leaderboard Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : displayData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-500">
                {error ||
                  `No data available for ${selectedMonth} ${selectedYear}`}
              </p>
              <button
                onClick={fetchAllData}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm"
              >
                <RefreshCw size={16} className="inline mr-2" />
                Refresh
              </button>
              <Link
                href="/kpi/management"
                className="mt-2 ml-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm inline-flex items-center gap-2"
              >
                <Settings size={16} />
                Configure KPI
              </Link>
            </div>
          ) : (
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
                        Rank
                      </th>
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
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentItems.map((item: any, index: number) => {
                      // If it's a KPI score
                      if (item.userId && item.scores) {
                        const score = item as KPIScore;
                        const perfConfig = getPerformanceConfig(
                          score.performanceLevel,
                        );
                        const rankBadge = getRankBadge(score.rank || index + 1);
                        const isTopThree = (score.rank || index + 1) <= 3;

                        return (
                          <tr
                            key={score._id || index}
                            className={`hover:bg-gray-50 transition cursor-pointer ${
                              isTopThree
                                ? "bg-gradient-to-r from-amber-50/50 to-transparent"
                                : ""
                            }`}
                            onClick={() =>
                              router.push(`/kpi/employee/${score.userId._id}`)
                            }
                          >
                            <td className="px-4 py-3">
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${rankBadge}`}
                              >
                                {score.rank || index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {score.userId.fullName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {score.userId.fullName}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {score.userId.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {score.departmentId.name}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-800">
                                  {formatScore(score.totalScore)}%
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      score.totalScore >= 90
                                        ? "bg-emerald-500"
                                        : score.totalScore >= 75
                                          ? "bg-blue-500"
                                          : score.totalScore >= 60
                                            ? "bg-amber-500"
                                            : "bg-red-500"
                                    }`}
                                    style={{ width: `${score.totalScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                              >
                                {perfConfig.emoji} {perfConfig.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-0.5">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      score.scores.taskCompletion.score >= 70
                                        ? "#10b981"
                                        : "#ef4444",
                                  }}
                                  title={`Task Completion: ${score.scores.taskCompletion.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      score.scores.qualityScore.score >= 70
                                        ? "#3b82f6"
                                        : "#ef4444",
                                  }}
                                  title={`Quality Score: ${score.scores.qualityScore.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      score.scores.efficiency.score >= 70
                                        ? "#8b5cf6"
                                        : "#ef4444",
                                  }}
                                  title={`Efficiency: ${score.scores.efficiency.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      score.scores.collaboration.score >= 70
                                        ? "#f59e0b"
                                        : "#ef4444",
                                  }}
                                  title={`Collaboration: ${score.scores.collaboration.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      score.scores.innovation.score >= 70
                                        ? "#ec4899"
                                        : "#ef4444",
                                  }}
                                  title={`Innovation: ${score.scores.innovation.score}%`}
                                />
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor:
                                      score.scores.attendance.score >= 70
                                        ? "#14b8a6"
                                        : "#ef4444",
                                  }}
                                  title={`Attendance: ${score.scores.attendance.score}%`}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/kpi/employee/${score.userId._id}`,
                                  );
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      } else {
                        // It's a user without KPI data
                        const user = item as User;
                        const perfConfig =
                          getPerformanceConfig("not_calculated");

                        return (
                          <tr
                            key={user._id || index}
                            className="hover:bg-gray-50 transition cursor-pointer opacity-75"
                            onClick={() => router.push(`/users/${user._id}`)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs bg-gray-100 text-gray-600">
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold">
                                  {user.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {user.fullName}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {user.departmentId?.name || "Unassigned"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-400">
                                Not Calculated
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                              >
                                {perfConfig.emoji} {perfConfig.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-400">
                                No data
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/users/${user._id}`);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, displayData.length)} of{" "}
                    {displayData.length} employees
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
                          className={`px-3 py-2 rounded-lg text-sm transition ${
                            currentPage === pageNum
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
          )}
        </div>
      </div>
    </div>
  );
}
