// app/(dashboard)/tasks/timerlog/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import {
    Play,
    Pause,
    Square,
    Clock,
    Calendar,
    Search,
    RefreshCw,
    Loader2,
    Timer,
    Plus,
    Save,
    X,
    Edit2,
    Trash2,
    AlertCircle,
    PlayCircle,
    StopCircle,
} from "lucide-react";
import { format, parseISO, differenceInSeconds, isToday, isYesterday, isThisWeek, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import Link from "next/link";

// Types
interface TimerEntry {
    _id: string;
    taskId: string;
    taskTitle: string;
    taskStatus: string;
    userId: string;
    userName: string;
    startTime: string;
    endTime: string | null;
    duration: number;
    description: string;
    isRunning: boolean;
    elapsedTime?: number;
    createdAt: string;
    updatedAt: string;
}

interface TimerStats {
    totalTimeToday: number;
    totalTimeThisWeek: number;
    totalTimeThisMonth: number;
    averageDailyTime: number;
    tasksTracked: number;
    currentStreak: number;
}

interface DayData {
    date: string;
    dayName: string;
    duration: number;
    displayTime: string;
    isToday: boolean;
    entries: number;
}

export default function TimerLogPage() {
    const { user } = useAuth();
    const {
        timerState,
        isTimerRunning,
        activeTimerTaskId,
        stopTimer,
        formatTime,
        formatTimeShort,
    } = useTimer();

    const [entries, setEntries] = useState<TimerEntry[]>([]);
    const [stats, setStats] = useState<TimerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "running" | "completed">("all");
    const [selectedTask, setSelectedTask] = useState<string>("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimerEntry | null>(null);
    const [tasks, setTasks] = useState<Array<{ _id: string; title: string; actualMinutes?: number }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTimerEntry, setActiveTimerEntry] = useState<TimerEntry | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        taskId: "",
        description: "",
        duration: 0,
    });

    // Timer interval for active timer
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fetchTimerDataRef = useRef<(() => Promise<void>) | null>(null);

    // Fetch timer data - memoized to prevent recreation
    const fetchTimerData = useCallback(async () => {
        if (isInitialLoad) {
            setIsLoading(true);
        }

        try {
            setError(null);

            // Fetch timer entries
            const entriesRes = await api.get("/timer/entries");
            // Fetch timer stats
            const statsRes = await api.get("/timer/stats");
            // Fetch tasks for dropdown
            const tasksRes = await api.get("/tasks/my-tasks");

            let entriesData = entriesRes.data?.data || [];

            // Check if there's an active timer from the global context
            const activeTaskId = activeTimerTaskId;
            let activeEntry = entriesData.find((e: TimerEntry) => e.isRunning);

            if (!activeEntry && activeTaskId) {
                const task = tasksRes.data?.data?.find((t: any) => t._id === activeTaskId);
                if (task) {
                    const virtualEntry: TimerEntry = {
                        _id: `virtual_${activeTaskId}`,
                        taskId: activeTaskId,
                        taskTitle: task.title || "Unknown Task",
                        taskStatus: "in_progress",
                        userId: user?._id || "",
                        userName: user?.fullName || "User",
                        startTime: new Date().toISOString(),
                        endTime: null,
                        duration: 0,
                        description: "Timer running",
                        isRunning: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    entriesData = [virtualEntry, ...entriesData];
                    activeEntry = virtualEntry;
                }
            }

            setEntries(entriesData);

            if (activeEntry) {
                setActiveTimerEntry(activeEntry);

                let elapsed = 0;
                if (activeEntry.taskId === activeTimerTaskId && isTimerRunning) {
                    elapsed = timerState.elapsedSeconds;
                } else if (activeEntry.startTime) {
                    const startTime = parseISO(activeEntry.startTime);
                    const now = new Date();
                    elapsed = differenceInSeconds(now, startTime) + (activeEntry.duration || 0);
                }
                setElapsedTime(elapsed);
            } else {
                setActiveTimerEntry(null);
                setElapsedTime(0);
            }

            if (statsRes.data?.data) {
                setStats(statsRes.data.data);
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const todayEntries = entriesData.filter((e: TimerEntry) => {
                    const date = new Date(e.startTime);
                    date.setHours(0, 0, 0, 0);
                    return date.getTime() === today.getTime();
                });

                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                weekStart.setHours(0, 0, 0, 0);

                const weekEntries = entriesData.filter((e: TimerEntry) => {
                    const date = new Date(e.startTime);
                    date.setHours(0, 0, 0, 0);
                    return date.getTime() >= weekStart.getTime();
                });

                const totalTimeToday = todayEntries.reduce((sum: number, e: TimerEntry) => {
                    const duration = e.isRunning ? (elapsedTime || 0) : e.duration;
                    return sum + duration;
                }, 0);

                const totalTimeThisWeek = weekEntries.reduce((sum: number, e: TimerEntry) => {
                    const duration = e.isRunning ? (elapsedTime || 0) : e.duration;
                    return sum + duration;
                }, 0);

                const uniqueTasks = new Set(entriesData.map((e: TimerEntry) => e.taskId));

                setStats({
                    totalTimeToday,
                    totalTimeThisWeek,
                    totalTimeThisMonth: totalTimeThisWeek * 4,
                    averageDailyTime: entriesData.length > 0 ? Math.round(entriesData.reduce((sum: number, e: TimerEntry) => sum + e.duration, 0) / 30) : 0,
                    tasksTracked: uniqueTasks.size,
                    currentStreak: 0,
                });
            }

            if (tasksRes.data?.data) {
                setTasks(tasksRes.data.data || []);
            } else {
                setTasks([]);
            }

        } catch (error: any) {
            if (error.response?.status === 404) {
                setError("No timer entries found. Start a timer from a task to get started.");
            } else if (error.response?.status === 403) {
                setError("You don't have permission to view timer logs.");
            } else {
                setError(error.response?.data?.message || "Failed to load timer data");
            }

            setEntries([]);
            setStats({
                totalTimeToday: 0,
                totalTimeThisWeek: 0,
                totalTimeThisMonth: 0,
                averageDailyTime: 0,
                tasksTracked: 0,
                currentStreak: 0,
            });
            setTasks([]);

            if (error.response?.status !== 404) {
                toast.error(error.response?.data?.message || "Failed to load timer data");
            }
        } finally {
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    }, [user, activeTimerTaskId, isTimerRunning, timerState.elapsedSeconds, isInitialLoad]);

    useEffect(() => {
        fetchTimerDataRef.current = fetchTimerData;
    }, [fetchTimerData]);

    useEffect(() => {
        if (activeTimerEntry && activeTimerEntry.isRunning) {
            timerIntervalRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        } else if (isTimerRunning && activeTimerTaskId) {
            timerIntervalRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [activeTimerEntry, isTimerRunning, activeTimerTaskId]);

    useEffect(() => {
        if (user && isInitialLoad) {
            fetchTimerData();
        }
    }, [user, isInitialLoad, fetchTimerData]);

    const handleStopTimer = async (taskId: string) => {
        if (!taskId) {
            toast.error("No task ID found");
            return;
        }

        try {
            setIsSubmitting(true);
            const result = await stopTimer(taskId);

            if (result.success) {
                toast.success(`⏱️ Timer stopped! Tracked: ${result.displayTime}`);
                setActiveTimerEntry(null);
                setElapsedTime(0);
                await fetchTimerData();
            } else {
                toast.error("Failed to stop timer");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to stop timer");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm("Are you sure you want to delete this timer entry?")) return;

        try {
            await api.delete(`/timer/entries/${entryId}`);
            toast.success("Timer entry deleted");
            await fetchTimerData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete entry");
        }
    };

    const handleUpdateEntry = async (entryId: string, data: { description?: string; duration?: number }) => {
        try {
            setIsSubmitting(true);
            await api.put(`/timer/entries/${entryId}`, data);
            toast.success("Timer entry updated");
            setEditingEntry(null);
            await fetchTimerData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update entry");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateEntry = async () => {
        if (!formData.taskId) {
            toast.error("Please select a task");
            return;
        }

        if (formData.duration <= 0) {
            toast.error("Duration must be greater than 0");
            return;
        }

        const selectedTask = tasks.find(t => t._id === formData.taskId);
        if (!selectedTask) {
            toast.error("Selected task not found. Please refresh and try again.");
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                taskId: formData.taskId,
                description: formData.description || "Manual entry",
                duration: formData.duration * 60,
            };

            const response = await api.post("/timer/entries", payload);

            if (response.data.success) {
                toast.success(`✅ Timer entry created for "${selectedTask.title}"`);
                setShowCreateModal(false);
                setFormData({ taskId: "", description: "", duration: 0 });
                await fetchTimerData();
            } else {
                throw new Error(response.data.message || "Failed to create entry");
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                toast.error("Task not found. Please select a valid task from the list.");
            } else if (error.response?.status === 403) {
                toast.error("You don't have permission to log time for this task.");
            } else if (error.response?.status === 400) {
                toast.error(error.response?.data?.message || "Invalid request. Please check the duration.");
            } else {
                toast.error(error.response?.data?.message || "Failed to create entry. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    };

    const formatDurationShort = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getEntryDisplayTime = (entry: TimerEntry) => {
        if (entry.isRunning) {
            if (entry.taskId === activeTimerTaskId) {
                return formatTime(elapsedTime);
            }
            const startTime = parseISO(entry.startTime);
            const now = new Date();
            const elapsed = differenceInSeconds(now, startTime) + (entry.duration || 0);
            return formatTime(elapsed);
        }
        return formatTime(entry.duration || 0);
    };

    const getEntryDuration = (entry: TimerEntry) => {
        if (entry.isRunning && entry.taskId === activeTimerTaskId) {
            return elapsedTime;
        }
        return entry.duration || 0;
    };

    // ============ DYNAMIC CHART DATA ============
    const getWeekData = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const maxDuration = 8 * 3600; // 8 hours in seconds

        return weekDays.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const dayEntries = entries.filter((entry) => {
                const entryDate = format(parseISO(entry.startTime), "yyyy-MM-dd");
                return entryDate === dateStr;
            });

            let totalDuration = dayEntries.reduce((sum, entry) => {
                return sum + (entry.isRunning ? getEntryDuration(entry) : entry.duration);
            }, 0);

            // If it's today and timer is running, add the current elapsed time
            if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd") && activeTimerEntry) {
                totalDuration += elapsedTime;
            }

            const isTodayDate = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
            const height = totalDuration > 0 ? Math.min((totalDuration / maxDuration) * 100, 100) : 4;

            // Determine color based on duration
            let color = "bg-gray-200";
            if (totalDuration > 6 * 3600) color = "bg-linear-to-t from-emerald-500 to-emerald-400";
            else if (totalDuration > 4 * 3600) color = "bg-[#1A60FF]";
            else if (totalDuration > 2 * 3600) color = "bg-blue-400";
            else if (totalDuration > 0) color = "bg-amber-400";

            // If it's today and timer is running, highlight it
            if (isTodayDate && activeTimerEntry) {
                color = "bg-linear-to-t from-indigo-500 to-purple-500";
            }

            return {
                date: dateStr,
                dayName: format(date, "EEE"),
                duration: totalDuration,
                displayTime: formatDurationShort(totalDuration),
                isToday: isTodayDate,
                entries: dayEntries.length,
                height: height,
                color: color,
            };
        });
    }, [entries, elapsedTime, activeTimerEntry]);

    const getMaxDuration = useMemo(() => {
        const max = Math.max(...getWeekData.map(d => d.duration));
        return Math.max(max, 3600); // At least 1 hour
    }, [getWeekData]);

    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            if (filterStatus === "running" && !entry.isRunning) return false;
            if (filterStatus === "completed" && entry.isRunning) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    entry.taskTitle.toLowerCase().includes(query) ||
                    entry.description.toLowerCase().includes(query) ||
                    entry.userName.toLowerCase().includes(query)
                );
            }

            if (selectedTask && entry.taskId !== selectedTask) return false;

            return true;
        });
    }, [entries, filterStatus, searchQuery, selectedTask]);

    const groupedEntries = useMemo(() => {
        return filteredEntries.reduce((groups, entry) => {
            const date = format(parseISO(entry.startTime), "yyyy-MM-dd");
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(entry);
            return groups;
        }, {} as Record<string, TimerEntry[]>);
    }, [filteredEntries]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));
    }, [groupedEntries]);

    const getDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        if (isThisWeek(date)) return format(date, "EEEE");
        return format(date, "MMM d, yyyy");
    };

    const getGroupTotalTime = (dayEntries: TimerEntry[]) => {
        return dayEntries.reduce((total, entry) => {
            const duration = entry.isRunning ? getEntryDuration(entry) : entry.duration;
            return total + duration;
        }, 0);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-gray-500 text-sm font-medium">Loading timer log...</p>
                </div>
            </div>
        );
    }

    const hasActiveTimer = activeTimerEntry || activeTimerTaskId;
    const totalWeekTime = getWeekData.reduce((sum, day) => sum + day.duration, 0);
    const peakDay = getWeekData.reduce((max, day) => day.duration > max.duration ? day : max, getWeekData[0]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Error Banner */}
                {error && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-amber-700">{error}</p>
                        <button
                            onClick={fetchTimerData}
                            className="ml-auto px-4 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm transition"
                        >
                            <RefreshCw className="w-4 h-4 inline mr-1" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Top Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                                {stats ? formatDurationShort(stats.totalTimeToday) : "0h 0m"}
                            </div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                                LOGGED TODAY
                            </div>
                        </div>
                        <div className="text-xs font-semibold text-[#1A60FF] mt-4">
                            {stats && stats.totalTimeToday > 0
                                ? `${Math.min(100, Math.round((stats.totalTimeToday / (8 * 3600)) * 100))}% of 8h target`
                                : "0% of 8h target"}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                                {stats ? `${Math.floor(stats.totalTimeThisMonth / 3600)}h` : "0h"}
                            </div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                                THIS MONTH
                            </div>
                        </div>
                        <div className="text-xs font-semibold text-emerald-500 mt-4">
                            {stats && stats.totalTimeThisMonth > 0
                                ? `${Math.min(100, Math.round((stats.totalTimeThisMonth / (176 * 3600)) * 100))}% of 176h`
                                : "0% of 176h"}
                        </div>
                    </div>
                </div>

                {/* This Week — Daily Breakdown Bar Chart - DYNAMIC */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                            This Week — Daily Breakdown
                        </h2>
                        <span className="text-xs font-semibold text-gray-400">
                            {formatDurationShort(totalWeekTime)} total · {formatDurationShort(peakDay.duration)} peak
                        </span>
                    </div>

                    <div className="grid grid-cols-7 gap-2 items-end h-36 pt-6 px-1">
                        {getWeekData.map((day) => (
                            <div key={day.date} className="flex flex-col items-center h-full justify-end group">
                                <span className="text-[10px] font-bold text-gray-500 mb-1">
                                    {day.duration > 0 ? day.displayTime : '-'}
                                </span>
                                <div
                                    className={`w-full ${day.color} rounded-xl transition-all group-hover:opacity-90 shadow-sm ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                                    style={{
                                        height: `${Math.max(day.height, 4)}%`,
                                        minHeight: '4px',
                                        transition: 'height 0.3s ease'
                                    }}
                                />
                                <div className="flex items-center gap-1 mt-2">
                                    <span className={`text-[10px] font-medium ${day.isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                                        {day.dayName}
                                    </span>
                                    {day.entries > 0 && (
                                        <span className="text-[8px] text-gray-400">({day.entries})</span>
                                    )}
                                </div>
                                {day.isToday && (
                                    <span className="text-[8px] text-indigo-500 font-bold mt-0.5">● Today</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-[#1A60FF]"></div>
                            <span className="text-[10px] text-gray-500">4-6h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-linear-to-t from-emerald-500 to-emerald-400"></div>
                            <span className="text-[10px] text-gray-500">6h+</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-amber-400"></div>
                            <span className="text-[10px] text-gray-500">&lt;2h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gray-200"></div>
                            <span className="text-[10px] text-gray-500">No time</span>
                        </div>
                        {activeTimerEntry && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-linear-to-t from-indigo-500 to-purple-500"></div>
                                <span className="text-[10px] text-indigo-600 font-medium">● Running</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Timer Banner */}
                {hasActiveTimer && (
                    <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/30">
                                <Timer className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">Currently Tracking</span>
                                <h3 className="text-base font-bold text-white">
                                    {activeTimerEntry?.taskTitle || "Task"}
                                </h3>
                                <p className="text-xs text-indigo-200">
                                    {activeTimerEntry?.description || "Timer is running"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-2xl font-mono font-bold text-white tabular-nums">
                                    {formatTime(elapsedTime)}
                                </div>
                                <span className="text-[10px] text-emerald-300 font-medium">● running</span>
                            </div>
                            <button
                                onClick={() => handleStopTimer(activeTimerEntry?.taskId || activeTimerTaskId || "")}
                                disabled={isSubmitting}
                                className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
                            >
                                <StopCircle className="w-4 h-4" /> Stop Timer
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Task Timer Log Section */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Task Timer Log</h2>
                            <p className="text-xs text-gray-400">
                                {entries.length > 0
                                    ? `${entries.length} entries · ${formatDurationShort(entries.reduce((sum, e) => sum + e.duration, 0))} total`
                                    : "No entries yet"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/tasks/my"
                                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-xs transition flex items-center gap-2"
                            >
                                <PlayCircle className="w-4 h-4" /> Start Timer from Task
                            </Link>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2.5 bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition flex items-center gap-2 shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Manual Entry
                            </button>
                            <button
                                onClick={fetchTimerData}
                                className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-xl transition"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 relative min-w-[200px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#1A60FF] focus:ring-1 focus:ring-[#1A60FF] outline-none"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:border-[#1A60FF] outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="running">Running</option>
                            <option value="completed">Completed</option>
                        </select>
                        <select
                            value={selectedTask}
                            onChange={(e) => setSelectedTask(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:border-[#1A60FF] outline-none"
                        >
                            <option value="">All Tasks</option>
                            {tasks.map((task) => (
                                <option key={task._id} value={task._id}>{task.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-6 pt-2">
                        {sortedDates.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Timer Logs Yet</h3>
                                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                                    Start a timer from a task or add a manual entry to get started.
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <Link
                                        href="/tasks/my"
                                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
                                    >
                                        <PlayCircle className="w-4 h-4" /> Start Timer from Task
                                    </Link>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-5 py-2.5 bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Manual Entry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            sortedDates.slice(0, 7).map((date) => {
                                const dayEntries = groupedEntries[date];
                                const totalDayTime = getGroupTotalTime(dayEntries);

                                return (
                                    <div key={date} className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                            <span>{getDateLabel(date)}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{formatDurationShort(totalDayTime)} total</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{dayEntries.length} entries</span>
                                        </div>
                                        {dayEntries.map((entry) => {
                                            const startTimeFormatted = format(parseISO(entry.startTime), "h:mm a");
                                            const endTimeFormatted = entry.endTime ? format(parseISO(entry.endTime), "h:mm a") : "now";
                                            const displayTime = getEntryDisplayTime(entry);

                                            return (
                                                <div key={entry._id} className="relative flex items-start justify-between group">
                                                    <span className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ring-2 ${entry.isRunning ? 'bg-indigo-600 ring-indigo-100' : 'bg-emerald-500 ring-emerald-100'}`} />

                                                    <div className="space-y-1 flex-1">
                                                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                            {startTimeFormatted} → {endTimeFormatted}
                                                        </div>
                                                        <h4 className="text-sm font-bold text-gray-900">
                                                            {entry.taskTitle}
                                                            {entry.isRunning && <span className="text-indigo-600 font-normal ml-1">(running)</span>}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            {displayTime} logged · {entry.isRunning ? 'running' : 'completed'}
                                                            {entry.description && entry.description !== "Manual entry" && (
                                                                <span className="text-gray-400 ml-2">· {entry.description}</span>
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!entry.isRunning && (
                                                            <button
                                                                onClick={() => setEditingEntry(entry)}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteEntry(entry._id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Edit Modal */}
                {editingEntry && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Edit Timer Entry</h3>
                                <button onClick={() => setEditingEntry(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={editingEntry.description}
                                        onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A60FF]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={Math.floor(editingEntry.duration / 60)}
                                        onChange={(e) => {
                                            const mins = parseInt(e.target.value) || 0;
                                            setEditingEntry({ ...editingEntry, duration: mins * 60 });
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A60FF]"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setEditingEntry(null)}
                                        className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl text-xs transition shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleUpdateEntry(editingEntry._id, { description: editingEntry.description, duration: editingEntry.duration })}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Manual Entry Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Add Manual Entry</h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Select Task *</label>
                                    <select
                                        value={formData.taskId}
                                        onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A60FF]"
                                    >
                                        <option value="">Select a task...</option>
                                        {tasks.length === 0 ? (
                                            <option value="" disabled>No tasks available</option>
                                        ) : (
                                            tasks.map((task) => (
                                                <option key={task._id} value={task._id}>{task.title}</option>
                                            ))
                                        )}
                                    </select>
                                    {tasks.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            No tasks assigned to you. Please ask your manager to assign tasks.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        placeholder="What did you work on?"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A60FF]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Duration (minutes) *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Enter duration in minutes"
                                        value={formData.duration || ""}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#1A60FF]"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl text-xs transition shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateEntry}
                                        disabled={isSubmitting || !formData.taskId || formData.duration <= 0}
                                        className="flex-1 py-3 bg-[#1A60FF] hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Entry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}