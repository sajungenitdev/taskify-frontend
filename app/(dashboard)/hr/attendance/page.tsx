// app/hr/attendance/page.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  ChevronDown,
  Eye,
  Loader2,
  Building2,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Activity,
  Timer,
  UserCheck,
  UserX,
  Clock as ClockIcon,
  FileText,
  Printer,
  Mail,
  Phone,
  MapPin,
  Play,
  Pause,
  Square,
  StopCircle,
  Home,
  ChevronRight as ChevronRightIcon,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceRecord {
  _id: string;
  employeeId:
    | string
    | { _id: string; fullName: string; email: string; employeeId?: string };
  employeeName: string;
  employeeEmail: string;
  employeeDepartment: string;
  employeePosition: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInTime?: string;
  checkOutTime?: string;
  status: "present" | "absent" | "late" | "half-day" | "on-leave";
  workingHours: number;
  overtime: number;
  location?: string;
  notes?: string;
  isHalfDay: boolean;
  halfDayType?: string;
  timerPaused: boolean;
  timerPausedAt?: string;
  totalPausedDuration: number;
  totalWorkingTime: number;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
  attendanceRate: number;
  totalWorkingHours: number;
  totalOvertime: number;
}

interface TimerStatus {
  isActive: boolean;
  isPaused: boolean;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkIn: string | null;
  checkOut: string | null;
  checkInTime?: string;
  checkOutTime?: string;
  currentWorkingHours: number;
  totalWorkingHours: number;
  overtime: number;
  status: string;
  location?: string;
  notes?: string;
  attendanceId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const statusColors: Record<string, string> = {
  present: "bg-emerald-50 text-emerald-700 border-emerald-200",
  absent: "bg-rose-50 text-rose-700 border-rose-200",
  late: "bg-amber-50 text-amber-700 border-amber-200",
  "half-day": "bg-blue-50 text-blue-700 border-blue-200",
  "on-leave": "bg-purple-50 text-purple-700 border-purple-200",
};

const statusIcons: Record<string, any> = {
  present: CheckCircle,
  absent: XCircle,
  late: AlertCircle,
  "half-day": Clock,
  "on-leave": UserX,
};

const statusLabels: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  "half-day": "Half Day",
  "on-leave": "On Leave",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to safely get employee ID
const getEmployeeId = (employeeId: any): string => {
  if (!employeeId) return "N/A";
  if (typeof employeeId === "object") {
    return employeeId.employeeId || employeeId._id || "N/A";
  }
  return employeeId || "N/A";
};

// Helper to safely get employee name
const getEmployeeName = (record: AttendanceRecord): string => {
  if (record.employeeName) return record.employeeName;
  if (typeof record.employeeId === "object") {
    return record.employeeId.fullName || "Unknown";
  }
  return "Unknown";
};

// Helper to safely get employee email
const getEmployeeEmail = (record: AttendanceRecord): string => {
  if (record.employeeEmail) return record.employeeEmail;
  if (typeof record.employeeId === "object") {
    return record.employeeId.email || "";
  }
  return "";
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] =
    useState<AttendanceRecord | null>(null);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<string[]>(["All Departments"]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    halfDay: 0,
    attendanceRate: 0,
    totalWorkingHours: 0,
    totalOvertime: 0,
  });
  const [timerStatus, setTimerStatus] = useState<TimerStatus>({
    isActive: false,
    isPaused: false,
    hasCheckedIn: false,
    hasCheckedOut: false,
    checkIn: null,
    checkOut: null,
    currentWorkingHours: 0,
    totalWorkingHours: 0,
    overtime: 0,
    status: "",
  });
  const [timerElapsed, setTimerElapsed] = useState(0);

  // Check if user has HR permissions
  const isHR =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.role === "hr_manager";

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchAttendanceData();
    fetchTimerStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        timerStatus.isActive &&
        !timerStatus.isPaused &&
        !timerStatus.hasCheckedOut
      ) {
        setTimerElapsed((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStatus.isActive, timerStatus.isPaused, timerStatus.hasCheckedOut]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      const dateStr = selectedDate.toISOString().split("T")[0];

      let response;

      // If HR, get all attendance records
      if (isHR) {
        response = await api.get(`/attendance/all`, {
          params: { date: dateStr },
        });
      } else {
        // If employee, get only their attendance
        response = await api.get(`/attendance/history`, {
          params: { startDate: dateStr, endDate: dateStr },
        });
      }

      if (response.data.success) {
        const data = response.data.data || [];
        setAttendanceData(data);

        // Extract unique departments (only for HR)
        if (isHR) {
          const deptSet = new Set<string>();
          data.forEach((record: AttendanceRecord) => {
            if (record.employeeDepartment) {
              deptSet.add(record.employeeDepartment);
            }
          });
          setDepartments(["All Departments", ...Array.from(deptSet)]);
        }

        await fetchStats();
        toast.success(`Loaded ${data.length} attendance records`);
      } else {
        toast.error(response.data.message || "Failed to load attendance data");
      }
    } catch (error: any) {
      console.error("Error fetching attendance:", error);

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view all attendance records");
        setAttendanceData([]);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to load attendance data",
        );
      }
      setAttendanceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];

      // Only HR can access stats
      if (isHR) {
        const response = await api.get(`/attendance/stats`, {
          params: { date: dateStr },
        });

        if (response.data.success) {
          setStats(response.data.data);
        }
      } else {
        // For employees, calculate stats from their own data
        const total = attendanceData.length;
        const present = attendanceData.filter(
          (r) => r.status === "present",
        ).length;
        const absent = attendanceData.filter(
          (r) => r.status === "absent",
        ).length;
        const late = attendanceData.filter((r) => r.status === "late").length;
        const onLeave = attendanceData.filter(
          (r) => r.status === "on-leave",
        ).length;
        const halfDay = attendanceData.filter(
          (r) => r.status === "half-day",
        ).length;
        const totalWorkingHours = attendanceData.reduce(
          (sum, r) => sum + (r.workingHours || 0),
          0,
        );
        const totalOvertime = attendanceData.reduce(
          (sum, r) => sum + (r.overtime || 0),
          0,
        );
        const attendanceRate =
          total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        setStats({
          totalEmployees: total,
          present,
          absent,
          late,
          onLeave,
          halfDay,
          attendanceRate,
          totalWorkingHours,
          totalOvertime,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchTimerStatus = async () => {
    try {
      const response = await api.get("/attendance/timer-status");
      if (response.data.success) {
        const data = response.data.data;
        setTimerStatus(data);
        if (data.isActive && !data.isPaused && !data.hasCheckedOut) {
          setTimerElapsed(data.currentWorkingHours * 3600);
        }
      }
    } catch (error: any) {
      console.error("Error fetching timer status:", error);
    }
  };

  // ============================================================================
  // TIMER FUNCTIONS
  // ============================================================================

  const handleStartTimer = async () => {
    try {
      const response = await api.post("/attendance/start", {
        location: "Office - Main Building",
      });
      if (response.data.success) {
        toast.success("Timer started successfully!");
        await fetchTimerStatus();
        await fetchAttendanceData();
      }
    } catch (error: any) {
      console.error("Error starting timer:", error);
      toast.error(error.response?.data?.message || "Failed to start timer");
    }
  };

  const handlePauseTimer = async () => {
    try {
      const response = await api.post("/attendance/pause");
      if (response.data.success) {
        toast.success("Timer paused!");
        await fetchTimerStatus();
      }
    } catch (error: any) {
      console.error("Error pausing timer:", error);
      toast.error(error.response?.data?.message || "Failed to pause timer");
    }
  };

  const handleResumeTimer = async () => {
    try {
      const response = await api.post("/attendance/resume");
      if (response.data.success) {
        toast.success("Timer resumed!");
        await fetchTimerStatus();
      }
    } catch (error: any) {
      console.error("Error resuming timer:", error);
      toast.error(error.response?.data?.message || "Failed to resume timer");
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await api.post("/attendance/checkout", {
        location: "Office - Main Building",
        notes: "Completed work for the day",
      });
      if (response.data.success) {
        toast.success("Checked out successfully! Have a great day!");
        await fetchTimerStatus();
        await fetchAttendanceData();
        setTimerElapsed(0);
      }
    } catch (error: any) {
      console.error("Error checking out:", error);
      toast.error(error.response?.data?.message || "Failed to check out");
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
    fetchAttendanceData();
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    fetchAttendanceData();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendanceData();
    fetchTimerStatus();
  };

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredRecords = useMemo(() => {
    let records = attendanceData;

    if (searchTerm) {
      records = records.filter((r) => {
        const name = getEmployeeName(r).toLowerCase();
        const email = getEmployeeEmail(r).toLowerCase();
        const id = getEmployeeId(r.employeeId).toLowerCase();
        const search = searchTerm.toLowerCase();
        return (
          name.includes(search) || email.includes(search) || id.includes(search)
        );
      });
    }

    if (selectedDepartment !== "All Departments") {
      records = records.filter(
        (r) => r.employeeDepartment === selectedDepartment,
      );
    }

    if (selectedStatus !== "all") {
      records = records.filter((r) => r.status === selectedStatus);
    }

    return records;
  }, [attendanceData, searchTerm, selectedDepartment, selectedStatus]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ============================================================
            BREADCRUMB
            ============================================================ */}
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
          <ChevronRightIcon size={14} className="text-gray-300" />
          <Link
            href="/hr"
            className="text-gray-400 hover:text-gray-600 transition"
          >
            HR
          </Link>
          <ChevronRightIcon size={14} className="text-gray-300" />
          <span className="text-gray-700 font-medium">Attendance</span>
        </motion.div>

        {/* ============================================================
            HEADER
            ============================================================ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-500" />
              Attendance
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              {isHR
                ? "Manage and track employee attendance"
                : "Track your attendance"}
              {refreshing && (
                <span className="text-xs text-indigo-500 animate-pulse ml-2">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Updating...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition-all text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-medium shadow-md shadow-indigo-500/25 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Today
            </button>
          </div>
        </div>

        {/* ============================================================
            TIMER CARD
            ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Timer className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Work Timer</h3>
                <p className="text-white/80 text-sm">
                  {timerStatus.hasCheckedOut
                    ? "Completed for today"
                    : timerStatus.hasCheckedIn
                      ? "Currently working"
                      : "Ready to start"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-mono font-bold tabular-nums">
                  {formatTime(timerElapsed)}
                </p>
                <p className="text-xs text-white/70">Elapsed Time</p>
              </div>

              <div className="flex items-center gap-2">
                {!timerStatus.hasCheckedIn ? (
                  <button
                    onClick={handleStartTimer}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30"
                  >
                    <Play className="w-5 h-5" />
                    Start Timer
                  </button>
                ) : timerStatus.hasCheckedOut ? (
                  <div className="px-6 py-3 bg-white/20 rounded-xl font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Done Today
                  </div>
                ) : (
                  <>
                    {timerStatus.isPaused ? (
                      <button
                        onClick={handleResumeTimer}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30"
                      >
                        <Play className="w-5 h-5" />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseTimer}
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-amber-500/30"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </button>
                    )}
                    <button
                      onClick={handleCheckOut}
                      className="px-6 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-rose-500/30"
                    >
                      <StopCircle className="w-5 h-5" />
                      Done Today
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="text-sm text-white/80 text-right">
              {timerStatus.hasCheckedIn && !timerStatus.hasCheckedOut && (
                <>
                  <p>Check In: {timerStatus.checkInTime || "N/A"}</p>
                  {timerStatus.totalWorkingHours > 0 && (
                    <p>Worked: {timerStatus.totalWorkingHours.toFixed(1)}h</p>
                  )}
                  {timerStatus.overtime > 0 && (
                    <p className="text-emerald-300">
                      Overtime: +{timerStatus.overtime}h
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* ============================================================
            STATS CARDS
            ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalEmployees}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-xl font-bold text-emerald-600">
                  {stats.present}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-xl font-bold text-rose-600">
                  {stats.absent}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Late</p>
                <p className="text-xl font-bold text-amber-600">{stats.late}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <UserX className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.onLeave}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Half Day</p>
                <p className="text-xl font-bold text-blue-600">
                  {stats.halfDay}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-md p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Attendance Rate</p>
                <p className="text-xl font-bold">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            DATE NAVIGATION & FILTERS
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {formatDate(selectedDate)}
              </h2>
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-2 ${
                  showFilters ||
                  selectedStatus !== "all" ||
                  selectedDepartment !== "All Departments"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && isHR && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm"
                  />
                </div>
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm min-w-[160px]"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDepartment("All Departments");
                  setSelectedStatus("all");
                  fetchAttendanceData();
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ============================================================
            ATTENDANCE RECORDS
            ============================================================ */}
        {filteredRecords.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRecords.map((record) => {
                const StatusIcon = statusIcons[record.status];
                const statusColor = statusColors[record.status];
                const statusLabel = statusLabels[record.status];
                const employeeName = getEmployeeName(record);
                const employeeEmail = getEmployeeEmail(record);
                const employeeId = getEmployeeId(record.employeeId);

                return (
                  <motion.div
                    key={record._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    onClick={() => {
                      setSelectedEmployee(record);
                      setShowEmployeeDetail(true);
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                            {getInitials(employeeName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">
                              {employeeName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              ID: {employeeId}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1 ${statusColor}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusLabel}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                            Check In
                          </span>
                          <span className="font-medium text-gray-800">
                            {record.checkInTime || record.checkIn || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
                            Check Out
                          </span>
                          <span className="font-medium text-gray-800">
                            {record.checkOutTime || record.checkOut || "—"}
                          </span>
                        </div>
                        {record.status !== "absent" &&
                          record.status !== "on-leave" && (
                            <>
                              <div className="flex items-center justify-between text-gray-600">
                                <span className="flex items-center gap-1.5">
                                  <Timer className="w-3.5 h-3.5 text-gray-400" />
                                  Working Hours
                                </span>
                                <span className="font-medium text-gray-800">
                                  {record.workingHours.toFixed(1)}h
                                </span>
                              </div>
                              {record.overtime > 0 && (
                                <div className="flex items-center justify-between text-amber-600">
                                  <span className="flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    Overtime
                                  </span>
                                  <span className="font-medium">
                                    +{record.overtime.toFixed(1)}h
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                      </div>

                      {record.location && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {record.location}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRecords.map((record) => {
                      const StatusIcon = statusIcons[record.status];
                      const statusColor = statusColors[record.status];
                      const statusLabel = statusLabels[record.status];
                      const employeeName = getEmployeeName(record);
                      const employeeEmail = getEmployeeEmail(record);
                      const employeeId = getEmployeeId(record.employeeId);

                      return (
                        <tr
                          key={record._id}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                                {getInitials(employeeName)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {employeeName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {employeeEmail}
                                </p>
                                <p className="text-xs text-gray-400">
                                  ID: {employeeId}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.employeeDepartment}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">
                            {record.checkInTime || record.checkIn || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">
                            {record.checkOutTime || record.checkOut || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.status !== "absent" &&
                            record.status !== "on-leave" ? (
                              <span>
                                {record.workingHours.toFixed(1)}h
                                {record.overtime > 0 && (
                                  <span className="text-amber-600 ml-1">
                                    (+{record.overtime.toFixed(1)}h)
                                  </span>
                                )}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusColor}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedEmployee(record);
                                setShowEmployeeDetail(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100/80">
            <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No attendance records
            </h3>
            <p className="text-gray-500 mt-1">
              No records found for {formatDate(selectedDate)}
              {searchTerm && " matching your search"}
            </p>
            <button
              onClick={goToToday}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Go to Today
            </button>
          </div>
        )}
      </div>

      {/* ============================================================
          EMPLOYEE DETAIL MODAL
          ============================================================ */}
      <AnimatePresence>
        {showEmployeeDetail && selectedEmployee && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xl font-bold shrink-0">
                      {getInitials(getEmployeeName(selectedEmployee))}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {getEmployeeName(selectedEmployee)}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {getEmployeeEmail(selectedEmployee)}
                      </p>
                      <p className="text-xs text-gray-400">
                        ID: {getEmployeeId(selectedEmployee.employeeId)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowEmployeeDetail(false);
                      setSelectedEmployee(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Status
                    </h3>
                    {(() => {
                      const StatusIcon = statusIcons[selectedEmployee.status];
                      const statusColor = statusColors[selectedEmployee.status];
                      const statusLabel = statusLabels[selectedEmployee.status];
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${statusColor}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {statusLabel}
                        </span>
                      );
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Department
                    </h3>
                    <p className="text-gray-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {selectedEmployee.employeeDepartment}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Position
                    </h3>
                    <p className="text-gray-800 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {selectedEmployee.employeePosition}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Date
                    </h3>
                    <p className="text-gray-800 flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      {new Date(selectedEmployee.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Check In</p>
                    <p className="text-xl font-bold text-gray-800">
                      {selectedEmployee.checkInTime ||
                        selectedEmployee.checkIn ||
                        "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Check Out</p>
                    <p className="text-xl font-bold text-gray-800">
                      {selectedEmployee.checkOutTime ||
                        selectedEmployee.checkOut ||
                        "—"}
                    </p>
                  </div>
                  {selectedEmployee.status !== "absent" &&
                    selectedEmployee.status !== "on-leave" && (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Working Hours</p>
                          <p className="text-xl font-bold text-gray-800">
                            {selectedEmployee.workingHours.toFixed(1)}h
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Overtime</p>
                          <p
                            className={`text-xl font-bold ${selectedEmployee.overtime > 0 ? "text-amber-600" : "text-gray-400"}`}
                          >
                            {selectedEmployee.overtime > 0
                              ? `+${selectedEmployee.overtime.toFixed(1)}h`
                              : "0h"}
                          </p>
                        </div>
                      </>
                    )}
                </div>

                {selectedEmployee.location && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Location
                    </h3>
                    <p className="text-gray-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedEmployee.location}
                    </p>
                  </div>
                )}

                {selectedEmployee.notes && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Notes
                    </h3>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-xl">
                      {selectedEmployee.notes}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowEmployeeDetail(false);
                      setSelectedEmployee(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
