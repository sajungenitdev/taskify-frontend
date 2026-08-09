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
  Calendar,
  Filter,
  Search,
  Loader2,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
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
  Briefcase,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  CheckCheck,
  Hourglass,
  Flame,
  Gauge,
  TrendingUp as TrendingUpIcon,
  Shield,
  Award as AwardIcon,
  Crown,
  Medal,
  Zap,
  Brain,
  Sparkles,
  BarChart,
  Layers,
  FileText,
  Printer,
  Share2,
  Settings,
  Save,
  Edit2,
  Plus,
  Trash2,
  MoreVertical,
  Home,
  Globe,
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
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
} from "recharts";

// ============================================================
// TYPES
// ============================================================
interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

interface KPIWeights {
  taskCompletion: number;
  qualityScore: number;
  efficiency: number;
  collaboration: number;
  innovation: number;
  attendance: number;
}

interface KPIWeight {
  _id?: string;
  departmentId: {
    _id: string;
    name: string;
    code: string;
  };
  weights: KPIWeights;
  totalWeight: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

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
  scores: {
    taskCompletion: ScoreComponent;
    qualityScore: ScoreComponent;
    efficiency: ScoreComponent;
    collaboration: ScoreComponent;
    innovation: ScoreComponent;
    attendance: ScoreComponent;
  };
  totalScore: number;
  performanceLevel: "excellent" | "good" | "average" | "needs_improvement";
  percentile: number;
  rank: number;
  totalEmployees: number;
  comments: string;
  calculatedAt: string;
}

interface MonthlyReport {
  month: string;
  year: number;
  totalEmployees: number;
  overallAverage: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
  departmentAverages: Array<{
    department: { _id: string; name: string; code: string };
    averageScore: number;
    employeeCount: number;
    topPerformer: string;
  }>;
  topPerformers: Array<{
    name: string;
    department: string;
    score: number;
    level: string;
  }>;
  allScores: KPIScore[];
}

interface WeightLabels {
  [key: string]: string;
}

interface WeightDescriptions {
  [key: string]: string;
}

interface WeightIcons {
  [key: string]: any;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

// ============================================================
// WEIGHT CONFIGURATION CONSTANTS
// ============================================================
const DEFAULT_WEIGHTS: KPIWeights = {
  taskCompletion: 20,
  qualityScore: 20,
  efficiency: 20,
  collaboration: 15,
  innovation: 15,
  attendance: 10,
};

const WEIGHT_LABELS: WeightLabels = {
  taskCompletion: "Task Completion",
  qualityScore: "Quality Score",
  efficiency: "Efficiency",
  collaboration: "Collaboration",
  innovation: "Innovation",
  attendance: "Attendance",
};

const WEIGHT_DESCRIPTIONS: WeightDescriptions = {
  taskCompletion: "Percentage of tasks completed on time",
  qualityScore: "Quality of work based on approval rate",
  efficiency: "Efficiency based on time management",
  collaboration: "Team collaboration and communication",
  innovation: "Innovation and creative contributions",
  attendance: "Attendance and punctuality",
};

const WEIGHT_ICONS: WeightIcons = {
  taskCompletion: CheckCircle,
  qualityScore: Award,
  efficiency: Zap,
  collaboration: Users,
  innovation: Brain,
  attendance: Calendar,
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function KPIManagementPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();

  // State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [kpiWeights, setKpiWeights] = useState<KPIWeight | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [showWeightEditor, setShowWeightEditor] = useState(false);
  const [editingWeights, setEditingWeights] = useState<KPIWeights>(DEFAULT_WEIGHTS);
  const [savingWeights, setSavingWeights] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "weights" | "report"
  >("weights");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerformanceLevel, setSelectedPerformanceLevel] =
    useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const isDepartmentsLoaded = useRef(false);

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

  // Use ref to prevent infinite loops
  const isFetching = useRef(false);
  const isInitialized = useRef(false);



