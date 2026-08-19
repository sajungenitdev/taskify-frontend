// app/(dashboard)/kpi/analytics/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Crown,
  Target,
  AlertCircle,
  Gauge,
  Lightbulb,
  Building2,
  Grid,
  Home,
  ChevronRight,
  RefreshCw,
  MinusCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import InsightsTab from "@/components/kpi/InsightsTab";
import ComparisonsTab from "@/components/kpi/ComparisonsTab";
import HeatMapTab from "@/components/kpi/HeatMapTab";
import PredictionsTab from "@/components/kpi/PredictionsTab";

// ============================================================
// TYPES & INTERFACES
// ============================================================
export interface Insight {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export interface Prediction {
  month: string;
  predictedScore: number;
  confidence: "low" | "medium" | "high";
  trend: "up" | "down" | "stable";
}

export interface Recommendation {
  area: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
}

export interface Anomaly {
  employeeId: string;
  employeeName: string;
  department: string;
  score: number;
  expectedScore: number;
  deviation: number;
  type: "high_performer" | "low_performer";
  severity: "critical" | "high" | "medium" | "low";
}

export interface AnalyticsData {
  insights: Insight[];
  predictions: Prediction[];
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  summary: {
    totalEmployees: number;
    averageScore: number;
    maxScore: number;
    minScore: number;
    stdDev: number;
    distribution: {
      excellent: number;
      good: number;
      average: number;
      needs_improvement: number;
    };
  };
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    averageScore: number;
    employeeCount: number;
    minScore: number;
    maxScore: number;
    stdDev: number;
  }>;
}

export interface DepartmentComparison {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalEmployees: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  components: {
    taskCompletion: number;
    qualityScore: number;
    efficiency: number;
    collaboration: number;
    innovation: number;
    attendance: number;
  };
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
}

export interface HeatMapData {
  employeeId: string;
  employeeName: string;
  department: string;
  taskCompletion: number;
  qualityScore: number;
  efficiency: number;
  collaboration: number;
  innovation: number;
  attendance: number;
  totalScore: number;
  performanceLevel: string;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const YEARS = [2023, 2024, 2025, 2026, 2027];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function KPIAnalyticsPage() {
  const { hasRole } = useAuth();
  const router = useRouter();

  // State Management
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [departmentComparisons, setDepartmentComparisons] = useState<DepartmentComparison[]>([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"insights" | "comparisons" | "heatmap" | "predictions">("insights");
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const canManage = hasRole(["super_admin", "admin", "hr_manager", "dept_manager", "employee"]);
  const currentMonth = MONTHS[new Date().getMonth()];

  // Refs for race-condition management and cleanup
  const isFetching = useRef(false);
  const isInitialized = useRef(false);
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedMonth && !isInitialized.current) {
      isInitialized.current = true;
      setSelectedMonth(currentMonth);
    }
  }, [selectedMonth, currentMonth]);

