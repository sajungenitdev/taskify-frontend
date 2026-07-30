"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  Search,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Flag,
  MessageSquare,
  XCircle,
  Briefcase,
  FileCheck,
  Zap,
  X,
  Loader2,
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  TrendingUp,
  BarChart3,
  Home,
  FolderKanban,
  Award,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchResult {
  _id: string;
  title: string;
  type: "task" | "project" | "user";
  url: string;
  description?: string;
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // ============================================================
  // STATE - Initialize with lazy initializers to avoid useEffect warnings
  // ============================================================
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved === "true";
    }
    return false;
  });
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isBellBuzzing, setIsBellBuzzing] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // ============================================================
  // REFS
  // ============================================================
  const prevUnreadCountRef = useRef(0);
  const searchDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isNotificationsInitialized = useRef(false);

  const imagePathKey = user?.profilePhoto || "default";
  const imageError = imageErrorMap[imagePathKey] || false;

  // ============================================================
  // EFFECTS
  // ============================================================


  // Live time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for sidebar collapse changes from other components
  useEffect(() => {
    const handleSidebarToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.collapsed !== undefined) {
        setSidebarCollapsed(customEvent.detail.collapsed);
      } else {
        const saved = localStorage.getItem("sidebarCollapsed");
        if (saved !== null) {
          setSidebarCollapsed(saved === "true");
        }
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  // Trigger bell animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      setIsBellBuzzing(true);
      const timer = setTimeout(() => setIsBellBuzzing(false), 1500);
      prevUnreadCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  // Helper function to get image URL using photoVersion
// Helper function to get image URL - uses user._id as cache buster
const getImageUrl = useCallback(
  (imagePath: string | undefined): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:image/")) return imagePath;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const baseUrl = apiUrl.replace("/api/v1", "");
    const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    // Use user ID as cache buster
    const cacheBuster = user?._id || Date.now();
    return `${baseUrl}${path}?v=${cacheBuster}`;
  },
  [user?._id],
);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.get("/notifications?limit=20");
      if (response.data.success) {
        const formattedNotifications = (response.data.data || []).map(
          (notif: any) => ({
            _id: notif._id,
            title: notif.title,
            message: notif.message,
            type: notif.type || "info",
            category: notif.category || "system",
            isRead: notif.isRead || false,
            taskId: notif.taskId,
            taskTitle: notif.taskTitle,
            userId: notif.userId,
            userEmail: notif.userEmail,
            actionUrl: notif.actionUrl,
            createdAt: notif.createdAt,
            updatedAt: notif.updatedAt,
          }),
        );
        setNotifications(formattedNotifications);
        setUnreadCount(
          formattedNotifications.filter((n: Notification) => !n.isRead).length,
        );
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Polling for notifications - only fetch once with ref
  useEffect(() => {
    if (!isNotificationsInitialized.current) {
      isNotificationsInitialized.current = true;
      fetchNotifications();
    }
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error: any) {
      console.error("Error marking all as read:", error);
      toast.error(
        error.response?.data?.message || "Failed to mark all as read",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Notification deleted");
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete notification",
      );
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
    } else if (notification.category === "approval") {
      router.push("/tasks?filter=pending_approval");
    }

    setShowNotifications(false);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([
        {
          _id: "1",
          title: `View all results for "${query}"`,
          type: "task",
          url: `/tasks?search=${query}`,
          description: "Click to see all matching tasks",
        },
      ]);
      setShowSearchResults(true);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, handleSearch]);

  useEffect(() => {
    const handleClickOutside = () => setShowSearchResults(false);
    if (showSearchResults) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSearchResults]);

  const getNotificationIcon = (category: string, type: string) => {
    switch (category) {
      case "task":
        return <CheckCircle size={14} className="text-emerald-500" />;
      case "comment":
        return <MessageSquare size={14} className="text-blue-500" />;
      case "approval":
        return <FileCheck size={14} className="text-purple-500" />;
      case "reminder":
        return <Clock size={14} className="text-amber-500" />;
      case "system":
        return <Zap size={14} className="text-indigo-500" />;
      default:
        if (type === "success")
          return <CheckCircle size={14} className="text-emerald-500" />;
        if (type === "warning")
          return <AlertCircle size={14} className="text-amber-500" />;
        if (type === "error")
          return <XCircle size={14} className="text-rose-500" />;
        return <Bell size={14} className="text-indigo-500" />;
    }
  };

  const getNotificationColor = (category: string, type: string) => {
    if (category === "task") return "bg-emerald-50 border-emerald-200";
    if (category === "comment") return "bg-blue-50 border-blue-200";
    if (category === "approval") return "bg-purple-50 border-purple-200";
    if (category === "reminder") return "bg-amber-50 border-amber-200";
    if (type === "success") return "bg-emerald-50 border-emerald-200";
    if (type === "warning") return "bg-amber-50 border-amber-200";
    if (type === "error") return "bg-rose-50 border-rose-200";
    return "bg-indigo-50 border-indigo-200";
  };

  const formatTime = (dateString: string) => {
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
    return date.toLocaleDateString();
  };

  const getPageTitle = () => {
    const path = pathname || "";
    if (path === "/dashboard") return "Dashboard";
    if (path === "/tasks") return "Task Workspace";
    if (path === "/users") return "User Management";
    if (path === "/departments") return "Departments";
    if (path === "/profile") return "My Profile";
    if (path === "/attendance") return "Attendance Records";
    if (path === "/reports") return "Reports & Analytics";
    if (path === "/settings") return "System Settings";
    if (path === "/bulk-upload") return "Bulk Task Upload";
    if (path.startsWith("/tasks/")) return "Task Details";
    if (path === "/kpi/dashboard") return "KPI Dashboard";
    if (path === "/kpi/leaderboard") return "KPI Leaderboard";
    if (path === "/kpi/reports") return "KPI Reports";
    if (path === "/projects") return "Projects";
    return "Workspace";
  };

  const getPageIcon = () => {
    const path = pathname || "";
    if (path === "/dashboard") return <LayoutDashboard size={16} />;
    if (path === "/tasks") return <CheckSquare size={16} />;
    if (path === "/users") return <Users size={16} />;
    if (path === "/departments") return <FolderKanban size={16} />;
    if (path === "/profile") return <User size={16} />;
    if (path === "/attendance") return <Calendar size={16} />;
    if (path === "/reports") return <BarChart3 size={16} />;
    if (path === "/settings") return <Settings size={16} />;
    if (path === "/kpi/dashboard") return <TrendingUp size={16} />;
    if (path === "/kpi/leaderboard") return <Award size={16} />;
    if (path === "/projects") return <Briefcase size={16} />;
    return <Home size={16} />;
  };

  const profileImageUrl = getImageUrl(user?.profilePhoto);

  // Format time for display
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  if (!user) return null;

  return (
    <header
      className={`fixed top-0 right-0 z-30 transition-all duration-500 ease-out ${
        sidebarCollapsed ? "left-20" : "left-80"
      }`}
      style={{ backgroundColor: "#122645" }}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-purple-400/50" />

      {/* Subtle glow effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between relative">
        {/* Left Section - Mobile Menu & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-white/60 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-white/10 backdrop-blur-sm"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              {getPageIcon()}
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">
                {getPageTitle()}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/40 font-medium tracking-wider uppercase">
                  {formattedDate}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[9px] text-white/30 font-medium">
                  {user?.role?.replace(/_/g, " ").toUpperCase()}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[9px] text-white/30 font-mono">
                  {formattedTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="hidden md:block flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl bg-white/5 blur-xl group-focus-within:bg-indigo-500/10 transition-all duration-500" />
            <div className="relative flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl transition-all duration-300 group-focus-within:border-indigo-400/50 group-focus-within:bg-white/10 group-focus-within:shadow-lg group-focus-within:shadow-indigo-500/5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-indigo-400 transition-colors duration-300" />
              <input
                type="text"
                disabled
                placeholder="Search tasks, projects, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() =>
                  searchQuery.length >= 2 && setShowSearchResults(true)
                }
                className="w-full pl-10 pr-4 py-2 text-sm bg-transparent border-none rounded-xl focus:outline-none text-white/90 placeholder:text-white/30 transition-all duration-300"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 animate-spin" />
              )}
              {!searching && searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/10 hidden lg:inline-block font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearchResults &&
              (searchResults.length > 0 || searchQuery.length >= 2) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0f1f3a] backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                >
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {searchResults.length === 0 && searchQuery.length >= 2 && (
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center">
                          <Search className="w-6 h-6 text-white/20" />
                        </div>
                        <p className="text-sm text-white/60">
                          No results found for
                        </p>
                        <p className="text-sm text-white font-medium">
                          "{searchQuery}"
                        </p>
                      </div>
                    )}
                    {searchResults.map((result, index) => (
                      <motion.div
                        key={result._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={result.url}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                            {result.type === "task" && (
                              <CheckCircle
                                size={14}
                                className="text-emerald-400"
                              />
                            )}
                            {result.type === "project" && (
                              <Briefcase size={14} className="text-blue-400" />
                            )}
                            {result.type === "user" && (
                              <User size={14} className="text-amber-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/90 truncate group-hover:text-white transition-colors">
                              {result.title}
                            </p>
                            {result.description && (
                              <p className="text-xs text-white/40 truncate">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[9px] uppercase text-white/20 tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                            {result.type}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-white/5 bg-white/5">
                    <p className="text-[9px] text-white/20 text-center font-mono">
                      {searchResults.length} results found
                    </p>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
          >
            <Search size={18} />
          </button>

          <Link
            href="/help"
            className="hidden lg:flex text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
          >
            <HelpCircle size={18} />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
                setIsBellBuzzing(false);
              }}
              className="relative text-white/60 hover:text-white transition-all duration-300 p-2 rounded-lg hover:bg-white/10"
            >
              <div className="relative">
                <Bell
                  size={18}
                  className={`transition-all duration-300 ${
                    isBellBuzzing
                      ? "text-amber-400 animate-bell-buzz"
                      : unreadCount > 0
                        ? "text-indigo-400"
                        : ""
                  }`}
                />
                {isBellBuzzing && (
                  <>
                    <span className="absolute inset-0 rounded-full animate-ping-ring border-2 border-amber-400/40" />
                    <span className="absolute inset-0 rounded-full animate-ping-ring-delayed border-2 border-amber-400/20" />
                  </>
                )}
              </div>
              {unreadCount > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-gradient-to-r from-rose-500 to-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-lg shadow-rose-500/30 transition-all duration-300 ${
                    isBellBuzzing ? "animate-bounce" : ""
                  }`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f1f3a] backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Notifications
                        </h3>
                        <p className="text-[10px] text-white/40">
                          Stay updated with your tasks
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          disabled={markingAll}
                          className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                        >
                          {markingAll ? "..." : "Mark all read"}
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {loading ? (
                        <div className="p-8 text-center">
                          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
                          <p className="text-xs text-white/40">
                            Loading notifications...
                          </p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white/20" />
                          </div>
                          <p className="text-sm text-white/60">
                            No notifications
                          </p>
                          <p className="text-xs text-white/30 mt-1">
                            When you get notifications, they'll appear here
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <motion.div
                            key={notification._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all ${
                              !notification.isRead ? "bg-indigo-500/5" : ""
                            }`}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-1.5 rounded-lg border ${getNotificationColor(
                                  notification.category,
                                  notification.type,
                                )}`}
                              >
                                {getNotificationIcon(
                                  notification.category,
                                  notification.type,
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-semibold text-white/90">
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-[9px] text-white/30 whitespace-nowrap">
                                      {formatTime(notification.createdAt)}
                                    </span>
                                    <button
                                      onClick={(e) =>
                                        deleteNotification(notification._id, e)
                                      }
                                      className="text-white/20 hover:text-rose-400 transition-colors"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[11px] text-white/60 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                {notification.taskTitle && (
                                  <p className="text-[9px] text-indigo-400 mt-1 flex items-center gap-1">
                                    <Flag size={9} />
                                    {notification.taskTitle}
                                  </p>
                                )}
                              </div>
                              {!notification.isRead && (
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1 animate-pulse" />
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-white/10 bg-white/5">
                        <Link
                          href="/notifications"
                          className="w-full text-center text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors block"
                          onClick={() => setShowNotifications(false)}
                        >
                          View all notifications
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 p-1 rounded-lg hover:bg-white/10"
            >
              <div className="relative group/avatar">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 ring-2 ring-white/10 hover:ring-indigo-400/30 transition-all duration-300">
                  {profileImageUrl && !imageError ? (
                    <img
                      src={profileImageUrl}
                      alt={user?.fullName || "Profile"}
                      className="w-full h-full object-cover"
                      onError={() => {
                        setImageErrorMap((prev) => ({
                          ...prev,
                          [imagePathKey]: true,
                        }));
                      }}
                    />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {user?.fullName?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        "U"}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#122645] animate-pulse" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-white/90 max-w-[120px] truncate">
                  {user?.fullName?.split(" ")[0] || "User"}
                </p>
                <p className="text-[9px] text-white/40 capitalize truncate max-w-[120px]">
                  {user?.role?.replace(/_/g, " ") || "Employee"}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`hidden lg:block text-white/40 transition-transform duration-300 ${
                  showProfileDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-[#0f1f3a] backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                  >
                    {/* Profile Header */}
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 ring-2 ring-white/20">
                            {profileImageUrl && !imageError ? (
                              <img
                                src={profileImageUrl}
                                alt={user?.fullName || "Profile"}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setImageErrorMap((prev) => ({
                                    ...prev,
                                    [imagePathKey]: true,
                                  }));
                                }}
                              />
                            ) : (
                              <span className="text-white text-lg font-bold">
                                {user?.fullName?.charAt(0) ||
                                  user?.email?.charAt(0) ||
                                  "U"}
                              </span>
                            )}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0f1f3a] animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {user?.fullName || "User"}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {user?.email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[8px] font-medium text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/20">
                              {user?.role?.replace(/_/g, " ").toUpperCase()}
                            </span>
                            <span className="text-[8px] font-medium text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Online
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(user?.email || "")}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          title="Copy email"
                        >
                          {showCopySuccess ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <Copy size={14} className="text-white/40" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Profile Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 group"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                          <User
                            size={14}
                            className="text-white/30 group-hover:text-indigo-400"
                          />
                        </div>
                        <span>Your Profile</span>
                        <ChevronRight
                          size={14}
                          className="ml-auto text-white/10 group-hover:text-white/20"
                        />
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 group"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                          <Settings
                            size={14}
                            className="text-white/30 group-hover:text-indigo-400"
                          />
                        </div>
                        <span>Settings</span>
                        <ChevronRight
                          size={14}
                          className="ml-auto text-white/10 group-hover:text-white/20"
                        />
                      </Link>
                      <Link
                        href="/notifications"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all duration-300 group"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                          <Bell
                            size={14}
                            className="text-white/30 group-hover:text-indigo-400"
                          />
                        </div>
                        <span className="flex-1">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                        <ChevronRight
                          size={14}
                          className="text-white/10 group-hover:text-white/20"
                        />
                      </Link>
                      <div className="h-px bg-white/5 my-1" />
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                          logout();
                        }}
                        className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-300 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center transition-colors">
                          <LogOut
                            size={14}
                            className="text-rose-400/50 group-hover:text-rose-400"
                          />
                        </div>
                        <span>Sign out</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-white/5 bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] text-white/20 font-mono">
                              Online
                            </span>
                          </div>
                          <span className="w-px h-3 bg-white/5" />
                          <span className="text-[9px] text-white/20 font-mono">
                            v2.0.0
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-white/20">
                            {formattedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-white/10 bg-[#0f1f3a]"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search tasks, projects, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 text-white/90 placeholder:text-white/30 transition-all duration-300"
                  autoFocus
                />
              </div>
              {searchResults.length > 0 && searchQuery.length >= 2 && (
                <div className="mt-2 bg-[#0f1f3a] rounded-lg border border-white/10 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <Link
                      key={result._id}
                      href={result.url}
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      {result.type === "task" && (
                        <CheckCircle size={14} className="text-emerald-400" />
                      )}
                      {result.type === "project" && (
                        <Briefcase size={14} className="text-blue-400" />
                      )}
                      {result.type === "user" && (
                        <User size={14} className="text-amber-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white/90">{result.title}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }

        @keyframes bellBuzz {
          0%,
          100% {
            transform: rotate(0deg);
          }
          10% {
            transform: rotate(15deg);
          }
          20% {
            transform: rotate(-15deg);
          }
          30% {
            transform: rotate(12deg);
          }
          40% {
            transform: rotate(-12deg);
          }
          50% {
            transform: rotate(8deg);
          }
          60% {
            transform: rotate(-8deg);
          }
          70% {
            transform: rotate(5deg);
          }
          80% {
            transform: rotate(-5deg);
          }
          90% {
            transform: rotate(2deg);
          }
        }

        @keyframes pingRing {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        @keyframes pingRingDelayed {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes bounce {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(0.95);
          }
        }

        .animate-bell-buzz {
          animation: bellBuzz 0.8s ease-in-out;
        }

        .animate-ping-ring {
          animation: pingRing 0.8s ease-out;
        }

        .animate-ping-ring-delayed {
          animation: pingRingDelayed 0.8s ease-out 0.15s;
        }

        .animate-bounce {
          animation: bounce 0.4s ease-in-out 2;
        }
      `}</style>
    </header>
  );
}