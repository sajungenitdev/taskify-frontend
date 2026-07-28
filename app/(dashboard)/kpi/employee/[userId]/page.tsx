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
    departmentId: UserDepartment;
    avatar?: string;
    phone?: string;
    position?: string;
    location?: string;
    bio?: string;
    isActive?: boolean;
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

interface RadarDataItem {
    subject: string;
    value: number;
    fullMark: number;
}

interface ApiTask {
    _id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
    assignedTo?: string;
    createdAt: string;
}

// ============================================================
// CONSTANTS
// ============================================================
const ROLE_MULTIPLIERS: Record<string, number> = {
    super_admin: 1.2,
    admin: 1.1,
    hr_manager: 1.05,
    dept_manager: 1.0,
    project_manager: 0.95,
    line_manager: 0.9,
    employee: 0.85,
};

const MONTHS = [
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

const YEARS = [2023, 2024, 2025, 2026];

const COMPONENT_LABELS: Record<string, string> = {
    taskCompletion: "Task Completion",
    qualityScore: "Quality Score",
    efficiency: "Efficiency",
    collaboration: "Collaboration",
    innovation: "Innovation",
    attendance: "Attendance",
};

const COMPONENT_COLORS: Record<string, string> = {
    taskCompletion: "#10b981",
    qualityScore: "#3b82f6",
    efficiency: "#8b5cf6",
    collaboration: "#f59e0b",
    innovation: "#ec4899",
    attendance: "#14b8a6",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EmployeeKPIDetailPage() {
    const { user, hasRole } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    // State
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
    const [userDetails, setUserDetails] = useState<UserData | null>(null);

    const canManage = hasRole([
        "super_admin",
        "admin",
        "hr_manager",
        "dept_manager",
    ]);

    const currentMonth = MONTHS[new Date().getMonth()];

    // Refs
    const isInitialized = useRef(false);
    const isFetching = useRef(false);

    // ============================================================
    // HELPERS
    // ============================================================
    const getRoleMultiplier = useCallback((role: string): number => {
        return ROLE_MULTIPLIERS[role] || 0.85;
    }, []);

    const calculateScoreForUser = useCallback((userData: UserData, tasks: ApiTask[]): number => {
        const multiplier = getRoleMultiplier(userData.role);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "completed").length;

        if (totalTasks === 0) return Math.round(50 * multiplier + 20);

        const taskCompletion = Math.min(
            100,
            Math.round((completedTasks / totalTasks) * 100 * multiplier)
        );
        const qualityScore = Math.min(
            100,
            Math.round((completedTasks / totalTasks) * 100 * multiplier * 0.95 + 5)
        );
        const efficiency = Math.min(
            100,
            Math.round((completedTasks / totalTasks) * 100 * multiplier * 0.9 + 10)
        );
        const collaboration = Math.min(100, Math.round(60 * multiplier + 30));
        const innovation = Math.min(100, Math.round(50 * multiplier + 30));
        const attendance = Math.min(100, Math.round(85 + Math.random() * 15));

        return Math.round(
            (taskCompletion + qualityScore + efficiency + collaboration + innovation + attendance) / 6
        );
    }, [getRoleMultiplier]);

    const calculateKPIForUser = useCallback((
        userData: UserData,
        tasks: ApiTask[],
        allUsers: UserData[]
    ): EmployeeKPI => {
        const multiplier = getRoleMultiplier(userData.role);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === "completed").length;
        const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
        const overdueTasks = tasks.filter(
            (t) => t.status === "overdue" || (t.deadline && new Date(t.deadline) < new Date())
        ).length;

        const taskCompletion = totalTasks > 0
            ? Math.min(100, Math.round((completedTasks / totalTasks) * 100 * multiplier))
            : Math.min(100, Math.round(60 * multiplier + 20));

        const qualityScore = totalTasks > 0
            ? Math.min(100, Math.round((completedTasks / totalTasks) * 100 * multiplier * 0.95 + 5))
            : Math.min(100, Math.round(55 * multiplier + 25));

        const efficiency = totalTasks > 0
            ? Math.min(100, Math.round(((completedTasks - overdueTasks * 0.5) / totalTasks) * 100 * multiplier))
            : Math.min(100, Math.round(50 * multiplier + 30));

        const collaboration = Math.min(100, Math.round(60 * multiplier + 30 + Math.random() * 10));
        const innovation = Math.min(100, Math.round(50 * multiplier + 30 + Math.random() * 20));
        const attendance = Math.min(100, Math.round(85 + Math.random() * 15));

        const totalScore = Math.round(
            (taskCompletion + qualityScore + efficiency + collaboration + innovation + attendance) / 6
        );

        const performanceLevel: EmployeeKPI["performanceLevel"] =
            totalScore >= 90 ? "excellent"
                : totalScore >= 75 ? "good"
                    : totalScore >= 60 ? "average"
                        : "needs_improvement";

        const allUserScores = allUsers.map((u) => {
            const userTasks = tasks.filter((t: ApiTask) => t.assignedTo === u._id);
            return calculateScoreForUser(u, userTasks);
        });

        const sortedScores = [...allUserScores].sort((a, b) => b - a);
        const rank = sortedScores.indexOf(totalScore) + 1 || allUsers.length;
        const percentile = allUsers.length > 0
            ? Math.round(((allUsers.length - rank) / allUsers.length) * 100)
            : 50;

        return {
            _id: `calculated_${userData._id}_${selectedMonth}_${selectedYear}`,
            userId: {
                ...userData,
                departmentId: userData.departmentId || { _id: "unassigned", name: "Unassigned", code: "NA" },
            },
            month: selectedMonth,
            year: selectedYear,
            totalScore,
            performanceLevel,
            percentile,
            rank,
            totalEmployees: allUsers.length || 1,
            scores: {
                taskCompletion: { score: taskCompletion, weight: 20, weightedScore: taskCompletion * 0.2 },
                qualityScore: { score: qualityScore, weight: 20, weightedScore: qualityScore * 0.2 },
                efficiency: { score: efficiency, weight: 20, weightedScore: efficiency * 0.2 },
                collaboration: { score: collaboration, weight: 15, weightedScore: collaboration * 0.15 },
                innovation: { score: innovation, weight: 15, weightedScore: innovation * 0.15 },
                attendance: { score: attendance, weight: 10, weightedScore: attendance * 0.1 },
            },
            comments: `Calculated based on ${totalTasks} tasks. ${completedTasks} completed, ${inProgressTasks} in progress, ${overdueTasks} overdue.`,
            calculatedAt: new Date().toISOString(),
        };
    }, [selectedMonth, selectedYear, getRoleMultiplier, calculateScoreForUser]);

    // ============================================================
    // API CALLS
    // ============================================================
    const loadAllData = useCallback(async () => {
        if (isFetching.current) return;

        try {
            isFetching.current = true;
            setLoading(true);
            setError(null);
            setDataLoaded(false);

            // 1. Fetch user details
            let userData: UserData | null = null;
            try {
                const userResponse = await api.get(`/users/${userId}`);
                if (userResponse.data.success) {
                    userData = userResponse.data.data;
                    setUserDetails(userData);
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
            }

            // 2. Fetch tasks for this user
            let userTasks: ApiTask[] = [];
            try {
                const tasksResponse = await api.get(`/tasks?assignedTo=${userId}`);
                if (tasksResponse.data.success) {
                    userTasks = tasksResponse.data.data || [];
                }
            } catch (error) {
                console.error("Error fetching user tasks:", error);
            }

            // 3. Fetch all users for ranking
            let allUsers: UserData[] = [];
            try {
                const usersResponse = await api.get("/users");
                if (usersResponse.data.success) {
                    allUsers = usersResponse.data.data || [];
                }
            } catch (error) {
                console.error("Error fetching all users:", error);
            }

            // 4. Try to fetch existing KPI data
            let existingKPI: EmployeeKPI | null = null;
            try {
                const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
                const kpiResponse = await api.get(`/kpi/employee/${userId}`, {
                    params: { month: monthIndex, year: selectedYear },
                });
                if (kpiResponse.data.success && kpiResponse.data.data?.length > 0) {
                    existingKPI = kpiResponse.data.data[0];
                }
            } catch (error) {
                console.error("Error fetching existing KPI:", error);
            }

            // 5. Build employee data
            let employeeData: EmployeeKPI | null = null;
            if (existingKPI) {
                employeeData = {
                    ...existingKPI,
                    userId: existingKPI.userId ||
                        userData || {
                        _id: userId,
                        fullName: "Unknown",
                        email: "",
                        employeeId: "",
                        role: "",
                        departmentId: { _id: "", name: "", code: "" },
                    },
                };
            } else if (userData) {
                employeeData = calculateKPIForUser(userData, userTasks, allUsers);
            }

            if (employeeData) {
                setEmployee(employeeData);
                setDataLoaded(true);
                toast.success("KPI data loaded successfully");
            } else {
                setError("No KPI data found for this employee");
                setDataLoaded(false);
            }

            // 6. Fetch KPI history
            try {
                const historyResponse = await api.get(`/kpi/employee/${userId}`);
                if (historyResponse.data.success) {
                    const history = historyResponse.data.data || [];
                    setAllKPIScores(history);
                }
            } catch (error) {
                console.error("Error fetching KPI history:", error);
            }

            // 7. Fetch trend data
            try {
                setTrendLoading(true);
                const trendResponse = await api.get(`/kpi/employee/${userId}/trend`, {
                    params: { months: 12 },
                });
                if (trendResponse.data.success) {
                    setTrendData(trendResponse.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching trend data:", error);
            } finally {
                setTrendLoading(false);
            }

            // 8. Fetch task statistics
            try {
                setTaskLoading(true);
                const tasks = await api.get(`/tasks/my-tasks?assignedTo=${userId}`);
                if (tasks.data.success) {
                    const taskList = tasks.data.data || [];
                    const stats: TaskStats = {
                        total: taskList.length,
                        completed: taskList.filter((t: ApiTask) => t.status === "completed").length,
                        inProgress: taskList.filter((t: ApiTask) => t.status === "in_progress").length,
                        pending: taskList.filter((t: ApiTask) => t.status === "pending").length,
                        overdue: taskList.filter((t: ApiTask) => t.status === "overdue").length,
                        rejected: taskList.filter((t: ApiTask) => t.status === "rejected").length,
                        submitted: taskList.filter((t: ApiTask) => t.status === "submitted").length,
                        completionRate: taskList.length > 0
                            ? Math.round((taskList.filter((t: ApiTask) => t.status === "completed").length / taskList.length) * 100)
                            : 0,
                        byPriority: {
                            low: taskList.filter((t: ApiTask) => t.priority === "low").length,
                            normal: taskList.filter((t: ApiTask) => t.priority === "normal").length,
                            high: taskList.filter((t: ApiTask) => t.priority === "high").length,
                            urgent: taskList.filter((t: ApiTask) => t.priority === "urgent").length,
                        },
                    };
                    setTaskStats(stats);
                }
            } catch (error) {
                console.error("Error fetching task stats:", error);
            } finally {
                setTaskLoading(false);
            }
        } catch (error: any) {
            console.error("Error loading data:", error);
            setError(error.response?.data?.message || "Failed to load data");
            setDataLoaded(false);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [userId, selectedMonth, selectedYear, calculateKPIForUser]);

    // ============================================================
    // PERFORMANCE CONFIG
    // ============================================================
    const getPerformanceConfig = useCallback((level: string) => {
        const configs: Record<string, {
            color: string;
            bg: string;
            border: string;
            icon: any;
            label: string;
            emoji: string;
            gradient: string;
        }> = {
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
        return configs[level] || configs.average;
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

    const getRoleDisplayName = useCallback((role: string): string => {
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
    }, []);

    // ============================================================
    // EXPORT FUNCTIONS
    // ============================================================
    const handleExportPDF = useCallback(async () => {
        if (!employee) return;

        try {
            setExporting(true);
            toast.loading("Generating PDF...", { id: "pdf-export" });

            const doc = new jsPDF("p", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setFontSize(20);
            doc.setTextColor(99, 102, 241);
            doc.text("Employee KPI Report", pageWidth / 2, 20, { align: "center" });

            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            doc.text(
                `${employee.userId.fullName} - ${selectedMonth} ${selectedYear}`,
                pageWidth / 2,
                28,
                { align: "center" }
            );

            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);
            doc.text(`Employee: ${employee.userId.fullName}`, 14, 40);
            doc.text(`Email: ${employee.userId.email}`, 14, 46);
            doc.text(`Department: ${employee.userId.departmentId.name}`, 14, 52);
            doc.text(`Role: ${getRoleDisplayName(employee.userId.role)}`, 14, 58);
            doc.text(`Total Score: ${employee.totalScore}%`, 14, 64);
            doc.text(`Performance Level: ${employee.performanceLevel}`, 14, 70);

            const scoreEntries = [
                ["Task Completion", employee.scores.taskCompletion.score, employee.scores.taskCompletion.weight, employee.scores.taskCompletion.weightedScore],
                ["Quality Score", employee.scores.qualityScore.score, employee.scores.qualityScore.weight, employee.scores.qualityScore.weightedScore],
                ["Efficiency", employee.scores.efficiency.score, employee.scores.efficiency.weight, employee.scores.efficiency.weightedScore],
                ["Collaboration", employee.scores.collaboration.score, employee.scores.collaboration.weight, employee.scores.collaboration.weightedScore],
                ["Innovation", employee.scores.innovation.score, employee.scores.innovation.weight, employee.scores.innovation.weightedScore],
                ["Attendance", employee.scores.attendance.score, employee.scores.attendance.weight, employee.scores.attendance.weightedScore],
            ];

            autoTable(doc, {
                startY: 78,
                head: [["Component", "Score", "Weight", "Weighted Score"]],
                body: scoreEntries.map(([name, score, weight, weighted]) => [
                    name,
                    `${score}%`,
                    `${weight}%`,
                    `${typeof weighted === 'number' ? weighted.toFixed(1) : Number(weighted).toFixed(1)}%`,
                ]),
                theme: "striped",
                headStyles: { fillColor: [99, 102, 241] },
            });

            const finalY = (doc as any).lastAutoTable?.finalY || 150;
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(
                `Generated on ${new Date().toLocaleString()}`,
                pageWidth / 2,
                finalY + 20,
                { align: "center" }
            );

            doc.save(`KPI_Report_${employee.userId.fullName}_${selectedMonth}_${selectedYear}.pdf`);
            toast.success("PDF exported successfully", { id: "pdf-export" });
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Failed to export PDF", { id: "pdf-export" });
        } finally {
            setExporting(false);
        }
    }, [employee, selectedMonth, selectedYear, getRoleDisplayName]);

    const handleExportCSV = useCallback(() => {
        if (!employee) return;

        const headers = ["Component", "Score", "Weight", "Weighted Score", "Total Score", "Performance Level", "Rank", "Percentile"];
        const rows = [
            ["Task Completion", employee.scores.taskCompletion.score, employee.scores.taskCompletion.weight, employee.scores.taskCompletion.weightedScore],
            ["Quality Score", employee.scores.qualityScore.score, employee.scores.qualityScore.weight, employee.scores.qualityScore.weightedScore],
            ["Efficiency", employee.scores.efficiency.score, employee.scores.efficiency.weight, employee.scores.efficiency.weightedScore],
            ["Collaboration", employee.scores.collaboration.score, employee.scores.collaboration.weight, employee.scores.collaboration.weightedScore],
            ["Innovation", employee.scores.innovation.score, employee.scores.innovation.weight, employee.scores.innovation.weightedScore],
            ["Attendance", employee.scores.attendance.score, employee.scores.attendance.weight, employee.scores.attendance.weightedScore],
        ];

        const summaryRow = ["SUMMARY", employee.totalScore, employee.performanceLevel, employee.rank, employee.percentile];
        const csv = [
            headers.join(","),
            ...rows.map((row) => row.join(",")),
            "",
            summaryRow.join(","),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `KPI_Report_${employee.userId.fullName}_${selectedMonth}_${selectedYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
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
    }, [userId, selectedMonth, selectedYear]);

    // ============================================================
    // ACCESS DENIED
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

    // ============================================================
    // RADAR DATA
    // ============================================================
    const radarData: RadarDataItem[] = employee ? [
        { subject: "Task Completion", value: employee.scores.taskCompletion.score, fullMark: 100 },
        { subject: "Quality", value: employee.scores.qualityScore.score, fullMark: 100 },
        { subject: "Efficiency", value: employee.scores.efficiency.score, fullMark: 100 },
        { subject: "Collaboration", value: employee.scores.collaboration.score, fullMark: 100 },
        { subject: "Innovation", value: employee.scores.innovation.score, fullMark: 100 },
        { subject: "Attendance", value: employee.scores.attendance.score, fullMark: 100 },
    ] : [];

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumb */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-sm mb-6"
                    >
                        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1">
                            <Home size={14} />
                            Dashboard
                        </Link>
                        <ChevronRight size={14} className="text-gray-300" />
                        <Link href="/kpi/dashboard" className="text-gray-400 hover:text-gray-600 transition">
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
                                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Employee KPI Details</h1>
                                        {employee && (
                                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                <span className="text-sm font-medium text-gray-800">{employee.userId.fullName}</span>
                                                <span className="text-xs text-gray-400">{employee.userId.email}</span>
                                                <span className="text-xs text-gray-400">ID: {employee.userId.employeeId || "N/A"}</span>
                                                <span className="text-xs text-gray-400">{employee.userId.departmentId.name}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                    {getRoleDisplayName(employee.userId.role)}
                                                </span>
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
                                {MONTHS.map((month) => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                            >
                                {YEARS.map((year) => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            <button
                                onClick={handleExportPDF}
                                disabled={!employee || exporting}
                                className="px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
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
                                onClick={loadAllData}
                                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
                            >
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium animate-pulse">Loading employee data...</p>
                            </div>
                        </div>
                    ) : error && !employee ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-10 h-10 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Found</h3>
                            <p className="text-gray-500 max-w-md mx-auto">{error}</p>
                            <div className="flex flex-wrap gap-3 justify-center mt-6">
                                <button
                                    onClick={loadAllData}
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
                                    <p className={`text-3xl font-bold ${employee.totalScore >= 90 ? "text-emerald-600"
                                        : employee.totalScore >= 75 ? "text-blue-600"
                                            : employee.totalScore >= 60 ? "text-amber-600"
                                                : "text-red-600"
                                        }`}>
                                        {formatScore(employee.totalScore)}%
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                                    <p className="text-sm text-gray-500">Performance Level</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-2xl">{getPerformanceConfig(employee.performanceLevel).emoji}</span>
                                        <span className="text-lg font-semibold">{getPerformanceConfig(employee.performanceLevel).label}</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                                    <p className="text-sm text-gray-500">Rank</p>
                                    <p className="text-2xl font-bold text-gray-800">#{employee.rank} of {employee.totalEmployees}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                                    <p className="text-sm text-gray-500">Percentile</p>
                                    <p className="text-2xl font-bold text-indigo-600">{employee.percentile}%</p>
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
                                    className={`px-4 py-3 text-sm font-medium transition relative ${activeTab === "overview" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <BarChart3 size={16} className="inline mr-2" />
                                    Overview
                                    {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab("tasks")}
                                    className={`px-4 py-3 text-sm font-medium transition relative ${activeTab === "tasks" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <CheckCircle size={16} className="inline mr-2" />
                                    Tasks ({taskStats?.total || 0})
                                    {activeTab === "tasks" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`px-4 py-3 text-sm font-medium transition relative ${activeTab === "history" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <TrendingUp size={16} className="inline mr-2" />
                                    History
                                    {activeTab === "history" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
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
                                                    <p className="text-sm font-medium text-gray-800">{employee.userId.fullName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Email</p>
                                                    <div className="flex items-center gap-1">
                                                        <Mail size={12} className="text-gray-400" />
                                                        <p className="text-sm font-medium text-gray-800">{employee.userId.email}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Employee ID</p>
                                                    <p className="text-sm font-medium text-gray-800">{employee.userId.employeeId || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Department</p>
                                                    <p className="text-sm font-medium text-gray-800">{employee.userId.departmentId.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Role</p>
                                                    <p className="text-sm font-medium text-gray-800">{getRoleDisplayName(employee.userId.role)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Position</p>
                                                    <p className="text-sm font-medium text-gray-800">{employee.userId.position || "N/A"}</p>
                                                </div>
                                                {employee.userId.phone && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Phone</p>
                                                        <div className="flex items-center gap-1">
                                                            <Phone size={12} className="text-gray-400" />
                                                            <p className="text-sm font-medium text-gray-800">{employee.userId.phone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {employee.userId.location && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Location</p>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin size={12} className="text-gray-400" />
                                                            <p className="text-sm font-medium text-gray-800">{employee.userId.location}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-xs text-gray-500">Calculated</p>
                                                    <p className="text-sm font-medium text-gray-800">{formatDate(employee.calculatedAt)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Period</p>
                                                    <p className="text-sm font-medium text-gray-800">{selectedMonth} {selectedYear}</p>
                                                </div>
                                            </div>
                                            {employee.userId.bio && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500">Bio</p>
                                                    <p className="text-sm text-gray-700 mt-1">{employee.userId.bio}</p>
                                                </div>
                                            )}
                                            {employee.comments && (
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                    <p className="text-xs text-gray-500">Comments</p>
                                                    <p className="text-sm text-gray-700 mt-1">{employee.comments}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Radar Chart & Component Scores */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                <h3 className="text-sm font-medium text-gray-700 mb-3">Component Scores Radar</h3>
                                                <div className="h-80">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                                            <PolarGrid />
                                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                                            <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#818cf8" fillOpacity={0.6} />
                                                            <Tooltip formatter={(value) => `${value}%`} />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {Object.entries(employee.scores).map(([key, value]) => (
                                                    <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700">
                                                                    {COMPONENT_LABELS[key] || key}
                                                                </p>
                                                                <p className="text-xs text-gray-400">Weight: {value.weight}%</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-bold text-gray-800">{formatScore(value.score)}%</p>
                                                                <p className="text-xs text-indigo-600">Weighted: {formatScore(value.weightedScore)}%</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="h-2 rounded-full transition-all"
                                                                style={{
                                                                    width: `${value.score}%`,
                                                                    backgroundColor: COMPONENT_COLORS[key] || "#6366f1",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
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
                                                        <p className="text-2xl font-bold text-gray-800">{taskStats.total}</p>
                                                        <p className="text-xs text-gray-500">Total Tasks</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-emerald-200">
                                                        <p className="text-2xl font-bold text-emerald-600">{taskStats.completed}</p>
                                                        <p className="text-xs text-gray-500">Completed</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-amber-200">
                                                        <p className="text-2xl font-bold text-amber-600">{taskStats.inProgress}</p>
                                                        <p className="text-xs text-gray-500">In Progress</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-rose-200">
                                                        <p className={`text-2xl font-bold ${taskStats.completionRate >= 80 ? "text-emerald-600"
                                                            : taskStats.completionRate >= 50 ? "text-amber-600"
                                                                : "text-rose-600"
                                                            }`}>
                                                            {taskStats.completionRate}%
                                                        </p>
                                                        <p className="text-xs text-gray-500">Completion Rate</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Task Status Breakdown</h3>
                                                        <div className="space-y-2">
                                                            {[
                                                                { label: "Pending", value: taskStats.pending, color: "bg-amber-500" },
                                                                { label: "In Progress", value: taskStats.inProgress, color: "bg-blue-500" },
                                                                { label: "Submitted", value: taskStats.submitted, color: "bg-purple-500" },
                                                                { label: "Completed", value: taskStats.completed, color: "bg-emerald-500" },
                                                                { label: "Overdue", value: taskStats.overdue, color: "bg-rose-500" },
                                                                { label: "Rejected", value: taskStats.rejected, color: "bg-gray-500" },
                                                            ].map((item) => (
                                                                <div key={item.label}>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm text-gray-600">{item.label}</span>
                                                                        <span className="text-sm font-medium text-gray-800">{item.value}</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full ${item.color}`}
                                                                            style={{
                                                                                width: `${taskStats.total > 0 ? (item.value / taskStats.total) * 100 : 0}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Priority Distribution</h3>
                                                        <div className="space-y-3">
                                                            {[
                                                                { label: "Low", value: taskStats.byPriority.low, color: "text-emerald-600" },
                                                                { label: "Normal", value: taskStats.byPriority.normal, color: "text-blue-600" },
                                                                { label: "High", value: taskStats.byPriority.high, color: "text-amber-600" },
                                                                { label: "Urgent", value: taskStats.byPriority.urgent, color: "text-rose-600" },
                                                            ].map((item) => (
                                                                <div key={item.label} className="flex items-center justify-between">
                                                                    <span className="text-sm text-gray-600">{item.label}</span>
                                                                    <span className={`text-sm font-medium ${item.color}`}>{item.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <div className="h-32">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={[
                                                                        { name: "Low", value: taskStats.byPriority.low },
                                                                        { name: "Normal", value: taskStats.byPriority.normal },
                                                                        { name: "High", value: taskStats.byPriority.high },
                                                                        { name: "Urgent", value: taskStats.byPriority.urgent },
                                                                    ]}>
                                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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
                                            <div className="text-center py-8 text-gray-500">No task data available</div>
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
                                                                <th className="text-left py-2 px-3 font-medium">Month</th>
                                                                <th className="text-left py-2 px-3 font-medium">Score</th>
                                                                <th className="text-left py-2 px-3 font-medium">Level</th>
                                                                <th className="text-left py-2 px-3 font-medium">Rank</th>
                                                                <th className="text-left py-2 px-3 font-medium">Percentile</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {allKPIScores.map((score) => {
                                                                const perfConfig = getPerformanceConfig(score.performanceLevel);
                                                                return (
                                                                    <tr key={score._id} className="hover:bg-gray-50 transition">
                                                                        <td className="py-2 px-3 text-sm text-gray-800">{score.month} {score.year}</td>
                                                                        <td className="py-2 px-3 text-sm font-bold text-gray-800">{formatScore(score.totalScore)}%</td>
                                                                        <td className="py-2 px-3">
                                                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${perfConfig.bg} ${perfConfig.border} ${perfConfig.color}`}>
                                                                                {perfConfig.emoji} {perfConfig.label}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2 px-3 text-sm text-gray-600">#{score.rank} of {score.totalEmployees}</td>
                                                                        <td className="py-2 px-3 text-sm text-gray-600">{score.percentile}%</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-center text-gray-500 py-4">No historical data available</p>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                <LineChart className="text-indigo-500" />
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
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                                                                formatter={(value: any) => `${value}%`}
                                                            />
                                                            <Legend />
                                                            <Area type="monotone" dataKey="totalScore" name="Total Score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.2} />
                                                            <Line type="monotone" dataKey="totalScore" name="Total Score" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                        </ComposedChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <p className="text-center text-gray-500 py-4">No trend data available</p>
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
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Employee Data</h3>
                            <p className="text-gray-500">Unable to find KPI data for this employee</p>
                            <button
                                onClick={loadAllData}
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