  // Load Department metadata
  const loadDepartments = useCallback(async () => {
    if (!canManage || !isMounted.current) return;
    try {
      const response = await api.get("/departments");
      if (response.data.success && isMounted.current) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, [canManage]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Robust Sample Generator for demonstration & fallbacks
  const generateSampleData = useCallback(async () => {
    if (isGeneratingSample) return;

    try {
      setIsGeneratingSample(true);
      setLoading(true);

      const sampleInsights: Insight[] = [
        { type: "success", title: "Strong Overall Performance", description: `Organizational performance remains solid for ${selectedMonth}.`, impact: "high" },
        { type: "warning", title: "Performance Variance Detected", description: "Variability in squad scorecards suggests inconsistent task output.", impact: "medium" },
        { type: "info", title: "Top Achiever Identified", description: "John Doe recorded the highest organizational score this period.", impact: "medium" },
        { type: "success", title: "Division Yield Gap", description: "Engineering unit outperforms auxiliary units by over 15%.", impact: "medium" },
      ];

      const sampleRecommendations: Recommendation[] = [
        { area: "Overall Performance", title: "Upskilling Programs", description: "Focus targeted learning sessions on efficiency bottlenecks.", priority: "high", impact: "high" },
        { area: "Task Completion", title: "Deadline Optimization", description: "Streamline blocker escalations to lift completion ratios.", priority: "medium", impact: "medium" },
      ];

      const sampleAnomalies: Anomaly[] = [
        { employeeId: "user1", employeeName: "John Doe", department: "Engineering", score: 92, expectedScore: 75, deviation: 22.7, type: "high_performer", severity: "high" },
        { employeeId: "user2", employeeName: "Jane Smith", department: "Marketing", score: 45, expectedScore: 70, deviation: -35.7, type: "low_performer", severity: "critical" },
      ];

      const samplePredictions: Prediction[] = [
        { month: "Jan", predictedScore: 76, confidence: "high", trend: "up" },
        { month: "Feb", predictedScore: 78, confidence: "high", trend: "up" },
        { month: "Mar", predictedScore: 80, confidence: "medium", trend: "up" },
        { month: "Apr", predictedScore: 79, confidence: "medium", trend: "stable" },
        { month: "May", predictedScore: 82, confidence: "medium", trend: "up" },
        { month: "Jun", predictedScore: 84, confidence: "high", trend: "up" },
      ];

      setAnalyticsData({
        insights: sampleInsights,
        predictions: samplePredictions,
        recommendations: sampleRecommendations,
        anomalies: sampleAnomalies,
        summary: {
          totalEmployees: 45, averageScore: 78, maxScore: 92, minScore: 45, stdDev: 12.5,
          distribution: { excellent: 12, good: 18, average: 10, needs_improvement: 5 },
        },
        departmentStats: [
          { departmentId: "dept1", departmentName: "Engineering", averageScore: 85, employeeCount: 20, minScore: 65, maxScore: 92, stdDev: 8.5 },
          { departmentId: "dept2", departmentName: "Marketing", averageScore: 65, employeeCount: 15, minScore: 45, maxScore: 82, stdDev: 12.3 },
          { departmentId: "dept3", departmentName: "Sales", averageScore: 75, employeeCount: 10, minScore: 55, maxScore: 88, stdDev: 10.1 },
        ],
      });

      setDepartmentComparisons([
        {
          departmentId: "dept1", departmentName: "Engineering", departmentCode: "ENG", totalEmployees: 20, averageScore: 85, maxScore: 92, minScore: 65,
          components: { taskCompletion: 88, qualityScore: 85, efficiency: 82, collaboration: 78, innovation: 80, attendance: 95 },
          distribution: { excellent: 8, good: 8, average: 3, needs_improvement: 1 },
        },
        {
          departmentId: "dept2", departmentName: "Marketing", departmentCode: "MKT", totalEmployees: 15, averageScore: 65, maxScore: 82, minScore: 45,
          components: { taskCompletion: 70, qualityScore: 68, efficiency: 62, collaboration: 75, innovation: 85, attendance: 88 },
          distribution: { excellent: 3, good: 5, average: 5, needs_improvement: 2 },
        },
      ]);

      setHeatMapData([
        { employeeId: "user1", employeeName: "John Doe", department: "Engineering", taskCompletion: 95, qualityScore: 90, efficiency: 88, collaboration: 85, innovation: 92, attendance: 98, totalScore: 92, performanceLevel: "excellent" },
        { employeeId: "user2", employeeName: "Jane Smith", department: "Marketing", taskCompletion: 55, qualityScore: 50, efficiency: 42, collaboration: 60, innovation: 75, attendance: 80, totalScore: 45, performanceLevel: "needs_improvement" },
      ]);

      toast.success("Sample analytics compiled successfully!");
    } catch (error) {
      console.error("Error generating sample data:", error);
      toast.error("Failed to generate sample data");
    } finally {
      setIsGeneratingSample(false);
      setLoading(false);
    }
  }, [selectedMonth, isGeneratingSample]);

  // Main Data Fetcher with API Integration & Fallbacks
  const fetchAllData = useCallback(async () => {
    if (isFetching.current || !isMounted.current) return;
    if (!selectedMonth || !selectedYear) {
      if (isMounted.current) setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      isFetching.current = true;
      if (isMounted.current) setLoading(true);

      const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
      const params = {
        departmentId: selectedDepartment === "all" ? undefined : selectedDepartment,
        month: monthIndex,
        year: selectedYear,
      };

      let hasRealData = false;

      try {
        const [analyticsRes, comparisonsRes, heatmapRes] = await Promise.all([
          api.get("/kpi-analytics/insights", { params, signal }).catch(() => ({ data: { success: false } })),
          api.get("/kpi-analytics/department-comparisons", { params: { month: monthIndex, year: selectedYear }, signal }).catch(() => ({ data: { success: false } })),
          api.get("/kpi-analytics/heatmap", { params, signal }).catch(() => ({ data: { success: false } })),
        ]);

        if (!isMounted.current || signal.aborted) return;

        if (analyticsRes.data?.success && analyticsRes.data.data?.insights?.length > 0) {
          setAnalyticsData(analyticsRes.data.data);
          hasRealData = true;
        }

        if (comparisonsRes.data?.success && comparisonsRes.data.data?.departments?.length > 0) {
          setDepartmentComparisons(comparisonsRes.data.data.departments);
          hasRealData = true;
        }

        if (heatmapRes.data?.success && heatmapRes.data.data?.heatMapData?.length > 0) {
          setHeatMapData(heatmapRes.data.data.heatMapData);
          hasRealData = true;
        }
      } catch (err) {
        console.log("Using fallback sample telemetry:", err);
      }

      if (!hasRealData && isMounted.current) {
        await generateSampleData();
      }
    } catch (error: any) {
      if (error.name !== "AbortError" && isMounted.current) {
        await generateSampleData();
      }
    } finally {
      if (isMounted.current && !signal.aborted) {
        setLoading(false);
        isFetching.current = false;
      }
    }
  }, [selectedMonth, selectedYear, selectedDepartment, generateSampleData]);

  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchAllData();
    }, 300);
  }, [fetchAllData]);

  useEffect(() => {
    if (selectedMonth && selectedYear && canManage) {
      debouncedFetch();
    }
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [selectedMonth, selectedYear, selectedDepartment, canManage, debouncedFetch]);

  const handleRefresh = useCallback(() => {
    if (!loading) fetchAllData();
  }, [fetchAllData, loading]);

  const getImpactColor = useCallback((impact: string) => {
    const colors: Record<string, string> = {
      high: "text-rose-600 bg-rose-50 border-rose-200",
      medium: "text-amber-600 bg-amber-50 border-amber-200",
      low: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return colors[impact] || colors.low;
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    const colors: Record<string, string> = {
      high: "text-rose-600 bg-rose-50 border-rose-200",
      medium: "text-amber-600 bg-amber-50 border-amber-200",
      low: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return colors[priority] || colors.low;
  }, []);

  const getConfidenceColor = useCallback((confidence: string) => {
    const colors: Record<string, string> = {
      high: "text-emerald-600 bg-emerald-50",
      medium: "text-amber-600 bg-amber-50",
      low: "text-rose-600 bg-rose-50",
    };
    return colors[confidence] || colors.low;
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp size={14} className="text-emerald-500" />;
      case "down": return <TrendingDown size={14} className="text-rose-500" />;
      default: return <MinusCircle size={14} className="text-amber-500" />;
    }
  }, []);

  const getPerformanceConfig = useCallback((level: string) => {
    const config: Record<string, any> = {
      excellent: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: Crown, label: "Excellent", emoji: "🌟" },
      good: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Award, label: "Good", emoji: "⭐" },
      average: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Award, label: "Average", emoji: "📊" },
      needs_improvement: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle, label: "Needs Improvement", emoji: "📈" },
    };
    return config[level] || config.average;
  }, []);

  const formatScore = useCallback((score: number) => score?.toFixed(1) || "0.0", []);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md w-full">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm mb-6">You lack administrative clearance to view analytics matrices.</p>
          <Link href="/dashboard" className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20">
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
          <span className="text-slate-700">KPI Analytics Hub</span>
        </div>

        {/* Header Banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">AI Analytics & Insights Hub</h1>
                <p className="text-slate-500 text-sm font-medium">Advanced intelligence metrics, predictive trajectories, and cross-departmental benchmarks.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh Analytics"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            <button
              onClick={generateSampleData}
              disabled={isGeneratingSample || loading}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} className={isGeneratingSample ? "animate-spin" : ""} />
              Sample Telemetry
            </button>
          </div>
        </motion.div>

        {/* Summary Stat Cards */}
        {analyticsData && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Total Workforce", val: analyticsData.summary.totalEmployees, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Unit Average", val: `${analyticsData.summary.averageScore}%`, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Top Score", val: `${analyticsData.summary.maxScore}%`, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Lowest Score", val: `${analyticsData.summary.minScore}%`, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "Variance (σ)", val: analyticsData.summary.stdDev.toFixed(1), icon: Gauge, color: "text-purple-600", bg: "bg-purple-50" },
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

        {/* Navigation Tabs Bar */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-xs max-w-xl">
          {[
            { id: "insights", icon: Lightbulb, label: "AI Insights" },
            { id: "comparisons", icon: Building2, label: "Comparisons" },
            { id: "heatmap", icon: Grid, label: "Heat Map" },
            { id: "predictions", icon: TrendingUp, label: "Predictions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panel Viewport */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-400">Synthesizing analytical matrix...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "insights" && (
              <InsightsTab
                analyticsData={analyticsData}
                getImpactColor={getImpactColor}
                getPriorityColor={getPriorityColor}
                getPerformanceConfig={getPerformanceConfig}
                formatScore={formatScore}
                onViewEmployee={(userId: string) => router.push(`/kpi/employee/${userId}`)}
                onRefresh={handleRefresh}
                onGenerateSample={generateSampleData}
                isLoading={loading}
              />
            )}
            {activeTab === "comparisons" && (
              <ComparisonsTab
                departmentComparisons={departmentComparisons}
                selectedDepartment={selectedDepartment}
                formatScore={formatScore}
                getPerformanceConfig={getPerformanceConfig}
                COLORS={COLORS}
              />
            )}
            {activeTab === "heatmap" && (
              <HeatMapTab
                heatMapData={heatMapData}
                selectedDepartment={selectedDepartment}
                departments={departments}
                formatScore={formatScore}
                getPerformanceConfig={getPerformanceConfig}
                onViewEmployee={(userId: string) => router.push(`/kpi/employee/${userId}`)}
              />
            )}
            {activeTab === "predictions" && analyticsData && (
              <PredictionsTab
                analyticsData={{ predictions: analyticsData.predictions || [] }}
                getTrendIcon={getTrendIcon}
                getConfidenceColor={getConfidenceColor}
                formatScore={formatScore}
                selectedDepartment={selectedDepartment}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}