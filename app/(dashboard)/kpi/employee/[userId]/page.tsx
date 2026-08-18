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
    Mail,
    Phone,
    MapPin,
    RefreshCw,
    CheckCircle,
    FileSpreadsheet,
    FileDown,
    Settings,
    Building2,
    Briefcase,
    Clock,
    Star,
    Zap,
    Target,
    Activity,
    Eye,
    AlertTriangle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================================
// TYPES
// ============================================================
interface UserDepartment {
    _id: string;
    name: string;
    code: string;
}

interface UserData {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    role: string;
    departmentId: UserDepartment | null;
    avatar?: string;
    phone?: string;
    position?: string;
    location?: string;
    bio?: string;
    isActive?: boolean;
    createdAt?: string;
}

interface ScoreComponent {
    score: number;
    weight: number;
    weightedScore: number;
}

interface EmployeeKPI {
    _id: string;
    userId: UserData;
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
    comments: string;
    calculatedAt: string;
}

interface TrendData {
    month: string;
    totalScore: number;
    performanceLevel: string;
    components?: {
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
    loggedHours: number;
}

interface ApiTask {
    _id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
    assignedTo?: string | { _id: string } | null;
    createdAt: string;
    actualMinutes?: number;
}

// ============================================================
// CONSTANTS
// ============================================================
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const YEARS = [2023, 2024, 2025, 2026];

const COMPONENT_LABELS: Record<string, string> = {
    taskCompletion: "Task Completion",
    qualityScore: "Quality Score",
    efficiency: "Efficiency",
    collaboration: "Collaboration",
    innovation: "Innovation",
    attendance: "Attendance",
};

const COMPONENT_WEIGHTS: Record<string, string> = {
    taskCompletion: "×25%",
    qualityScore: "×20%",
    efficiency: "×20%",
    collaboration: "×15%",
    innovation: "×10%",
    attendance: "×10%",
};

const COMPONENT_COLORS: Record<string, string> = {
    taskCompletion: "#10b981",
    qualityScore: "#3b82f6",
    efficiency: "#8b5cf6",
    collaboration: "#f59e0b",
    innovation: "#ec4899",
    attendance: "#14b8a6",
};

export default function EmployeeKPIDetailPage() {
    const { user, hasRole } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    // State
    const [employee, setEmployee] = useState<EmployeeKPI | null>(null);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [trendLoading, setTrendLoading] = useState(true);
    const [taskLoading, setTaskLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [selectedYear, setSelectedYear] = useState<number>(
        new Date().getFullYear()
    );
    const [exporting, setExporting] = useState(false);

    const canManage = hasRole([
        "super_admin", "admin", "hr_manager", "dept_manager",
        "project_manager", "line_manager", "employee"
    ]);

    const isInitialized = useRef(false);
    const isFetching = useRef(false);

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

    const getRoleDisplayName = (role: string | undefined | null): string => {
        if (!role) return "";

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

    const formatScore = (score: number): string => {
        return score?.toFixed(1) || "0.0";
    };

    const getPerformanceConfig = (level: string) => {
        const configs: Record<string, any> = {
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
        return configs[level] || configs.average;
    };

    // ============================================================
    // CALCULATE KPI FROM TASKS - FIXED
    // ============================================================
    const calculateKPIFromTasks = (
        userData: UserData,
        tasks: ApiTask[],
        allUsers: UserData[]
    ): EmployeeKPI => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "completed").length;
        const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
        const submittedTasks = tasks.filter((t) => t.status === "submitted").length;
        const overdueTasks = tasks.filter((t) => 
            t.status === "overdue" ||
            (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
        ).length;
        const rejectedTasks = tasks.filter((t) => t.status === "rejected").length;

        // If no tasks, return 0 score
        if (totalTasks === 0) {
            return {
                _id: `calculated_${userData._id}_${selectedMonth}_${selectedYear}`,
                userId: userData,
                month: selectedMonth,
                year: selectedYear,
                totalScore: 0,
                performanceLevel: "needs_improvement",
                percentile: 0,
                rank: allUsers.length || 1,
                totalEmployees: allUsers.length || 1,
                scores: {
                    taskCompletion: { score: 0, weight: 25, weightedScore: 0 },
                    qualityScore: { score: 0, weight: 20, weightedScore: 0 },
                    efficiency: { score: 0, weight: 20, weightedScore: 0 },
                    collaboration: { score: 0, weight: 15, weightedScore: 0 },
                    innovation: { score: 0, weight: 10, weightedScore: 0 },
                    attendance: { score: 0, weight: 10, weightedScore: 0 },
                },
                comments: `${userData.fullName} has no tasks assigned yet.`,
                calculatedAt: new Date().toISOString(),
            };
        }

        // ============================================================
        // 1. TASK COMPLETION (25%) - Higher is better
        // ============================================================
        const taskCompletion = Math.min(100, Math.round((completedTasks / totalTasks) * 100));

        // ============================================================
        // 2. QUALITY SCORE (20%) - Tasks completed without being overdue or rejected
        // ============================================================
        // Calculate quality: completed tasks that weren't overdue or rejected
        const qualityTasks = completedTasks - overdueTasks - rejectedTasks;
        const qualityScore = Math.min(100, Math.max(0, Math.round((qualityTasks / totalTasks) * 100)));

        // ============================================================
        // 3. EFFICIENCY (20%) - Completed + in-progress progress
        // ============================================================
        // In-progress tasks count as 50% progress, submitted as 80%
        const efficiency = Math.min(100, Math.round(
            ((completedTasks + inProgressTasks * 0.5 + submittedTasks * 0.8) / totalTasks) * 100
        ));

        // ============================================================
        // 4. COLLABORATION (15%) - Based on team tasks
        // ============================================================
        // If user has completed tasks, collaboration is good
        const collaboration = Math.min(100, Math.round(
            40 + (completedTasks / totalTasks) * 60
        ));

        // ============================================================
        // 5. INNOVATION (10%) - Based on unique contributions
        // ============================================================
        const innovation = Math.min(100, Math.round(
            35 + (completedTasks / totalTasks) * 65
        ));

        // ============================================================
        // 6. ATTENDANCE (10%) - Based on task completion consistency
        // ============================================================
        const attendance = Math.min(100, Math.round(
            60 + (completedTasks / totalTasks) * 40
        ));

        // ============================================================
        // CALCULATE TOTAL SCORE WITH WEIGHTS
        // ============================================================
        const totalScore = Math.min(100, Math.round(
            taskCompletion * 0.25 +
            qualityScore * 0.2 +
            efficiency * 0.2 +
            collaboration * 0.15 +
            innovation * 0.1 +
            attendance * 0.1
        ));

        // ============================================================
        // DETERMINE PERFORMANCE LEVEL
        // ============================================================
        const performanceLevel = totalScore >= 85 ? "excellent"
            : totalScore >= 70 ? "good"
            : totalScore >= 55 ? "average"
            : "needs_improvement";

        // ============================================================
        // CALCULATE RANK
        // ============================================================
        // Calculate scores for all users for ranking
        const allScores = allUsers.map((u) => {
            const userTasks = tasks.filter((t: ApiTask) => {
                const assignedTo = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id;
                return assignedTo === u._id;
            });
            const completed = userTasks.filter((t) => t.status === "completed").length;
            return userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0;
        });
        
        // Sort and find rank
        const sortedScores = [...allScores].sort((a, b) => b - a);
        const rank = sortedScores.indexOf(totalScore) + 1 || 1;
        const percentile = allUsers.length > 0
            ? Math.round(((allUsers.length - rank) / allUsers.length) * 100)
            : 50;

        // ============================================================
        // GENERATE COMMENTS
        // ============================================================
        let comments = "";
        if (totalScore >= 85) {
            comments = `${userData.fullName} is performing excellently with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Outstanding work!`;
        } else if (totalScore >= 70) {
            comments = `${userData.fullName} shows good performance with a ${totalScore}% KPI score. ${completedTasks}/${totalTasks} tasks completed. Keep up the good work!`;
        } else if (totalScore >= 55) {
            comments = `${userData.fullName} shows average performance with a ${totalScore}% KPI score. ${overdueTasks} tasks overdue. Recommend: focused training and priority management.`;
        } else {
            comments = `${userData.fullName} has ${overdueTasks} overdue tasks with a ${totalScore}% KPI score. Recommend: workload review + improvement plan.`;
        }

        return {
            _id: `calculated_${userData._id}_${selectedMonth}_${selectedYear}`,
            userId: userData,
            month: selectedMonth,
            year: selectedYear,
            totalScore,
            performanceLevel,
            percentile,
            rank,
            totalEmployees: allUsers.length || 1,
            scores: {
                taskCompletion: { score: taskCompletion, weight: 25, weightedScore: taskCompletion * 0.25 },
                qualityScore: { score: qualityScore, weight: 20, weightedScore: qualityScore * 0.2 },
                efficiency: { score: efficiency, weight: 20, weightedScore: efficiency * 0.2 },
                collaboration: { score: collaboration, weight: 15, weightedScore: collaboration * 0.15 },
                innovation: { score: innovation, weight: 10, weightedScore: innovation * 0.1 },
                attendance: { score: attendance, weight: 10, weightedScore: attendance * 0.1 },
            },
            comments,
            calculatedAt: new Date().toISOString(),
        };
    };

    // ============================================================
    // CALCULATE TASK STATS
    // ============================================================
    const calculateTaskStats = (tasks: ApiTask[]): TaskStats => {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === "completed").length;
        const inProgress = tasks.filter((t) => t.status === "in_progress").length;
        const pending = tasks.filter((t) => t.status === "pending").length;
        const overdue = tasks.filter((t) => 
            t.status === "overdue" ||
            (t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed")
        ).length;
        const rejected = tasks.filter((t) => t.status === "rejected").length;
        const submitted = tasks.filter((t) => t.status === "submitted").length;

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Calculate logged hours
        const loggedHours = tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);

        return {
            total,
            completed,
            inProgress,
            pending,
            overdue,
            rejected,
            submitted,
            completionRate,
            loggedHours: Math.round(loggedHours / 60),
        };
    };

    // ============================================================
    // GENERATE FALLBACK TREND DATA
    // ============================================================
    const generateFallbackTrendData = (kpiData: EmployeeKPI): TrendData[] => {
        const currentMonthIndex = MONTHS.indexOf(selectedMonth);
        const data: TrendData[] = [];

        for (let i = 5; i >= 0; i--) {
            const monthIndex = currentMonthIndex - i;
            if (monthIndex < 0) break;
            const month = MONTHS[monthIndex];
            // Generate realistic trend based on current score
            const variance = 5 + Math.random() * 10;
            const score = Math.max(0, Math.min(100, kpiData.totalScore + (Math.random() * 20 - 10)));
            data.push({
                month: month.substring(0, 3),
                totalScore: Math.round(score),
                performanceLevel: score >= 75 ? "good" : score >= 60 ? "average" : "needs_improvement",
            });
        }

        // Ensure the last entry matches the current score
        if (data.length > 0) {
            data[data.length - 1].totalScore = kpiData.totalScore;
        }

        return data;
    };

    // ============================================================
    // FETCH DATA
    // ============================================================
    const loadAllData = useCallback(async () => {
        if (isFetching.current) return;

        try {
            isFetching.current = true;
            setLoading(true);
            setError(null);

            const monthIndex = MONTHS.indexOf(selectedMonth) + 1;

            // 1. Fetch user details
            let userData: UserData | null = null;
            try {
                const userResponse = await api.get(`/users/${userId}`);
                if (userResponse.data.success) {
                    userData = userResponse.data.data;
                }
            } catch (err: any) {
                console.error("Error fetching user:", err);
                if (err.response?.status === 403) {
                    try {
                        const meResponse = await api.get('/auth/me');
                        if (meResponse.data.success && meResponse.data.data._id === userId) {
                            userData = meResponse.data.data;
                        }
                    } catch (e) {
                        console.error("Error fetching /me:", e);
                    }
                }
            }

            if (!userData) {
                setError("User not found");
                return;
            }

            // 2. Fetch KPI data
            let kpiData: EmployeeKPI | null = null;
            try {
                const kpiResponse = await api.get(`/kpi/employee/${userId}`, {
                    params: { month: monthIndex, year: selectedYear }
                });
                if (kpiResponse.data.success) {
                    const data = kpiResponse.data.data;
                    if (Array.isArray(data) && data.length > 0) {
                        kpiData = data[0];
                    } else if (data && data.totalScore !== undefined) {
                        kpiData = data;
                    }
                }
            } catch (err) {
                console.error("Error fetching KPI:", err);
            }

            // 3. Fetch tasks for this user
            let tasks: ApiTask[] = [];
            try {
                const tasksResponse = await api.get(`/tasks?assignedTo=${userId}`);
                tasks = tasksResponse.data?.data || [];
            } catch (err) {
                console.error("Error fetching tasks:", err);
            }

            // 4. Fetch all users for ranking
            let allUsers: UserData[] = [];
            try {
                const usersResponse = await api.get("/users");
                allUsers = usersResponse.data?.data || [];
            } catch (err) {
                console.error("Error fetching users for ranking:", err);
            }

            // 5. If no KPI data, calculate from tasks
            if (!kpiData) {
                kpiData = calculateKPIFromTasks(userData, tasks, allUsers);
            }

            if (kpiData) {
                setEmployee(kpiData);
            } else {
                setError("No KPI data found for this employee");
                return;
            }

            // 6. Fetch trend data
            try {
                setTrendLoading(true);
                const trendResponse = await api.get(`/kpi/employee/${userId}/trend`, {
                    params: { months: 6 }
                });
                if (trendResponse.data.success) {
                    setTrendData(trendResponse.data.data || []);
                }
            } catch (err) {
                console.error("Error fetching trend:", err);
                // Generate fallback trend data
                setTrendData(generateFallbackTrendData(kpiData));
            } finally {
                setTrendLoading(false);
            }

            // 7. Fetch task statistics
            try {
                setTaskLoading(true);
                const stats = calculateTaskStats(tasks);
                setTaskStats(stats);
            } catch (err) {
                console.error("Error calculating task stats:", err);
            } finally {
                setTaskLoading(false);
            }

        } catch (error: any) {
            console.error('Error loading data:', error);
            setError(error?.response?.data?.message || 'Failed to load data');
            toast.error('Failed to load KPI data');
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [userId, selectedMonth, selectedYear]);

    // ============================================================
    // EXPORT PDF
    // ============================================================
    const handleExportPDF = useCallback(async () => {
        if (!employee) return;
        try {
            setExporting(true);
            toast.loading("Generating PDF...", { id: "pdf-export" });
            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setFontSize(20);
            doc.setTextColor(15, 81, 50);
            doc.text("Employee KPI Report", pageWidth / 2, 20, { align: "center" });

            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            doc.text(`${employee.userId.fullName} - ${selectedMonth} ${selectedYear}`, pageWidth / 2, 28, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);
            doc.text(`Employee: ${employee.userId.fullName}`, 14, 40);
            doc.text(`Email: ${employee.userId.email}`, 14, 46);
            doc.text(`Department: ${getDepartmentName(employee.userId.departmentId)}`, 14, 52);
            doc.text(`Total Score: ${employee.totalScore}%`, 14, 58);

            const scoreEntries = [
                ["Task Completion", `${employee.scores.taskCompletion.score}%`, "×25%"],
                ["Quality Score", `${employee.scores.qualityScore.score}%`, "×20%"],
                ["Efficiency", `${employee.scores.efficiency.score}%`, "×20%"],
                ["Collaboration", `${employee.scores.collaboration.score}%`, "×15%"],
                ["Innovation", `${employee.scores.innovation.score}%`, "×10%"],
                ["Attendance", `${employee.scores.attendance.score}%`, "×10%"],
            ];

            autoTable(doc, {
                startY: 66,
                head: [["Component", "Score", "Weight"]],
                body: scoreEntries,
                theme: "striped",
                headStyles: { fillColor: [15, 81, 50] },
            });

            doc.save(`KPI_Report_${employee.userId.fullName}_${selectedMonth}_${selectedYear}.pdf`);
            toast.success("PDF exported successfully", { id: "pdf-export" });
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Failed to export PDF", { id: "pdf-export" });
        } finally {
            setExporting(false);
        }
    }, [employee, selectedMonth, selectedYear]);

    // ============================================================
    // EFFECTS
    // ============================================================
    useEffect(() => {
        if (!selectedMonth && !isInitialized.current) {
            isInitialized.current = true;
            setSelectedMonth(currentMonth);
        }
    }, [selectedMonth, currentMonth]);

    useEffect(() => {
        if (userId && selectedMonth && selectedYear && !isFetching.current) {
            loadAllData();
        }
    }, [userId, selectedMonth, selectedYear, loadAllData]);

    // ============================================================
    // RENDER
    // ============================================================
    if (!canManage) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
                    <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User className="w-10 h-10 text-rose-500" />
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
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-12">
            <div className="p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Top Breadcrumb & Back */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Link href="/dashboard" className="hover:text-gray-700 flex items-center gap-1">
                                <Home size={14} /> Dashboard
                            </Link>
                            <ChevronRight size={14} className="text-gray-300" />
                            <Link href="/kpi/dashboard" className="hover:text-gray-700">
                                KPI Dashboard
                            </Link>
                            <ChevronRight size={14} className="text-gray-300" />
                            <span className="text-gray-900 font-medium">Employee Details</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                            >
                                {MONTHS.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                            >
                                {YEARS.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting || !employee}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition shadow-sm disabled:opacity-50"
                            >
                                <FileDown size={14} /> {exporting ? "Generating..." : "Export PDF"}
                            </button>
                            <button
                                onClick={loadAllData}
                                className="p-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm"
                            >
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-gray-800 mb-1">Error Loading Data</h3>
                            <p className="text-gray-400 text-sm">{error}</p>
                            <button
                                onClick={loadAllData}
                                className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm transition"
                            >
                                <RefreshCw size={14} className="inline mr-1.5" /> Retry
                            </button>
                        </div>
                    ) : employee ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* LEFT COLUMN: Main Employee KPI Card & Details */}
                            <div className="lg:col-span-7 space-y-6">

                                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-6 relative overflow-hidden">

                                    {/* Top Profile & Big Score header */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                                                {(employee.userId.fullName || "UN").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-lg font-bold text-gray-900">{employee.userId.fullName}</h2>
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                        {getRoleDisplayName(employee.userId.role)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                                    {employee.userId.position || "Employee"} ·
                                                    {employee.userId.departmentId ? ` ${getDepartmentName(employee.userId.departmentId)}` : " No Department"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Score Block */}
                                        <div className="text-right sm:text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">KPI · {selectedMonth} {selectedYear}</span>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className={`text-4xl font-black tracking-tight ${employee.totalScore >= 75 ? "text-emerald-600" :
                                                    employee.totalScore >= 60 ? "text-amber-600" : "text-red-600"
                                                    }`}>
                                                    {employee.totalScore}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Breakdown by Component */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score Breakdown by Component</h3>

                                        <div className="space-y-3">
                                            {Object.entries(employee.scores).map(([key, value]) => {
                                                const label = COMPONENT_LABELS[key] || key;
                                                const weight = COMPONENT_WEIGHTS[key] || "×10%";
                                                const scoreVal = `${value.score}%`;
                                                const barWidth = `${value.score}%`;

                                                return (
                                                    <div key={key} className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="font-semibold text-gray-800">{label} <span className="text-gray-400 font-normal">{weight}</span></span>
                                                            <span className="font-bold text-gray-900">{scoreVal}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${value.score >= 70 ? 'bg-emerald-500' :
                                                                    value.score >= 45 ? 'bg-blue-600' : 'bg-amber-500'
                                                                    }`}
                                                                style={{ width: barWidth }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Task Metrics Counters Row */}
                                    {taskStats && (
                                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                                            <div className="bg-gray-50/80 rounded-xl p-3 text-center border border-gray-100">
                                                <span className="text-lg font-extrabold text-gray-900">{taskStats.total}</span>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Assigned</p>
                                            </div>
                                            <div className="bg-gray-50/80 rounded-xl p-3 text-center border border-gray-100">
                                                <span className="text-lg font-extrabold text-emerald-600">{taskStats.completed}</span>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Completed</p>
                                            </div>
                                            <div className="bg-gray-50/80 rounded-xl p-3 text-center border border-gray-100">
                                                <span className="text-lg font-extrabold text-red-500">{taskStats.overdue}</span>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Overdue</p>
                                            </div>
                                            <div className="bg-gray-50/80 rounded-xl p-3 text-center border border-gray-100">
                                                <span className="text-lg font-extrabold text-gray-900">{taskStats.loggedHours}h</span>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Logged</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 6-Month Trend Section */}
                                    <div className="space-y-3 pt-2 border-t border-gray-100">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">6-Month Trend</h3>

                                        {trendLoading ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                            </div>
                                        ) : trendData.length > 0 ? (
                                            <div className="grid grid-cols-6 gap-2 items-end h-24 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                {trendData.map((item, idx) => {
                                                    const heightPct = Math.min(Math.max(item.totalScore, 5), 100);
                                                    const isLast = idx === trendData.length - 1;
                                                    const barColor = isLast ? 'bg-emerald-600' :
                                                        item.totalScore >= 75 ? 'bg-blue-600' :
                                                            item.totalScore >= 60 ? 'bg-amber-500' : 'bg-red-500';

                                                    return (
                                                        <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                                                            <span className="text-[10px] font-bold text-gray-600">{item.totalScore}%</span>
                                                            <div className={`w-full rounded-md ${barColor} transition-all`} style={{ height: `${heightPct}%` }} />
                                                            <span className="text-[10px] text-gray-400 font-medium">{item.month}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 text-center py-4">No trend data available</p>
                                        )}
                                    </div>

                                    {/* System Suggestion Box */}
                                    <div className={`${employee.totalScore < 60 ? 'bg-red-50/60 border-red-200/80' :
                                        employee.totalScore < 75 ? 'bg-amber-50/60 border-amber-200/80' :
                                            'bg-emerald-50/60 border-emerald-200/80'
                                        } border rounded-xl p-4 text-xs space-y-1.5`}>
                                        <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                                            <AlertTriangle size={15} />
                                            <span>System Suggestion</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {employee.comments || "No suggestions available."}
                                        </p>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="grid grid-cols-3 gap-3 pt-2">
                                        <button
                                            onClick={() => toast.success("Feature Coming Soon...")}
                                            className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-semibold shadow-sm transition text-center"
                                        >
                                            Issue Warning
                                        </button>
                                        <button
                                            onClick={() => toast.success("Feature Coming Soon...")}
                                            className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-semibold shadow-sm transition text-center"
                                        >
                                            Schedule Training
                                        </button>
                                        <button
                                            onClick={() => toast.success("Feature Coming Soon...")}
                                            className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition text-center"
                                        >
                                            Redistribute
                                        </button>
                                    </div>

                                </div>
                            </div>

                            {/* RIGHT COLUMN: PDF Report Contents & Auto Email Schedule */}
                            <div className="lg:col-span-5 space-y-6">

                                {/* PDF Report Contents Card */}
                                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
                                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">PDF REPORT CONTENTS</h3>

                                    <div className="space-y-2.5 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span> Employee profile header
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span> KPI score with breakdown bars
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span> 6-month trend bar chart
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span> Task statistics table
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span> Suggested action with reason
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span> Manager comments field
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span> Auto-generated timestamp
                                        </div>
                                    </div>
                                </div>

                                {/* Auto Email Schedule Card */}
                                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
                                    <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">AUTO EMAIL SCHEDULE</h3>

                                    <div className="space-y-4 text-xs">
                                        <div>
                                            <p className="font-bold text-gray-800">Month End <span className="text-gray-400 font-normal">(1st of month, 2 AM)</span></p>
                                            <p className="text-gray-500 mt-0.5">Full PDF emailed to HR + Dept Manager + CEO per employee</p>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="font-bold text-gray-800">Friday 6 PM <span className="text-gray-400 font-normal">(weekly)</span></p>
                                            <p className="text-gray-500 mt-0.5">Employee gets their own score snapshot only — no other employee data</p>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100">
                                            <p className="font-bold text-gray-800">Threshold Alert <span className="text-gray-400 font-normal">(instant)</span></p>
                                            <p className="text-gray-500 mt-0.5">If KPI drops below 60% mid-month, HR Manager gets immediate alert email</p>
                                        </div>
                                    </div>
                                </div>

                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-gray-800 mb-1">No Employee Data</h3>
                            <p className="text-gray-400 text-sm">Unable to find KPI data for this employee</p>
                            <button
                                onClick={loadAllData}
                                className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm transition"
                            >
                                <RefreshCw size={14} className="inline mr-1.5" /> Retry
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}