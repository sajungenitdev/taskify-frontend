// app/(dashboard)/kpi/reports/page.tsx
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
  Crown,
  Medal,
  Zap,
  Sparkles,
  Settings,
  Home,
  Filter,
  Mail,
  Star,
  Flame,
  Gauge,
  Shield,
  Users as UsersIcon,
  Briefcase,
  ExternalLink,
  TrendingUp as TrendingUpIcon,
  FileText,
  Calendar as CalendarIcon,
  Layers,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  MinusCircle,
  HelpCircle,
  ChevronLeft,
  Globe,
  Award as AwardIcon,
  Trophy,
  Medal as MedalIcon,
  FileDown,
  Printer,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  departmentAverages: Array<{
    department: string;
    departmentId: string;
    averageScore: number;
    employeeCount: number;
  }>;
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
}

type ReportType = "monthly" | "quarterly" | "annual" | "department";
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function KPIReportsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();

  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>("Q1");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [allScores, setAllScores] = useState<KPIScore[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const canManage = hasRole([
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
  ]);

  const months = useMemo(
    () => [
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
    ],
    [],
  );

  const quarters = useMemo(
    () => ({
      Q1: ["January", "February", "March"],
      Q2: ["April", "May", "June"],
      Q3: ["July", "August", "September"],
      Q4: ["October", "November", "December"],
    }),
    [],
  );

  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Initialize selected month only once
  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(currentMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use ref to prevent infinite loop
  const isFetching = useRef(false);
  const initialFetchDone = useRef(false);

  // ============================================================
  // HELPER FUNCTIONS - MEMOIZED
  // ============================================================

  const generateMonthlyTrend = useCallback(
    (scores: KPIScore[], usersData: any[]) => {
      const monthMap = new Map();

      scores.forEach((s) => {
        const key = s.month;
        if (!monthMap.has(key)) {
          monthMap.set(key, { total: 0, count: 0 });
        }
        const data = monthMap.get(key);
        data.total += s.totalScore;
        data.count++;
      });

      if (scores.length === 0) {
        const monthNames = months.slice(0, 6);
        return monthNames.map((month) => ({
          month,
          averageScore: 0,
          employeeCount: 0,
        }));
      }

      return Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          averageScore:
            data.count > 0 ? Math.round(data.total / data.count) : 0,
          employeeCount: data.count,
        }))
        .sort((a, b) => {
          const monthOrder = months.indexOf(a.month) - months.indexOf(b.month);
          return monthOrder || 0;
        });
    },
    [months],
  );

  const calculateComponentAverages = useCallback((scores: KPIScore[]) => {
    if (scores.length === 0) {
      return {
        taskCompletion: 0,
        qualityScore: 0,
        efficiency: 0,
        collaboration: 0,
        innovation: 0,
        attendance: 0,
      };
    }

    const totals = {
      taskCompletion: 0,
      qualityScore: 0,
      efficiency: 0,
      collaboration: 0,
      innovation: 0,
      attendance: 0,
    };

    scores.forEach((s) => {
      totals.taskCompletion += s.scores.taskCompletion.score;
      totals.qualityScore += s.scores.qualityScore.score;
      totals.efficiency += s.scores.efficiency.score;
      totals.collaboration += s.scores.collaboration.score;
      totals.innovation += s.scores.innovation.score;
      totals.attendance += s.scores.attendance.score;
    });

    const count = scores.length;
    return {
      taskCompletion: Math.round(totals.taskCompletion / count),
      qualityScore: Math.round(totals.qualityScore / count),
      efficiency: Math.round(totals.efficiency / count),
      collaboration: Math.round(totals.collaboration / count),
      innovation: Math.round(totals.innovation / count),
      attendance: Math.round(totals.attendance / count),
    };
  }, []);

  // ============================================================
  // FETCH REPORT DATA - MEMOIZED WITH useCallback
  // ============================================================
  const fetchReportData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);
      setError(null);

      // Fetch users data
      let usersData: any[] = [];
      try {
        const usersResponse = await api.get("/users");
        if (usersResponse.data.success) {
          usersData = usersResponse.data.data || [];
        }
      } catch (userError) {
        console.error("Error fetching users:", userError);
      }

      let monthIndex = months.indexOf(selectedMonth) + 1;

      // For quarterly reports
      if (reportType === "quarterly") {
        const quarterMonths = quarters[selectedQuarter];
        const allQuarterScores: KPIScore[] = [];

        for (const month of quarterMonths) {
          const monthIdx = months.indexOf(month) + 1;
          try {
            const response = await api.get(`/kpi/report/monthly`, {
              params: {
                month: monthIdx,
                year: selectedYear,
              },
            });

            if (response.data.success && response.data.data) {
              const scores = response.data.data.allScores || [];
              allQuarterScores.push(...scores);
            }
          } catch (e) {
            console.error(`Error fetching data for ${month}:`, e);
          }
        }

        // If no scores found, use users data for display
        if (allQuarterScores.length === 0 && usersData.length > 0) {
          const placeholderScores = usersData.map((user, index) => ({
            _id: `placeholder-${user._id}`,
            userId: {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              employeeId:
                user.employeeId || `EMP${String(index + 1).padStart(4, "0")}`,
              role: user.role || "employee",
            },
            departmentId: user.departmentId || {
              _id: "unknown",
              name: "Unassigned",
              code: "UNK",
            },
            month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
            year: selectedYear,
            totalScore: 0,
            performanceLevel: "needs_improvement",
            percentile: 0,
            rank: index + 1,
            totalEmployees: usersData.length,
            scores: {
              taskCompletion: { score: 0, weight: 20, weightedScore: 0 },
              qualityScore: { score: 0, weight: 20, weightedScore: 0 },
              efficiency: { score: 0, weight: 20, weightedScore: 0 },
              collaboration: { score: 0, weight: 15, weightedScore: 0 },
              innovation: { score: 0, weight: 15, weightedScore: 0 },
              attendance: { score: 0, weight: 10, weightedScore: 0 },
            },
            calculatedAt: new Date().toISOString(),
          }));
          allQuarterScores.push(...placeholderScores);
        }

        // Calculate department averages
        const deptMap = new Map();
        allQuarterScores.forEach((s) => {
          const name = s.departmentId?.name || "Unassigned";
          if (!deptMap.has(name)) {
            deptMap.set(name, {
              total: 0,
              count: 0,
              id: s.departmentId?._id || "unknown",
            });
          }
          const data = deptMap.get(name);
          data.total += s.totalScore;
          data.count++;
        });

        const departmentAverages = Array.from(deptMap.entries()).map(
          ([name, data]) => ({
            department: name,
            departmentId: data.id,
            averageScore:
              data.count > 0 ? Math.round(data.total / data.count) : 0,
            employeeCount: data.count,
          }),
        );

        const departmentNames = departmentAverages.map((d) => d.department);
        setDepartments(departmentNames);

        const total = allQuarterScores.length || usersData.length;
        const avgScore =
          allQuarterScores.length > 0
            ? Math.round(
                allQuarterScores.reduce((sum, s) => sum + s.totalScore, 0) /
                  allQuarterScores.length,
              )
            : 0;

        const distribution = {
          excellent: allQuarterScores.filter(
            (s) => s.performanceLevel === "excellent",
          ).length,
          good: allQuarterScores.filter((s) => s.performanceLevel === "good")
            .length,
          average: allQuarterScores.filter(
            (s) => s.performanceLevel === "average",
          ).length,
          needs_improvement: allQuarterScores.filter(
            (s) => s.performanceLevel === "needs_improvement",
          ).length,
        };

        const monthlyTrend = generateMonthlyTrend(allQuarterScores, usersData);

        setAllScores(allQuarterScores);
        setReportData({
          period: `${selectedQuarter} ${selectedYear}`,
          totalEmployees: total,
          averageScore: avgScore,
          distribution,
          departmentAverages,
          topPerformers: allQuarterScores.slice(0, 5),
          monthlyTrend,
          componentAverages: calculateComponentAverages(allQuarterScores),
        });
        setLoading(false);
        isFetching.current = false;
        return;
      }

      // For annual reports
      if (reportType === "annual") {
        const allYearScores: KPIScore[] = [];

        for (const month of months) {
          const monthIdx = months.indexOf(month) + 1;
          try {
            const response = await api.get(`/kpi/report/monthly`, {
              params: {
                month: monthIdx,
                year: selectedYear,
              },
            });
            if (response.data.success && response.data.data) {
              const scores = response.data.data.allScores || [];
              allYearScores.push(...scores);
            }
          } catch (e) {
            console.error(`Error fetching data for ${month}:`, e);
          }
        }

        if (allYearScores.length === 0 && usersData.length > 0) {
          const placeholderScores = usersData.map((user, index) => ({
            _id: `placeholder-${user._id}`,
            userId: {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              employeeId:
                user.employeeId || `EMP${String(index + 1).padStart(4, "0")}`,
              role: user.role || "employee",
            },
            departmentId: user.departmentId || {
              _id: "unknown",
              name: "Unassigned",
              code: "UNK",
            },
            month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
            year: selectedYear,
            totalScore: 0,
            performanceLevel: "needs_improvement",
            percentile: 0,
            rank: index + 1,
            totalEmployees: usersData.length,
            scores: {
              taskCompletion: { score: 0, weight: 20, weightedScore: 0 },
              qualityScore: { score: 0, weight: 20, weightedScore: 0 },
              efficiency: { score: 0, weight: 20, weightedScore: 0 },
              collaboration: { score: 0, weight: 15, weightedScore: 0 },
              innovation: { score: 0, weight: 15, weightedScore: 0 },
              attendance: { score: 0, weight: 10, weightedScore: 0 },
            },
            calculatedAt: new Date().toISOString(),
          }));
          allYearScores.push(...placeholderScores);
        }

        const deptMap = new Map();
        allYearScores.forEach((s) => {
          const name = s.departmentId?.name || "Unassigned";
          if (!deptMap.has(name)) {
            deptMap.set(name, {
              total: 0,
              count: 0,
              id: s.departmentId?._id || "unknown",
            });
          }
          const data = deptMap.get(name);
          data.total += s.totalScore;
          data.count++;
        });

        const departmentAverages = Array.from(deptMap.entries()).map(
          ([name, data]) => ({
            department: name,
            departmentId: data.id,
            averageScore:
              data.count > 0 ? Math.round(data.total / data.count) : 0,
            employeeCount: data.count,
          }),
        );

        const departmentNames = departmentAverages.map((d) => d.department);
        setDepartments(departmentNames);

        const total = allYearScores.length || usersData.length;
        const avgScore =
          allYearScores.length > 0
            ? Math.round(
                allYearScores.reduce((sum, s) => sum + s.totalScore, 0) /
                  allYearScores.length,
              )
            : 0;

        const distribution = {
          excellent: allYearScores.filter(
            (s) => s.performanceLevel === "excellent",
          ).length,
          good: allYearScores.filter((s) => s.performanceLevel === "good")
            .length,
          average: allYearScores.filter((s) => s.performanceLevel === "average")
            .length,
          needs_improvement: allYearScores.filter(
            (s) => s.performanceLevel === "needs_improvement",
          ).length,
        };

        const monthlyTrend = generateMonthlyTrend(allYearScores, usersData);

        setAllScores(allYearScores);
        setReportData({
          period: `${selectedYear}`,
          totalEmployees: total,
          averageScore: avgScore,
          distribution,
          departmentAverages,
          topPerformers: allYearScores.slice(0, 5),
          monthlyTrend,
          componentAverages: calculateComponentAverages(allYearScores),
        });
        setLoading(false);
        isFetching.current = false;
        return;
      }

      // For department reports
      if (reportType === "department") {
        let deptScores: KPIScore[] = [];
        const deptFilter =
          selectedDepartment !== "all" ? selectedDepartment : null;

        try {
          const response = await api.get(`/kpi/report/monthly`, {
            params: {
              month: monthIndex,
              year: selectedYear,
            },
          });

          if (response.data.success && response.data.data) {
            const allData = response.data.data.allScores || [];
            deptScores = deptFilter
              ? allData.filter(
                  (s: KPIScore) => s.departmentId?.name === deptFilter,
                )
              : allData;
          }
        } catch (e) {
          console.error("Error fetching department data:", e);
        }

        if (deptScores.length === 0 && usersData.length > 0) {
          const filteredUsers = deptFilter
            ? usersData.filter((u: any) => u.departmentId?.name === deptFilter)
            : usersData;

          deptScores = filteredUsers.map((user, index) => ({
            _id: `placeholder-${user._id}`,
            userId: {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              employeeId:
                user.employeeId || `EMP${String(index + 1).padStart(4, "0")}`,
              role: user.role || "employee",
            },
            departmentId: user.departmentId || {
              _id: "unknown",
              name: deptFilter || "Unassigned",
              code: "UNK",
            },
            month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
            year: selectedYear,
            totalScore: 0,
            performanceLevel: "needs_improvement",
            percentile: 0,
            rank: index + 1,
            totalEmployees: filteredUsers.length,
            scores: {
              taskCompletion: { score: 0, weight: 20, weightedScore: 0 },
              qualityScore: { score: 0, weight: 20, weightedScore: 0 },
              efficiency: { score: 0, weight: 20, weightedScore: 0 },
              collaboration: { score: 0, weight: 15, weightedScore: 0 },
              innovation: { score: 0, weight: 15, weightedScore: 0 },
              attendance: { score: 0, weight: 10, weightedScore: 0 },
            },
            calculatedAt: new Date().toISOString(),
          }));
        }

        if (departments.length === 0 && usersData.length > 0) {
          const deptSet = new Set(
            usersData.map((u: any) => u.departmentId?.name).filter(Boolean),
          );
          setDepartments(Array.from(deptSet));
        }

        const total =
          deptScores.length ||
          usersData.filter(
            (u) =>
              selectedDepartment === "all" ||
              u.departmentId?.name === selectedDepartment,
          ).length;

        const avgScore =
          deptScores.length > 0
            ? Math.round(
                deptScores.reduce((sum, s) => sum + s.totalScore, 0) /
                  deptScores.length,
              )
            : 0;

        const distribution = {
          excellent: deptScores.filter(
            (s) => s.performanceLevel === "excellent",
          ).length,
          good: deptScores.filter((s) => s.performanceLevel === "good").length,
          average: deptScores.filter((s) => s.performanceLevel === "average")
            .length,
          needs_improvement: deptScores.filter(
            (s) => s.performanceLevel === "needs_improvement",
          ).length,
        };

        const monthlyTrend = generateMonthlyTrend(deptScores, usersData);

        setAllScores(deptScores);
        setReportData({
          period: `${selectedMonth} ${selectedYear} - ${selectedDepartment !== "all" ? selectedDepartment : "All Departments"}`,
          totalEmployees: total,
          averageScore: avgScore,
          distribution,
          departmentAverages: [],
          topPerformers: deptScores.slice(0, 5),
          monthlyTrend,
          componentAverages: calculateComponentAverages(deptScores),
        });
        setLoading(false);
        isFetching.current = false;
        return;
      }

      // Monthly report - DEFAULT
      try {
        const response = await api.get(`/kpi/report/monthly`, {
          params: {
            month: monthIndex,
            year: selectedYear,
          },
        });

        let scores: KPIScore[] = [];
        let reportDataFromApi: any = null;

        if (response.data.success && response.data.data) {
          reportDataFromApi = response.data.data;
          scores = reportDataFromApi.allScores || [];

          if (scores.length === 0 && usersData.length > 0) {
            scores = usersData.map((user, index) => ({
              _id: `placeholder-${user._id}`,
              userId: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                employeeId:
                  user.employeeId || `EMP${String(index + 1).padStart(4, "0")}`,
                role: user.role || "employee",
              },
              departmentId: user.departmentId || {
                _id: "unknown",
                name: "Unassigned",
                code: "UNK",
              },
              month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
              year: selectedYear,
              totalScore: 0,
              performanceLevel: "needs_improvement",
              percentile: 0,
              rank: index + 1,
              totalEmployees: usersData.length,
              scores: {
                taskCompletion: { score: 0, weight: 20, weightedScore: 0 },
                qualityScore: { score: 0, weight: 20, weightedScore: 0 },
                efficiency: { score: 0, weight: 20, weightedScore: 0 },
                collaboration: { score: 0, weight: 15, weightedScore: 0 },
                innovation: { score: 0, weight: 15, weightedScore: 0 },
                attendance: { score: 0, weight: 10, weightedScore: 0 },
              },
              calculatedAt: new Date().toISOString(),
            }));
          }
        }

        setAllScores(scores);

        const deptMap = new Map();
        scores.forEach((s) => {
          const deptName = s.departmentId?.name || "Unassigned";
          const deptId = s.departmentId?._id || "unknown";

          if (!deptMap.has(deptName)) {
            deptMap.set(deptName, {
              total: 0,
              count: 0,
              id: deptId,
              name: deptName,
            });
          }
          const data = deptMap.get(deptName);
          data.total += s.totalScore;
          data.count++;
        });

        const departmentAverages = Array.from(deptMap.entries()).map(
          ([name, data]) => ({
            department: name,
            departmentId: data.id,
            averageScore:
              data.count > 0 ? Math.round(data.total / data.count) : 0,
            employeeCount: data.count,
          }),
        );

        const departmentNames = departmentAverages.map((d) => d.department);
        setDepartments(departmentNames);

        const total = scores.length || usersData.length;
        const avgScore =
          scores.length > 0
            ? Math.round(
                scores.reduce((sum, s) => sum + s.totalScore, 0) /
                  scores.length,
              )
            : 0;

        const distribution = {
          excellent: scores.filter((s) => s.performanceLevel === "excellent")
            .length,
          good: scores.filter((s) => s.performanceLevel === "good").length,
          average: scores.filter((s) => s.performanceLevel === "average")
            .length,
          needs_improvement: scores.filter(
            (s) => s.performanceLevel === "needs_improvement",
          ).length,
        };

        const report: ReportData = {
          period: `${selectedMonth} ${selectedYear}`,
          totalEmployees: total,
          averageScore: avgScore,
          distribution,
          departmentAverages:
            reportDataFromApi?.departmentAverages || departmentAverages,
          topPerformers: scores.slice(0, 5),
          monthlyTrend: generateMonthlyTrend(scores, usersData),
          componentAverages: calculateComponentAverages(scores),
        };

        setReportData(report);
        setLoading(false);
        isFetching.current = false;
        return;
      } catch (e) {
        console.error("Error fetching monthly data:", e);

        if (usersData.length > 0) {
          const scores = usersData.map((user, index) => ({
            _id: `placeholder-${user._id}`,
            userId: {
              _id: user._id,
              fullName: user.fullName,
              email: user.email,
              employeeId:
                user.employeeId || `EMP${String(index + 1).padStart(4, "0")}`,
              role: user.role || "employee",
            },
            departmentId: user.departmentId || {
              _id: "unknown",
              name: "Unassigned",
              code: "UNK",
            },
            month: `${selectedYear}-${String(monthIndex).padStart(2, "0")}`,
            year: selectedYear,
            totalScore: 0,
            performanceLevel: "needs_improvement",
            percentile: 0,
            rank: index + 1,
            totalEmployees: usersData.length,
            scores: {
              taskCompletion: { score: 0, weight: 20, weightedScore: 0 },
              qualityScore: { score: 0, weight: 20, weightedScore: 0 },
              efficiency: { score: 0, weight: 20, weightedScore: 0 },
              collaboration: { score: 0, weight: 15, weightedScore: 0 },
              innovation: { score: 0, weight: 15, weightedScore: 0 },
              attendance: { score: 0, weight: 10, weightedScore: 0 },
            },
            calculatedAt: new Date().toISOString(),
          }));
          setAllScores(scores);

          const deptMap = new Map();
          scores.forEach((s) => {
            const name = s.departmentId?.name || "Unassigned";
            if (!deptMap.has(name)) {
              deptMap.set(name, {
                total: 0,
                count: 0,
                id: s.departmentId?._id || "unknown",
              });
            }
            const data = deptMap.get(name);
            data.count++;
          });

          const departmentAverages = Array.from(deptMap.entries()).map(
            ([name, data]) => ({
              department: name,
              departmentId: data.id,
              averageScore: 0,
              employeeCount: data.count,
            }),
          );

          const departmentNames = departmentAverages.map((d) => d.department);
          setDepartments(departmentNames);

          setReportData({
            period: `${selectedMonth} ${selectedYear}`,
            totalEmployees: usersData.length,
            averageScore: 0,
            distribution: {
              excellent: 0,
              good: 0,
              average: 0,
              needs_improvement: usersData.length,
            },
            departmentAverages,
            topPerformers: [],
            monthlyTrend: generateMonthlyTrend(scores, usersData),
            componentAverages: calculateComponentAverages(scores),
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching report data:", error);
      setError(error.response?.data?.message || "Failed to fetch report data");
      toast.error(
        error.response?.data?.message || "Failed to fetch report data",
      );
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [
    reportType,
    selectedMonth,
    selectedYear,
    selectedQuarter,
    selectedDepartment,
    months,
    quarters,
    generateMonthlyTrend,
    calculateComponentAverages,
  ]);

  // ============================================================
  // EFFECT - CONTROLLED WITH FLAGS
  // ============================================================
  useEffect(() => {
    // Only fetch if:
    // 1. User has permission
    // 2. Not currently fetching
    // 3. Selected month is set
    // 4. Either first load or explicitly triggered by dependency change
    if (canManage && !isFetching.current && selectedMonth) {
      // For first load, only fetch once
      if (isFirstLoad) {
        setIsFirstLoad(false);
        fetchReportData();
        return;
      }

      // For subsequent loads, fetch when dependencies change
      fetchReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canManage,
    reportType,
    selectedMonth,
    selectedYear,
    selectedQuarter,
    selectedDepartment,
  ]);

  // ============================================================
  // PDF EXPORT FUNCTION
  // ============================================================
  const exportToPDF = () => {
    if (!reportData) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF report...");

    try {
      setExportLoading(true);

      const doc = new jsPDF("l", "mm", "a4"); // Landscape
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Palette Colors
      const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo 600
      const primaryDark: [number, number, number] = [55, 48, 163]; // Indigo 800
      const textDark: [number, number, number] = [30, 41, 59]; // Slate 800
      const textMuted: [number, number, number] = [100, 116, 139]; // Slate 500
      const cardBg: [number, number, number] = [255, 255, 255];
      const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

      // ===== HEADER BANNER =====
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 28, "F");

      // Bottom Header Border Accent
      doc.setFillColor(...primaryDark);
      doc.rect(0, 26, pageWidth, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("KPI Performance Report", margin, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(224, 231, 255);
      doc.text(
        "Enterprise Task Management System • Executive Analytics",
        margin,
        21,
      );

      // Right Header Pill Badge
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth - margin - 55, 7, 55, 14, 3, 3, "F");
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`Period: ${reportData.period}`, pageWidth - margin - 27.5, 16, {
        align: "center",
      });

      // ===== KPI SUMMARY CARDS =====
      let yPos = 36;
      const totalCards = 5;
      const cardGap = 5;
      const usableWidth = pageWidth - margin * 2;
      const cardWidth = (usableWidth - cardGap * (totalCards - 1)) / totalCards;
      const cardHeight = 20;

      const summaryCards = [
        {
          label: "Total Employees",
          val: String(reportData.totalEmployees),
          color: primaryColor,
        },
        {
          label: "Average Score",
          val: `${reportData.averageScore}%`,
          color: [16, 185, 129],
        }, // Emerald
        {
          label: "Excellent",
          val: String(reportData.distribution?.excellent || 0),
          color: [5, 150, 105],
        },
        {
          label: "Good",
          val: String(reportData.distribution?.good || 0),
          color: [37, 99, 235],
        },
        {
          label: "Needs Work",
          val: String(reportData.distribution?.needs_improvement || 0),
          color: [220, 38, 38],
        },
      ];

      summaryCards.forEach((card, idx) => {
        const x = margin + idx * (cardWidth + cardGap);

        // Card Box Shadow / Border simulation
        doc.setFillColor(226, 232, 240);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, "F");
        doc.setFillColor(...cardBg);
        doc.roundedRect(
          x + 0.5,
          yPos + 0.5,
          cardWidth - 1,
          cardHeight - 1,
          2,
          2,
          "F",
        );

        // Label
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...textMuted);
        doc.text(card.label.toUpperCase(), x + cardWidth / 2, yPos + 6, {
          align: "center",
        });

        // Value
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...(card.color as [number, number, number]));
        doc.text(card.val, x + cardWidth / 2, yPos + 15, { align: "center" });
      });

      yPos += cardHeight + 10;

      // ===== TWO COLUMN LAYOUT SETUP =====
      const colWidth = (usableWidth - 10) / 2;
      const leftColX = margin;
      const rightColX = margin + colWidth + 10;

      // ----- LEFT COLUMN 1: Component Averages -----
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryColor);
      doc.text("Component Averages", leftColX, yPos);

      const componentLabels: Record<string, string> = {
        taskCompletion: "Task Completion",
        qualityScore: "Quality Score",
        efficiency: "Efficiency",
        collaboration: "Collaboration",
        innovation: "Innovation",
        attendance: "Attendance",
      };

      const componentData = Object.entries(
        reportData.componentAverages || {},
      ).map(([key, value]) => [componentLabels[key] || key, `${value}%`]);

      autoTable(doc, {
        startY: yPos + 3,
        head: [["Component", "Score"]],
        body: componentData,
        theme: "striped",
        tableWidth: colWidth,
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontSize: 8.5,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 8, textColor: textDark },
        columnStyles: {
          0: { cellWidth: colWidth * 0.7 },
          1: { cellWidth: colWidth * 0.3, halign: "center", fontStyle: "bold" },
        },
        margin: { left: leftColX },
      });

      let leftY = (doc as any).lastAutoTable.finalY + 8;

      // ----- LEFT COLUMN 2: Department Averages -----
      if (
        reportData.departmentAverages &&
        reportData.departmentAverages.length > 0
      ) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("Department Breakdown", leftColX, leftY);

        const deptData = reportData.departmentAverages.map((dept: any) => [
          dept.department,
          `${dept.averageScore}%`,
          String(dept.employeeCount),
        ]);

        autoTable(doc, {
          startY: leftY + 3,
          head: [["Department", "Avg Score", "Employees"]],
          body: deptData,
          theme: "striped",
          tableWidth: colWidth,
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 8.5,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8, textColor: textDark },
          columnStyles: {
            0: { cellWidth: colWidth * 0.5 },
            1: {
              cellWidth: colWidth * 0.25,
              halign: "center",
              fontStyle: "bold",
            },
            2: { cellWidth: colWidth * 0.25, halign: "center" },
          },
          margin: { left: leftColX },
        });
      }

      // ----- RIGHT COLUMN 1: Top Performers -----
      let rightY = yPos;

      if (reportData.topPerformers && reportData.topPerformers.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("Top Performers", rightColX, rightY);

        const performerData = reportData.topPerformers.map(
          (performer: any, index: number) => [
            `#${index + 1}`,
            performer.userId?.fullName || "N/A",
            performer.departmentId?.name || "N/A",
            `${performer.totalScore}%`,
          ],
        );

        autoTable(doc, {
          startY: rightY + 3,
          head: [["Rank", "Name", "Department", "Score"]],
          body: performerData,
          theme: "striped",
          tableWidth: colWidth,
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 8.5,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8, textColor: textDark },
          columnStyles: {
            0: {
              cellWidth: colWidth * 0.15,
              halign: "center",
              fontStyle: "bold",
            },
            1: { cellWidth: colWidth * 0.45 },
            2: { cellWidth: colWidth * 0.25 },
            3: {
              cellWidth: colWidth * 0.15,
              halign: "center",
              fontStyle: "bold",
            },
          },
          margin: { left: rightColX },
        });

        rightY = (doc as any).lastAutoTable.finalY + 8;
      }

      // ----- RIGHT COLUMN 2: Monthly Trend -----
      if (reportData.monthlyTrend && reportData.monthlyTrend.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryColor);
        doc.text("Monthly Trend", rightColX, rightY);

        const trendData = reportData.monthlyTrend.map((trend: any) => [
          trend.month,
          `${trend.averageScore}%`,
          String(trend.employeeCount),
        ]);

        autoTable(doc, {
          startY: rightY + 3,
          head: [["Month", "Avg Score", "Employees"]],
          body: trendData,
          theme: "striped",
          tableWidth: colWidth,
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 8.5,
            fontStyle: "bold",
          },
          bodyStyles: { fontSize: 8, textColor: textDark },
          columnStyles: {
            0: { cellWidth: colWidth * 0.4 },
            1: {
              cellWidth: colWidth * 0.3,
              halign: "center",
              fontStyle: "bold",
            },
            2: { cellWidth: colWidth * 0.3, halign: "center" },
          },
          margin: { left: rightColX },
        });
      }

      // ===== PAGE FOOTERS =====
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer Divider
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFontSize(7.5);
        doc.setTextColor(...textMuted);
        doc.setFont("helvetica", "normal");
        doc.text(
          "Confidential • Enterprise Task Management System",
          margin,
          pageHeight - 6,
        );
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 6,
          {
            align: "right",
          },
        );
      }

      // Save Output
      const cleanPeriod = (reportData.period || "Report").replace(/\s+/g, "_");
      doc.save(`KPI_Executive_Report_${cleanPeriod}.pdf`);

      toast.success("PDF exported successfully!", { id: toastId });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF", { id: toastId });
    } finally {
      setExportLoading(false);
    }
  };

  // ============================================================
  // HANDLE CSV EXPORT
  // ============================================================
  const handleExportCSV = () => {
    if (!reportData) {
      toast.error("No data to export");
      return;
    }

    try {
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
        "Rank",
        "Percentile",
      ];

      const rows =
        allScores.length > 0
          ? allScores.map((score) => [
              score.userId.fullName,
              score.departmentId.name,
              score.totalScore.toFixed(1),
              score.performanceLevel.replace("_", " "),
              score.scores.taskCompletion.score.toFixed(1),
              score.scores.qualityScore.score.toFixed(1),
              score.scores.efficiency.score.toFixed(1),
              score.scores.collaboration.score.toFixed(1),
              score.scores.innovation.score.toFixed(1),
              score.scores.attendance.score.toFixed(1),
              score.rank || "N/A",
              score.percentile || "N/A",
            ])
          : [["No data available", "", "", "", "", "", "", "", "", "", "", ""]];

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n",
      );
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KPI_Report_${reportData.period.replace(/\s/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error("Export error:", error);
    }
  };

  // ============================================================
  // HANDLE EXPORT MENU
  // ============================================================
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================
  const getPerformanceConfig = (level: string) => {
    const config = {
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
    return config[level as keyof typeof config] || config.average;
  };

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  const getTrendDirection = (data: any[]) => {
    if (data.length < 2) return "stable";
    const first = data[0]?.averageScore || 0;
    const last = data[data.length - 1]?.averageScore || 0;
    if (last > first) return "up";
    if (last < first) return "down";
    return "stable";
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-rose-500" />
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
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
            <span className="text-gray-700 font-medium">KPI Reports</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    KPI Reports
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Comprehensive performance reports and analytics
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Export Dropdown */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!reportData || exportLoading}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg disabled:opacity-50"
                >
                  {exportLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  Export
                  <ChevronDown size={14} />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                      <FileText size={14} />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        exportToPDF();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                      <FileDown size={14} />
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={fetchReportData}
                disabled={loading}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Report Type Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200 shadow-sm"
          >
            <div className="flex flex-wrap gap-1">
              {[
                { type: "monthly", icon: Calendar, label: "Monthly" },
                { type: "quarterly", icon: Layers, label: "Quarterly" },
                { type: "annual", icon: BarChart3, label: "Annual" },
                { type: "department", icon: Building2, label: "Department" },
              ].map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => setReportType(tab.type as ReportType)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${
                    reportType === tab.type
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/80"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-sm"
          >
            <div className="flex flex-wrap gap-4 items-end">
              {(reportType === "monthly" || reportType === "department") && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setIsFirstLoad(false);
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                        setIsFirstLoad(false);
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      {[2023, 2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {reportType === "quarterly" && (
                <>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Quarter
                    </label>
                    <select
                      value={selectedQuarter}
                      onChange={(e) => {
                        setSelectedQuarter(e.target.value as Quarter);
                        setIsFirstLoad(false);
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      <option value="Q1">Q1 (Jan - Mar)</option>
                      <option value="Q2">Q2 (Apr - Jun)</option>
                      <option value="Q3">Q3 (Jul - Sep)</option>
                      <option value="Q4">Q4 (Oct - Dec)</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                        setIsFirstLoad(false);
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      {[2023, 2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {reportType === "annual" && (
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value));
                      setIsFirstLoad(false);
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    {[2023, 2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reportType === "department" && (
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setIsFirstLoad(false);
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => {
                  setIsFirstLoad(false);
                  fetchReportData();
                }}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Generate Report
              </button>
            </div>
          </motion.div>

          {/* Report Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">
                  Generating report...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Failed to Load Report
              </h3>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={() => {
                  setIsFirstLoad(false);
                  fetchReportData();
                }}
                disabled={loading}
                className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/20 disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Report Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {[
                  {
                    label: "Total Employees",
                    value: reportData.totalEmployees,
                    icon: Users,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                    border: "border-indigo-200",
                  },
                  {
                    label: "Average Score",
                    value: `${reportData.averageScore}%`,
                    icon: Target,
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                    border: "border-purple-200",
                  },
                  {
                    label: "Excellent",
                    value: reportData.distribution.excellent,
                    icon: Crown,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-200",
                  },
                  {
                    label: "Needs Improvement",
                    value: reportData.distribution.needs_improvement,
                    icon: AlertCircle,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${stat.bg} rounded-2xl p-5 border ${stat.border} shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {stat.value}
                        </p>
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
                    <div className="mt-2 h-0.5 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Charts Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Distribution Chart */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <PieChartIcon size={16} className="text-indigo-500" />
                    </div>
                    Performance Distribution
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: "Excellent",
                              value: reportData.distribution.excellent,
                            },
                            {
                              name: "Good",
                              value: reportData.distribution.good,
                            },
                            {
                              name: "Average",
                              value: reportData.distribution.average,
                            },
                            {
                              name: "Needs Improvement",
                              value: reportData.distribution.needs_improvement,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "12px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Component Averages */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Target size={16} className="text-purple-500" />
                    </div>
                    Component Averages
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.componentAverages).map(
                      ([key, value]) => {
                        const labels: Record<string, string> = {
                          taskCompletion: "Task Completion",
                          qualityScore: "Quality Score",
                          efficiency: "Efficiency",
                          collaboration: "Collaboration",
                          innovation: "Innovation",
                          attendance: "Attendance",
                        };
                        const colors: Record<string, string> = {
                          taskCompletion: "#10b981",
                          qualityScore: "#3b82f6",
                          efficiency: "#8b5cf6",
                          collaboration: "#f59e0b",
                          innovation: "#ec4899",
                          attendance: "#14b8a6",
                        };
                        const emojis: Record<string, string> = {
                          taskCompletion: "✅",
                          qualityScore: "⭐",
                          efficiency: "⚡",
                          collaboration: "🤝",
                          innovation: "💡",
                          attendance: "📅",
                        };
                        return (
                          <div key={key} className="group">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 flex items-center gap-2">
                                <span>
                                  {emojis[key as keyof typeof emojis]}
                                </span>
                                {labels[key as keyof typeof labels] || key}
                              </span>
                              <span className="font-semibold text-gray-800">
                                {value}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 mt-1 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    colors[key as keyof typeof colors] ||
                                    "#6366f1",
                                }}
                              />
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Trend Chart */}
              {reportData.monthlyTrend &&
                reportData.monthlyTrend.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <TrendingUp size={16} className="text-emerald-500" />
                        </div>
                        Performance Trend
                      </h3>
                      <div className="flex items-center gap-2">
                        {getTrendDirection(reportData.monthlyTrend) ===
                          "up" && (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                            <TrendingUp size={12} />
                            Improving
                          </span>
                        )}
                        {getTrendDirection(reportData.monthlyTrend) ===
                          "down" && (
                          <span className="text-xs font-medium text-rose-600 bg-rose-50 px-3 py-1 rounded-full flex items-center gap-1">
                            <TrendingDown size={12} />
                            Declining
                          </span>
                        )}
                        {getTrendDirection(reportData.monthlyTrend) ===
                          "stable" && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                            <MinusCircle size={12} />
                            Stable
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={reportData.monthlyTrend}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              padding: "12px",
                            }}
                            formatter={(value: any) => `${value}%`}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="averageScore"
                            name="Average Score"
                            stroke="#6366f1"
                            fill="#818cf8"
                            fillOpacity={0.2}
                          />
                          <Line
                            type="monotone"
                            dataKey="averageScore"
                            name="Average Score"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}

              {/* Department Averages */}
              {reportData.departmentAverages &&
                reportData.departmentAverages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center">
                        <Building2 size={16} className="text-cyan-500" />
                      </div>
                      Department Averages
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {reportData.departmentAverages
                        .sort((a, b) => b.averageScore - a.averageScore)
                        .map((dept, index) => (
                          <motion.div
                            key={
                              typeof dept.departmentId === "string"
                                ? dept.departmentId
                                : `dept-${index}`
                            }
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-50/80 hover:bg-gray-100/80 rounded-xl p-4 border border-gray-200 transition-all duration-200 group cursor-pointer"
                          >
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {typeof dept.department === "string"
                                ? dept.department
                                : "Unknown Department"}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-2xl font-bold text-indigo-600">
                                {dept.averageScore}%
                              </span>
                              <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">
                                {dept.employeeCount} employees
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${dept.averageScore}%` }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              />
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}

              {/* Top Performers */}
              {reportData.topPerformers &&
                reportData.topPerformers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Crown size={16} className="text-amber-500" />
                      </div>
                      Top Performers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {reportData.topPerformers.map((performer, index) => {
                        const perfConfig = getPerformanceConfig(
                          performer.performanceLevel,
                        );
                        return (
                          <motion.div
                            key={performer._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50/50 to-transparent rounded-xl border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200 group"
                            onClick={() =>
                              router.push(
                                `/kpi/employee/${performer.userId._id}`,
                              )
                            }
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600 transition">
                                {performer.userId.fullName}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {performer.departmentId.name}
                              </p>
                            </div>
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {formatScore(performer.totalScore)}%
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

              {/* Report Period Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gray-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 text-center text-sm"
              >
                <p className="text-gray-500 flex items-center justify-center gap-2 flex-wrap">
                  <FileText size={14} className="text-indigo-400" />
                  Report generated for{" "}
                  <span className="font-semibold text-gray-700">
                    {reportData.period}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  {reportData.totalEmployees} employees evaluated
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  Average score:{" "}
                  <span className="font-semibold text-indigo-600">
                    {reportData.averageScore}%
                  </span>
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Report Data
              </h3>
              <p className="text-gray-500">
                Select a report type and generate a report
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
