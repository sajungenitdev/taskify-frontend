// app/hr/attendance/my/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  Calendar as CalendarIcon,
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
  Home,
  ChevronRight as ChevronRightIcon,
  MapPin,
  Play,
  Pause,
  StopCircle,
  Info,
  AlertTriangle,
  Check,
  X,
  Ban,
  CalendarDays,
  Heart,
  Sun,
  CloudRain,
  Baby,
  Star,
  Clock8,
  CalendarClock,
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
  employeeId: string | { _id: string; fullName: string; email: string };
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
  totalWorkingTime: number;
  createdAt: string;
  updatedAt: string;
}

interface DayStats {
  date: string;
  status: "present" | "absent" | "late" | "half-day" | "on-leave" | null;
  workingHours: number;
  checkIn?: string;
  checkOut?: string;
  record?: AttendanceRecord;
}

interface MonthlyStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  totalWorkingHours: number;
  totalOvertime: number;
  attendanceRate: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const statusColors: Record<string, string> = {
  present: "bg-emerald-500 text-white",
  absent: "bg-rose-500 text-white",
  late: "bg-amber-500 text-white",
  "half-day": "bg-blue-500 text-white",
  "on-leave": "bg-purple-500 text-white",
};

const statusLightColors: Record<string, string> = {
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

const statusEmojis: Record<string, string> = {
  present: "✅",
  absent: "❌",
  late: "⚠️",
  "half-day": "🌗",
  "on-leave": "🏖️",
};

const leaveTypeIcons: Record<string, any> = {
  annual: CalendarDays,
  sick: Heart,
  casual: Sun,
  maternity: Baby,
  paternity: Baby,
  bereavement: CloudRain,
  unpaid: Clock8,
  earned: Star,
  other: CalendarClock,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    onLeave: 0,
    totalWorkingHours: 0,
    totalOvertime: 0,
    attendanceRate: 0,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchAttendanceData();
  }, [currentDate]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

      const response = await api.get("/attendance/history", {
        params: { startDate, endDate },
      });

      if (response.data.success) {
        const data = response.data.data || [];
        setAttendanceData(data);
        calculateMonthlyStats(data);
      } else {
        toast.error(response.data.message || "Failed to load attendance data");
      }
    } catch (error: any) {
      console.error("Error fetching attendance:", error);
      toast.error(
        error.response?.data?.message || "Failed to load attendance data",
      );
      setAttendanceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMonthlyStats = (data: AttendanceRecord[]) => {
    const totalDays = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    ).getDate();
    const present = data.filter((r) => r.status === "present").length;
    const absent = data.filter((r) => r.status === "absent").length;
    const late = data.filter((r) => r.status === "late").length;
    const halfDay = data.filter((r) => r.status === "half-day").length;
    const onLeave = data.filter((r) => r.status === "on-leave").length;
    const totalWorkingHours = data.reduce(
      (sum, r) => sum + (r.workingHours || 0),
      0,
    );
    const totalOvertime = data.reduce((sum, r) => sum + (r.overtime || 0), 0);
    const presentCount = present + late + halfDay;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

    setMonthlyStats({
      totalDays,
      present,
      absent,
      late,
      halfDay,
      onLeave,
      totalWorkingHours,
      totalOvertime,
      attendanceRate,
    });
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getAttendanceForDate = (date: Date): DayStats | null => {
    const dateStr = date.toISOString().split("T")[0];
    const record = attendanceData.find((r) => r.date === dateStr);

    if (record) {
      return {
        date: dateStr,
        status: record.status,
        workingHours: record.workingHours,
        checkIn: record.checkInTime || record.checkIn || undefined,
        checkOut: record.checkOutTime || record.checkOut || undefined,
        record,
      };
    }

    // Check if it's a weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        date: dateStr,
        status: null,
        workingHours: 0,
      };
    }

    return {
      date: dateStr,
      status: null,
      workingHours: 0,
    };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string | null | undefined) => {
    if (!time) return "—";
    return time;
  };

  const formatHours = (hours: number) => {
    if (!hours || hours === 0) return "0h";
    return `${hours.toFixed(1)}h`;
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

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.error("Weekend day - No attendance record");
      return;
    }

    const record = attendanceData.find((r) => r.date === dateStr);
    if (record) {
      setSelectedRecord(record);
      setSelectedDate(dateStr);
      setShowDetailModal(true);
    } else {
      toast.error("No attendance record for this day");
    }
  };

  const handleRefresh = () => {
    fetchAttendanceData();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your attendance...</p>
        </div>
      </div>
    );
  }

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

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
          <span className="text-gray-700 font-medium">My Attendance</span>
        </motion.div>

        {/* ============================================================
            HEADER
            ============================================================ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-500" />
              My Attendance
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              Track your daily attendance
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
            STATS CARDS
            ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Days</p>
                <p className="text-xl font-bold text-gray-900">
                  {monthlyStats.totalDays}
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
                  {monthlyStats.present}
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
                  {monthlyStats.absent}
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
                <p className="text-xl font-bold text-amber-600">
                  {monthlyStats.late}
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
                  {monthlyStats.halfDay}
                </p>
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
                  {monthlyStats.onLeave}
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
                <p className="text-xl font-bold">
                  {monthlyStats.attendanceRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            SUMMARY CARDS
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-linear-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200/50 rounded-lg">
                <Timer className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Working Hours</p>
                <p className="text-2xl font-bold text-blue-900">
                  {monthlyStats.totalWorkingHours.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200/50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Overtime</p>
                <p className="text-2xl font-bold text-amber-900">
                  {monthlyStats.totalOvertime.toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-200/50 rounded-lg">
                <UserCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Attendance Rate</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {monthlyStats.attendanceRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            CALENDAR
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {monthName} {year}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-1" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day,
              );
              const dateStr = date.toISOString().split("T")[0];
              const dayOfWeek = date.getDay();
              const isToday = dateStr === todayStr;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const attendance = getAttendanceForDate(date);
              const hasRecord = attendance?.status !== null && !isWeekend;

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square p-1 rounded-xl transition-all duration-200 relative
                    ${isToday ? "ring-2 ring-indigo-500 ring-offset-2" : ""}
                    ${isWeekend ? "bg-gray-50/50 cursor-not-allowed opacity-60" : "hover:bg-gray-50"}
                    ${hasRecord ? "cursor-pointer" : "cursor-pointer"}
                  `}
                  disabled={isWeekend}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span
                      className={`text-sm font-medium ${isToday ? "text-indigo-600" : "text-gray-700"}`}
                    >
                      {day}
                    </span>

                    {hasRecord && attendance?.status && (
                      <div className="mt-0.5 flex items-center gap-0.5">
                        <span className="text-[8px]">
                          {statusEmojis[attendance.status]}
                        </span>
                        {attendance.workingHours > 0 && (
                          <span className="text-[8px] text-gray-400">
                            {attendance.workingHours.toFixed(1)}h
                          </span>
                        )}
                      </div>
                    )}

                    {isWeekend && (
                      <span className="text-[10px] text-gray-300">🌙</span>
                    )}
                  </div>

                  {/* Status dot indicator */}
                  {hasRecord && attendance?.status && (
                    <div
                      className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                        statusColors[attendance.status]?.split(" ")[0] ||
                        "bg-gray-300"
                      }`}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${statusColors[key]?.split(" ")[0] || "bg-gray-300"}`}
                />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              <span className="text-xs text-gray-500">No Record</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-300" />
              <span className="text-xs text-gray-500">Weekend</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          ATTENDANCE DETAIL MODAL
          ============================================================ */}
      <AnimatePresence>
        {showDetailModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Attendance Details
                      </h2>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedRecord.date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedRecord(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Status Badge */}
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusLightColors[selectedRecord.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                >
                  {(() => {
                    const StatusIcon =
                      statusIcons[selectedRecord.status] || Clock;
                    return <StatusIcon className="w-4 h-4" />;
                  })()}
                  <span className="font-medium">
                    {statusLabels[selectedRecord.status] ||
                      selectedRecord.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Check In
                    </p>
                    <p className="text-lg font-bold text-gray-800 mt-1">
                      {formatTime(
                        selectedRecord.checkInTime || selectedRecord.checkIn,
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Check Out
                    </p>
                    <p className="text-lg font-bold text-gray-800 mt-1">
                      {formatTime(
                        selectedRecord.checkOutTime || selectedRecord.checkOut,
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Working Hours
                    </p>
                    <p className="text-lg font-bold text-gray-800 mt-1">
                      {formatHours(selectedRecord.workingHours)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Overtime
                    </p>
                    <p
                      className={`text-lg font-bold mt-1 ${selectedRecord.overtime > 0 ? "text-amber-600" : "text-gray-400"}`}
                    >
                      {selectedRecord.overtime > 0
                        ? `+${formatHours(selectedRecord.overtime)}`
                        : "0h"}
                    </p>
                  </div>
                </div>

                {selectedRecord.location && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Location
                    </p>
                    <p className="text-gray-700 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedRecord.location}
                    </p>
                  </div>
                )}

                {selectedRecord.notes && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700 font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Notes
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {selectedRecord.notes}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedRecord(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toast.success("Attendance report downloaded");
                    }}
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download Report
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
