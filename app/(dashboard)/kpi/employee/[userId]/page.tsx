// app/(dashboard)/kpi/employee/[userId]/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  ChevronRight,
  Home,
  Award,
  Crown,
  Medal,
  AlertCircle,
  Star,
  Target,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Mail,
  Phone,
  Briefcase,
  Building2,
  MapPin,
  Users,
  CheckCheck,
  Hourglass,
  Flame,
  Zap,
  Sparkles,
  ExternalLink,
  FileText,
  Printer,
  Share2,
  FileSpreadsheet,
  FileDown,
  Settings,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Area,
} from "recharts";

// Import PDF libraries
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EmployeeKPI {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    role: string;
    departmentId: { _id: string; name: string; code: string };
    avatar?: string;
    phone?: string;
    position?: string;
    location?: string;
    bio?: string;
  };
  month: string;
  year: number;
  totalScore: number;
  performanceLevel: string;
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
  comments: string;
  calculatedAt: string;
}

interface TrendData {
  month: string;
  totalScore: number;
  performanceLevel: string;
  components: {
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
  completionRate: number;
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
}

export default function EmployeeKPIDetailPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [employee, setEmployee] = useState<EmployeeKPI | null>(null);
  const [allKPIScores, setAllKPIScores] = useState<EmployeeKPI[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "history">(
    "overview",
  );
  const [exporting, setExporting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

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

  // Auto-load data when userId, month, or year changes
  useEffect(() => {
    if (userId && selectedMonth && selectedYear) {
      loadAllData();
    }
  }, [userId, selectedMonth, selectedYear]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      setDataLoaded(false);

      // Load all data in parallel
      const [employeeResult, allScoresResult, trendResult, taskResult] =
        await Promise.all([
          fetchEmployeeKPI(),
          fetchAllKPIScores(),
          fetchTrendData(),
          fetchTaskStats(),
        ]);

      // Check if we have any data
      const hasData =
        employeeResult ||
        allScoresResult?.length > 0 ||
        trendResult?.length > 0;

      if (!hasData) {
        // Try to find data from the user's KPI history
        const fallbackData = await tryFindFallbackData();
        if (fallbackData) {
          setEmployee(fallbackData);
          setDataLoaded(true);
          toast.success("Showing latest available KPI data");
          return;
        }

        // If still no data, show the empty state
        setError("No KPI data found for this employee");
        setDataLoaded(false);
        return;
      }

      setDataLoaded(true);
    } catch (error: any) {
      console.error("Error loading data:", error);
      setError(error.response?.data?.message || "Failed to load data");
      setDataLoaded(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeKPI = async () => {
    try {
      const monthIndex = months.indexOf(selectedMonth) + 1;
      const response = await api.get(`/kpi/employee/${userId}`, {
        params: {
          month: monthIndex,
          year: selectedYear,
        },
      });
      if (response.data.success) {
        const data = response.data.data || [];
        const employeeData = data[0] || null;
        setEmployee(employeeData);
        return employeeData;
      }
      return null;
    } catch (error: any) {
      console.error("Error fetching employee KPI:", error);
      return null;
    }
  };

  const fetchAllKPIScores = async () => {
    try {
      const response = await api.get(`/kpi/employee/${userId}`);
      if (response.data.success) {
        const data = response.data.data || [];
        setAllKPIScores(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching all KPI scores:", error);
      return [];
    }
  };

  const fetchTrendData = async () => {
    try {
      setTrendLoading(true);
      const response = await api.get(`/kpi/employee/${userId}/trend`, {
        params: { months: 12 },
      });
      if (response.data.success) {
        const data = response.data.data || [];
        setTrendData(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching trend data:", error);
      return [];
    } finally {
      setTrendLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      setTaskLoading(true);
      const response = await api.get(`/tasks/my-tasks?assignedTo=${userId}`);
      if (response.data.success) {
        const tasks = response.data.data || [];
        const stats = {
          total: tasks.length,
          completed: tasks.filter((t: any) => t.status === "completed").length,
          inProgress: tasks.filter((t: any) => t.status === "in_progress")
            .length,
          pending: tasks.filter((t: any) => t.status === "pending").length,
          overdue: tasks.filter((t: any) => t.status === "overdue").length,
          rejected: tasks.filter((t: any) => t.status === "rejected").length,
          submitted: tasks.filter((t: any) => t.status === "submitted").length,
          completionRate:
            tasks.length > 0
              ? Math.round(
                  (tasks.filter((t: any) => t.status === "completed").length /
                    tasks.length) *
                    100,
                )
              : 0,
          byPriority: {
            low: tasks.filter((t: any) => t.priority === "low").length,
            normal: tasks.filter((t: any) => t.priority === "normal").length,
            high: tasks.filter((t: any) => t.priority === "high").length,
            urgent: tasks.filter((t: any) => t.priority === "urgent").length,
          },
        };
        setTaskStats(stats);
        return stats;
      }
      return null;
    } catch (error) {
      console.error("Error fetching task stats:", error);
      return null;
    } finally {
      setTaskLoading(false);
    }
  };

  const tryFindFallbackData = async () => {
    try {
      // Try to get all KPI scores for this user
      const response = await api.get(`/kpi/employee/${userId}`);
      if (response.data.success) {
        const allData = response.data.data || [];
        if (allData.length > 0) {
          // Use the most recent data
          const latestData = allData[0];
          // Update the selected month/year to match the found data
          setSelectedMonth(latestData.month);
          setSelectedYear(latestData.year);
          return latestData;
        }
      }
      return null;
    } catch (error) {
      console.error("Error finding fallback data:", error);
      return null;
    }
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
        gradient: "from-emerald-400 to-emerald-600",
      },
      good: {
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Award,
        label: "Good",
        emoji: "⭐",
        gradient: "from-blue-400 to-blue-600",
      },
      average: {
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Medal,
        label: "Average",
        emoji: "📊",
        gradient: "from-amber-400 to-amber-600",
      },
      needs_improvement: {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: AlertCircle,
        label: "Needs Improvement",
        emoji: "📈",
        gradient: "from-red-400 to-red-600",
      },
    };
    return config[level as keyof typeof config] || config.average;
  };

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // PDF EXPORT FUNCTION
  // ============================================================
  const handleExportPDF = async () => {
    if (!employee) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");

    try {
      setExporting(true);

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Theme Colors
      const primaryColor: [number, number, number] = [99, 102, 241];
      const textColor: [number, number, number] = [31, 41, 55];
      const textLight: [number, number, number] = [107, 114, 128];
      const cardBg: [number, number, number] = [248, 250, 252];

      let yPosition = 0;

      const checkPageOverflow = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // ===== 1. HEADER SECTION =====
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("KPI Performance Report", margin, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Enterprise Task Management System", margin, 28);

      yPosition = 45;

      // ===== 2. EMPLOYEE DETAILS =====
      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(
        employee.userId.fullName || "Employee Report",
        margin,
        yPosition,
      );

      yPosition += 8;

      const details = [
        ["Employee ID", employee.userId.employeeId || "N/A"],
        ["Email", employee.userId.email || "N/A"],
        ["Department", employee.userId.departmentId?.name || "N/A"],
        ["Role", employee.userId.role?.replace(/_/g, " ") || "N/A"],
        ["Position", (employee.userId as any).position || "N/A"],
        ["Period", `${selectedMonth} ${selectedYear}`],
        ["Report Date", new Date().toLocaleDateString()],
      ];

      doc.setFontSize(9);
      details.forEach(([label, value], index) => {
        const isRightCol = index >= 4;
        const x = isRightCol ? margin + contentWidth / 2 : margin;
        const y = yPosition + (index % 4) * 6;

        doc.setTextColor(...textLight);
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, x, y);

        doc.setTextColor(...textColor);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), x + 30, y);
      });

      yPosition += 28;

      // ===== 3. SCORE CARDS SUMMARY =====
      checkPageOverflow(35);

      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Performance Summary", margin, yPosition);
      yPosition += 6;

      const perfConfig = getPerformanceConfig(employee.performanceLevel);
      const scoreCards = [
        {
          label: "Total Score",
          value: `${formatScore(employee.totalScore)}%`,
          color:
            employee.totalScore >= 90
              ? "#10b981"
              : employee.totalScore >= 75
                ? "#3b82f6"
                : employee.totalScore >= 60
                  ? "#f59e0b"
                  : "#ef4444",
        },
        {
          label: "Performance Level",
          value: perfConfig.label,
          color: "#6366f1",
        },
        {
          label: "Rank",
          value: `#${employee.rank} / ${employee.totalEmployees}`,
          color: "#6366f1",
        },
        {
          label: "Percentile",
          value: `${employee.percentile}%`,
          color: "#6366f1",
        },
      ];

      const cardGap = 4;
      const cardWidth =
        (contentWidth - cardGap * (scoreCards.length - 1)) / scoreCards.length;
      const cardHeight = 22;

      scoreCards.forEach((card, index) => {
        const x = margin + index * (cardWidth + cardGap);
        doc.setFillColor(...cardBg);
        doc.roundedRect(x, yPosition, cardWidth, cardHeight, 2, 2, "F");
        doc.setTextColor(card.color);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(String(card.value), x + cardWidth / 2, yPosition + 10, {
          align: "center",
        });
        doc.setTextColor(...textLight);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(card.label, x + cardWidth / 2, yPosition + 17, {
          align: "center",
        });
      });

      yPosition += cardHeight + 10;

      // ===== 4. COMPONENT SCORES TABLE =====
      checkPageOverflow(40);

      const componentLabels: Record<string, string> = {
        taskCompletion: "Task Completion",
        qualityScore: "Quality Score",
        efficiency: "Efficiency",
        collaboration: "Collaboration",
        innovation: "Innovation",
        attendance: "Attendance",
      };

      const componentData = Object.entries(employee.scores || {}).map(
        ([key, value]: [string, any]) => [
          componentLabels[key] || key,
          `${formatScore(value.score)}%`,
          `${value.weight}%`,
          `${formatScore(value.weightedScore)}%`,
        ],
      );

      autoTable(doc, {
        head: [["Component", "Score", "Weight", "Weighted Score"]],
        body: componentData,
        startY: yPosition,
        theme: "striped",
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 8, textColor },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { halign: "center" },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // ===== 5. TASK STATISTICS =====
      if (taskStats) {
        checkPageOverflow(40);

        const taskData = [
          ["Total Tasks", String(taskStats.total)],
          ["Completed", String(taskStats.completed)],
          ["In Progress", String(taskStats.inProgress)],
          ["Pending", String(taskStats.pending)],
          ["Overdue", String(taskStats.overdue)],
          ["Completion Rate", `${taskStats.completionRate}%`],
        ];

        autoTable(doc, {
          head: [["Metric", "Value"]],
          body: taskData,
          startY: yPosition,
          theme: "striped",
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8, textColor },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: "center" },
          },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // ===== 6. KPI HISTORY =====
      if (allKPIScores && allKPIScores.length > 0) {
        checkPageOverflow(40);

        const historyData = allKPIScores
          .slice(0, 10)
          .map((score: any) => [
            `${score.month} ${score.year}`,
            `${formatScore(score.totalScore)}%`,
            getPerformanceConfig(score.performanceLevel).label,
            `#${score.rank}`,
            `${score.percentile}%`,
          ]);

        autoTable(doc, {
          head: [["Period", "Score", "Level", "Rank", "Percentile"]],
          body: historyData,
          startY: yPosition,
          theme: "striped",
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8, textColor },
          columnStyles: {
            0: { halign: "left" },
            1: { halign: "center" },
            2: { halign: "center" },
            3: { halign: "center" },
            4: { halign: "center" },
          },
          margin: { left: margin, right: margin },
        });
      }

      // ===== 7. PAGE FOOTERS =====
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setTextColor(...textLight);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated on ${new Date().toLocaleString()}`,
          margin,
          pageHeight - 8,
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 8,
          { align: "right" },
        );
      }

      const cleanFileName = (employee.userId.fullName || "Employee").replace(
        /[^a-zA-Z0-0]/g,
        "_",
      );
      doc.save(
        `KPI_Report_${cleanFileName}_${selectedMonth}_${selectedYear}.pdf`,
      );

      toast.success("PDF downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // CSV EXPORT
  // ============================================================
  const handleExportCSV = () => {
    if (!employee) return;

    const headers = ["Metric", "Value", "Score", "Weight", "Weighted Score"];
    const rows = [
      ["Employee", employee.userId.fullName, "", "", ""],
      ["Email", employee.userId.email, "", "", ""],
      ["Department", employee.userId.departmentId?.name || "N/A", "", "", ""],
      ["Period", `${selectedMonth} ${selectedYear}`, "", "", ""],
      ["Total Score", "", formatScore(employee.totalScore), "", ""],
      ["Performance Level", employee.performanceLevel, "", "", ""],
      ["Rank", `#${employee.rank} of ${employee.totalEmployees}`, "", "", ""],
      ["Percentile", `${employee.percentile}%`, "", "", ""],
      ["", "", "", "", ""],
      ["Component", "Score", "Weight", "Weighted Score", ""],
      [
        "Task Completion",
        formatScore(employee.scores.taskCompletion.score),
        `${employee.scores.taskCompletion.weight}%`,
        formatScore(employee.scores.taskCompletion.weightedScore),
        "",
      ],
      [
        "Quality Score",
        formatScore(employee.scores.qualityScore.score),
        `${employee.scores.qualityScore.weight}%`,
        formatScore(employee.scores.qualityScore.weightedScore),
        "",
      ],
      [
        "Efficiency",
        formatScore(employee.scores.efficiency.score),
        `${employee.scores.efficiency.weight}%`,
        formatScore(employee.scores.efficiency.weightedScore),
        "",
      ],
      [
        "Collaboration",
        formatScore(employee.scores.collaboration.score),
        `${employee.scores.collaboration.weight}%`,
        formatScore(employee.scores.collaboration.weightedScore),
        "",
      ],
      [
        "Innovation",
        formatScore(employee.scores.innovation.score),
        `${employee.scores.innovation.weight}%`,
        formatScore(employee.scores.innovation.weightedScore),
        "",
      ],
      [
        "Attendance",
        formatScore(employee.scores.attendance.score),
        `${employee.scores.attendance.weight}%`,
        formatScore(employee.scores.attendance.weightedScore),
        "",
      ],
    ];

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Employee_KPI_${employee.userId.fullName}_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  // Radar chart data
  const radarData = employee
    ? [
        {
          subject: "Task Completion",
          value: employee.scores.taskCompletion.score,
          fullMark: 100,
        },
        {
          subject: "Quality",
          value: employee.scores.qualityScore.score,
          fullMark: 100,
        },
        {
          subject: "Efficiency",
          value: employee.scores.efficiency.score,
          fullMark: 100,
        },
        {
          subject: "Collaboration",
          value: employee.scores.collaboration.score,
          fullMark: 100,
        },
        {
          subject: "Innovation",
          value: employee.scores.innovation.score,
          fullMark: 100,
        },
        {
          subject: "Attendance",
          value: employee.scores.attendance.score,
          fullMark: 100,
        },
      ]
    : [];

  const componentColors = {
    taskCompletion: "#10b981",
    qualityScore: "#3b82f6",
    efficiency: "#8b5cf6",
    collaboration: "#f59e0b",
    innovation: "#ec4899",
    attendance: "#14b8a6",
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-rose-500" />
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
        <div className="max-w-375 mx-auto">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm mb-6"
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
              href="/kpi/dashboard"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              KPI Dashboard
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">Employee Details</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/kpi/dashboard")}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                      Employee KPI Details
                    </h1>
                    {employee && (
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">
                          {employee.userId.fullName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {employee.userId.email}
                        </span>
                        <span className="text-xs text-gray-400">
                          ID: {employee.userId.employeeId}
                        </span>
                        <span className="text-xs text-gray-400">
                          {employee.userId.departmentId?.name ||
                            "No Department"}
                        </span>
                        {employee.userId.role && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {employee.userId.role.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
                onClick={handleExportPDF}
                disabled={!employee || exporting}
                className="px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileDown size={16} />
                )}
                {exporting ? "Generating..." : "PDF"}
              </button>

              <button
                onClick={handleExportCSV}
                disabled={!employee}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                CSV
              </button>

              <button
                onClick={() => loadAllData()}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
                </div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">
                  Loading employee data...
                </p>
              </div>
            </div>
          ) : error && !employee ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Data Found
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">{error}</p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <button
                  onClick={() => loadAllData()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm flex items-center gap-2"
                >
                  <RefreshCw size={16} className="inline" />
                  Retry
                </button>
                <Link
                  href={`/kpi/employee/${userId}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm flex items-center gap-2"
                >
                  <Calendar size={16} />
                  Check Latest
                </Link>
                <Link
                  href="/kpi/management"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition shadow-sm flex items-center gap-2"
                >
                  <Settings size={16} />
                  Configure KPI
                </Link>
              </div>
            </div>
          ) : employee ? (
            <div className="space-y-6">
              {/* Score Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-sm text-gray-500">Total Score</p>
                  <p
                    className={`text-3xl font-bold ${
                      employee.totalScore >= 90
                        ? "text-emerald-600"
                        : employee.totalScore >= 75
                          ? "text-blue-600"
                          : employee.totalScore >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                    }`}
                  >
                    {formatScore(employee.totalScore)}%
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-sm text-gray-500">Performance Level</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">
                      {getPerformanceConfig(employee.performanceLevel).emoji}
                    </span>
                    <span className="text-lg text-amber-600 font-semibold">
                      {getPerformanceConfig(employee.performanceLevel).label}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-sm text-gray-500">Rank</p>
                  <p className="text-2xl font-bold text-gray-800">
                    #{employee.rank} of {employee.totalEmployees}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                  <p className="text-sm text-gray-500">Percentile</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {employee.percentile}%
                  </p>
                </div>
              </motion.div>

              {/* Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex border-b border-gray-200 bg-white rounded-t-xl px-4"
              >
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-3 text-sm font-medium transition relative ${
                    activeTab === "overview"
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart3 size={16} className="inline mr-2" />
                  Overview
                  {activeTab === "overview" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`px-4 py-3 text-sm font-medium transition relative ${
                    activeTab === "tasks"
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <CheckCircle size={16} className="inline mr-2" />
                  Tasks ({taskStats?.total || 0})
                  {activeTab === "tasks" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-3 text-sm font-medium transition relative ${
                    activeTab === "history"
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <TrendingUp size={16} className="inline mr-2" />
                  History
                  {activeTab === "history" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
              </motion.div>

              {/* Tab Content */}
              <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 p-6 shadow-sm">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* User Profile */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <User size={16} className="text-indigo-500" />
                        Employee Profile
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="text-sm font-medium text-gray-800">
                            {employee.userId.fullName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <div className="flex items-center gap-1">
                            <Mail size={12} className="text-gray-400" />
                            <p className="text-sm font-medium text-gray-800">
                              {employee.userId.email}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Employee ID</p>
                          <p className="text-sm font-medium text-gray-800">
                            {employee.userId.employeeId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-medium text-gray-800">
                            {employee.userId.departmentId?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Role</p>
                          <p className="text-sm font-medium text-gray-800">
                            {employee.userId.role?.replace(/_/g, " ") || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Position</p>
                          <p className="text-sm font-medium text-gray-800">
                            {(employee.userId as any).position || "N/A"}
                          </p>
                        </div>
                        {(employee.userId as any).phone && (
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <div className="flex items-center gap-1">
                              <Phone size={12} className="text-gray-400" />
                              <p className="text-sm font-medium text-gray-800">
                                {(employee.userId as any).phone}
                              </p>
                            </div>
                          </div>
                        )}
                        {(employee.userId as any).location && (
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <div className="flex items-center gap-1">
                              <MapPin size={12} className="text-gray-400" />
                              <p className="text-sm font-medium text-gray-800">
                                {(employee.userId as any).location}
                              </p>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Calculated</p>
                          <p className="text-sm font-medium text-gray-800">
                            {formatDate(employee.calculatedAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Period</p>
                          <p className="text-sm font-medium text-gray-800">
                            {selectedMonth} {selectedYear}
                          </p>
                        </div>
                      </div>
                      {(employee.userId as any).bio && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Bio</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {(employee.userId as any).bio}
                          </p>
                        </div>
                      )}
                      {employee.comments && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">Comments</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {employee.comments}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Radar Chart & Component Scores */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          Component Scores Radar
                        </h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart
                              cx="50%"
                              cy="50%"
                              outerRadius="70%"
                              data={radarData}
                            >
                              <PolarGrid />
                              <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fontSize: 10 }}
                              />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              <Radar
                                name="Score"
                                dataKey="value"
                                stroke="#6366f1"
                                fill="#818cf8"
                                fillOpacity={0.6}
                              />
                              <Tooltip formatter={(value) => `${value}%`} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(employee.scores).map(([key, value]) => {
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
                              className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">
                                    {labels[key as keyof typeof labels] || key}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Weight: {value.weight}%
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-800">
                                    {formatScore(value.score)}%
                                  </p>
                                  <p className="text-xs text-indigo-600">
                                    Weighted: {formatScore(value.weightedScore)}
                                    %
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{
                                    width: `${value.score}%`,
                                    backgroundColor:
                                      componentColors[
                                        key as keyof typeof componentColors
                                      ] || "#6366f1",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "tasks" && (
                  <div className="space-y-6">
                    {taskLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                      </div>
                    ) : taskStats ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-2xl font-bold text-gray-800">
                              {taskStats.total}
                            </p>
                            <p className="text-xs text-gray-500">Total Tasks</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 border border-emerald-200">
                            <p className="text-2xl font-bold text-emerald-600">
                              {taskStats.completed}
                            </p>
                            <p className="text-xs text-gray-500">Completed</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 border border-amber-200">
                            <p className="text-2xl font-bold text-amber-600">
                              {taskStats.inProgress}
                            </p>
                            <p className="text-xs text-gray-500">In Progress</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-4 border border-rose-200">
                            <p
                              className={`text-2xl font-bold ${
                                taskStats.completionRate >= 80
                                  ? "text-emerald-600"
                                  : taskStats.completionRate >= 50
                                    ? "text-amber-600"
                                    : "text-rose-600"
                              }`}
                            >
                              {taskStats.completionRate}%
                            </p>
                            <p className="text-xs text-gray-500">
                              Completion Rate
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                              Task Status Breakdown
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Pending
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                  {taskStats.pending}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-amber-500"
                                  style={{
                                    width: `${taskStats.total > 0 ? (taskStats.pending / taskStats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  In Progress
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                  {taskStats.inProgress}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{
                                    width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Submitted
                                </span>
                                <span className="text-sm font-medium text-gray-800">
                                  {taskStats.submitted}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-purple-500"
                                  style={{
                                    width: `${taskStats.total > 0 ? (taskStats.submitted / taskStats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Completed
                                </span>
                                <span className="text-sm font-medium text-emerald-600">
                                  {taskStats.completed}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-emerald-500"
                                  style={{
                                    width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Overdue
                                </span>
                                <span className="text-sm font-medium text-rose-600">
                                  {taskStats.overdue}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-rose-500"
                                  style={{
                                    width: `${taskStats.total > 0 ? (taskStats.overdue / taskStats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Rejected
                                </span>
                                <span className="text-sm font-medium text-gray-500">
                                  {taskStats.rejected}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-gray-500"
                                  style={{
                                    width: `${taskStats.total > 0 ? (taskStats.rejected / taskStats.total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                              Priority Distribution
                            </h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Low
                                </span>
                                <span className="text-sm font-medium text-emerald-600">
                                  {taskStats.byPriority.low}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Normal
                                </span>
                                <span className="text-sm font-medium text-blue-600">
                                  {taskStats.byPriority.normal}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  High
                                </span>
                                <span className="text-sm font-medium text-amber-600">
                                  {taskStats.byPriority.high}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Urgent
                                </span>
                                <span className="text-sm font-medium text-rose-600">
                                  {taskStats.byPriority.urgent}
                                </span>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      {
                                        name: "Low",
                                        value: taskStats.byPriority.low,
                                      },
                                      {
                                        name: "Normal",
                                        value: taskStats.byPriority.normal,
                                      },
                                      {
                                        name: "High",
                                        value: taskStats.byPriority.high,
                                      },
                                      {
                                        name: "Urgent",
                                        value: taskStats.byPriority.urgent,
                                      },
                                    ]}
                                  >
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#f0f0f0"
                                    />
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 10 }}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                      <Cell fill="#10b981" />
                                      <Cell fill="#3b82f6" />
                                      <Cell fill="#f59e0b" />
                                      <Cell fill="#ef4444" />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No task data available
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" />
                        KPI History
                      </h3>
                      {allKPIScores.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-xs text-gray-500 border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-medium">
                                  Month
                                </th>
                                <th className="text-left py-2 px-3 font-medium">
                                  Score
                                </th>
                                <th className="text-left py-2 px-3 font-medium">
                                  Level
                                </th>
                                <th className="text-left py-2 px-3 font-medium">
                                  Rank
                                </th>
                                <th className="text-left py-2 px-3 font-medium">
                                  Percentile
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {allKPIScores.map((score) => {
                                const perfConfig = getPerformanceConfig(
                                  score.performanceLevel,
                                );
                                return (
                                  <tr
                                    key={score._id}
                                    className="hover:bg-gray-50 transition"
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-800">
                                      {score.month} {score.year}
                                    </td>
                                    <td className="py-2 px-3 text-sm font-bold text-gray-800">
                                      {formatScore(score.totalScore)}%
                                    </td>
                                    <td className="py-2 px-3">
                                      <span
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}
                                      >
                                        {perfConfig.emoji} {perfConfig.label}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-sm text-gray-600">
                                      #{score.rank} of {score.totalEmployees}
                                    </td>
                                    <td className="py-2 px-3 text-sm text-gray-600">
                                      {score.percentile}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          No historical data available
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <LineChart size={16} className="text-indigo-500" />
                        Performance Trend
                      </h3>
                      {trendLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        </div>
                      ) : trendData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#f0f0f0"
                              />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fontSize: 11 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                }}
                                formatter={(value: any) => `${value}%`}
                              />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="totalScore"
                                name="Total Score"
                                stroke="#6366f1"
                                fill="#818cf8"
                                fillOpacity={0.2}
                              />
                              <Line
                                type="monotone"
                                dataKey="totalScore"
                                name="Total Score"
                                stroke="#6366f1"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          No trend data available
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Employee Data
              </h3>
              <p className="text-gray-500">
                Unable to find KPI data for this employee
              </p>
              <button
                onClick={() => loadAllData()}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={16} className="inline" />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
