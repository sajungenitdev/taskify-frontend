"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronRight,
  MinusCircle,
  Building2,
  Crown,
  Medal,
  Target,
  AlertCircle,
  Home,
  FileText,
  FileDown,
  ChevronDown,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ResponsiveContainer,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  XAxis,
  YAxis,
  Cell,
  Area,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================================
// TYPES
// ============================================================
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

interface DepartmentAverage {
  department: {
    _id: string;
    name: string;
    code: string;
  };
  averageScore: number;
  employeeCount: number;
  topPerformer: string;
}

interface ReportData {
  period: string;
  totalEmployees: number;
  averageScore: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
  departmentAverages: DepartmentAverage[];
  topPerformers: KPIScore[];
  monthlyTrend: Array<{
    month: string;
    averageScore: number;
    employeeCount: number;
  }>;
  componentAverages: {
    taskCompletion: number;
    qualityScore: number;
    efficiency: number;
    collaboration: number;
    innovation: number;
    attendance: number;
  };
  rawScores: KPIScore[];
}

type ReportType = "monthly" | "quarterly" | "annual" | "department";
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Quarter month mapping
const QUARTER_MONTHS: Record<Quarter, number[]> = {
  "Q1": [0, 1, 2], // Jan-Mar
  "Q2": [3, 4, 5], // Apr-Jun
  "Q3": [6, 7, 8], // Jul-Sep
  "Q4": [9, 10, 11], // Oct-Dec
};

