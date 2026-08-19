"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  Search,
  Loader2,
  Download,
  Eye,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Crown,
  Settings,
  Home,
  Award,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";

// ============================================================
// TYPES
// ============================================================
interface ScoreComponent {
  score: number;
  weight: number;
  weightedScore: number;
}

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
    taskCompletion: ScoreComponent;
    qualityScore: ScoreComponent;
    efficiency: ScoreComponent;
    collaboration: ScoreComponent;
    innovation: ScoreComponent;
    attendance: ScoreComponent;
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
  profilePhoto?: string; // optional
  avatar?: string; // optional
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  department?: {
    _id: string;
    name: string;
    code: string;
  } | string;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  assignedTo: string | { _id: string };
  completedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  rejected?: boolean;
  comments?: any[];
  attachments?: any[];
  assignedTeam?: string[];
  isInnovative?: boolean;
  creativeSolution?: boolean;
  processImprovement?: boolean;
}

interface LeaderboardStats {
  totalEmployees: number;
  averageScore: number;
  topScore: number;
  excellentCount: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function KPLeaderboardPage() {
  const { hasRole } = useAuth();
  const router = useRouter();

  // State Management
  const [scores, setScores] = useState<KPIScore[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<"rank" | "score" | "name">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [departments, setDepartments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasRole(["super_admin", "admin", "hr_manager", "dept_manager", "employee"]);
  console.log(scores, "scores")
  // ============================================================
  // HELPER: GET DEPARTMENT OBJECT
  // ============================================================
  const getDepartmentObject = (user: User) => {
    if (user.departmentId) {
      return {
        _id: user.departmentId._id,
        name: user.departmentId.name,
        code: user.departmentId.code || "NA",
      };
    }
    if (user.department && typeof user.department === "object") {
      return {
        _id: user.department._id,
        name: user.department.name,
        code: user.department.code || "NA",
      };
    }
    if (user.department && typeof user.department === "string") {
      return {
        _id: user.department,
        name: user.department,
        code: user.department.substring(0, 3).toUpperCase(),
      };
    }
    return { _id: "unassigned", name: "Unassigned", code: "NA" };
  };

  // ============================================================
  // REAL DATA KPI CALCULATION ALGORITHM
  // ============================================================
  const calculateKPIScoresFromTasks = useCallback((
    users: User[],
    tasks: Task[],
    month: string,
    year: number,
  ): KPIScore[] => {
    const calculatedScores: KPIScore[] = [];
    const monthIndex = MONTHS.indexOf(month);

    // Get tasks for the selected month
    const monthTasks = tasks.filter((task) => {
      if (!task.createdAt && !task.deadline) return false;
      const taskDate = new Date(task.createdAt || task.deadline);
      return taskDate.getMonth() === monthIndex && taskDate.getFullYear() === year;
    });

    users.forEach((user) => {
      // Get user's tasks for the month
      const userTasks = monthTasks.filter((task) => {
        const assignedToId = typeof task.assignedTo === "string"
          ? task.assignedTo
          : task.assignedTo?._id;
        return assignedToId === user._id;
      });

      const totalTasks = userTasks.length;

      // ✅ Create userId object with avatar ONCE and reuse for all users
      const userIdObj = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        employeeId: user.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        role: user.role,
        avatar: user.profilePhoto || user.avatar || undefined,
      };

      // If no tasks, return default zero scores
      if (totalTasks === 0) {
        calculatedScores.push({
          _id: `calc_${user._id}_${month}_${year}`,
          userId: userIdObj,
          departmentId: getDepartmentObject(user),
          month,
          year,
          totalScore: 0,
          performanceLevel: "needs_improvement",
          percentile: 0,
          rank: 0,
          totalEmployees: users.length,
          scores: {
            taskCompletion: { score: 0, weight: 30, weightedScore: 0 },
            qualityScore: { score: 0, weight: 25, weightedScore: 0 },
            efficiency: { score: 0, weight: 20, weightedScore: 0 },
            collaboration: { score: 0, weight: 10, weightedScore: 0 },
            innovation: { score: 0, weight: 10, weightedScore: 0 },
            attendance: { score: 0, weight: 5, weightedScore: 0 },
          },
          calculatedAt: new Date().toISOString(),
        });
        return;
      }

      // ============================================================
      // 1. TASK COMPLETION SCORE
      // ============================================================
      const completedTasks = userTasks.filter((t) => t.status === "completed").length;
      const taskCompletionScore = Math.min(100, Math.round((completedTasks / totalTasks) * 100));

      // ============================================================
      // 2. QUALITY SCORE
      // ============================================================
      const approvedTasks = userTasks.filter((t) => t.status === "completed" && !t.rejected);
      const submittedTasks = userTasks.filter((t) => t.status === "completed" || t.status === "submitted");
      const qualityScore = submittedTasks.length > 0
        ? Math.min(100, Math.round((approvedTasks.length / submittedTasks.length) * 100))
        : 0;

      // ============================================================
      // 3. EFFICIENCY SCORE
      // ============================================================
      const onTimeTasks = userTasks.filter((t) => {
        if (t.status !== "completed" || !t.deadline) return false;
        const completedDate = t.completedAt
          ? new Date(t.completedAt)
          : new Date(t.updatedAt || t.createdAt || Date.now());
        const deadline = new Date(t.deadline);
        return completedDate <= deadline;
      });
      const efficiencyScore = Math.min(100, Math.round((onTimeTasks.length / totalTasks) * 100));

      // ============================================================
      // 4. COLLABORATION SCORE
      // ============================================================
      const collaborativeTasks = userTasks.filter((t) => {
        const hasComments = t.comments && t.comments.length > 0;
        const hasAttachments = t.attachments && t.attachments.length > 0;
        const isTeamTask = t.assignedTeam && t.assignedTeam.length > 1;
        return hasComments || hasAttachments || isTeamTask;
      });
      const collaborationScore = Math.min(100, Math.round((collaborativeTasks.length / totalTasks) * 100));

      // ============================================================
      // 5. INNOVATION SCORE
      // ============================================================
      const innovativeTasks = userTasks.filter((t) => {
        return t.isInnovative || t.creativeSolution || t.processImprovement;
      });
      const innovationScore = Math.min(100, Math.round((innovativeTasks.length / totalTasks) * 100));

      // ============================================================
      // 6. ATTENDANCE SCORE (Proxy based on volume and consistency)
      // ============================================================
      const hasConsistentWork = userTasks.length >= 10;
      const attendanceScore = hasConsistentWork
        ? 95
        : Math.min(80, Math.round((userTasks.length / 10) * 100));

      // ============================================================
      // CALCULATE WEIGHTED SCORES
      // ============================================================
      const weightedScores = {
        taskCompletion: {
          score: taskCompletionScore,
          weight: 30,
          weightedScore: Math.round((taskCompletionScore * 30) / 100),
        },
        qualityScore: {
          score: qualityScore,
          weight: 25,
          weightedScore: Math.round((qualityScore * 25) / 100),
        },
        efficiency: {
          score: efficiencyScore,
          weight: 20,
          weightedScore: Math.round((efficiencyScore * 20) / 100),
        },
        collaboration: {
          score: collaborationScore,
          weight: 10,
          weightedScore: Math.round((collaborationScore * 10) / 100),
        },
        innovation: {
          score: innovationScore,
          weight: 10,
          weightedScore: Math.round((innovationScore * 10) / 100),
        },
        attendance: {
          score: attendanceScore,
          weight: 5,
          weightedScore: Math.round((attendanceScore * 5) / 100),
        },
      };

      // ============================================================
      // CALCULATE TOTAL SCORE
      // ============================================================
      const totalScore = Math.round(
        weightedScores.taskCompletion.weightedScore +
        weightedScores.qualityScore.weightedScore +
        weightedScores.efficiency.weightedScore +
        weightedScores.collaboration.weightedScore +
        weightedScores.innovation.weightedScore +
        weightedScores.attendance.weightedScore
      );

      // ============================================================
      // DETERMINE PERFORMANCE LEVEL
      // ============================================================
      let performanceLevel: "excellent" | "good" | "average" | "needs_improvement" = "average";
      if (totalScore >= 90) performanceLevel = "excellent";
      else if (totalScore >= 75) performanceLevel = "good";
      else if (totalScore >= 60) performanceLevel = "average";
      else performanceLevel = "needs_improvement";

      // ============================================================
      // CREATE SCORE OBJECT WITH AVATAR
      // ============================================================
      calculatedScores.push({
        _id: `calc_${user._id}_${month}_${year}`,
        userId: userIdObj, // ✅ Includes avatar
        departmentId: getDepartmentObject(user),
        month,
        year,
        totalScore,
        performanceLevel,
        percentile: 0,
        rank: 0,
        totalEmployees: users.length,
        scores: weightedScores,
        calculatedAt: new Date().toISOString(),
      });
    });

    // ============================================================
    // SORT AND CALCULATE RANKS & PERCENTILES
    // ============================================================
    const sorted = [...calculatedScores].sort((a, b) => b.totalScore - a.totalScore);
    sorted.forEach((score, index) => {
      score.rank = index + 1;
      score.percentile = Math.round(((sorted.length - index) / sorted.length) * 100);
    });

    return sorted;
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, tasksRes] = await Promise.all([
        api.get("/users").catch(() => ({ data: { success: false, data: [] } })),
        api.get("/tasks").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const usersData: User[] = usersRes.data.success ? usersRes.data.data || [] : [];
      const tasksData: Task[] = tasksRes.data.success ? tasksRes.data.data || [] : [];

      let allScores: KPIScore[] = [];
      if (usersData.length > 0) {
        allScores = calculateKPIScoresFromTasks(usersData, tasksData, selectedMonth, selectedYear);
      }

      setScores(allScores);

      const depts = [...new Set(allScores.map((s) => s.departmentId?.name || "Unassigned"))];
      setDepartments(depts.length > 0 ? depts : ["Unassigned"]);

      const total = allScores.length;
      const topScore = allScores.length > 0 ? Math.max(...allScores.map((s) => s.totalScore)) : 0;
      const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((sum, s) => sum + s.totalScore, 0) / allScores.length) : 0;

      setStats({
        totalEmployees: total,
        averageScore: avgScore,
        topScore,
        excellentCount: allScores.filter((s) => s.performanceLevel === "excellent").length,
      });

      if (allScores.length === 0) {
        setError("No KPI metrics registered for this timeframe.");
      }
    } catch (err: any) {
      console.error("Leaderboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load leaderboard metrics.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, calculateKPIScoresFromTasks]);

  useEffect(() => {
    if (canManage) {
      fetchAllData();
    }
  }, [canManage, fetchAllData]);

  const handleExport = () => {
    if (scores.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const headers = ["Rank", "Employee", "Department", "Score", "Performance Tier", "Percentile"];
    const rows = scores.map((s) => [
      s.rank,
      `"${s.userId.fullName}"`,
      `"${s.departmentId.name}"`,
      s.totalScore.toFixed(1),
      s.performanceLevel.replace("_", " "),
      `${s.percentile}%`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `KPI_Leaderboard_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Leaderboard exported successfully");
  };

  const filteredScores = useMemo(() => {
    let filtered = [...scores];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.userId.fullName.toLowerCase().includes(term) ||
          s.userId.email.toLowerCase().includes(term) ||
          s.userId.employeeId?.toLowerCase().includes(term)
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter((s) => s.departmentId?.name === selectedDepartment);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "rank") comparison = (a.rank || 99) - (b.rank || 99);
      else if (sortBy === "score") comparison = b.totalScore - a.totalScore;
      else if (sortBy === "name") comparison = a.userId.fullName.localeCompare(b.userId.fullName);

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [scores, searchTerm, selectedDepartment, sortBy, sortOrder]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredScores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredScores.length / itemsPerPage);

  const topThree = useMemo(() => [...scores].sort((a, b) => a.rank - b.rank).slice(0, 3), [scores]);

  const formatScore = (score: number): string => score?.toFixed(1) || "0.0";

  const getPerformanceConfig = (level: string) => {
    const config: Record<string, { color: string; bg: string; border: string; label: string; emoji: string }> = {
      excellent: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Excellent", emoji: "🌟" },
      good: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Good", emoji: "⭐" },
      average: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Average", emoji: "📊" },
      needs_improvement: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Needs Improvement", emoji: "📈" },
    };
    return config[level] || config.average;
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-linear-to-r from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20";
    if (rank === 2) return "bg-linear-to-r from-slate-300 to-slate-400 text-white shadow-md";
    if (rank === 3) return "bg-linear-to-r from-amber-700 to-amber-900 text-white shadow-md";
    return "bg-slate-100 text-slate-700";
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md w-full"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm mb-6">You lack administrative clearance to access KPI leaderboards.</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Return to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-600 transition flex items-center gap-1">
            <Home size={13} /> Dashboard
          </Link>
          <ChevronRight size={13} />
          <span className="text-slate-700">KPI Leaderboard</span>
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Performance Leaderboard</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                    {selectedMonth} {selectedYear}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Rankings and performance evaluations derived from organizational task completion.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Download size={14} /> Export CSV
            </button>

            <Link
              href="/kpi/management"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
            >
              <Settings size={14} /> Configure KPI
            </Link>
          </div>
        </motion.div>

        {/* Statistical Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Active Workforce", val: stats.totalEmployees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Unit Average", val: `${stats.averageScore}%`, icon: Crown, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Top Achiever", val: `${stats.topScore}%`, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Elite Tier", val: stats.excellentCount, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
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
        )}
        {/* Top 3 Podium Cards */}
        {topThree.length >= 3 && (
          <div className="relative pt-12 pb-6 px-4">
            {/* Floating Crown for 1st Place (Center) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-bounce">
              <svg className="w-10 h-10 text-amber-400 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
              </svg>
            </div>

            {/* Podium Container - Side-by-Side arrangement mimicking the vector illustration */}
            <div className="flex items-end justify-center gap-4 sm:gap-8 max-w-2xl mx-auto">

              {/* 2nd Place (Left) */}
              {[topThree[1]].map((score) => {
                if (!score) return null;
                return (
                  <motion.div
                    key={score._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => router.push(`/kpi/employee/${score.userId._id}`)}
                    className="flex flex-col items-center group cursor-pointer relative z-10 -mr-2 sm:-mr-4 mb-2"
                  >
                    {/* Circular Avatar Node with Outside Badge */}
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#f4f1de] border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                        {score.userId.avatar ? (
                          <img src={score.userId.avatar} alt={score.userId.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#d0cbd0] flex items-center justify-center text-slate-700 font-extrabold text-xl shadow-inner">
                            {score.userId.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Rank Badge Indicator (Outside using z-30) */}
                      <div className="absolute -bottom-2 -right-2 z-30 w-8 h-8 rounded-full bg-[#f2cc8f] border-2 border-white flex items-center justify-center text-xs font-black text-slate-800 shadow-lg">
                        2
                      </div>
                    </div>

                    {/* Label details */}
                    <div className="mt-3 text-center">
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight max-w-[100px] sm:max-w-[120px] truncate">
                        {score.userId.fullName}
                      </h4>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-emerald-100">
                        {formatScore(score.totalScore)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* 1st Place (Center - Elevated) */}
              {[topThree[0]].map((score) => {
                if (!score) return null;
                return (
                  <motion.div
                    key={score._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => router.push(`/kpi/employee/${score.userId._id}`)}
                    className="flex flex-col items-center group cursor-pointer relative z-30 -translate-y-6"
                  >
                    {/* Larger Circular Avatar Node with Outside Badge */}
                    <div className="relative">
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#f4f1de] border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                        {score.userId.avatar ? (
                          <img src={score.userId.avatar} alt={score.userId.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#e07a5f] flex items-center justify-center text-white font-extrabold text-2xl shadow-inner">
                            {score.userId.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Rank Badge Indicator (Outside using z-30) */}
                      <div className="absolute -bottom-2 -right-2 z-30 w-9 h-9 rounded-full bg-[#f2cc8f] border-2 border-white flex items-center justify-center text-sm font-black text-slate-800 shadow-lg">
                        1
                      </div>
                    </div>

                    {/* Label details */}
                    <div className="mt-3 text-center">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight max-w-[120px] sm:max-w-[140px] truncate">
                        {score.userId.fullName}
                      </h4>
                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg mt-1 inline-block border border-amber-200 shadow-xs">
                        {formatScore(score.totalScore)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {/* 3rd Place (Right) */}
              {[topThree[2]].map((score) => {
                if (!score) return null;
                return (
                  <motion.div
                    key={score._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => router.push(`/kpi/employee/${score.userId._id}`)}
                    className="flex flex-col items-center group cursor-pointer relative z-10 -ml-2 sm:-ml-4 mb-2"
                  >
                    {/* Circular Avatar Node with Outside Badge */}
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#f4f1de] border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                        {score.userId.avatar ? (
                          <img src={score.userId.avatar} alt={score.userId.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#3d405b] flex items-center justify-center text-white font-extrabold text-xl shadow-inner">
                            {score.userId.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Rank Badge Indicator (Outside using z-30) */}
                      <div className="absolute -bottom-2 -right-2 z-30 w-8 h-8 rounded-full bg-[#f2cc8f] border-2 border-white flex items-center justify-center text-xs font-black text-slate-800 shadow-lg">
                        3
                      </div>
                    </div>

                    {/* Label details */}
                    <div className="mt-3 text-center">
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight max-w-[100px] sm:max-w-[120px] truncate">
                        {score.userId.fullName}
                      </h4>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-emerald-100">
                        {formatScore(score.totalScore)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}

            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ranked employee..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-sm font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Units</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-sm font-semibold outline-none cursor-pointer"
            >
              <option value="rank">Sort by Rank</option>
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 rounded-2xl transition shadow-xs cursor-pointer font-bold text-xs"
            >
              {sortOrder === "asc" ? "ASC" : "DESC"}
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-400">Compiling leaderboard rankings...</p>
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-xs max-w-lg mx-auto space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Rankings Discovered</h3>
            <p className="text-slate-400 text-xs">No employee performance scores match your filtering criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4 text-center w-20">Rank</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Unit Division</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4">Performance Tier</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {currentItems.map((score, index) => {
                    const perf = getPerformanceConfig(score.performanceLevel);
                    const actualRank = score.rank || indexOfFirstItem + index + 1;

                    return (
                      <tr
                        key={score._id}
                        onClick={() => router.push(`/kpi/employee/${score.userId._id}`)}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                      >
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-extrabold text-xs ${getRankBadgeStyle(actualRank)}`}>
                            {actualRank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {score.userId.avatar ? (
                              <img
                                src={score.userId.avatar}
                                alt={score.userId.fullName}
                                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs';
                                  fallback.textContent = score.userId.fullName.charAt(0).toUpperCase();
                                  parent?.appendChild(fallback);
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                {score.userId.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{score.userId.fullName}</p>
                              <p className="text-xs text-slate-400">{score.userId.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{score.departmentId?.name || "Unassigned"}</td>
                        <td className="px-6 py-4 text-center font-extrabold text-slate-900">{formatScore(score.totalScore)}%</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${perf.bg} ${perf.border} ${perf.color}`}>
                            {perf.emoji} {perf.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/kpi/employee/${score.userId._id}`);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition inline-block"
                            title="Inspect Metrics"
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs font-medium text-slate-500">
                <span>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredScores.length)} of {filteredScores.length} records</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-3 py-1 font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}