  const fetchKPIWeights = useCallback(async (departmentId: string) => {
    if (isFetching.current) return;
    try {
      isFetching.current = true;
      setLoading(true);
      const response = await api.get(`/kpi/weights/${departmentId}`);
      if (response.data.success) {
        setKpiWeights(response.data.data);
        if (response.data.data && response.data.data.weights) {
          setEditingWeights(response.data.data.weights);
        }
      }
    } catch (error) {
      console.error("Error fetching KPI weights:", error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  const fetchMonthlyReport = useCallback(async () => {
    if (isFetching.current) return;
    try {
      isFetching.current = true;
      setReportLoading(true);
      const monthIndex = months.indexOf(selectedMonth) + 1;
      const response = await api.get(`/kpi/report/monthly`, {
        params: {
          month: monthIndex,
          year: selectedYear,
        },
      });
      if (response.data.success) {
        setMonthlyReport(response.data.data);
      } else {
        setMonthlyReport({
          month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
          year: selectedYear,
          totalEmployees: 0,
          overallAverage: 0,
          distribution: {
            excellent: 0,
            good: 0,
            average: 0,
            needs_improvement: 0,
          },
          departmentAverages: [],
          topPerformers: [],
          allScores: [],
        });
      }
    } catch (error) {
      console.error("Error fetching monthly report:", error);
      const monthIndex = months.indexOf(selectedMonth) + 1;
      setMonthlyReport({
        month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
        year: selectedYear,
        totalEmployees: 0,
        overallAverage: 0,
        distribution: {
          excellent: 0,
          good: 0,
          average: 0,
          needs_improvement: 0,
        },
        departmentAverages: [],
        topPerformers: [],
        allScores: [],
      });
    } finally {
      setReportLoading(false);
      isFetching.current = false;
    }
  }, [selectedMonth, selectedYear, months]);


  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
        if (response.data.data.length > 0 && !selectedDepartment) {
          setSelectedDepartment(response.data.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    }
  }, [selectedDepartment]);


  // ============================================================
  // HANDLERS
  // ============================================================
  const handleSaveWeights = useCallback(async () => {
    const total = Object.values(editingWeights).reduce(
      (sum: number, val: number) => sum + val,
      0,
    );
    if (total !== 100) {
      toast.error(`Total weight must equal 100%. Current total: ${total}%`);
      return;
    }

    setSavingWeights(true);
    try {
      const response = await api.put(`/kpi/weights/${selectedDepartment}`, {
        weights: editingWeights,
      });
      if (response.data.success) {
        toast.success("KPI weights saved successfully");
        setKpiWeights(response.data.data);
        setShowWeightEditor(false);
        await fetchKPIWeights(selectedDepartment);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save KPI weights",
      );
    } finally {
      setSavingWeights(false);
    }
  }, [editingWeights, selectedDepartment, fetchKPIWeights]);

  const handleCalculateKPI = useCallback(async () => {
    if (!selectedDepartment) {
      toast.error("Please select a department");
      return;
    }

    const monthIndex = months.indexOf(selectedMonth) + 1;
    const deptName = departments.find(
      (d) => d._id === selectedDepartment,
    )?.name;

    if (
      !confirm(
        `Calculate KPI scores for ${deptName} for ${selectedMonth} ${selectedYear}?`,
      )
    ) {
      return;
    }

    setCalculating(true);
    try {
      const response = await api.post(`/kpi/calculate/${selectedDepartment}`, {
        month: monthIndex,
        year: selectedYear,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchMonthlyReport();
        await fetchKPIWeights(selectedDepartment);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to calculate KPI scores",
      );
    } finally {
      setCalculating(false);
    }
  }, [selectedDepartment, selectedMonth, selectedYear, departments, months, fetchMonthlyReport, fetchKPIWeights]);

  const handleExportReport = useCallback(() => {
    if (!monthlyReport || monthlyReport.allScores.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
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
    ];
    const rows = monthlyReport.allScores.map((score) => [
      score.userId.fullName,
      score.departmentId.name,
      formatScore(score.totalScore),
      score.performanceLevel.replace("_", " "),
      formatScore(score.scores.taskCompletion.score),
      formatScore(score.scores.qualityScore.score),
      formatScore(score.scores.efficiency.score),
      formatScore(score.scores.collaboration.score),
      formatScore(score.scores.innovation.score),
      formatScore(score.scores.attendance.score),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KPI_Report_${selectedMonth}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  }, [monthlyReport, selectedMonth, selectedYear]);

  // ============================================================
  // HELPERS
  // ============================================================
  const getPerformanceConfig = useCallback((level: string) => {
    const config: Record<string, {
      color: string;
      bg: string;
      border: string;
      icon: any;
      label: string;
      emoji: string;
    }> = {
      excellent: {
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: Crown,
        label: "Excellent",
        emoji: "🌟",
      },
      good: {
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Award,
        label: "Good",
        emoji: "⭐",
      },
      average: {
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Medal,
        label: "Average",
        emoji: "📊",
      },
      needs_improvement: {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: AlertCircle,
        label: "Needs Improvement",
        emoji: "📈",
      },
    };
    return config[level] || config.average;
  }, []);

  const formatScore = useCallback((score: number): string => {
    return score?.toFixed(1) || "0.0";
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // ============================================================
  // EFFECTS - All effects should be declared after all functions
  // ============================================================

  // Initialize selected month
  useEffect(() => {
    if (!selectedMonth && !isInitialized.current) {
      isInitialized.current = true;
      setSelectedMonth(currentMonth);
    }
  }, [selectedMonth, currentMonth]);

  useEffect(() => {
    if (canManage && !isDepartmentsLoaded.current) {
      isDepartmentsLoaded.current = true;
      fetchDepartments();
    }
  }, [canManage]);

  // Fetch KPI weights when department changes
  useEffect(() => {
    if (selectedDepartment && !isFetching.current) {
      fetchKPIWeights(selectedDepartment);
    }
  }, [selectedDepartment, fetchKPIWeights]);

  // Fetch monthly report when month/year changes
  useEffect(() => {
    if (selectedMonth && selectedYear && !isFetching.current) {
      fetchMonthlyReport();
    }
  }, [selectedMonth, selectedYear, fetchMonthlyReport]);

  // ============================================================
  // API CALLS - All functions declared before they're used
  // ============================================================

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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">
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
            <span className="text-gray-700 font-medium">KPI Management</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    KPI Management
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Configure weights and monitor employee performance
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchMonthlyReport}
                disabled={reportLoading}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={reportLoading ? "animate-spin" : ""}
                />
              </button>
              <button
                onClick={handleExportReport}
                disabled={
                  !monthlyReport || monthlyReport.allScores.length === 0
                }
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </motion.div>

          {/* Department & Month Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-sm"
          >
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCalculateKPI}
                disabled={calculating}
                className="px-6 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-lg disabled:opacity-50"
              >
                {calculating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                Calculate KPI
              </button>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex border-b border-gray-200 bg-white/80 backdrop-blur-sm rounded-t-2xl px-4"
          >
            <button
              onClick={() => setActiveTab("weights")}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 relative ${activeTab === "weights"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <Settings size={16} className="inline mr-2" />
              Weights Configuration
              {activeTab === "weights" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-500 to-purple-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 relative ${activeTab === "report"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Monthly Report
              {activeTab === "report" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-indigo-500 to-purple-500" />
              )}
            </button>
          </motion.div>

          {/* Tab Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-b-2xl border border-t-0 border-gray-200 p-6 shadow-sm">
            {activeTab === "weights" && (
              <WeightsTab
                departmentName={
                  departments.find((d) => d._id === selectedDepartment)?.name ||
                  "Selected Department"
                }
                kpiWeights={kpiWeights}
                editingWeights={editingWeights}
                setEditingWeights={setEditingWeights}
                showWeightEditor={showWeightEditor}
                setShowWeightEditor={setShowWeightEditor}
                savingWeights={savingWeights}
                handleSaveWeights={handleSaveWeights}
                loading={loading}
                formatDate={formatDate}
                WEIGHT_LABELS={WEIGHT_LABELS}
                WEIGHT_DESCRIPTIONS={WEIGHT_DESCRIPTIONS}
                WEIGHT_ICONS={WEIGHT_ICONS}
                DEFAULT_WEIGHTS={DEFAULT_WEIGHTS}
              />
            )}

            {activeTab === "report" && (
              <ReportTab
                monthlyReport={monthlyReport}
                reportLoading={reportLoading}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                selectedDepartment={selectedDepartment}
                departments={departments}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedPerformanceLevel={selectedPerformanceLevel}
                setSelectedPerformanceLevel={setSelectedPerformanceLevel}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                getPerformanceConfig={getPerformanceConfig}
                formatScore={formatScore}
                formatDate={formatDate}
                onViewEmployee={(userId: string) =>
                  router.push(`/kpi/employee/${userId}`)
                }
                COLORS={COLORS}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WEIGHTS TAB COMPONENT
// ============================================================
interface WeightsTabProps {
  departmentName: string;
  kpiWeights: KPIWeight | null;
  editingWeights: KPIWeights;
  setEditingWeights: (weights: KPIWeights) => void;
  showWeightEditor: boolean;
  setShowWeightEditor: (show: boolean) => void;
  savingWeights: boolean;
  handleSaveWeights: () => void;
  loading: boolean;
  formatDate: (date: string) => string;
  WEIGHT_LABELS: WeightLabels;
  WEIGHT_DESCRIPTIONS: WeightDescriptions;
  WEIGHT_ICONS: WeightIcons;
  DEFAULT_WEIGHTS: KPIWeights;
}

function WeightsTab({
  departmentName,
  kpiWeights,
  editingWeights,
  setEditingWeights,
  showWeightEditor,
  setShowWeightEditor,
  savingWeights,
  handleSaveWeights,
  loading,
  formatDate,
  WEIGHT_LABELS,
  WEIGHT_DESCRIPTIONS,
  WEIGHT_ICONS,
  DEFAULT_WEIGHTS,
}: WeightsTabProps) {
  const total = Object.values(editingWeights).reduce(
    (sum: number, val: number) => sum + val,
    0,
  );
  const isValid = total === 100;

  const handleWeightChange = (key: keyof KPIWeights, value: number) => {
    setEditingWeights({
      ...editingWeights,
      [key]: Math.min(100, Math.max(0, value)),
    });
  };

  const resetToDefault = () => {
    setEditingWeights(DEFAULT_WEIGHTS);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            KPI Weights for {departmentName}
          </h3>
          <p className="text-sm text-gray-500">
            Configure the weight distribution for KPI calculations
          </p>
        </div>
        <button
          onClick={() => setShowWeightEditor(!showWeightEditor)}
          className="px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md shadow-indigo-500/20"
        >
          {showWeightEditor ? <X size={16} /> : <Edit2 size={16} />}
          {showWeightEditor ? "Cancel" : "Edit Weights"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : showWeightEditor ? (
        <div className="space-y-4">
          {(Object.keys(editingWeights) as Array<keyof KPIWeights>).map((key) => {
            const Icon = WEIGHT_ICONS[key];
            return (
              <div
                key={key}
                className="bg-gray-50/80 rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Icon size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {WEIGHT_LABELS[key]}
                      </label>
                      <p className="text-xs text-gray-400">
                        {WEIGHT_DESCRIPTIONS[key]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editingWeights[key]}
                      onChange={(e) =>
                        handleWeightChange(key, parseInt(e.target.value))
                      }
                      className="w-48 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingWeights[key]}
                      onChange={(e) =>
                        handleWeightChange(key, parseInt(e.target.value) || 0)
                      }
                      className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                    <span className="text-sm text-gray-400">%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${editingWeights[key] > 0
                      ? "bg-linear-to-r from-indigo-500 to-purple-500"
                      : "bg-gray-300"
                      }`}
                    style={{
                      width: `${editingWeights[key]}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span
                  className={`ml-2 text-sm font-bold ${isValid ? "text-emerald-600" : "text-rose-600"
                    }`}
                >
                  {total}%
                </span>
                {!isValid && (
                  <p className="text-xs text-rose-600 mt-1">
                    Total must equal 100%. Current total: {total}%
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetToDefault}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
                >
                  Reset to Default
                </button>
                <button
                  onClick={handleSaveWeights}
                  disabled={savingWeights || !isValid}
                  className="px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {savingWeights ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Weights
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiWeights?.weights ? (
            (Object.keys(kpiWeights.weights) as Array<keyof KPIWeights>).map((key) => {
              const Icon = WEIGHT_ICONS[key];
              const value = kpiWeights.weights[key];
              return (
                <div
                  key={key}
                  className="bg-linear-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={18} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {WEIGHT_LABELS[key]}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {WEIGHT_DESCRIPTIONS[key]}
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">
                      {value}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                    <div
                      className="h-1.5 rounded-full bg-linear-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-12 bg-gray-50/80 rounded-2xl border-2 border-dashed border-gray-300">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No weights configured</p>
              <p className="text-sm text-gray-400">
                Click "Edit Weights" to configure KPI weights
              </p>
            </div>
          )}
          {kpiWeights && (
            <div className="col-span-3 bg-linear-to-r from-indigo-50/80 to-purple-50/80 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-700 font-medium flex items-center gap-2">
                  <Shield size={14} />
                  Version {kpiWeights.version}
                </span>
                <span className="text-indigo-600">
                  Total: {kpiWeights.totalWeight}%
                </span>
                <span className="text-gray-500 text-xs">
                  Updated: {formatDate(kpiWeights.updatedAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// REPORT TAB COMPONENT
// ============================================================
interface ReportTabProps {
  monthlyReport: MonthlyReport | null;
  reportLoading: boolean;
  selectedMonth: string;
  selectedYear: number;
  selectedDepartment: string;
  departments: Department[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedPerformanceLevel: string;
  setSelectedPerformanceLevel: (level: string) => void;
  sortBy: "score" | "name";
  setSortBy: (sort: "score" | "name") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  getPerformanceConfig: (level: string) => any;
  formatScore: (score: number) => string;
  formatDate: (date: string) => string;
  onViewEmployee: (userId: string) => void;
  COLORS: string[];
}

function ReportTab({
  monthlyReport,
  reportLoading,
  selectedMonth,
  selectedYear,
  selectedDepartment,
  departments,
  searchTerm,
  setSearchTerm,
  selectedPerformanceLevel,
  setSelectedPerformanceLevel,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  getPerformanceConfig,
  formatScore,
  formatDate,
  onViewEmployee,
  COLORS,
}: ReportTabProps) {
  const performanceLevels = [
    { value: "all", label: "All Levels" },
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "average", label: "Average" },
    { value: "needs_improvement", label: "Needs Improvement" },
  ];

  // Filter and sort scores - with department filter
  const filteredScores = useMemo(() => {
    if (!monthlyReport) return [];

    let scores = [...monthlyReport.allScores];

    // Filter by selected department
    if (selectedDepartment) {
      scores = scores.filter((s) => s.departmentId._id === selectedDepartment);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      scores = scores.filter(
        (s) =>
          s.userId.fullName.toLowerCase().includes(term) ||
          s.userId.email.toLowerCase().includes(term) ||
          s.userId.employeeId?.toLowerCase().includes(term),
      );
    }

    if (selectedPerformanceLevel !== "all") {
      scores = scores.filter(
        (s) => s.performanceLevel === selectedPerformanceLevel,
      );
    }

    scores.sort((a, b) => {
      if (sortBy === "score") {
        return sortOrder === "asc"
          ? a.totalScore - b.totalScore
          : b.totalScore - a.totalScore;
      } else {
        return sortOrder === "asc"
          ? a.userId.fullName.localeCompare(b.userId.fullName)
          : b.userId.fullName.localeCompare(a.userId.fullName);
      }
    });

    return scores;
  }, [
    monthlyReport,
    selectedDepartment,
    searchTerm,
    selectedPerformanceLevel,
    sortBy,
    sortOrder,
  ]);

  if (reportLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading report...
          </p>
        </div>
      </div>
    );
  }

  if (!monthlyReport || monthlyReport.totalEmployees === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/80 rounded-2xl border-2 border-dashed border-gray-300">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Report Data
        </h3>
        <p className="text-gray-500">
          No KPI data available for {selectedMonth} {selectedYear}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Click "Calculate KPI" to generate scores for this period
        </p>
      </div>
    );
  }

  // Get department name for display
  const departmentName =
    departments.find((d) => d._id === selectedDepartment)?.name ||
    "All Departments";

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Employees",
            value: filteredScores.length,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Average Score",
            value:
              filteredScores.length > 0
                ? `${formatScore(filteredScores.reduce((sum: number, s: KPIScore) => sum + s.totalScore, 0) / filteredScores.length)}%`
                : "0%",
            icon: Target,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Excellent",
            value: filteredScores.filter(
              (s) => s.performanceLevel === "excellent",
            ).length,
            icon: Crown,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Needs Improvement",
            value: filteredScores.filter(
              (s) => s.performanceLevel === "needs_improvement",
            ).length,
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`${stat.bg} rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  {stat.label}
                </p>
              </div>
              <div
                className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Department Name Header */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <Building2 size={14} className="text-indigo-500" />
        <span>
          Showing results for:{" "}
          <strong className="text-gray-800">{departmentName}</strong>
        </span>
        {filteredScores.length > 0 && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {filteredScores.length} employees
          </span>
        )}
      </div>

      {/* Distribution Chart */}
      {filteredScores.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50/80 rounded-xl border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Performance Distribution
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width:
                    filteredScores.length > 0
                      ? `${(filteredScores.filter((s) => s.performanceLevel === "excellent").length / filteredScores.length) * 100}%`
                      : "0%",
                }}
              />
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width:
                    filteredScores.length > 0
                      ? `${(filteredScores.filter((s) => s.performanceLevel === "good").length / filteredScores.length) * 100}%`
                      : "0%",
                }}
              />
              <div
                className="h-full bg-amber-500 transition-all"
                style={{
                  width:
                    filteredScores.length > 0
                      ? `${(filteredScores.filter((s) => s.performanceLevel === "average").length / filteredScores.length) * 100}%`
                      : "0%",
                }}
              />
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  width:
                    filteredScores.length > 0
                      ? `${(filteredScores.filter((s) => s.performanceLevel === "needs_improvement").length / filteredScores.length) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-gray-600">Excellent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-gray-600">Good</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-gray-600">Average</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-gray-600">Needs Improvement</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {filteredScores.length > 0 && (
        <div className="mb-6 p-4 bg-linear-to-r from-amber-50/80 to-orange-50/80 rounded-xl border border-amber-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Crown size={16} className="text-amber-500" />
            Top Performers in {departmentName}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredScores.slice(0, 3).map((performer, index) => {
              const perfConfig = getPerformanceConfig(
                performer.performanceLevel,
              );
              return (
                <div
                  key={performer._id}
                  className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
                  onClick={() => onViewEmployee(performer.userId._id)}
                >
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {performer.userId.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {performer.departmentId.name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {formatScore(performer.totalScore)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee List */}
      <div>
        <h3 className="text-gray-800 font-medium mb-3">All Employees</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search employees in ${departmentName}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>
          <select
            value={selectedPerformanceLevel}
            onChange={(e) => setSelectedPerformanceLevel(e.target.value)}
            className="px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          >
            {performanceLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score" | "name")}
            className="px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          >
            <option value="score">Sort by Score</option>
            <option value="name">Sort by Name</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl hover:bg-gray-100/80 transition"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-200">
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
                  Rank
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredScores.map((score) => {
                const perfConfig = getPerformanceConfig(score.performanceLevel);
                return (
                  <tr
                    key={score._id}
                    className="hover:bg-gray-50/80 transition cursor-pointer"
                    onClick={() => onViewEmployee(score.userId._id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {score.userId.fullName.charAt(0).toUpperCase()}
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
                            className={`h-1.5 rounded-full ${score.totalScore >= 90
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
                    <td className="px-4 py-3 text-sm text-gray-600">
                      #{score.rank} of {score.totalEmployees}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewEmployee(score.userId._id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredScores.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employees found matching your filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}