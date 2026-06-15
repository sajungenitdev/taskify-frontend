"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
      // Set default stats
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

  const deleteNotification = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.data.success) {
        const deleted = notifications.find((n) => n._id === id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (deleted) {
          setStats((prev) => ({
            ...prev,
            total: prev.total - 1,
            unread: deleted.isRead ? prev.unread : Math.max(0, prev.unread - 1),
            read: deleted.isRead ? Math.max(0, prev.read - 1) : prev.read,
            byCategory: {
              ...prev.byCategory,
              [deleted.category]: Math.max(
                0,
                prev.byCategory[deleted.category] - 1,
              ),
            },
            byType: {
              ...prev.byType,
              [deleted.type]: Math.max(0, prev.byType[deleted.type] - 1),
            },
          }));
        }
        toast.success("Notification deleted");
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete notification",
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

  const deleteAllRead = async () => {
    if (
      !confirm("Delete all read notifications? This action cannot be undone.")
    )
      return;

    setBulkActionLoading(true);
    try {
      const response = await api.delete("/notifications/read");
      if (response.data.success) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
        const readCount = stats.read;
        setStats((prev) => ({
          ...prev,
          total: prev.total - readCount,
          read: 0,
        }));
        toast.success("Read notifications deleted");
      }
    } catch (error: any) {
      console.error("Error deleting read notifications:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete read notifications",
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
    switch (category) {
      case "task":
        return <CheckCircle size={16} className="text-emerald-400" />;
      case "comment":
        return <MessageSquare size={16} className="text-blue-400" />;
      case "approval":
        return <FileCheck size={16} className="text-purple-400" />;
      case "reminder":
        return <Clock size={16} className="text-amber-400" />;
      default:
        return <Bell size={16} className="text-indigo-400" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "task":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "comment":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      case "approval":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400";
      case "reminder":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      default:
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6 px-5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  Notifications
                </h1>
                {totalCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-slate-800 rounded-full text-slate-400">
                    {totalCount}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                Stay updated with your tasks and activities
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white text-sm rounded-xl flex items-center gap-2 transition-all"
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
                  className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-sm rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              {stats.read > 0 && (
                <button
                  onClick={deleteAllRead}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-sm rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Clear read
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <Bell size={20} className="text-indigo-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {stats.unread}
                  </p>
                  <p className="text-xs text-slate-400">Unread</p>
                </div>
                <Mail size={20} className="text-emerald-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-400">
                    {stats.read}
                  </p>
                  <p className="text-xs text-slate-400">Read</p>
                </div>
                <MailOpen size={20} className="text-slate-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {stats.byCategory.task}
                  </p>
                  <p className="text-xs text-slate-400">Tasks</p>
                </div>
                <CheckCircle size={20} className="text-purple-400" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-amber-400">
                    {stats.byCategory.reminder}
                  </p>
                  <p className="text-xs text-slate-400">Reminders</p>
                </div>
                <Clock size={20} className="text-amber-400" />
              </div>
            </div>
          </motion.div>

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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={14} className="text-slate-500 hover:text-white" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-all flex items-center gap-1.5 ${
                    filter === option.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:text-white"
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
              <div className="bg-indigo-600/10 rounded-xl border border-indigo-500/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedNotifications.length === notifications.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-white">
                    {selectedNotifications.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkAction("read")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCheck size={12} />
                    Mark as read
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    disabled={bulkActionLoading}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg transition flex items-center gap-1 disabled:opacity-50"
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
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
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
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800"
            >
              <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No notifications
              </h3>
              <p className="text-slate-400">
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
                    className={`group bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 ${
                      !notification.isRead
                        ? "border-indigo-500/30 bg-indigo-500/5"
                        : "border-slate-800 hover:border-indigo-500/30"
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(
                              notification._id,
                            )}
                            onChange={() => toggleSelect(notification._id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Icon */}
                        <div
                          className={`p-2 rounded-lg border ${getCategoryColor(notification.category)}`}
                        >
                          {getCategoryIcon(notification.category)}
                        </div>

                        {/* Content */}
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-white">
                                  {notification.title}
                                </h4>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                    notification.type === "success"
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : notification.type === "warning"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : notification.type === "error"
                                          ? "bg-rose-500/20 text-rose-400"
                                          : "bg-indigo-500/20 text-indigo-400"
                                  }`}
                                >
                                  {notification.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {notification.message}
                              </p>
                              {notification.taskTitle && (
                                <p className="text-xs text-indigo-400 mt-2 flex items-center gap-1">
                                  <Flag size={10} />
                                  {notification.taskTitle}
                                </p>
                              )}
                              {notification.userFullName && (
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                  <Users size={10} />
                                  {notification.userFullName}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {formatDate(notification.createdAt)}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead ? (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-1.5 text-slate-500 hover:text-emerald-400 rounded-lg transition"
                              title="Mark as read"
                            >
                              <CheckCheck size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsUnread(notification._id)}
                              className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg transition"
                              title="Mark as unread"
                            >
                              <EyeOff size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
                className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`w-8 h-8 text-sm rounded-lg transition ${
                        page === pageNum
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800/50 text-slate-400 hover:text-white"
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
                className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
