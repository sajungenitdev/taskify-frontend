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
  Calendar,
  Briefcase,
  Users,
  FileCheck,
  Zap,
  X,
  Loader2,
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
  // FIXED: Added proper type with initial value
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Listen for sidebar collapse changes from sidebar
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

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
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
      if (error.response?.status === 404) {
        console.log("Notifications API not ready");
      }
    }
  }, [user]);

  // Real-time notification polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // WebSocket for real-time notifications
  useEffect(() => {
    if (!user) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications`;

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "new_notification") {
          const newNotification: Notification = {
            _id: data.notification._id,
            title: data.notification.title,
            message: data.notification.message,
            type: data.notification.type,
            category: data.notification.category,
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(), // ✅ Added missing field
          };
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.success(data.notification.title, {
            duration: 5000,
            icon: "🔔",
          });
        }
      };
    } catch (error) {
      console.error("WebSocket connection failed:", error);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
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
          title: `Results for "${query}"`,
          type: "task",
          url: `/tasks?search=${query}`,
          description: "View all matching tasks",
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
        return <CheckCircle size={14} className="text-emerald-400" />;
      case "comment":
        return <MessageSquare size={14} className="text-blue-400" />;
      case "approval":
        return <FileCheck size={14} className="text-purple-400" />;
      case "reminder":
        return <Clock size={14} className="text-amber-400" />;
      case "system":
        return <Zap size={14} className="text-indigo-400" />;
      default:
        if (type === "success")
          return <CheckCircle size={14} className="text-emerald-400" />;
        if (type === "warning")
          return <AlertCircle size={14} className="text-amber-400" />;
        if (type === "error")
          return <XCircle size={14} className="text-rose-400" />;
        return <Bell size={14} className="text-indigo-400" />;
    }
  };

  const getNotificationColor = (category: string, type: string) => {
    if (category === "task") return "bg-emerald-500/10 border-emerald-500/20";
    if (category === "comment") return "bg-blue-500/10 border-blue-500/20";
    if (category === "approval") return "bg-purple-500/10 border-purple-500/20";
    if (category === "reminder") return "bg-amber-500/10 border-amber-500/20";
    if (type === "success") return "bg-emerald-500/10 border-emerald-500/20";
    if (type === "warning") return "bg-amber-500/10 border-amber-500/20";
    if (type === "error") return "bg-rose-500/10 border-rose-500/20";
    return "bg-indigo-500/10 border-indigo-500/20";
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
      className={`bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 fixed top-0 right-0 z-30 transition-all duration-300 ${
        sidebarCollapsed ? "left-20" : "left-80"
      }`}
    >
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
        {/* Left Section - Mobile Menu & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="text-[9px] text-slate-600 mt-0.5">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks, projects, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() =>
                searchQuery.length >= 2 && setShowSearchResults(true)
              }
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-500 transition-all"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
            )}
            {!searching && searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
              ⌘K
            </kbd>
          </div>

          {showSearchResults &&
            (searchResults.length > 0 || searchQuery.length >= 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {searchResults.length === 0 && searchQuery.length >= 2 && (
                    <div className="p-4 text-center">
                      <p className="text-sm text-slate-500">
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
                      className="flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700 last:border-0"
                    >
                      {result.type === "task" && (
                        <CheckCircle size={16} className="text-indigo-400" />
                      )}
                      {result.type === "project" && (
                        <Briefcase size={16} className="text-emerald-400" />
                      )}
                      {result.type === "user" && (
                        <User size={16} className="text-amber-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {result.title}
                        </p>
                        {result.description && (
                          <p className="text-xs text-slate-500 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] capitalize text-slate-500">
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
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
          >
            <Search size={18} />
          </button>

          <Link
            href="/help"
            className="hidden lg:flex text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <HelpCircle size={18} />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
              }}
              className="relative text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-gradient-to-r from-rose-500 to-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-lg shadow-rose-500/30">
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Notifications
                      </h3>
                      <p className="text-[10px] text-slate-500">
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
                        <p className="text-xs text-slate-500">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">
                          No notifications
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          When you get notifications, they'll appear here
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-3 border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-all ${!notification.isRead ? "bg-indigo-500/5" : ""}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-1.5 rounded-lg border ${getNotificationColor(notification.category, notification.type)}`}
                            >
                              {getNotificationIcon(
                                notification.category,
                                notification.type,
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-semibold text-white">
                                  {notification.title}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-slate-500 whitespace-nowrap">
                                    {formatTime(notification.createdAt)}
                                  </span>
                                  <button
                                    onClick={(e) =>
                                      deleteNotification(notification._id, e)
                                    }
                                    className="text-slate-500 hover:text-rose-400 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
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
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                      <Link
                        href="/notifications"
                        className="w-full text-center text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors block"
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
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-bold">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white max-w-[120px] truncate">
                  {user?.fullName?.split(" ")[0] || "User"}
                </p>
                <p className="text-[9px] text-slate-400 capitalize truncate max-w-[120px]">
                  {user?.role?.replace(/_/g, " ") || "Employee"}
                </p>
              </div>
              <ChevronDown
                size={14}
                className="hidden lg:block text-slate-500"
              />
            </button>

            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-bold">
                          {user?.fullName?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.fullName || "User"}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {user?.email}
                        </p>
                        <p className="text-[9px] text-indigo-400 capitalize mt-0.5">
                          {user?.role?.replace(/_/g, " ") || "Employee"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <User size={16} />
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <div className="h-px bg-slate-700 my-1" />
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        logout();
                      }}
                      className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>

                  <div className="p-3 border-t border-slate-700 bg-slate-800/30">
                    <p className="text-[9px] text-slate-500 text-center">
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
        <div className="md:hidden p-3 border-t border-slate-800 bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks, projects, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-500"
              autoFocus
            />
          </div>
          {searchResults.length > 0 && searchQuery.length >= 2 && (
            <div className="mt-2 bg-slate-800 rounded-lg border border-slate-700 max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <Link
                  key={result._id}
                  href={result.url}
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                >
                  {result.type === "task" && (
                    <CheckCircle size={14} className="text-indigo-400" />
                  )}
                  {result.type === "project" && (
                    <Briefcase size={14} className="text-emerald-400" />
                  )}
                  {result.type === "user" && (
                    <User size={14} className="text-amber-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-white">{result.title}</p>
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
          background: rgba(51, 65, 85, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </header>
  );
}
