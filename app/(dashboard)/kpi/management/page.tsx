"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Award,
  Calendar,
  Search,
  Loader2,
  Download,
  RefreshCw,
  Eye,
  Crown,
  Medal,
  Zap,
  Brain,
  Sparkles,
  Settings,
  Save,
  Edit2,
  X,
  Home,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Building2,
  Target,
  Shield,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";

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

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================
const DEFAULT_WEIGHTS: KPIWeights = {
  taskCompletion: 20,
  qualityScore: 20,
  efficiency: 20,
  collaboration: 15,
  innovation: 15,
  attendance: 10,
};

const WEIGHT_LABELS: Record<keyof KPIWeights, string> = {
  taskCompletion: "Task Completion",
  qualityScore: "Quality Score",
  efficiency: "Efficiency",
  collaboration: "Collaboration",
  innovation: "Innovation",
  attendance: "Attendance",
};

const WEIGHT_DESCRIPTIONS: Record<keyof KPIWeights, string> = {
  taskCompletion: "Percentage of tasks completed on time",
  qualityScore: "Quality of work based on approval rate",
  efficiency: "Efficiency based on time management",
  collaboration: "Team collaboration and communication",
  innovation: "Innovation and creative contributions",
  attendance: "Attendance and punctuality",
};

const WEIGHT_ICONS: Record<keyof KPIWeights, any> = {
  taskCompletion: CheckCircle,
  qualityScore: Award,
  efficiency: Zap,
  collaboration: Users,
  innovation: Brain,
  attendance: Calendar,
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function KPIManagementPage() {
  const router = useRouter();

  // State Management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [kpiWeights, setKpiWeights] = useState<KPIWeight | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showWeightEditor, setShowWeightEditor] = useState(false);
  const [editingWeights, setEditingWeights] = useState<KPIWeights>(DEFAULT_WEIGHTS);
  const [savingWeights, setSavingWeights] = useState(false);
  const [activeTab, setActiveTab] = useState<"weights" | "report">("weights");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerformanceLevel, setSelectedPerformanceLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Lifecycle & Fetch Guards
  const initialized = useRef(false);
  const mounted = useRef(true);
  const isFetchingReport = useRef(false);
  const isFetchingWeights = useRef(false);
  const isFetchingDepartments = useRef(false);
  const prevMonthRef = useRef<string>("");
  const prevYearRef = useRef<number>(0);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    if (isFetchingDepartments.current || !mounted.current) return;
    try {
      isFetchingDepartments.current = true;
      const response = await api.get("/departments");
      if (mounted.current && response.data.success) {
        const depts = response.data.data || [];
        setDepartments(depts);
        if (depts.length > 0 && !selectedDepartment) {
          setSelectedDepartment(depts[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      if (mounted.current) isFetchingDepartments.current = false;
    }
  }, [selectedDepartment]);

  // Fetch Weights
  const fetchWeights = useCallback(async (departmentId: string) => {
    if (isFetchingWeights.current || !departmentId || !mounted.current) return;
    try {
      isFetchingWeights.current = true;
      setLoadingWeights(true);
      const response = await api.get(`/kpi/weights/${departmentId}`);
      if (mounted.current && response.data.success) {
        setKpiWeights(response.data.data);
        if (response.data.data?.weights) {
          setEditingWeights(response.data.data.weights);
        }
      }
    } catch (error) {
      console.error("Error fetching KPI weights:", error);
    } finally {
      if (mounted.current) {
        setLoadingWeights(false);
        isFetchingWeights.current = false;
      }
    }
  }, []);

  // Fallback Employee Fetching if Report is Empty
  const fetchDepartmentEmployees = useCallback(async () => {
    if (!selectedDepartment) return false;
    try {
      const response = await api.get(`/departments/${selectedDepartment}/employees`);
      if (response.data.success) {
        const employees = response.data.data || [];
        if (employees.length === 0) return false;

        const placeholderScores = employees.map((emp: any) => ({
          _id: `placeholder_${emp._id}`,
          userId: {
            _id: emp._id,
            fullName: emp.fullName,
            email: emp.email,
            employeeId: emp.employeeId || "N/A",
            role: emp.role || "employee",
          },
          departmentId: {
            _id: selectedDepartment,
            name: departments.find((d) => d._id === selectedDepartment)?.name || "Unknown",
            code: departments.find((d) => d._id === selectedDepartment)?.code || "N/A",
          },
          month: selectedMonth,
          year: selectedYear,
          totalScore: 0,
          performanceLevel: "needs_improvement" as const,
          percentile: 0,
          rank: 0,
          totalEmployees: employees.length,
          scores: {
            taskCompletion: { score: 0, weight: 0, weightedScore: 0 },
            qualityScore: { score: 0, weight: 0, weightedScore: 0 },
            efficiency: { score: 0, weight: 0, weightedScore: 0 },
            collaboration: { score: 0, weight: 0, weightedScore: 0 },
            innovation: { score: 0, weight: 0, weightedScore: 0 },
            attendance: { score: 0, weight: 0, weightedScore: 0 },
          },
          comments: 'No KPI data calculated yet. Click "Calculate KPI" to generate scores.',
          calculatedAt: new Date().toISOString(),
        }));

        setMonthlyReport({
          month: `${selectedYear}-${String(MONTHS.indexOf(selectedMonth) + 1).padStart(2, "0")}`,
          year: selectedYear,
          totalEmployees: employees.length,
          overallAverage: 0,
          distribution: { excellent: 0, good: 0, average: 0, needs_improvement: employees.length },
          departmentAverages: [],
          topPerformers: [],
          allScores: placeholderScores,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching department employees:", error);
      return false;
    }
  }, [selectedDepartment, selectedMonth, selectedYear, departments]);

  // Fetch Monthly Report
  const fetchReport = useCallback(async () => {
    if (isFetchingReport.current || !selectedMonth || !selectedYear || !mounted.current) return;

    try {
      isFetchingReport.current = true;
      setLoadingReport(true);

      const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
      const params: any = { month: monthIndex, year: selectedYear };
      if (selectedDepartment && selectedDepartment !== "all") {
        params.departmentId = selectedDepartment;
      }

      const response = await api.get(`/kpi/report/monthly`, { params });

      if (mounted.current && response.data.success) {
        const data = response.data.data;
        if (data.totalEmployees > 0 && data.allScores?.length > 0) {
          data.allScores = data.allScores.filter((score: KPIScore) => score.userId != null);
          setMonthlyReport(data);
        } else {
          const hasEmployees = await fetchDepartmentEmployees();
          if (!hasEmployees) {
            setMonthlyReport({
              month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
              year: selectedYear,
              totalEmployees: 0,
              overallAverage: 0,
              distribution: { excellent: 0, good: 0, average: 0, needs_improvement: 0 },
              departmentAverages: [],
              topPerformers: [],
              allScores: [],
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching monthly report:", error);
    } finally {
      if (mounted.current) {
        setLoadingReport(false);
        isFetchingReport.current = false;
      }
    }
  }, [selectedMonth, selectedYear, selectedDepartment, fetchDepartmentEmployees]);

  // Effects
  useEffect(() => {
    mounted.current = true;
    fetchDepartments();
    return () => {
      mounted.current = false;
    };
  }, [fetchDepartments]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchWeights(selectedDepartment);
    }
  }, [selectedDepartment, fetchWeights]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      prevMonthRef.current = selectedMonth;
      prevYearRef.current = selectedYear;
      fetchReport();
      return;
    }

    if (selectedMonth !== prevMonthRef.current || selectedYear !== prevYearRef.current) {
      prevMonthRef.current = selectedMonth;
      prevYearRef.current = selectedYear;
      fetchReport();
    }
  }, [selectedMonth, selectedYear, fetchReport]);

  // Handlers
  const handleSaveWeights = async () => {
    const total = Object.values(editingWeights).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      toast.error(`Total weight must equal 100%. Current total: ${total}%`);
      return;
    }

    setSavingWeights(true);
    try {
      const response = await api.put(`/kpi/weights/${selectedDepartment}`, { weights: editingWeights });
      if (mounted.current && response.data.success) {
        toast.success("KPI weights saved successfully");
        setKpiWeights(response.data.data);
        setShowWeightEditor(false);
        fetchWeights(selectedDepartment);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save KPI weights");
    } finally {
      if (mounted.current) setSavingWeights(false);
    }
  };

  // Custom Toast Confirmation for Calculation
  const handleCalculateKPI = () => {
    if (!selectedDepartment) {
      toast.error("Please select a department first");
      return;
    }

    const deptName = departments.find((d) => d._id === selectedDepartment)?.name || "Department";

    toast((t) => (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-800">
          Calculate KPI scores for <span className="text-indigo-600">{deptName}</span> ({selectedMonth} {selectedYear})?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeCalculation();
            }}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000, position: "top-center" });
  };

  const executeCalculation = async () => {
    setCalculating(true);
    const toastId = toast.loading("Calculating KPI metrics...");
    try {
      const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
      const response = await api.post(`/kpi/calculate/${selectedDepartment}`, {
        month: monthIndex,
        year: selectedYear,
      });

      if (response.data.success) {
        toast.success(response.data.message || "KPI scores calculated successfully", { id: toastId });
        isFetchingReport.current = false;
        await fetchReport();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to calculate KPI scores", { id: toastId });
    } finally {
      setCalculating(false);
    }
  };

  const getPerformanceConfig = (level: string) => {
    const config: Record<string, { color: string; bg: string; border: string; label: string; emoji: string }> = {
      excellent: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Excellent", emoji: "🌟" },
      good: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Good", emoji: "⭐" },
      average: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Average", emoji: "📊" },
      needs_improvement: { color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", label: "Needs Improvement", emoji: "📈" },
    };
    return config[level] || config.average;
  };

  const formatScore = (score: number): string => score?.toFixed(1) || "0.0";

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-600 transition flex items-center gap-1">
            <Home size={13} /> Dashboard
          </Link>
          <ChevronRight size={13} />
          <span className="text-slate-700">KPI Management</span>
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">KPI Management Hub</h1>
                <p className="text-slate-500 text-sm font-medium">Configure performance weights and analyze departmental grading reports.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                isFetchingReport.current = false;
                fetchReport();
                toast.success("Metrics refreshed");
              }}
              disabled={loadingReport}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingReport ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Control Bar: Department & Period Selector */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-semibold outline-none cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                ))}
              </select>
            </div>

            <div>
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
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCalculateKPI}
              disabled={calculating}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Calculate KPI Scores
            </button>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs max-w-sm">
          <button
            onClick={() => setActiveTab("weights")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "weights" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 hover:bg-slate-50"
              }`}
          >
            <Settings size={14} /> Weight Config
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "report" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 hover:bg-slate-50"
              }`}
          >
            <BarChart3 size={14} /> Monthly Report
          </button>
        </div>

        {/* TAB CONTENT: WEIGHTS CONFIGURATION */}
        {activeTab === "weights" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Department Scoring Weights</h2>
                <p className="text-xs text-slate-500 font-medium">Configure mathematical weight distributions for performance evaluation.</p>
              </div>
              <button
                onClick={() => setShowWeightEditor(!showWeightEditor)}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl transition flex items-center gap-2 self-start cursor-pointer"
              >
                {showWeightEditor ? <X size={14} /> : <Edit2 size={14} />}
                {showWeightEditor ? "Close Editor" : "Modify Weights"}
              </button>
            </div>

            {loadingWeights ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
            ) : showWeightEditor ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {(Object.keys(editingWeights) as Array<keyof KPIWeights>).map((key) => {
                  const Icon = WEIGHT_ICONS[key];
                  return (
                    <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-xs">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{WEIGHT_LABELS[key]}</p>
                            <p className="text-[10px] text-slate-400">{WEIGHT_DESCRIPTIONS[key]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingWeights[key]}
                            onChange={(e) => setEditingWeights({ ...editingWeights, [key]: Number(e.target.value) })}
                            className="w-16 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-center text-xs font-bold outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editingWeights[key]}
                        onChange={(e) => setEditingWeights({ ...editingWeights, [key]: Number(e.target.value) })}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-700">
                    Total Sum: <span className={Object.values(editingWeights).reduce((a, b) => a + b, 0) === 100 ? "text-emerald-600" : "text-rose-600"}>
                      {Object.values(editingWeights).reduce((a, b) => a + b, 0)}%
                    </span> (Must equal 100%)
                  </p>
                  <button
                    onClick={handleSaveWeights}
                    disabled={savingWeights || Object.values(editingWeights).reduce((a, b) => a + b, 0) !== 100}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-40 cursor-pointer flex items-center gap-2"
                  >
                    {savingWeights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />} Save Configurations
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {kpiWeights?.weights ? (
                  (Object.keys(kpiWeights.weights) as Array<keyof KPIWeights>).map((key) => {
                    const Icon = WEIGHT_ICONS[key];
                    const val = kpiWeights.weights[key];
                    return (
                      <div key={key} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-xs">
                            <Icon size={16} />
                          </div>
                          <span className="text-lg font-extrabold text-indigo-600">{val}%</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{WEIGHT_LABELS[key]}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{WEIGHT_DESCRIPTIONS[key]}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6">No custom weights found. Using default standard distribution.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: MONTHLY REPORT */}
        {activeTab === "report" && (
          <div className="space-y-6">
            {loadingReport ? (
              <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : !monthlyReport || monthlyReport.totalEmployees === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-xs max-w-lg mx-auto space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Performance Scores</h3>
                <p className="text-slate-400 text-xs">No metrics calculated for this department and timeframe. Click "Calculate KPI" above.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Score Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evaluated Staff</span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">{monthlyReport.totalEmployees}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Average</span>
                    <p className="text-2xl font-extrabold text-indigo-600 mt-1">{formatScore(monthlyReport.overallAverage)}%</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Performers</span>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">{monthlyReport.distribution.excellent}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Needs Support</span>
                    <p className="text-2xl font-extrabold text-rose-600 mt-1">{monthlyReport.distribution.needs_improvement}</p>
                  </div>
                </div>

                {/* Score Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Employee</th>
                          <th className="px-6 py-4 text-center">Final Score</th>
                          <th className="px-6 py-4">Performance Tier</th>
                          <th className="px-6 py-4 text-center">Unit Rank</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                        {monthlyReport.allScores
                          .filter((score) => score.userId != null) // Filter out null users
                          .map((score) => {
                            const conf = getPerformanceConfig(score.performanceLevel);
                            return (
                              <tr key={score._id || Math.random()} className="hover:bg-slate-50/50 transition">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shadow-xs">
                                      {score.userId?.fullName ? score.userId.fullName.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">
                                        {score.userId?.fullName || "Deleted User"}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {score.userId?.email || "No email available"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center font-extrabold text-slate-900">
                                  {score.totalScore != null ? formatScore(score.totalScore) : "0%"}
                                </td>
                                <td className="px-6 py-4">
                                  {score.performanceLevel ? (
                                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${conf.bg} ${conf.border} ${conf.color}`}>
                                      {conf.emoji} {conf.label}
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-full border bg-gray-50 border-gray-200 text-gray-500">
                                      N/A
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-600">
                                  #{score.rank || "N/A"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {score.userId?._id ? (
                                    <button
                                      onClick={() => router.push(`/kpi/employee/${score.userId._id}`)}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition inline-block cursor-pointer"
                                      title="View Details"
                                    >
                                      <Eye size={16} />
                                    </button>
                                  ) : (
                                    <span className="p-2 text-slate-300 cursor-not-allowed" title="User not available">
                                      <Eye size={16} />
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}