// components/Assistant/AssistantWizard.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Sparkles,
  X,
  CheckCircle,
  Briefcase,
  TrendingUp,
  Star,
  Zap,
  Loader2,
  Bell,
  Users,
  RefreshCw,
  Minus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  const prefersReducedMotion = useReducedMotion();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AssistantData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchAssistantData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [tasksRes, notifRes, profileRes] = await Promise.all([
        api.get("/tasks/my-statistics"),
        api.get("/notifications?limit=5"),
        api.get("/auth/me"),
      ]);

      const taskStats = tasksRes.data.data || {};
      const notifications = notifRes.data.data || [];
      const profile = profileRes.data.data || {};

      const totalTasks = taskStats.total || 0;
      const completedTasks = taskStats.byStatus?.completed || 0;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const onTimeRate =
        completionRate > 0 ? Math.min(completionRate + 10, 100) : 0;

      const quickActions: AssistantData["quickActions"] = [
        {
          label: "My Tasks",
          icon: <CheckCircle className="h-4 w-4" />,
          href: "/tasks",
          color: "bg-blue-500",
        },
        {
          label: "Create Task",
          icon: <Zap className="h-4 w-4" />,
          href: "/tasks/create",
          color: "bg-purple-500",
        },
      ];

      if (
        user.role === "admin" ||
        user.role === "super_admin" ||
        user.role === "hr_manager"
      ) {
        quickActions.push({
          label: "Users",
          icon: <Users className="h-4 w-4" />,
          href: "/users",
          color: "bg-indigo-500",
        });
      }
      if (user.role === "admin" || user.role === "super_admin") {
        quickActions.push({
          label: "Reports",
          icon: <TrendingUp className="h-4 w-4" />,
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
          averageRating: 4.2,
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
        notifications: { unread: 0, latest: [] },
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
            icon: <CheckCircle className="h-4 w-4" />,
            href: "/tasks",
            color: "bg-blue-500",
          },
          {
            label: "Create Task",
            icon: <Zap className="h-4 w-4" />,
            href: "/tasks/create",
            color: "bg-purple-500",
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchAssistantData();
  }, [user, fetchAssistantData]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (!isOpen) fetchAssistantData();
    }, 60000);
    return () => clearInterval(interval);
  }, [user, isOpen, fetchAssistantData]);

  // Both Minimize and Close reliably collapse to the floating bubble
  const handleCollapse = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Click outside to collapse
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
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Escape to collapse
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Hide only on auth pages
  useEffect(() => {
    const hiddenPaths = [
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/onboarding",
    ];
    setIsVisible(!hiddenPaths.includes(pathname));
  }, [pathname]);

  const spring = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0.15 }
        : { type: "spring" as const, stiffness: 380, damping: 30, mass: 0.9 },
    [prefersReducedMotion],
  );

  const unreadCount = data?.notifications.unread ?? 0;
  const unreadDisplay =
    unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : String(unreadCount);
  const showBadge = unreadCount > 0;
  const showPing = showBadge && !prefersReducedMotion;

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

  const statusRows = [
    { label: "Pending", value: data?.tasks.pending || 0, color: "bg-slate-400" },
    { label: "In Progress", value: data?.tasks.inProgress || 0, color: "bg-blue-500" },
    { label: "Submitted", value: data?.tasks.submitted || 0, color: "bg-purple-500" },
    { label: "Completed", value: data?.tasks.completed || 0, color: "bg-emerald-500" },
    { label: "Overdue", value: data?.tasks.overdue || 0, color: "bg-rose-500" },
    { label: "Rejected", value: data?.tasks.rejected || 0, color: "bg-red-500" },
  ];

  return (
    <>
      <AnimatePresence mode="wait">
        {/* ============================================================
         * FLOATING BUTTON (Always rendered when panel is closed)
         * ============================================================ */}
        {!isOpen ? (
          <motion.div
            key="assistant-fab"
            initial={{ opacity: 0, scale: 0.6, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 15 }}
            transition={spring}
            className="fixed bottom-2 right-3 z-50 origin-bottom-right"
          >
            <div className="relative">
              {/* Soft halo */}
              <span className="pointer-events-none absolute -inset-2 rounded-full bg-indigo-400/25 blur-xl" />

              {/* Pulsing ring for unread items */}
              {showPing && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-indigo-500 opacity-30"
                />
              )}

              <motion.button
                ref={buttonRef}
                type="button"
                onClick={() => {
                  setIsHovered(false);
                  setIsOpen(true);
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-tr from-indigo-500 via-indigo-500 to-purple-600 text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.65)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_14px_36px_-8px_rgba(99,102,241,0.8)] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60"
                aria-label={
                  showBadge
                    ? `Open assistant (${unreadCount} unread)`
                    : "Open assistant"
                }
              >
                <Sparkles className="h-6 w-6 drop-shadow" />

                {/* Glass sheen highlight */}
                <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-70" />

                {/* Unread badge */}
                {showBadge && (
                  <motion.span
                    key="assistant-unread-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 520,
                      damping: 22,
                    }}
                    className="pointer-events-none absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-rose-500 to-rose-600 px-1 text-[10px] font-bold leading-none text-white shadow-[0_4px_10px_-2px_rgba(244,63,94,0.7)]"
                  >
                    {unreadDisplay}
                  </motion.span>
                )}
              </motion.button>

              {/* Hover tooltip */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.14 }}
                    className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-xl border border-white/10 bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur-md"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      Assistant
                      {showBadge && (
                        <span className="ml-1 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                          {unreadCount} new
                        </span>
                      )}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* ============================================================
           * ASSISTANT PANEL (Expanded state)
           * ============================================================ */
          <motion.div
            ref={panelRef}
            key="assistant-panel"
            initial={{ opacity: 0, scale: 0.88, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.88,
              y: 25,
              transition: { duration: 0.18, ease: "easeIn" },
            }}
            transition={spring}
            className="fixed bottom-20 right-4 z-50 flex max-h-[80vh] w-[380px] max-w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-indigo-500 via-indigo-500 to-purple-600 px-4 py-3 text-white">
              <span className="pointer-events-none absolute -top-8 right-0 h-24 w-24 rounded-full bg-white/15 blur-2xl" />

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-indigo-500 bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">
                      Assistant
                    </p>
                    <p className="truncate text-[10px] text-white/75">
                      Your workspace summary
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <motion.button
                    type="button"
                    onClick={fetchAssistantData}
                    disabled={isLoading}
                    whileTap={{ scale: 0.9 }}
                    className="cursor-pointer rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    title="Refresh"
                    aria-label="Refresh"
                  >
                    <RefreshCw
                      size={14}
                      className={isLoading ? "animate-spin" : ""}
                    />
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleCollapse}
                    whileTap={{ scale: 0.9 }}
                    className="cursor-pointer rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    title="Minimize"
                    aria-label="Minimize"
                  >
                    <Minus size={14} />
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleCollapse}
                    whileTap={{ scale: 0.9 }}
                    className="cursor-pointer rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="custom-scrollbar flex-1 space-y-3.5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(224,231,255,0.5),_transparent_60%),linear-gradient(to_bottom,_#f8fafc,_#f1f5f9)] p-3.5">
              {/* Greeting card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 }}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-gradient-to-r from-white to-indigo-50/60 p-3 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md ring-2 ring-white/80">
                  <span className="text-sm font-bold text-white">
                    {data?.user.fullName?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    Hello, {data?.user.fullName?.split(" ")[0] || "User"}! 👋
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadge.color}`}
                    >
                      {roleBadge.label}
                    </span>
                    <span className="truncate text-[10px] text-slate-400">
                      {data?.user.employeeId}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total", value: data?.tasks.total || 0, tone: "blue" },
                  {
                    label: "Completed",
                    value: data?.tasks.completed || 0,
                    tone: "emerald",
                  },
                  { label: "Pending", value: data?.tasks.pending || 0, tone: "amber" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.03 }}
                    className={`rounded-xl border p-3 text-center shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] ${
                      s.tone === "blue"
                        ? "border-blue-100 bg-blue-50/70"
                        : s.tone === "emerald"
                        ? "border-emerald-100 bg-emerald-50/70"
                        : "border-amber-100 bg-amber-50/70"
                    }`}
                  >
                    <p
                      className={`text-lg font-bold leading-none ${
                        s.tone === "blue"
                          ? "text-blue-600"
                          : s.tone === "emerald"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {s.value}
                    </p>
                    <p
                      className={`mt-1 text-[9px] font-medium ${
                        s.tone === "blue"
                          ? "text-blue-500"
                          : s.tone === "emerald"
                          ? "text-emerald-500"
                          : "text-amber-500"
                      }`}
                    >
                      {s.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Performance */}
              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]">
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <TrendingUp className="h-3 w-3 text-indigo-500" />
                  Performance
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Completion",
                      value: data?.performance.completionRate || 0,
                      bar: "bg-emerald-500",
                      text: "text-emerald-600",
                    },
                    {
                      label: "On Time",
                      value: data?.performance.onTimeRate || 0,
                      bar: "bg-blue-500",
                      text: "text-blue-600",
                    },
                  ].map((p, i) => (
                    <div key={p.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {p.label}
                        </span>
                        <span className={`text-xs font-bold ${p.text}`}>
                          {p.value}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(p.value, 100)}%` }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.6,
                            delay: 0.05 + i * 0.05,
                            ease: "easeOut",
                          }}
                          className={`h-full rounded-full ${p.bar}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="text-[10px] text-slate-400">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-slate-700">
                      {data?.performance.averageRating || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">/ 5</span>
                  </div>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className="text-[10px] text-slate-400">
                    {data?.performance.totalHours || 0}h logged
                  </span>
                </div>
              </div>

              {/* Notifications */}
              {data?.notifications.latest && data.notifications.latest.length > 0 && (
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)]">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Bell className="h-3 w-3 text-indigo-500" />
                      Recent Notifications
                    </h4>
                    {data.notifications.unread > 0 && (
                      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-500">
                        {data.notifications.unread} unread
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {data.notifications.latest.slice(0, 3).map((notif) => (
                      <div
                        key={notif._id}
                        className={`flex items-start gap-2 rounded-lg p-2 transition ${
                          !notif.isRead
                            ? "border border-indigo-100 bg-indigo-50/50"
                            : "bg-slate-50/60"
                        }`}
                      >
                        <div
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            !notif.isRead ? "bg-indigo-500" : "bg-slate-300"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-800">
                            {notif.title}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {notif.message}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {formatTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {data.notifications.unread > 0 && (
                    <Link
                      href="/notifications"
                      className="mt-2 block text-center text-[10px] font-medium text-indigo-500 transition hover:text-indigo-600"
                    >
                      View all notifications →
                    </Link>
                  )}
                </div>
              )}

              {/* Task Status */}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Briefcase className="h-3 w-3 text-indigo-500" />
                  Task Status
                </h4>
                <div className="space-y-2">
                  {statusRows.map((s, i) => {
                    const pct = data?.tasks.total
                      ? (s.value / data.tasks.total) * 100
                      : 0;
                    return (
                      <div
                        key={s.label}
                        className="flex items-center justify-between"
                      >
                        <span className="w-20 shrink-0 text-[10px] text-slate-500">
                          {s.label}
                        </span>
                        <div className="mx-2 flex-1">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{
                                duration: prefersReducedMotion ? 0 : 0.5,
                                delay: 0.05 + i * 0.03,
                                ease: "easeOut",
                              }}
                              className={`h-full rounded-full ${s.color}`}
                            />
                          </div>
                        </div>
                        <span className="w-6 shrink-0 text-right text-xs font-medium text-slate-700">
                          {s.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              {data?.quickActions && data.quickActions.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Zap className="h-3 w-3 text-indigo-500" />
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {data.quickActions.map((a, i) => (
                      <motion.div
                        key={a.href}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * 0.03 }}
                        whileHover={{ y: -2 }}
                      >
                        <Link
                          href={a.href}
                          onClick={() => setIsOpen(false)}
                          className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white shadow-sm transition ${a.color} hover:shadow-md`}
                        >
                          {a.icon}
                          <span className="truncate">{a.label}</span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    fetchAssistantData();
                  }}
                  className="w-full py-1 text-center text-[10px] text-slate-400 transition hover:text-slate-600"
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
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
}