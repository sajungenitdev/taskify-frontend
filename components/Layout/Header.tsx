"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse changes
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }

    const handleSidebarToggle = () => {
      const savedState = localStorage.getItem("sidebarCollapsed");
      if (savedState !== null) {
        setSidebarCollapsed(savedState === "true");
      }
    };

    window.addEventListener("sidebarToggle", handleSidebarToggle);
    return () =>
      window.removeEventListener("sidebarToggle", handleSidebarToggle);
  }, []);

  // Mock notifications - replace with API call
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        _id: "1",
        title: "New Task Assigned",
        message: 'You have been assigned a new task: "Complete project report"',
        type: "info",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      {
        _id: "2",
        title: "Task Completed",
        message: 'Your task "Update documentation" has been approved',
        type: "success",
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        _id: "3",
        title: "Deadline Approaching",
        message: 'Task "Fix login bug" is due in 2 days',
        type: "warning",
        isRead: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter((n) => !n.isRead).length);
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "error":
        return "bg-rose-500/10 border-rose-500/20 text-rose-400";
      default:
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✓";
      case "warning":
        return "⚠";
      case "error":
        return "✗";
      default:
        return "ℹ";
    }
  };

  const getPageTitle = () => {
    const path = pathname || "";
    if (path === "/dashboard") return "Dashboard";
    if (path === "/tasks") return "My Tasks";
    if (path === "/users") return "User Management";
    if (path === "/departments") return "Departments";
    if (path === "/profile") return "My Profile";
    if (path === "/attendance") return "Attendance Records";
    if (path === "/reports") return "Reports";
    if (path === "/settings") return "Settings";
    return "Workspace";
  };

  return (
    <header
      className={`bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 fixed top-0 right-0 z-30 transition-all duration-300 ${
        sidebarCollapsed ? "left-20" : "left-72"
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
            <p className="text-[10px] text-slate-500">
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
              placeholder="Search tasks, users, departments..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-200 placeholder:text-slate-500 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button (Mobile) */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
          >
            <Search size={18} />
          </button>

          {/* Help Button */}
          <button className="hidden lg:flex text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <HelpCircle size={18} />
          </button>

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
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-rose-500 to-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-lg shadow-rose-500/30">
                  {unreadCount > 9 ? "9+" : unreadCount}
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
                  <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-xs text-slate-500">
                          No notifications
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-3 border-b border-slate-700/50 hover:bg-slate-700/50 cursor-pointer transition-all ${
                            !notification.isRead ? "bg-indigo-500/5" : ""
                          }`}
                          onClick={() => markAsRead(notification._id)}
                        >
                          <div
                            className={`p-2 rounded-lg border ${getNotificationColor(notification.type)}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold text-white">
                                  {notification.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[9px] text-slate-500 mt-1">
                                  {new Date(
                                    notification.createdAt,
                                  ).toLocaleString()}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-700">
                    <button className="w-full text-center text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                      View all notifications
                    </button>
                  </div>
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
                  {user?.fullName?.charAt(0) || "U"}
                </span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white">
                  {user?.fullName?.split(" ")[0] || "User"}
                </p>
                <p className="text-[9px] text-slate-400 capitalize">
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
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {user?.fullName?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {user?.fullName}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate">
                          {user?.email}
                        </p>
                        <p className="text-[9px] text-indigo-400 capitalize mt-0.5">
                          {user?.role?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <User size={14} />
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <Settings size={14} />
                      Settings
                    </Link>
                    <div className="h-px bg-slate-700 my-1" />
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        logout();
                      }}
                      className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
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
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-200 placeholder:text-slate-500"
              autoFocus
            />
          </div>
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
