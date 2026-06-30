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
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isBellBuzzing, setIsBellBuzzing] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Listen for sidebar collapse changes
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }

    const handleSidebarToggle = (event: CustomEvent) => {
      if (event.detail?.collapsed !== undefined) {
        setSidebarCollapsed(event.detail.collapsed);
      } else {
        const savedState = localStorage.getItem("sidebarCollapsed");
        if (savedState !== null) {
          setSidebarCollapsed(savedState === "true");
        }
      }
    };

    window.addEventListener(
      "sidebarToggle",
      handleSidebarToggle as EventListener,
    );
    return () =>
      window.removeEventListener(
        "sidebarToggle",
        handleSidebarToggle as EventListener,
      );
  }, []);

  // Trigger bell animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      // New notification arrived - trigger bell buzz
      setIsBellBuzzing(true);

      // Stop buzzing after animation completes
      const timer = setTimeout(() => {
        setIsBellBuzzing(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

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
      // Silent fail - don't show error to user
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Polling for notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    let ws: WebSocket | null = null;

    try {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
      };

      ws.onerror = () => {
        console.debug("WebSocket connection failed (using polling)");
      };

      ws.onclose = () => {
        console.debug("WebSocket disconnected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_notification") {
            fetchNotifications();
          }
        } catch (e) {
          // Ignore parse errors
        }
      };
    } catch (error) {
      console.debug("WebSocket not available");
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
    return "Workspace";
  };

  if (!user) return null;

  return (
    <header
      className={`bg-white/95 backdrop-blur-xl border-b border-gray-200 fixed top-0 right-0 z-30 transition-all duration-300 ${
        sidebarCollapsed ? "left-20" : "left-80"
      }`}
    >
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
        {/* Left Section - Mobile Menu & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="text-[9px] text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="hidden md:block flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() =>
                searchQuery.length >= 2 && setShowSearchResults(true)
              }
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-gray-700 placeholder:text-gray-400 transition-all"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
            {!searching && searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200 hidden lg:inline-block">
              ⌘K
            </kbd>
          </div>

          {showSearchResults &&
            (searchResults.length > 0 || searchQuery.length >= 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">
                        No results found for "{searchQuery}"
                      </p>
                    </div>
                  )}
                  {searchResults.map((result) => (
                    <Link
                      key={result._id}
                      href={result.url}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      {result.type === "task" && (
                        <CheckCircle size={16} className="text-indigo-500" />
                      )}
                      {result.type === "project" && (
                        <Briefcase size={16} className="text-emerald-500" />
                      )}
                      {result.type === "user" && (
                        <User size={16} className="text-amber-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] capitalize text-gray-400">
                        {result.type}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <Search size={18} />
          </button>

          <Link
            href="/help"
            className="hidden lg:flex text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <HelpCircle size={18} />
          </Link>

          {/* Notifications Dropdown with Buzzing Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
                // Reset bell buzzing when clicked
                setIsBellBuzzing(false);
              }}
              className="relative text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="relative">
                <Bell
                  size={18}
                  className={`transition-all duration-300 ${
                    isBellBuzzing
                      ? "text-amber-500 animate-bell-buzz"
                      : unreadCount > 0
                        ? "text-indigo-500"
                        : ""
                  }`}
                />
                {/* Bell ring effect - pulsing ring */}
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

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Notifications
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Stay updated with your tasks
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        disabled={markingAll}
                        className="text-[10px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {markingAll ? "..." : "Mark all read"}
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {loading ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          No notifications
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          When you get notifications, they'll appear here
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${
                            !notification.isRead ? "bg-indigo-50/50" : ""
                          }`}
                          onClick={() => handleNotificationClick(notification)}
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
                                <h4 className="text-xs font-semibold text-gray-800">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-gray-400 whitespace-nowrap">
                                    {formatTime(notification.createdAt)}
                                  </span>
                                  <button
                                    onClick={(e) =>
                                      deleteNotification(notification._id, e)
                                    }
                                    className="text-gray-400 hover:text-rose-500 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              {notification.taskTitle && (
                                <p className="text-[9px] text-indigo-500 mt-1 flex items-center gap-1">
                                  <Flag size={9} />
                                  {notification.taskTitle}
                                </p>
                              )}
                            </div>
                            {!notification.isRead && (
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50/50">
                      <Link
                        href="/notifications"
                        className="w-full text-center text-[10px] font-medium text-indigo-500 hover:text-indigo-600 transition-colors block"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-800 max-w-[120px] truncate">
                  {user?.fullName?.split(" ")[0] || "User"}
                </p>
                <p className="text-[9px] text-gray-400 capitalize truncate max-w-[120px]">
                  {user?.role?.replace(/_/g, " ") || "Employee"}
                </p>
              </div>
              <ChevronDown
                size={14}
                className="hidden lg:block text-gray-400"
              />
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">
                          {user?.fullName?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {user?.fullName || "User"}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <p className="text-[9px] text-indigo-500 capitalize mt-0.5">
                          {user?.role?.replace(/_/g, " ") || "Employee"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <User size={16} />
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <div className="h-px bg-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        logout();
                      }}
                      className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>

                  <div className="p-3 border-t border-gray-200 bg-gray-50/50">
                    <p className="text-[9px] text-gray-400 text-center">
                      Logged in as {user?.role?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="md:hidden p-3 border-t border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, projects, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-gray-700 placeholder:text-gray-400"
              autoFocus
            />
          </div>
          {searchResults.length > 0 && searchQuery.length >= 2 && (
            <div className="mt-2 bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <Link
                  key={result._id}
                  href={result.url}
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  {result.type === "task" && (
                    <CheckCircle size={14} className="text-indigo-500" />
                  )}
                  {result.type === "project" && (
                    <Briefcase size={14} className="text-emerald-500" />
                  )}
                  {result.type === "user" && (
                    <User size={14} className="text-amber-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{result.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }

        /* Bell Buzzing Animation */
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
