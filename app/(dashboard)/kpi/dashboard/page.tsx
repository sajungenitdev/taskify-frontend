"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Search,
  Loader2,
  RefreshCw,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Award,
  FileText,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================================
// TYPES
// ============================================================
interface EmployeeKPI {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  totalScore: number;
  performanceLevel: "excellent" | "good" | "average" | "needs_improvement" | "not_calculated";
  status: "promotion_ready" | "on_track" | "training_needed" | "warning_review" | "not_calculated";
  tasksCompleted: number;
  totalTasks: number;
  tasksInProgress: number;
  overdueTasks: number;
  scores?: {
    taskCompletion: number;
    qualityScore: number;
    efficiency: number;
    collaboration: number;
    innovation: number;
    attendance: number;
  };
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  rejected: number;
  submitted: number;
}

// ============================================================
// CONSTANTS
// ============================================================
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2023, 2024, 2025, 2026];

const COMPONENT_WEIGHTS = {
  taskCompletion: 0.25,
  qualityScore: 0.20,
  efficiency: 0.20,
  collaboration: 0.15,
  innovation: 0.10,
  attendance: 0.10,
};

export default function KPIDashboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeKPI[]>([]);
  const [stats, setStats] = useState({
    deptAvg: 0,
    topPerformer: "",
    topScore: 0,
    topPerformerId: "",
    needsAttention: "",
    needsScore: 0,
    needsAttentionId: "",
    tasksDone: 0,
    totalEmployees: 0,
    totalTasks: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const canManage = hasRole([
    "super_admin", "admin", "hr_manager", "dept_manager",
    "project_manager", "employee",
  ]);

  const currentMonth = MONTHS[new Date().getMonth()];

  // ============================================================
  // HELPERS
  // ============================================================
  const getDepartmentName = (dept: any): string => {
    if (!dept) return "Unassigned";
    if (typeof dept === 'string') return dept;
    if (dept.name) return dept.name;
    if (dept._id) return dept._id;
    return "Unassigned";
  };

  const getRoleDisplayName = (role: string): string => {
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
  };

  // ============================================================
  // EXACT KPI CALCULATION - SAME AS DETAIL PAGE
  // ============================================================
  const calculateKPIFromTasks = useCallback((tasks: any[]): {
    score: number;
    metrics: {
      taskCompletion: number;
      qualityScore: number;
      efficiency: number;
      collaboration: number;
      innovation: number;
      attendance: number;
    };
  } => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
    const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
    const submittedTasks = tasks.filter((t: any) => t.status === "submitted").length;
    const overdueTasks = tasks.filter((t: any) =>
      t.status === "overdue" ||
      (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
    ).length;
    const rejectedTasks = tasks.filter((t: any) => t.status === "rejected").length;

    if (totalTasks === 0) {
      return {
        score: 0,
        metrics: {
          taskCompletion: 0,
          qualityScore: 0,
          efficiency: 0,
          collaboration: 0,
          innovation: 0,
          attendance: 0,
        }
      };
    }

    // 1. TASK COMPLETION (25%)
    const effectiveCompleted = completedTasks + (inProgressTasks * 0.5) + (submittedTasks * 0.8);
    const taskCompletion = Math.min(100, Math.round((effectiveCompleted / totalTasks) * 100));

    // 2. QUALITY SCORE (20%)
    let qualityScore = 0;
    if (completedTasks > 0) {
      const qualityTasks = completedTasks - overdueTasks - rejectedTasks;
      qualityScore = Math.min(100, Math.max(0, Math.round((qualityTasks / totalTasks) * 100)));
    } else if (inProgressTasks + submittedTasks > 0) {
      const activeTasks = inProgressTasks + submittedTasks;
      qualityScore = Math.min(70, Math.round(30 + (activeTasks / totalTasks) * 40));
    } else {
      qualityScore = 20;
    }

    // 3. EFFICIENCY (20%)
    const progress = (completedTasks + inProgressTasks * 0.5 + submittedTasks * 0.8) / totalTasks;
    const efficiency = Math.min(100, Math.round(Math.max(15, progress * 100)));

    // 4. COLLABORATION (15%)
    const engagementRatio = (completedTasks + inProgressTasks + submittedTasks) / totalTasks;
    const collaboration = Math.min(100, Math.round(30 + engagementRatio * 70));

    // 5. INNOVATION (10%)
    const innovation = Math.min(100, Math.round(25 + engagementRatio * 75));

    // 6. ATTENDANCE (10%)
    const attendance = Math.min(100, Math.round(50 + engagementRatio * 50));

    // TOTAL SCORE
    const totalScore = Math.min(100, Math.round(
      taskCompletion * COMPONENT_WEIGHTS.taskCompletion +
      qualityScore * COMPONENT_WEIGHTS.qualityScore +
      efficiency * COMPONENT_WEIGHTS.efficiency +
      collaboration * COMPONENT_WEIGHTS.collaboration +
      innovation * COMPONENT_WEIGHTS.innovation +
      attendance * COMPONENT_WEIGHTS.attendance
    ));

    return {
      score: totalScore,
      metrics: {
        taskCompletion,
        qualityScore,
        efficiency,
        collaboration,
        innovation,
        attendance,
      }
    };
  }, []);

  // ============================================================
  // FETCH DATA - FULLY DYNAMIC
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all users
      const usersRes = await api.get("/users");
      const users = usersRes.data?.data || [];

      // 2. Fetch ALL tasks
      const tasksRes = await api.get("/tasks");
      const allTasks = tasksRes.data?.data || [];

      // 3. Calculate date range for selected month
      const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
      const startDate = new Date(selectedYear, monthIndex - 1, 1);
      const endDate = new Date(selectedYear, monthIndex, 0);

      console.log(`=== KPI Dashboard - ${selectedMonth} ${selectedYear} ===`);
      console.log(`Total users: ${users.length}, Total tasks: ${allTasks.length}`);

      // 4. Build employee data with EXACT calculations
      const employeeData: EmployeeKPI[] = users.map((user: any) => {
        // Get ALL tasks for this user
        const userTasks = allTasks.filter((t: any) => {
          const assignedTo = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id;
          return assignedTo === user._id;
        });

        // Filter tasks by selected month/year
        const monthTasks = userTasks.filter((t: any) => {
          const taskDate = new Date(t.createdAt);
          return taskDate >= startDate && taskDate <= endDate;
        });

        const total = monthTasks.length;
        const completed = monthTasks.filter((t: any) => t.status === "completed").length;
        const inProgress = monthTasks.filter((t: any) => t.status === "in_progress").length;
        const overdue = monthTasks.filter((t: any) =>
          t.status === "overdue" ||
          (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
        ).length;

        // Calculate KPI score from MONTH-FILTERED tasks
        const result = calculateKPIFromTasks(monthTasks);
        const score = result.score;

        const deptName = getDepartmentName(user.departmentId || user.department);

        // Determine performance level
        const performanceLevel = score >= 85 ? "excellent"
          : score >= 70 ? "good"
          : score >= 55 ? "average"
          : score >= 10 ? "needs_improvement"
          : "not_calculated";

        const status = score >= 85 ? "promotion_ready"
          : score >= 70 ? "on_track"
          : score >= 55 ? "training_needed"
          : score >= 10 ? "warning_review"
          : "not_calculated";

        return {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          employeeId: user.employeeId || `EMP${String(Math.random()).substring(2, 8)}`,
          role: user.role,
          department: deptName,
          totalScore: score,
          performanceLevel,
          status,
          tasksCompleted: completed,
          totalTasks: total,
          tasksInProgress: inProgress,
          overdueTasks: overdue,
          scores: result.metrics,
        };
      });

      // Sort by score (higher first)
      const sorted = [...employeeData].sort((a, b) => b.totalScore - a.totalScore);
      setEmployees(sorted);

      // Calculate stats
      const totalEmployees = sorted.length;
      const employeesWithScores = sorted.filter(e => e.totalScore > 0);
      const avgScore = employeesWithScores.length > 0
        ? Math.round(employeesWithScores.reduce((sum, e) => sum + e.totalScore, 0) / employeesWithScores.length)
        : 0;

      const top = employeesWithScores.length > 0 ? employeesWithScores[0] : null;
      const needs = employeesWithScores.length > 0 ? employeesWithScores[employeesWithScores.length - 1] : null;

      // Calculate total tasks for the month
      const allMonthTasks = allTasks.filter((t: any) => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= startDate && taskDate <= endDate;
      });
      const completedTasks = allMonthTasks.filter((t: any) => t.status === "completed").length;

      setStats({
        deptAvg: avgScore,
        topPerformer: top?.fullName || "N/A",
        topScore: top?.totalScore || 0,
        topPerformerId: top?._id || "",
        needsAttention: needs?.fullName || "N/A",
        needsScore: needs?.totalScore || 0,
        needsAttentionId: needs?._id || "",
        tasksDone: completedTasks,
        totalEmployees: totalEmployees,
        totalTasks: allMonthTasks.length,
      });

      console.log("Dashboard Stats:", {
        avgScore,
        topPerformer: top?.fullName,
        topScore: top?.totalScore,
        totalEmployees,
        totalTasks: allMonthTasks.length,
        completedTasks
      });

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, calculateKPIFromTasks]);

  // ============================================================
  // INITIALIZE
  // ============================================================
  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(currentMonth);
      setSelectedYear(new Date().getFullYear());
    }
  }, [currentMonth]);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchData();
    }
  }, [selectedMonth, selectedYear]);

  // ============================================================
  // FILTERED EMPLOYEES
  // ============================================================
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, departmentFilter]);

  // ============================================================
  // UNIQUE DEPARTMENTS
  // ============================================================
  const uniqueDepartments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return Array.from(depts).filter(Boolean);
  }, [employees]);

  // ============================================================
  // PDF EXPORT
  // ============================================================
  const handleExportPDF = () => {
    if (employees.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(22);
      doc.setTextColor(15, 81, 50);
      doc.text("KPI Dashboard", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${selectedMonth} ${selectedYear} • ${stats.totalEmployees} Employees • ${stats.deptAvg}% Average`,
        pageWidth / 2,
        28,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const statsY = 40;
      doc.text(`Department Average: ${stats.deptAvg}%`, 20, statsY);
      doc.text(`Top Performer: ${stats.topPerformer} (${stats.topScore}%)`, 20, statsY + 6);
      doc.text(`Needs Attention: ${stats.needsAttention} (${stats.needsScore}%)`, 20, statsY + 12);
      doc.text(`Tasks Completed: ${stats.tasksDone} / ${stats.totalTasks}`, 20, statsY + 18);

      const tableData = employees.map((emp) => [
        emp.fullName,
        emp.department,
        getRoleDisplayName(emp.role),
        emp.totalScore > 0 ? `${emp.totalScore}%` : "N/A",
        emp.status.replace(/_/g, " ").toUpperCase(),
        `${emp.tasksCompleted}/${emp.totalTasks}`,
      ]);

      autoTable(doc, {
        startY: 68,
        head: [["Employee", "Department", "Role", "Score", "Status", "Tasks"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [15, 81, 50],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 30 },
          5: { cellWidth: 20 },
        },
        margin: { left: 15, right: 15 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 250;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        finalY + 15,
        { align: "center" }
      );

      doc.save(`KPI_Dashboard_${selectedMonth}_${selectedYear}.pdf`);
      toast.success("PDF exported successfully!");

    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      promotion_ready: {
        label: "Promotion Ready",
        color: "text-emerald-700",
        bg: "bg-emerald-50/80",
        icon: ArrowUpRight,
      },
      on_track: {
        label: "On Track",
        color: "text-blue-700",
        bg: "bg-blue-50/80",
        icon: CheckCircle,
      },
      training_needed: {
        label: "Training Needed",
        color: "text-amber-700",
        bg: "bg-amber-50/80",
        icon: AlertCircle,
      },
      warning_review: {
        label: "Warning Review",
        color: "text-red-700",
        bg: "bg-red-50/80",
        icon: AlertCircle,
      },
      not_calculated: {
        label: "Not Calculated",
        color: "text-gray-500",
        bg: "bg-gray-50/80",
        icon: AlertCircle,
      },
    };
    return configs[status] || configs.not_calculated;
  };

  const getCircleColor = (score: number) => {
    if (score >= 85) return { border: "border-emerald-400", text: "text-emerald-600" };
    if (score >= 70) return { border: "border-blue-400", text: "text-blue-600" };
    if (score >= 55) return { border: "border-amber-400", text: "text-amber-500" };
    if (score > 0) return { border: "border-red-300", text: "text-red-500" };
    return { border: "border-gray-300", text: "text-gray-400" };
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page</p>
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">

          {/* Top Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                KPI Dashboard — {selectedMonth} {selectedYear}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {stats.totalEmployees} employees · {stats.deptAvg}% average score
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              >
                {MONTHS.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <button
                onClick={handleExportPDF}
                disabled={employees.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f5132] hover:bg-[#0a3622] text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
              >
                <FileText size={16} />
                Export PDF
              </button>

              <button
                onClick={fetchData}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition bg-gray-50 hover:bg-white"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 hover:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setDepartmentFilter("all");
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Stats Summary */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">DEPT AVG</span>
                    <BarChart3 size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.deptAvg}%</span>
                  </div>
                </div>

                <div
                  className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => stats.topPerformerId && router.push(`/kpi/employee/${stats.topPerformerId}`)}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TOP PERFORMER</span>
                    <Award size={18} className="text-amber-500" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-gray-900 truncate">{stats.topPerformer}</span>
                    <span className="text-lg font-extrabold text-emerald-600">{stats.topScore}%</span>
                  </div>
                </div>

                <div
                  className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => stats.needsAttentionId && router.push(`/kpi/employee/${stats.needsAttentionId}`)}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">NEEDS ATTENTION</span>
                    <AlertCircle size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-gray-900 truncate">{stats.needsAttention}</span>
                    <span className="text-lg font-extrabold text-red-500">{stats.needsScore}%</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TASKS DONE</span>
                    <CheckCircle size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.tasksDone}</span>
                    <span className="text-sm text-gray-400 ml-1">/ {stats.totalTasks}</span>
                  </div>
                </div>
              </div>

              {/* Employee Cards */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">
                    Employee KPI Scores — {selectedMonth} {selectedYear}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {filteredEmployees.length} employees
                    </span>
                    <button
                      onClick={handleExportPDF}
                      disabled={employees.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      <FileText size={13} />
                      Export All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {filteredEmployees.map((employee) => {
                    const statusConfig = getStatusConfig(employee.status);
                    const circle = getCircleColor(employee.totalScore);
                    const displayRole = getRoleDisplayName(employee.role);
                    const hasScore = employee.totalScore > 0;

                    return (
                      <div
                        key={employee._id}
                        onClick={() => hasScore && router.push(`/kpi/employee/${employee._id}`)}
                        className={`bg-white rounded-xl border border-gray-200/90 p-5 flex flex-col items-center text-center hover:shadow-md transition relative group justify-between ${hasScore ? 'cursor-pointer hover:border-emerald-300' : 'cursor-default opacity-60'}`}
                      >
                        <div className="flex flex-col items-center w-full">
                          <div className={`w-16 h-16 rounded-full border-2 ${circle.border} flex items-center justify-center mb-3 bg-white shadow-inner`}>
                            <span className={`text-base font-extrabold ${circle.text}`}>
                              {hasScore ? `${employee.totalScore}%` : '—'}
                            </span>
                          </div>

                          <h3 className="font-bold text-gray-900 text-sm truncate w-full mb-0.5">
                            {employee.fullName}
                          </h3>
                          <p className="text-xs text-gray-400 font-medium truncate w-full mb-4">
                            {displayRole} · {employee.department}
                          </p>
                        </div>

                        <div className={`w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 ${statusConfig.bg}`}>
                          <statusConfig.icon size={12} className={statusConfig.color} />
                          <span className={`text-[11px] font-semibold ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {hasScore && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                            <Eye size={14} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filteredEmployees.length === 0 && employees.length > 0 && (
                  <div className="text-center py-8">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-800">No employees match your filters</h3>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
                  </div>
                )}

                {employees.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-800 mb-1">No Data Available</h3>
                    <p className="text-gray-400 text-sm">No employees found in the system</p>
                    <button
                      onClick={fetchData}
                      className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm transition"
                    >
                      <RefreshCw size={14} className="inline mr-1.5" />
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}