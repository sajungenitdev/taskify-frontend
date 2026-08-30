"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Flag,
  MessageSquare,
  XCircle,
  Star,
  Calendar,
  Briefcase,
  Users,
  FileCheck,
  TrendingUp,
  Zap,
  X,
  Loader2,
  CheckCheck,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
  Settings,
  Inbox,
  Send,
  Mail,
  MailOpen,
  Plus,
  Minus,
  Search,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "task" | "comment" | "approval" | "system" | "reminder";
  isRead: boolean;
  taskId?: string;
  taskTitle?: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byCategory: {
    task: number;
    comment: number;
    approval: number;
    system: number;
    reminder: number;
  };
  byType: {
    info: number;
    success: number;
    warning: number;
    error: number;
  };
  lastWeek: Array<{ date: string; count: number }>;
}

type FilterType =
  | "all"
  | "unread"
  | "read"
  | "task"
  | "comment"
  | "approval"
  | "system"
  | "reminder";

const categoryColors = {
  task: "bg-emerald-50 text-emerald-700 border-emerald-200",
  comment: "bg-blue-50 text-blue-700 border-blue-200",
  approval: "bg-purple-50 text-purple-700 border-purple-200",
  reminder: "bg-amber-50 text-amber-700 border-amber-200",
  system: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const categoryIcons = {
  task: CheckCircle,
  comment: MessageSquare,
  approval: FileCheck,
  reminder: Clock,
  system: Settings,
};

const typeColors = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-rose-50 text-rose-700",
  info: "bg-blue-50 text-blue-700",
};

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    byCategory: {
      task: 0,
      comment: 0,
      approval: 0,
      system: 0,
      reminder: 0,
    },
    byType: {
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
    },
    lastWeek: [],
  });
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    [],
  );
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "compact">("list");
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchStats();
    }
  }, [user, filter, page, sortOrder, searchTerm]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = `/notifications?page=${page}&limit=20&sort=${sortOrder}`;
      if (filter !== "all") {
        if (filter === "unread") url += "&isRead=false";
        else if (filter === "read") url += "&isRead=true";
        else url += `&category=${filter}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalCount(response.data.pagination?.total || 0);
      } else {
        throw new Error("Failed to fetch notifications");
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      toast.error(
        error.response?.data?.message || "Failed to load notifications",
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/notifications/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      setStats({
        total: 0,
        unread: 0,
        read: 0,
        byCategory: {
          task: 0,
          comment: 0,
          approval: 0,
          system: 0,
          reminder: 0,
        },
        byType: {
          info: 0,
          success: 0,
          warning: 0,
          error: 0,
        },
        lastWeek: [],
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          read: prev.read + 1,
        }));
        toast.success("Marked as read");
      }
    } catch (error: any) {
      console.error("Error marking as read:", error);
      toast.error(error.response?.data?.message || "Failed to mark as read");
    }
  };

  const markAsUnread = async (id: string) => {
    try {
      const response = await api.patch(`/notifications/${id}/unread`);
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)),
        );
        setStats((prev) => ({
          ...prev,
          unread: prev.unread + 1,
          read: Math.max(0, prev.read - 1),
        }));
        toast.success("Marked as unread");
      }
    } catch (error: any) {
      console.error("Error marking as unread:", error);
      toast.error(error.response?.data?.message || "Failed to mark as unread");
    }
  };

  const deleteNotification = (id: string) => {
    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "animate-enter" : "animate-leave"
            } max-w-sm w-full bg-white shadow-lg rounded-2xl pointer-events-auto border border-slate-200/80 p-4 space-y-3`}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">
                Delete notification?
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await executeDelete(id);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-center" }
    );
  };

  const executeDelete = async (id: string) => {
    const loadingToast = toast.loading("Deleting notification...");

    try {
      const response = await api.delete(`/notifications/${id}`);

      if (response.data?.success) {
        const deleted = notifications.find((n) => n._id === id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));

        if (deleted) {
          setStats((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
            unread: deleted.isRead ? prev.unread : Math.max(0, prev.unread - 1),
            read: deleted.isRead ? Math.max(0, prev.read - 1) : prev.read,
            byCategory: {
              ...prev.byCategory,
              [deleted.category]: Math.max(
                0,
                (prev.byCategory?.[deleted.category] || 1) - 1
              ),
            },
            byType: {
              ...prev.byType,
              [deleted.type]: Math.max(
                0,
                (prev.byType?.[deleted.type] || 1) - 1
              ),
            },
          }));
        }

        toast.success("Notification deleted", { id: loadingToast });
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete notification",
        { id: loadingToast }
      );
    }
  };

  const markAllAsRead = async () => {
    setBulkActionLoading(true);
    try {
      const response = await api.patch("/notifications/read-all");
      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setStats((prev) => ({
          ...prev,
          unread: 0,
          read: prev.total,
        }));
        toast.success("All notifications marked as read");
      }
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      toast.error(
        error.response?.data?.message || "Failed to mark all as read",
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const deleteAllRead = () => {
    const readCount = notifications.filter((n) => n.isRead).length;

    if (readCount === 0) {
      toast.error("No read notifications to delete");
      return;
    }

    toast.custom(
      (t) => (
        <div
          className={`${t.visible ? "animate-enter" : "animate-leave"
            } max-w-sm w-full bg-white shadow-lg rounded-2xl pointer-events-auto border border-slate-200/80 p-4 space-y-3`}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">
                Delete all read notifications?
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                This will permanently remove {readCount} read notification{readCount > 1 ? "s" : ""}.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await executeDeleteAllRead();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
            >
              Delete All Read
            </button>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-center" }
    );
  };

  const executeDeleteAllRead = async () => {
    const loadingToast = toast.loading("Deleting read notifications...");
    setBulkActionLoading(true);

    try {
      const response = await api.delete("/notifications/read");

      if (response.data?.success) {
        const readNotifications = notifications.filter((n) => n.isRead);

        setNotifications((prev) => prev.filter((n) => !n.isRead));

        setStats((prev) => {
          const nextCategory = { ...prev.byCategory };
          const nextType = { ...prev.byType };

          readNotifications.forEach((n) => {
            if (nextCategory[n.category]) {
              nextCategory[n.category] = Math.max(0, nextCategory[n.category] - 1);
            }
            if (nextType[n.type]) {
              nextType[n.type] = Math.max(0, nextType[n.type] - 1);
            }
          });

          return {
            ...prev,
            total: Math.max(0, prev.total - readNotifications.length),
            read: 0,
            byCategory: nextCategory,
            byType: nextType,
          };
        });

        toast.success("Read notifications deleted", { id: loadingToast });
      }
    } catch (error: any) {
      console.error("Error deleting read notifications:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete read notifications",
        { id: loadingToast }
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkAction = async (action: "read" | "delete") => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected");
      return;
    }

    if (
      action === "delete" &&
      !confirm(`Delete ${selectedNotifications.length} notification(s)?`)
    ) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await api.post("/notifications/bulk", {
        action,
        ids: selectedNotifications,
      });

      if (response.data.success) {
        if (action === "read") {
          setNotifications((prev) =>
            prev.map((n) =>
              selectedNotifications.includes(n._id)
                ? { ...n, isRead: true }
                : n,
            ),
          );
          const newlyRead = notifications.filter(
            (n) => selectedNotifications.includes(n._id) && !n.isRead,
          ).length;
          setStats((prev) => ({
            ...prev,
            unread: Math.max(0, prev.unread - newlyRead),
            read: prev.read + newlyRead,
          }));
          toast.success(
            `${selectedNotifications.length} notification(s) marked as read`,
          );
        } else {
          const deleted = notifications.filter((n) =>
            selectedNotifications.includes(n._id),
          );
          setNotifications((prev) =>
            prev.filter((n) => !selectedNotifications.includes(n._id)),
          );
          const deletedUnread = deleted.filter((n) => !n.isRead).length;
          const deletedRead = deleted.filter((n) => n.isRead).length;
          setStats((prev) => ({
            ...prev,
            total: prev.total - deleted.length,
            unread: Math.max(0, prev.unread - deletedUnread),
            read: Math.max(0, prev.read - deletedRead),
          }));
          toast.success(
            `${selectedNotifications.length} notification(s) deleted`,
          );
        }
        setSelectedNotifications([]);
      }
    } catch (error: any) {
      console.error("Error in bulk action:", error);
      toast.error(error.response?.data?.message || "Failed to perform action");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n) => n._id));
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    } else if (notification.taskId) {
      router.push(`/tasks/${notification.taskId}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    const Icon = categoryIcons[category as keyof typeof categoryIcons] || Bell;
    return <Icon size={16} className="text-inherit" />;
  };

  const getCategoryColor = (category: string) => {
    return (
      categoryColors[category as keyof typeof categoryColors] ||
      categoryColors.system
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filterOptions: { value: FilterType; label: string; icon: any }[] = [
    { value: "all", label: "All", icon: Inbox },
    { value: "unread", label: "Unread", icon: Mail },
    { value: "read", label: "Read", icon: MailOpen },
    { value: "task", label: "Tasks", icon: CheckCircle },
    { value: "comment", label: "Comments", icon: MessageSquare },
    { value: "approval", label: "Approvals", icon: FileCheck },
    { value: "system", label: "System", icon: Settings },
    { value: "reminder", label: "Reminders", icon: Clock },
  ];

  // Memoized chart data
  const categoryChartData = useMemo(() => {
    return Object.entries(stats.byCategory).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [stats.byCategory]);

  const typeChartData = useMemo(() => {
    return Object.entries(stats.byType).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [stats.byType]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Notifications
                </h1>
                {totalCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                    {totalCount}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Stay updated with your tasks and activities
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <BarChart3 size={14} />
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
              <button
                onClick={() =>
                  setViewMode(viewMode === "list" ? "compact" : "list")
                }
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                {viewMode === "list" ? <Minus size={14} /> : <Plus size={14} />}
                {viewMode === "list" ? "Compact" : "Detailed"}
              </button>
              <button
                onClick={fetchNotifications}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              {stats.unread > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              {stats.read > 0 && (
                <button
                  onClick={deleteAllRead}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Clear read
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Section */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {stats.total}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <Bell size={20} className="text-indigo-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">
                        {stats.unread}
                      </p>
                      <p className="text-xs text-gray-500">Unread</p>
                    </div>
                    <Mail size={20} className="text-emerald-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-500">
                        {stats.read}
                      </p>
                      <p className="text-xs text-gray-500">Read</p>
                    </div>
                    <MailOpen size={20} className="text-gray-400" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.byCategory.task}
                      </p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                    <CheckCircle size={20} className="text-purple-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-amber-600">
                        {stats.byCategory.reminder}
                      </p>
                      <p className="text-xs text-gray-500">Reminders</p>
                    </div>
                    <Clock size={20} className="text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <PieChart size={16} className="text-indigo-500" />
                    Category Distribution
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-500" />
                    Type Distribution
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Last Week Activity */}
              {stats.lastWeek && stats.lastWeek.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CalendarIcon size={16} className="text-indigo-500" />
                    Last Week Activity
                  </h3>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.lastWeek}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-all flex items-center gap-1.5 ${filter === option.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                >
                  <option.icon size={12} />
                  {option.label}
                  {option.value !== "all" &&
                    option.value !== "unread" &&
                    option.value !== "read" && (
                      <span className="ml-1 text-[10px] opacity-70">
                        {stats.byCategory[
                          option.value as keyof typeof stats.byCategory
                        ] || 0}
                      </span>
                    )}
                </button>
              ))}
            </div>

            {/* Bulk Actions Bar */}
            {selectedNotifications.length > 0 && (
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotifications.length === notifications.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    {selectedNotifications.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction("read")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition flex items-center gap-1 disabled:opacity-50 shadow-sm"
                  >
                    <CheckCheck size={12} />
                    Mark as read
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Sort Order Toggle */}
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                }
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
              >
                {sortOrder === "desc" ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronUp size={14} />
                )}
                {sortOrder === "desc" ? "Newest first" : "Oldest first"}
              </button>
            </div>
          </motion.div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? `No results found for "${searchTerm}"`
                  : filter !== "all"
                    ? `No ${filter} notifications found`
                    : "You're all caught up!"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <AnimatePresence>
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group bg-white rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md ${!notification.isRead
                      ? "border-indigo-200 bg-indigo-50/30"
                      : "border-gray-200 hover:border-indigo-200"
                      } ${viewMode === "compact" ? "p-3" : "p-4"}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(
                            notification._id,
                          )}
                          onChange={() => toggleSelect(notification._id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Icon */}
                      <div
                        className={`p-2 rounded-lg border ${getCategoryColor(notification.category)} shrink-0`}
                      >
                        {getCategoryIcon(notification.category)}
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 cursor-pointer min-w-0"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-sm font-semibold text-gray-800 ${viewMode === "compact" ? "line-clamp-1" : ""}`}
                              >
                                {notification.title}
                              </h4>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${notification.type === "success"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : notification.type === "warning"
                                    ? "bg-amber-50 text-amber-700"
                                    : notification.type === "error"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-blue-50 text-blue-700"
                                  }`}
                              >
                                {notification.type}
                              </span>
                            </div>
                            <p
                              className={`text-xs text-gray-600 mt-1 ${viewMode === "compact" ? "line-clamp-1" : ""}`}
                            >
                              {notification.message}
                            </p>
                            {viewMode === "list" && notification.taskTitle && (
                              <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                                <Flag size={10} />
                                {notification.taskTitle}
                              </p>
                            )}
                            {viewMode === "list" &&
                              notification.userFullName && (
                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                  <Users size={10} />
                                  {notification.userFullName}
                                </p>
                              )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {formatDate(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!notification.isRead ? (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg transition"
                            title="Mark as read"
                          >
                            <CheckCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsUnread(notification._id)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg transition"
                            title="Mark as unread"
                          >
                            <EyeOff size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded-lg transition ${page === pageNum
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
