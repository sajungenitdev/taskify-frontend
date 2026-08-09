// components/Assistant/AssistantWizard.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sparkles,
  X,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Briefcase,
  TrendingUp,
  Star,
  Award,
  Zap,
  Loader2,
  ChevronRight,
  MessageSquare,
  Bell,
  Shield,
  Users,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AssistantData {
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    submitted: number;
    rejected: number;
  };
  performance: {
    completionRate: number;
    onTimeRate: number;
    averageRating: number;
    totalHours: number;
  };
  notifications: {
    unread: number;
    latest: Array<{
      _id: string;
      title: string;
      message: string;
      createdAt: string;
      isRead: boolean;
    }>;
  };
  user: {
    fullName: string;
    email: string;
    role: string;
    employeeId: string;
    department?: string;
    profilePhoto?: string;
  };
  quickActions: Array<{
    label: string;
    icon: React.ReactNode;
    href: string;
    color: string;
  }>;
}

export default function AssistantWizard() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AssistantData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch assistant data
  const fetchAssistantData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch tasks stats
      const tasksResponse = await api.get("/tasks/my-statistics");
      // Fetch notifications
      const notificationsResponse = await api.get("/notifications?limit=5");
      // Fetch user profile
      const profileResponse = await api.get("/auth/me");

      const taskStats = tasksResponse.data.data || {};
      const notifications = notificationsResponse.data.data || [];
      const profile = profileResponse.data.data || {};

      // Calculate completion rate
      const totalTasks = taskStats.total || 0;
      const completedTasks = taskStats.byStatus?.completed || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate on-time rate (simplified)
      const onTimeRate = completionRate > 0 ? Math.min(completionRate + 10, 100) : 0;

      // Quick actions based on role
      const quickActions = [
        {
          label: "My Tasks",
          icon: <CheckCircle className="w-4 h-4" />,
          href: "/tasks",
          color: "bg-blue-500",
        },
        {
          label: "Create Task",
          icon: <Zap className="w-4 h-4" />,
          href: "/tasks/create",
          color: "bg-purple-500",
        },
      ];

      // Add role-specific actions
      if (user.role === "admin" || user.role === "super_admin" || user.role === "hr_manager") {
        quickActions.push({
          label: "Users",
          icon: <Users className="w-4 h-4" />,
          href: "/users",
          color: "bg-indigo-500",
        });
      }

      if (user.role === "admin" || user.role === "super_admin") {
        quickActions.push({
          label: "Reports",
          icon: <TrendingUp className="w-4 h-4" />,
          href: "/reports",
          color: "bg-emerald-500",
        });
      }

      setData({
        tasks: {
          total: totalTasks,
          pending: taskStats.byStatus?.pending || 0,
          inProgress: taskStats.byStatus?.inProgress || 0,
          completed: completedTasks,
          overdue: taskStats.byStatus?.overdue || 0,
          submitted: taskStats.byStatus?.submitted || 0,
          rejected: taskStats.byStatus?.rejected || 0,
        },
        performance: {
          completionRate,
          onTimeRate,
          averageRating: 4.2, // Mock data, can be fetched from reviews
          totalHours: taskStats.totalEstimatedHours || 0,
        },
        notifications: {
          unread: notifications.filter((n: any) => !n.isRead).length,
          latest: notifications.slice(0, 3).map((n: any) => ({
            _id: n._id,
            title: n.title,
            message: n.message,
            createdAt: n.createdAt,
            isRead: n.isRead,
          })),
        },
        user: {
          fullName: profile.fullName || user.fullName,
          email: profile.email || user.email,
          role: user.role,
          employeeId: profile.employeeId || user.employeeId || "N/A",
          department: profile.departmentId?.name || "Unassigned",
          profilePhoto: profile.profilePhoto || user.profilePhoto,
        },
        quickActions,
      });
    } catch (error) {
      console.error("Error fetching assistant data:", error);
      // Set mock data if API fails
      setData({
        tasks: {
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0,
          submitted: 0,
          rejected: 0,
        },
        performance: {
          completionRate: 0,
          onTimeRate: 0,
          averageRating: 0,
          totalHours: 0,
        },
        notifications: {
          unread: 0,
          latest: [],
        },
        user: {
          fullName: user?.fullName || "User",
          email: user?.email || "",
          role: user?.role || "employee",
          employeeId: "N/A",
          department: "Unassigned",
        },
        quickActions: [
          {
            label: "My Tasks",
            icon: <CheckCircle className="w-4 h-4" />,
            href: "/tasks",
            color: "bg-blue-500",
          },
          {
            label: "Create Task",
            icon: <Zap className="w-4 h-4" />,
            href: "/tasks/create",
            color: "bg-purple-500",
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    if (user) {
      fetchAssistantData();
    }
  }, [user, fetchAssistantData]);

  // Refresh data periodically
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchAssistantData();
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [user, isOpen, fetchAssistantData]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Hide on certain pages (login, onboarding, etc.)
  useEffect(() => {
    const hiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/onboarding"];
    if (hiddenPaths.includes(pathname)) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [pathname]);

  if (!isVisible || !user) return null;

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      super_admin: { label: "Super Admin", color: "bg-purple-100 text-purple-700" },
      admin: { label: "Admin", color: "bg-red-100 text-red-700" },
      hr_manager: { label: "HR Manager", color: "bg-pink-100 text-pink-700" },
      dept_manager: { label: "Dept Manager", color: "bg-orange-100 text-orange-700" },
      project_manager: { label: "Project Manager", color: "bg-cyan-100 text-cyan-700" },
      line_manager: { label: "Line Manager", color: "bg-emerald-100 text-emerald-700" },
      employee: { label: "Employee", color: "bg-gray-100 text-gray-700" },
    };
    return badges[role] || badges.employee;
  };

  const roleBadge = getRoleBadge(user.role);

  // Format time
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

  return (
    <>
      {/* Floating Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 z-50 group"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="relative">
          {/* Pulse Animation */}
          <div className="absolute inset-0 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 opacity-30 animate-ping" />
          
          {/* Button */}
          <div className="relative w-14 h-14 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300">
            <Sparkles className="w-6 h-6 text-white" />
            
            {/* Notification Badge */}
            {data?.notifications.unread && data.notifications.unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-md">
                {data.notifications.unread > 9 ? "9+" : data.notifications.unread}
              </span>
            )}
          </div>

          {/* Tooltip on hover */}
          <AnimatePresence>
            {isHovered && !isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Assistant
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-indigo-500 to-purple-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Assistant</h3>
                  <p className="text-white/70 text-[10px]">Your workspace summary</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAssistantData}
                  disabled={isLoading}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4 max-h-[calc(80vh-120px)] overflow-y-auto custom-scrollbar">
              {/* User Greeting */}
              <div className="flex items-center gap-3 p-3 bg-linear-to-r from-gray-50 to-indigo-50/30 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
                  <span className="text-white text-sm font-bold">
                    {data?.user.fullName?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium text-sm truncate">
                    Hello, {data?.user.fullName?.split(" ")[0] || "User"}! 👋
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {data?.user.employeeId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                  <p className="text-lg font-bold text-blue-600">{data?.tasks.total || 0}</p>
                  <p className="text-[9px] text-blue-500 font-medium">Total Tasks</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                  <p className="text-lg font-bold text-emerald-600">{data?.tasks.completed || 0}</p>
                  <p className="text-[9px] text-emerald-500 font-medium">Completed</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                  <p className="text-lg font-bold text-amber-600">{data?.tasks.pending || 0}</p>
                  <p className="text-[9px] text-amber-500 font-medium">Pending</p>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-indigo-500" />
                  Performance
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">Completion</span>
                      <span className="text-xs font-bold text-emerald-600">{data?.performance.completionRate || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(data?.performance.completionRate || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">On Time</span>
                      <span className="text-xs font-bold text-blue-600">{data?.performance.onTimeRate || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${Math.min(data?.performance.onTimeRate || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                  <span className="text-[10px] text-gray-400">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-gray-700">{data?.performance.averageRating || 0}</span>
                    <span className="text-[10px] text-gray-400">/ 5</span>
                  </div>
                  <span className="text-[10px] text-gray-400">•</span>
                  <span className="text-[10px] text-gray-400">{data?.performance.totalHours || 0}h logged</span>
                </div>
              </div>

              {/* Recent Notifications */}
              {data?.notifications.latest && data.notifications.latest.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <Bell className="w-3 h-3 text-indigo-500" />
                      Recent Notifications
                    </h4>
                    {data.notifications.unread > 0 && (
                      <span className="text-[10px] text-rose-500 font-medium">
                        {data.notifications.unread} unread
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {data.notifications.latest.slice(0, 3).map((notif) => (
                      <div 
                        key={notif._id} 
                        className={`flex items-start gap-2 p-2 rounded-lg ${!notif.isRead ? 'bg-indigo-50/50 border border-indigo-100' : 'bg-white'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${!notif.isRead ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{notif.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">{notif.message}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{formatTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.notifications.unread > 0 && (
                    <Link
                      href="/notifications"
                      className="block text-center text-[10px] text-indigo-500 hover:text-indigo-600 font-medium mt-2"
                    >
                      View all notifications →
                    </Link>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-indigo-500" />
                  Quick Actions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {data?.quickActions.map((action, index) => (
                    <Link
                      key={index}
                      href={action.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-medium transition hover:opacity-90 ${action.color}`}
                    >
                      {action.icon}
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Task Status */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase className="w-3 h-3 text-indigo-500" />
                  Task Status
                </h4>
                <div className="space-y-1.5">
                  {[
                    { label: "Pending", value: data?.tasks.pending || 0, color: "bg-gray-400" },
                    { label: "In Progress", value: data?.tasks.inProgress || 0, color: "bg-blue-500" },
                    { label: "Submitted", value: data?.tasks.submitted || 0, color: "bg-purple-500" },
                    { label: "Completed", value: data?.tasks.completed || 0, color: "bg-emerald-500" },
                    { label: "Overdue", value: data?.tasks.overdue || 0, color: "bg-rose-500" },
                    { label: "Rejected", value: data?.tasks.rejected || 0, color: "bg-red-500" },
                  ].map((status) => (
                    <div key={status.label} className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">{status.label}</span>
                      <div className="flex items-center gap-2 flex-1 mx-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${status.color} rounded-full transition-all`}
                            style={{ 
                              width: `${data?.tasks.total ? ((status.value / data.tasks.total) * 100) : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-700">{status.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    fetchAssistantData();
                  }}
                  className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 transition py-1"
                >
                  Click to refresh • v1.0
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  );
}