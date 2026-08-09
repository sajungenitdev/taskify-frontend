"use client";

import { useState, useEffect, useCallback } from "react";
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
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  Zap,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EmployeeKPI {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  totalScore: number;
  performanceLevel: "excellent" | "good" | "average" | "needs_improvement";
  status: "promotion_ready" | "on_track" | "training_needed" | "warning_review";
  tasksCompleted: number;
  avatar?: string;
}

export default function KPIDashboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeKPI[]>([]);
  const [stats, setStats] = useState({
    deptAvg: 0,
    topPerformer: "",
    topScore: 0,
    needsAttention: "",
    needsScore: 0,
    tasksDone: 0,
    totalEmployees: 0,
  });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = [2023, 2024, 2025, 2026];

  const canManage = hasRole([
    "super_admin", "admin", "hr_manager", "dept_manager",
    "project_manager", "employee",
  ]);

  const currentMonth = months[new Date().getMonth()];

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
  // CALCULATE KPI SCORE FROM TASKS (Same as detail page)
  // ============================================================
  const calculateKPIFromTasks = useCallback((userTasks: any[]): number => {
    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter((t: any) => t.status === "completed").length;
    const overdueTasks = userTasks.filter((t: any) =>
      t.status === "overdue" ||
      (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
    ).length;
    const inProgressTasks = userTasks.filter((t: any) => t.status === "in_progress").length;

    if (totalTasks === 0) return 0;

    // Calculate component scores (matching detail page)
    const taskCompletion = Math.min(100, Math.round((completedTasks / totalTasks) * 100));
    const qualityScore = Math.min(100, Math.round(((completedTasks - overdueTasks * 0.3) / totalTasks) * 100));
    const efficiency = Math.min(100, Math.round(((completedTasks + inProgressTasks * 0.5) / totalTasks) * 100));
    const collaboration = Math.min(100, Math.round(50 + Math.random() * 40));
    const innovation = Math.min(100, Math.round(45 + Math.random() * 45));
    const attendance = Math.min(100, Math.round(80 + Math.random() * 20));

    // Calculate total score with weights (matching detail page)
    const totalScore = Math.round(
      taskCompletion * 0.25 +
      qualityScore * 0.2 +
      efficiency * 0.2 +
      collaboration * 0.15 +
      innovation * 0.1 +
      attendance * 0.1
    );

    return totalScore;
  }, []);

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const monthIndex = months.indexOf(selectedMonth) + 1;

      // 1. Fetch users
      const usersRes = await api.get("/users");
      const users = usersRes.data?.data || [];

      // 2. Fetch tasks
      const tasksRes = await api.get("/tasks");
      const tasks = tasksRes.data?.data || [];

      // 3. Fetch KPI scores if available
      let kpiScores: any[] = [];
      try {
        const kpiRes = await api.get(`/kpi/report/monthly`, {
          params: { month: monthIndex, year: selectedYear }
        });
        if (kpiRes.data.success) {
          kpiScores = kpiRes.data.data?.allScores || [];
          console.log(`✅ Found ${kpiScores.length} KPI scores from API`);
        }
      } catch (e) {
        console.log("No KPI data found, calculating from tasks");
      }

      // 4. Build employee data
      const employeeData: EmployeeKPI[] = users.map((user: any) => {
        // Find KPI score for this user from API
        const kpi = kpiScores.find((k: any) => k.userId?._id === user._id);

        // Get user's tasks
        const userTasks = tasks.filter((t: any) => {
          const assignedTo = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id;
          return assignedTo === user._id;
        });

        const total = userTasks.length;
        const completed = userTasks.filter((t: any) => t.status === "completed").length;

        // PRIORITY 1: Use KPI score from API (if available)
        let score = kpi?.totalScore || 0;

        // PRIORITY 2: Calculate from tasks if no KPI score exists
        if (score === 0 && total > 0) {
          score = calculateKPIFromTasks(userTasks);
          console.log(`📊 Calculated KPI for ${user.fullName}: ${score}% from ${total} tasks`);
        }
        // PRIORITY 3: Default score if no tasks
        else if (score === 0) {
          score = 0;
        }

        const performanceLevel = score >= 85 ? "excellent"
          : score >= 70 ? "good"
            : score >= 55 ? "average"
              : score < 55 && score > 0 ? "needs_improvement"
                : "not_calculated";

        const status = score >= 85 ? "promotion_ready"
          : score >= 70 ? "on_track"
            : score >= 55 ? "training_needed"
              : score < 55 && score > 0 ? "warning_review"
                : "not_calculated";

        const deptName = getDepartmentName(user.departmentId || user.department);

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
      const top = sorted.find(e => e.totalScore > 0) || null;
      const needsAttention = [...sorted].filter(e => e.totalScore > 0).pop() || null;
      const totalTasks = tasks.length;

      setStats({
        deptAvg: avgScore,
        topPerformer: top?.fullName || "N/A",
        topScore: top?.totalScore || 0,
        needsAttention: needsAttention?.fullName || "N/A",
        needsScore: needsAttention?.totalScore || 0,
        tasksDone: totalTasks,
        totalEmployees: totalEmployees,
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, calculateKPIFromTasks]);

  // ============================================================
  // INITIALIZE MONTH
  // ============================================================
  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(currentMonth);
    }
  }, [selectedMonth, currentMonth]);

  // ============================================================
  // FETCH DATA ON MOUNT AND FILTER CHANGE
  // ============================================================
  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth, selectedYear, fetchData]);

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
        `${selectedMonth} ${selectedYear} • ${stats.totalEmployees} Employees`,
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
      doc.text(`Tasks Completed: ${stats.tasksDone}`, 20, statsY + 18);

      const tableData = employees.map((emp) => [
        emp.fullName,
        emp.department,
        getRoleDisplayName(emp.role),
        emp.totalScore > 0 ? `${emp.totalScore}%` : "N/A",
        emp.status.replace(/_/g, " ").toUpperCase(),
        emp.tasksCompleted.toString(),
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      promotion_ready: {
        label: "Promotion ready",
        color: "text-emerald-700",
        bg: "bg-emerald-50/80",
        icon: ArrowUpRight,
      },
      on_track: {
        label: "On track",
        color: "text-blue-700",
        bg: "bg-blue-50/80",
        icon: CheckCircle,
      },
      training_needed: {
        label: "Training needed",
        color: "text-amber-700",
        bg: "bg-amber-50/80",
        icon: AlertCircle,
      },
      warning_review: {
        label: "Warning review",
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

          {/* Top Header Bar with Month buttons & Export */}
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
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
              >
                {years.map((year) => (
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
            </div>
          </div>

          {/* Stats Summary Cards */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">DEPT AVG</span>
                    <BarChart3 size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.deptAvg}%</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TOP PERFORMER</span>
                    <Award size={18} className="text-amber-500" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-gray-900 truncate">{stats.topPerformer}</span>
                    <span className="text-lg font-extrabold text-emerald-600">{stats.topScore}%</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">NEEDS ATTENTION</span>
                    <AlertCircle size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-gray-900 truncate">{stats.needsAttention}</span>
                    <span className="text-lg font-extrabold text-red-500">{stats.needsScore}%</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TASKS DONE</span>
                    <CheckCircle size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold text-gray-900">{stats.tasksDone}</span>
                  </div>
                </div>
              </div>

              {/* Main Employee Score Section */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6">

                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">
                    Employee KPI Scores — {selectedMonth} {selectedYear}
                  </h2>
                  <button
                    onClick={handleExportPDF}
                    disabled={employees.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <FileText size={13} />
                    Export All
                  </button>
                </div>

                {/* Employee Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {employees.map((employee) => {
                    const statusConfig = getStatusConfig(employee.status);
                    const circle = getCircleColor(employee.totalScore);
                    const displayRole = getRoleDisplayName(employee.role);
                    const hasScore = employee.totalScore > 0;

                    return (
                      <div
                        key={employee._id}
                        onClick={() => hasScore && router.push(`/kpi/employee/${employee._id}`)}
                        className={`bg-white rounded-xl border border-gray-200/90 p-5 flex flex-col items-center text-center hover:shadow-md transition relative group justify-between ${hasScore ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
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
                      </div>
                    );
                  })}
                </div>

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