export default function KPIReportsPage() {
  const { hasRole } = useAuth();
  const router = useRouter();

  // State Management
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>("Q1");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [allScores, setAllScores] = useState<KPIScore[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([2024, 2025, 2026, 2027]);

  const canManage = hasRole(["super_admin", "admin", "hr_manager", "dept_manager", "employee"]);
  const isFetching = useRef(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // HELPERS
  // ============================================================
  const getTrendDirection = useCallback((data: any[]) => {
    if (data.length < 2) return "stable";
    const values = data.map(d => d.averageScore);
    const first = values[0] || 0;
    const last = values[values.length - 1] || 0;
    if (last > first * 1.05) return "up";
    if (last < first * 0.95) return "down";
    return "stable";
  }, []);

  const formatPeriod = useCallback((month: string, year: number) => {
    return `${month} ${year}`;
  }, []);

  // ============================================================
  // QUARTERLY DATA AGGREGATION
  // ============================================================
  const aggregateQuarterlyData = useCallback((scores: KPIScore[], quarter: Quarter, year: number): KPIScore[] => {
    const monthIndices = QUARTER_MONTHS[quarter];
    const quarterMonths = monthIndices.map(i => MONTHS[i]);
    
    const quarterScores = scores.filter(score => {
      const scoreMonthIndex = MONTHS.indexOf(score.month);
      return quarterMonths.includes(score.month) && score.year === year;
    });

    // Group by user to average their scores across the quarter
    const userMap = new Map<string, { scores: KPIScore[]; user: any }>();
    
    quarterScores.forEach(score => {
      const userId = score.userId._id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: score.userId,
          scores: []
        });
      }
      userMap.get(userId)!.scores.push(score);
    });

    // Calculate quarterly average for each user
    const averagedScores: KPIScore[] = [];
    userMap.forEach((data, userId) => {
      const userScores = data.scores;
      const avgScore = userScores.reduce((sum, s) => sum + s.totalScore, 0) / userScores.length;
      const avgTaskCompletion = userScores.reduce((sum, s) => sum + s.scores.taskCompletion.score, 0) / userScores.length;
      const avgQuality = userScores.reduce((sum, s) => sum + s.scores.qualityScore.score, 0) / userScores.length;
      const avgEfficiency = userScores.reduce((sum, s) => sum + s.scores.efficiency.score, 0) / userScores.length;
      const avgCollaboration = userScores.reduce((sum, s) => sum + s.scores.collaboration.score, 0) / userScores.length;
      const avgInnovation = userScores.reduce((sum, s) => sum + s.scores.innovation.score, 0) / userScores.length;
      const avgAttendance = userScores.reduce((sum, s) => sum + s.scores.attendance.score, 0) / userScores.length;

      const totalScore = Math.round(avgScore);
      let performanceLevel: "excellent" | "good" | "average" | "needs_improvement" = "average";
      if (totalScore >= 90) performanceLevel = "excellent";
      else if (totalScore >= 75) performanceLevel = "good";
      else if (totalScore >= 60) performanceLevel = "average";
      else performanceLevel = "needs_improvement";

      averagedScores.push({
        _id: `quarterly_${userId}_${quarter}_${year}`,
        userId: data.user,
        departmentId: userScores[0]?.departmentId || { _id: "unknown", name: "Unknown", code: "UNK" },
        month: `${quarter} ${year}`,
        year: year,
        totalScore: totalScore,
        performanceLevel,
        percentile: 0,
        rank: 0,
        totalEmployees: userMap.size,
        scores: {
          taskCompletion: { score: Math.round(avgTaskCompletion), weight: 30, weightedScore: Math.round(avgTaskCompletion * 0.3) },
          qualityScore: { score: Math.round(avgQuality), weight: 25, weightedScore: Math.round(avgQuality * 0.25) },
          efficiency: { score: Math.round(avgEfficiency), weight: 20, weightedScore: Math.round(avgEfficiency * 0.2) },
          collaboration: { score: Math.round(avgCollaboration), weight: 10, weightedScore: Math.round(avgCollaboration * 0.1) },
          innovation: { score: Math.round(avgInnovation), weight: 10, weightedScore: Math.round(avgInnovation * 0.1) },
          attendance: { score: Math.round(avgAttendance), weight: 5, weightedScore: Math.round(avgAttendance * 0.05) },
        },
        calculatedAt: new Date().toISOString(),
      });
    });

    return averagedScores;
  }, []);

  // ============================================================
  // GENERATE MONTHLY TREND DATA
  // ============================================================
  const generateMonthlyTrend = useCallback((scores: KPIScore[], year: number) => {
    const trend: { month: string; averageScore: number; employeeCount: number }[] = [];
    const monthIndices = Array.from({ length: 12 }, (_, i) => i);
    
    // Get the current month index to limit trend to available data
    const currentMonthIndex = new Date().getMonth();
    const monthsToShow = Math.min(6, currentMonthIndex + 1);
    const startIndex = Math.max(0, currentMonthIndex - monthsToShow + 1);
    
    for (let i = startIndex; i <= currentMonthIndex; i++) {
      const monthName = MONTHS[i];
      const monthScores = scores.filter(s => s.month === monthName && s.year === year);
      const avgScore = monthScores.length > 0 
        ? Math.round(monthScores.reduce((sum, s) => sum + s.totalScore, 0) / monthScores.length)
        : 0;
      
      trend.push({
        month: monthName.substring(0, 3),
        averageScore: avgScore,
        employeeCount: monthScores.length,
      });
    }
    
    return trend;
  }, []);

  // ============================================================
  // FETCH REAL DATA FROM BACKEND
  // ============================================================
  const fetchReportData = useCallback(async () => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      let queryParams: any = { year: selectedYear };

      // Handle different report types
      if (reportType === "monthly" || reportType === "department") {
        const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
        queryParams.month = monthIndex;
        
        if (reportType === "department" && selectedDepartment !== "all") {
          queryParams.departmentId = selectedDepartment;
        }
      } else if (reportType === "quarterly") {
        // For quarterly, fetch the last 3 months of the quarter
        const monthIndices = QUARTER_MONTHS[selectedQuarter];
        // We'll fetch the last month of the quarter
        queryParams.month = monthIndices[monthIndices.length - 1] + 1;
      }

      // Fetch from backend
      const response = await api.get("/kpi/report/monthly", { params: queryParams });

      if (response.data.success && response.data.data) {
        const raw = response.data.data;
        let scores: KPIScore[] = (raw.allScores || []).filter((s: any) => s && s.userId !== null);

        // For quarterly reports, aggregate the data
        if (reportType === "quarterly") {
          const monthIndices = QUARTER_MONTHS[selectedQuarter];
          const allQuarterScores: KPIScore[] = [];
          
          // Fetch all 3 months of the quarter
          for (const monthIdx of monthIndices) {
            const monthName = MONTHS[monthIdx];
            const monthScores = scores.filter(s => s.month === monthName && s.year === selectedYear);
            allQuarterScores.push(...monthScores);
          }
          
          scores = aggregateQuarterlyData(allQuarterScores, selectedQuarter, selectedYear);
        }

        // Calculate distributions
        const total = scores.length;
        const avgScore = total > 0 ? Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / total) : 0;

        const distribution = {
          excellent: scores.filter((s) => s.performanceLevel === "excellent").length,
          good: scores.filter((s) => s.performanceLevel === "good").length,
          average: scores.filter((s) => s.performanceLevel === "average").length,
          needs_improvement: scores.filter((s) => s.performanceLevel === "needs_improvement").length,
        };

        // Calculate component averages
        const compTotals = scores.reduce(
          (acc, s) => {
            acc.taskCompletion += s.scores?.taskCompletion?.score || 0;
            acc.qualityScore += s.scores?.qualityScore?.score || 0;
            acc.efficiency += s.scores?.efficiency?.score || 0;
            acc.collaboration += s.scores?.collaboration?.score || 0;
            acc.innovation += s.scores?.innovation?.score || 0;
            acc.attendance += s.scores?.attendance?.score || 0;
            return acc;
          },
          { taskCompletion: 0, qualityScore: 0, efficiency: 0, collaboration: 0, innovation: 0, attendance: 0 }
        );

        const componentAverages = total > 0 ? {
          taskCompletion: Math.round(compTotals.taskCompletion / total),
          qualityScore: Math.round(compTotals.qualityScore / total),
          efficiency: Math.round(compTotals.efficiency / total),
          collaboration: Math.round(compTotals.collaboration / total),
          innovation: Math.round(compTotals.innovation / total),
          attendance: Math.round(compTotals.attendance / total),
        } : { taskCompletion: 0, qualityScore: 0, efficiency: 0, collaboration: 0, innovation: 0, attendance: 0 };

        // Build department averages
        const deptMap = new Map<string, { dept: any; total: number; count: number; topPerformer: string; topScore: number }>();
        scores.forEach((score) => {
          if (!score.departmentId) return;
          const deptId = score.departmentId._id;
          if (!deptMap.has(deptId)) {
            deptMap.set(deptId, {
              dept: score.departmentId,
              total: 0,
              count: 0,
              topPerformer: score.userId.fullName,
              topScore: score.totalScore,
            });
          }
          const dept = deptMap.get(deptId)!;
          dept.total += score.totalScore;
          dept.count++;
          if (score.totalScore > dept.topScore) {
            dept.topScore = score.totalScore;
            dept.topPerformer = score.userId.fullName;
          }
        });

        const departmentAverages: DepartmentAverage[] = Array.from(deptMap.entries()).map(([id, data]) => ({
          department: data.dept,
          averageScore: data.count > 0 ? Math.round(data.total / data.count) : 0,
          employeeCount: data.count,
          topPerformer: data.topPerformer,
        }));

        // Sort scores for ranking
        const sortedScores = [...scores].sort((a, b) => b.totalScore - a.totalScore);
        sortedScores.forEach((score, index) => {
          score.rank = index + 1;
          score.percentile = sortedScores.length > 0 ? Math.round(((sortedScores.length - index) / sortedScores.length) * 100) : 0;
        });

        // Set departments list
        const deptNames = departmentAverages.map(d => d.department.name);
        setDepartments(deptNames);

        // Generate monthly trend data
        const trendData = generateMonthlyTrend(scores, selectedYear);

        // Set report data
        const period = reportType === "quarterly" 
          ? `${selectedQuarter} ${selectedYear}`
          : reportType === "department" && selectedDepartment !== "all"
          ? `${selectedDepartment} - ${selectedMonth} ${selectedYear}`
          : `${selectedMonth} ${selectedYear}`;

        setAllScores(sortedScores);
        setReportData({
          period,
          totalEmployees: total,
          averageScore: avgScore,
          distribution,
          departmentAverages,
          topPerformers: sortedScores.slice(0, 5),
          monthlyTrend: trendData.length > 0 ? trendData : [{ month: selectedMonth.substring(0, 3), averageScore: avgScore, employeeCount: total }],
          componentAverages,
          rawScores: sortedScores,
        });
      } else {
        throw new Error(response.data.message || "Failed to retrieve report data");
      }
    } catch (err: any) {
      console.error("Error fetching report analytics:", err);
      setError(err.response?.data?.message || "Failed to fetch operational report data from server.");
      toast.error("Failed to load KPI reports");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [reportType, selectedMonth, selectedYear, selectedQuarter, selectedDepartment, aggregateQuarterlyData, generateMonthlyTrend]);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    if (canManage) {
      fetchReportData();
    }
  }, [canManage, fetchReportData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================
  // EXPORT FUNCTIONS
  // ============================================================
  const handleExportCSV = useCallback(() => {
    if (!reportData) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["Rank", "Employee", "Department", "Total Score", "Performance Level", "Percentile"];
      const rows = allScores.map((s) => [
        s.rank || "N/A",
        `"${s.userId?.fullName || "N/A"}"`,
        `"${s.departmentId?.name || "N/A"}"`,
        s.totalScore.toFixed(1),
        s.performanceLevel.replace("_", " "),
        `${s.percentile || 0}%`,
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `KPI_Report_${reportData.period.replace(/\s+/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV report exported successfully");
    } catch (err) {
      toast.error("Failed to export CSV file");
    }
  }, [reportData, allScores]);

  const exportToPDF = useCallback(() => {
    if (!reportData) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating professional PDF report...");

    try {
      setExportLoading(true);
      const doc = new jsPDF("l", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      const primaryColor: [number, number, number] = [79, 70, 229];
      const textDark: [number, number, number] = [30, 41, 59];
      const textMuted: [number, number, number] = [100, 116, 139];

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Executive KPI Performance Report", margin, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(224, 231, 255);
      doc.text(`Period: ${reportData.period} • Enterprise Analytics Unit`, margin, 21);

      // Summary Cards
      let yPos = 38;
      const totalCards = 4;
      const cardGap = 6;
      const usableWidth = pageWidth - margin * 2;
      const cardWidth = (usableWidth - cardGap * (totalCards - 1)) / totalCards;
      const cardHeight = 22;

      const cards = [
        { label: "Total Workforce", val: String(reportData.totalEmployees) },
        { label: "Unit Average", val: `${reportData.averageScore}%` },
        { label: "Elite Performers", val: String(reportData.distribution.excellent) },
        { label: "Needs Support", val: String(reportData.distribution.needs_improvement) },
      ];

      cards.forEach((c, idx) => {
        const x = margin + idx * (cardWidth + cardGap);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...textMuted);
        doc.text(c.label.toUpperCase(), x + cardWidth / 2, yPos + 7, { align: "center" });
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text(c.val, x + cardWidth / 2, yPos + 16, { align: "center" });
      });

      yPos += cardHeight + 12;

      // Department breakdown
      if (reportData.departmentAverages?.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...textDark);
        doc.text("Department Performance Breakdown", margin, yPos);

        const deptRows = reportData.departmentAverages.map((d) => [
          d.department.name,
          `${d.averageScore}%`,
          String(d.employeeCount),
          d.topPerformer || "N/A",
        ]);

        autoTable(doc, {
          startY: yPos + 4,
          head: [["Department Name", "Average Score", "Staff Headcount", "Top Performer"]],
          body: deptRows,
          theme: "striped",
          headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 8.5, textColor: textDark },
          margin: { left: margin, right: margin },
        });
      }

      // Top Performers
      yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 40;
      
      if (reportData.topPerformers.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...textDark);
        doc.text("Top Performers", margin, yPos);

        const performerRows = reportData.topPerformers.slice(0, 5).map((s) => [
          `${s.rank || "N/A"}`,
          s.userId.fullName,
          s.departmentId.name,
          `${s.totalScore}%`,
          s.performanceLevel.replace("_", " "),
        ]);

        autoTable(doc, {
          startY: yPos + 4,
          head: [["Rank", "Employee Name", "Department", "Score", "Level"]],
          body: performerRows,
          theme: "striped",
          headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9, fontStyle: "bold" },
          bodyStyles: { fontSize: 8.5, textColor: textDark },
          margin: { left: margin, right: margin },
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.text("Confidential • Enterprise Management Information System", margin, pageHeight - 6);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
      }

      doc.save(`KPI_Report_${reportData.period.replace(/\s+/g, "_")}.pdf`);
      toast.success("PDF exported successfully!", { id: toastId });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF document", { id: toastId });
    } finally {
      setExportLoading(false);
    }
  }, [reportData]);

  // ============================================================
  // RENDER
  // ============================================================
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
          <p className="text-slate-500 text-sm mb-6">You lack administrative clearance to view analytics reports.</p>
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
          <span className="text-slate-700">KPI Reports</span>
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Executive KPI Reports</h1>
                <p className="text-slate-500 text-sm font-medium">Comprehensive analytics, trend evaluations, and departmental distribution matrices.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!reportData || exportLoading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-40"
              >
                {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                Export Report <ChevronDown size={13} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
                  <button
                    onClick={() => { handleExportCSV(); setShowExportMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileText size={14} className="text-indigo-600" /> Export as CSV
                  </button>
                  <button
                    onClick={() => { exportToPDF(); setShowExportMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileDown size={14} className="text-rose-600" /> Export as PDF
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={fetchReportData}
              disabled={loading}
              title="Refresh Analytics"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Report Type Selector */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs max-w-lg">
          {[
            { type: "monthly", label: "Monthly" },
            { type: "quarterly", label: "Quarterly" },
            { type: "department", label: "Department" },
          ].map((tab) => (
            <button
              key={tab.type}
              onClick={() => setReportType(tab.type as ReportType)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${reportType === tab.type ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center gap-4">
          {(reportType === "monthly" || reportType === "department") && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Month Period</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === "quarterly" && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Quarter Period</label>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value as Quarter)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="Q1">Q1 (Jan - Mar)</option>
                <option value="Q2">Q2 (Apr - Jun)</option>
                <option value="Q3">Q3 (Jul - Sep)</option>
                <option value="Q4">Q4 (Oct - Dec)</option>
              </select>
            </div>
          )}

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Fiscal Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {reportType === "department" && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Division</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="all">All Divisions</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          <div className="self-end">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {loading && <Loader2 size={14} className="animate-spin" />} Generate Analytics
            </button>
          </div>
        </div>

        {/* Report Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-400">Synthesizing live performance metrics...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-rose-800 space-y-2 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <h3 className="font-bold text-sm">Analytics Sync Error</h3>
            <p className="text-xs">{error}</p>
          </div>
        ) : reportData ? (
          <div className="space-y-8">

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Workforce", val: reportData.totalEmployees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Unit Average Score", val: `${reportData.averageScore}%`, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Elite Performers", val: reportData.distribution.excellent, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Needs Support", val: reportData.distribution.needs_improvement, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Distribution Chart */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" /> Tier Distribution Matrix
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={[
                        { name: "Excellent", value: reportData.distribution.excellent || 0, fill: "#10b981" },
                        { name: "Good", value: reportData.distribution.good || 0, fill: "#3b82f6" },
                        { name: "Average", value: reportData.distribution.average || 0, fill: "#f59e0b" },
                        { name: "Needs Work", value: reportData.distribution.needs_improvement || 0, fill: "#ef4444" },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                        contentStyle={{
                          backgroundColor: "white",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {[
                          { fill: "#10b981" },
                          { fill: "#3b82f6" },
                          { fill: "#f59e0b" },
                          { fill: "#ef4444" },
                        ].map((entry, index) => (
                          <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Component Averages */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Target size={16} className="text-indigo-600" /> Evaluation Parameter Breakdowns
                </h3>
                <div className="space-y-3.5 pt-2">
                  {Object.entries(reportData.componentAverages).map(([key, val]) => {
                    const labels: Record<string, string> = {
                      taskCompletion: "Task Completion", qualityScore: "Quality Score",
                      efficiency: "Efficiency", collaboration: "Collaboration",
                      innovation: "Innovation", attendance: "Attendance",
                    };
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{labels[key] || key}</span>
                          <span className="text-indigo-600">{val}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Trend Chart */}
            {reportData.monthlyTrend?.length > 1 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" /> Longitudinal Performance Trend
                  </h3>
                  <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getTrendDirection(reportData.monthlyTrend) === "up" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                    getTrendDirection(reportData.monthlyTrend) === "down" ? "bg-rose-50 text-rose-700 border-rose-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    Trend: {getTrendDirection(reportData.monthlyTrend).toUpperCase()}
                  </span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={reportData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }} formatter={(v: any) => `${v}%`} />
                      <Area type="monotone" dataKey="averageScore" name="Average Score" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.15} strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Performers Table */}
            {reportData.topPerformers.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award size={16} className="text-amber-500" /> Top Performers
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.topPerformers.map((performer) => (
                        <tr key={performer._id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-bold text-slate-700">#{performer.rank}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{performer.userId.fullName}</td>
                          <td className="px-4 py-3 text-slate-600">{performer.departmentId.name}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{performer.totalScore}%</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${performer.performanceLevel === "excellent" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              performer.performanceLevel === "good" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              performer.performanceLevel === "average" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {performer.performanceLevel.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : null}

      </div>
    </div>
  );
}