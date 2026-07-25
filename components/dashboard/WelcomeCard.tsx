"use client";

import {
  Award,
  Calendar,
  TrendingUp,
  ArrowRight,
  LayoutDashboard,
  Users,
  BarChart3,
  CheckSquare,
  Briefcase,
  UserCheck,
  Building2,
  Crown,
  Shield,
  Sparkles,
  X,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface WelcomeCardProps {
  user: {
    _id?: string;
    fullName: string;
    role: string;
    departmentId?: {
      _id: string;
      name: string;
      code: string;
    };
  } | null;
}

export default function WelcomeCard({ user }: WelcomeCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);
  const [closeTimestamp, setCloseTimestamp] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load visibility state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("welcomeCardVisible");
    const savedCloseTime = localStorage.getItem("welcomeCardCloseTime");

    if (savedState === "false" && savedCloseTime) {
      const closeTime = parseInt(savedCloseTime);
      const currentTime = Date.now();
      const elapsedMinutes = (currentTime - closeTime) / (1000 * 60);

      // If 5 minutes have passed, show the card again
      if (elapsedMinutes >= 5) {
        setIsVisible(true);
        localStorage.setItem("welcomeCardVisible", "true");
        localStorage.removeItem("welcomeCardCloseTime");
      } else {
        setIsVisible(false);
        setCloseTimestamp(closeTime);
      }
    } else {
      setIsVisible(savedState !== "false");
    }
  }, []);

  // Check every 30 seconds if 5 minutes have passed
  useEffect(() => {
    if (!isVisible && closeTimestamp) {
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const elapsedMinutes = (currentTime - closeTimestamp) / (1000 * 60);

        if (elapsedMinutes >= 5) {
          setIsVisible(true);
          localStorage.setItem("welcomeCardVisible", "true");
          localStorage.removeItem("welcomeCardCloseTime");
          setCloseTimestamp(null);
          clearInterval(interval);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isVisible, closeTimestamp]);

  // Reset visibility when navigating to a new page (only if not explicitly closed or within 5 minutes)
  useEffect(() => {
    const savedState = localStorage.getItem("welcomeCardVisible");
    const savedCloseTime = localStorage.getItem("welcomeCardCloseTime");

    if (savedState === "false" && savedCloseTime) {
      const closeTime = parseInt(savedCloseTime);
      const currentTime = Date.now();
      const elapsedMinutes = (currentTime - closeTime) / (1000 * 60);

      // If 5 minutes have passed, show on navigation
      if (elapsedMinutes >= 5) {
        setIsVisible(true);
        localStorage.setItem("welcomeCardVisible", "true");
        localStorage.removeItem("welcomeCardCloseTime");
        setCloseTimestamp(null);
      }
    }
  }, [pathname]);

  const handleClose = () => {
    setIsVisible(false);
    const closeTime = Date.now();
    localStorage.setItem("welcomeCardVisible", "false");
    localStorage.setItem("welcomeCardCloseTime", closeTime.toString());
    setCloseTimestamp(closeTime);
  };

  if (!user) {
    return null;
  }

  // If the card is closed, don't show anything (no sticky button)
  if (!isVisible) {
    return null;
  }

  const getRoleMessage = () => {
    switch (user.role) {
      case "super_admin":
        return "You have full system access. Manage users, departments, and all system settings.";
      case "admin":
        return "You can manage users, departments, and view analytics reports.";
      case "hr_manager":
        return "You can manage employees, attendance, and leaves.";
      case "dept_manager":
        return "You can manage your team tasks and view department reports.";
      case "project_manager":
        return "You can manage project tasks and track project progress.";
      case "line_manager":
        return "You can assign daily tasks and review submissions.";
      case "employee":
        return "You can manage your tasks, track time, and submit work.";
      default:
        return "Welcome to the Task Management System.";
    }
  };

  const getRoleGradient = () => {
    switch (user.role) {
      case "super_admin":
        return "from-purple-600 via-pink-600 to-rose-600";
      case "admin":
        return "from-blue-600 via-indigo-600 to-blue-600";
      case "hr_manager":
        return "from-emerald-500 via-teal-500 to-emerald-500";
      case "dept_manager":
        return "from-amber-500 via-orange-500 to-amber-500";
      case "project_manager":
        return "from-cyan-500 via-blue-500 to-cyan-500";
      case "line_manager":
        return "from-green-500 via-emerald-500 to-green-500";
      case "employee":
        return "from-indigo-500 via-purple-500 to-indigo-500";
      default:
        return "from-indigo-500 via-purple-500 to-indigo-500";
    }
  };

  const getRoleEmoji = () => {
    switch (user.role) {
      case "super_admin":
        return "👑";
      case "admin":
        return "🛡️";
      case "hr_manager":
        return "👥";
      case "dept_manager":
        return "🏢";
      case "project_manager":
        return "📋";
      case "line_manager":
        return "👤";
      case "employee":
        return "💼";
      default:
        return "⭐";
    }
  };

  const getRoleIcon = () => {
    switch (user.role) {
      case "super_admin":
        return <Crown className="w-7 h-7 text-white" />;
      case "admin":
        return <Shield className="w-7 h-7 text-white" />;
      case "hr_manager":
        return <Users className="w-7 h-7 text-white" />;
      case "dept_manager":
        return <Building2 className="w-7 h-7 text-white" />;
      case "project_manager":
        return <Briefcase className="w-7 h-7 text-white" />;
      case "line_manager":
        return <UserCheck className="w-7 h-7 text-white" />;
      case "employee":
        return <UserCheck className="w-7 h-7 text-white" />;
      default:
        return <Award className="w-7 h-7 text-white" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅";
    if (hour < 18) return "☀️";
    return "🌙";
  };

  const getDashboardRoute = () => {
    switch (user.role) {
      case "super_admin":
        return "/dashboard/admin";
      case "admin":
        return "/dashboard/admin";
      case "hr_manager":
        return "/dashboard/hr";
      case "dept_manager":
        return "/dashboard/department";
      case "project_manager":
        return "/dashboard/project";
      case "line_manager":
        return "/dashboard/line-manager";
      case "employee":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  const getDashboardLabel = () => {
    switch (user.role) {
      case "super_admin":
        return "Admin Dashboard";
      case "admin":
        return "Admin Dashboard";
      case "hr_manager":
        return "HR Dashboard";
      case "dept_manager":
        return "Department Dashboard";
      case "project_manager":
        return "Project Dashboard";
      case "line_manager":
        return "Team Dashboard";
      case "employee":
        return "My Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getDashboardDescription = () => {
    switch (user.role) {
      case "super_admin":
        return "View system-wide analytics and command center";
      case "admin":
        return "Manage users, departments, and system settings";
      case "hr_manager":
        return "Manage employees, attendance, and KPI reviews";
      case "dept_manager":
        return "Monitor department performance and team tasks";
      case "project_manager":
        return "Track project progress and team productivity";
      case "line_manager":
        return "Manage daily tasks and team performance";
      case "employee":
        return "Track your personal performance and tasks";
      default:
        return "View your personalized dashboard";
    }
  };

  const getDashboardIcon = () => {
    switch (user.role) {
      case "super_admin":
        return <Crown className="w-4 h-4" />;
      case "admin":
        return <LayoutDashboard className="w-4 h-4" />;
      case "hr_manager":
        return <Users className="w-4 h-4" />;
      case "dept_manager":
        return <Building2 className="w-4 h-4" />;
      case "project_manager":
        return <Briefcase className="w-4 h-4" />;
      case "line_manager":
        return <UserCheck className="w-4 h-4" />;
      case "employee":
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <LayoutDashboard className="w-4 h-4" />;
    }
  };

  const getQuickActions = () => {
    const actions = [];
    switch (user.role) {
      case "super_admin":
        actions.push(
          { label: "Users", href: "/users", icon: Users, color: "indigo" },
          {
            label: "Departments",
            href: "/departments",
            icon: Building2,
            color: "emerald",
          },
          { label: "Roles", href: "/roles", icon: Shield, color: "purple" },
          {
            label: "KPI Engine",
            href: "/kpi/dashboard",
            icon: BarChart3,
            color: "amber",
          },
        );
        break;
      case "admin":
        actions.push(
          { label: "Users", href: "/users", icon: Users, color: "indigo" },
          {
            label: "Departments",
            href: "/departments",
            icon: Building2,
            color: "emerald",
          },
          {
            label: "KPI",
            href: "/kpi/dashboard",
            icon: BarChart3,
            color: "amber",
          },
        );
        break;
      case "hr_manager":
        actions.push(
          { label: "Employees", href: "/users", icon: Users, color: "indigo" },
          {
            label: "KPI",
            href: "/kpi/dashboard",
            icon: BarChart3,
            color: "amber",
          },
          {
            label: "Reports",
            href: "/kpi/reports",
            icon: TrendingUp,
            color: "purple",
          },
        );
        break;
      case "dept_manager":
        actions.push(
          {
            label: "Team Tasks",
            href: "/tasks/my",
            icon: CheckSquare,
            color: "blue",
          },
          {
            label: "Department KPIs",
            href: "/kpi/dashboard",
            icon: BarChart3,
            color: "amber",
          },
        );
        break;
      case "project_manager":
        actions.push(
          {
            label: "Projects",
            href: "/projects",
            icon: Briefcase,
            color: "cyan",
          },
          {
            label: "Tasks",
            href: "/tasks/my",
            icon: CheckSquare,
            color: "blue",
          },
        );
        break;
      case "line_manager":
        actions.push(
          {
            label: "Team Tasks",
            href: "/tasks/my",
            icon: CheckSquare,
            color: "blue",
          },
          {
            label: "My Tasks",
            href: "/tasks/my",
            icon: CheckSquare,
            color: "emerald",
          },
        );
        break;
      case "employee":
        actions.push(
          {
            label: "My Tasks",
            href: "/tasks/my",
            icon: CheckSquare,
            color: "blue",
          },
          {
            label: "My KPI",
            href: "/kpi/dashboard",
            icon: BarChart3,
            color: "amber",
          },
        );
        break;
      default:
        actions.push({
          label: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          color: "slate",
        });
    }
    return actions;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<
      string,
      { bg: string; text: string; hover: string; border: string }
    > = {
      indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        hover: "hover:bg-indigo-100",
        border: "border-indigo-200",
      },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        hover: "hover:bg-emerald-100",
        border: "border-emerald-200",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        hover: "hover:bg-purple-100",
        border: "border-purple-200",
      },
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        hover: "hover:bg-amber-100",
        border: "border-amber-200",
      },
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        hover: "hover:bg-blue-100",
        border: "border-blue-200",
      },
      cyan: {
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        hover: "hover:bg-cyan-100",
        border: "border-cyan-200",
      },
      slate: {
        bg: "bg-slate-50",
        text: "text-slate-700",
        hover: "hover:bg-slate-100",
        border: "border-slate-200",
      },
    };
    return colors[color] || colors.slate;
  };

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Show countdown timer if card is closed within 5 minutes
  const getRemainingMinutes = () => {
    if (!closeTimestamp) return 0;
    const elapsed = (Date.now() - closeTimestamp) / (1000 * 60);
    return Math.max(0, 5 - elapsed);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-indigo-50/30 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-indigo-500/5 p-6 md:p-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Close Button */}
        <motion.button
          onClick={handleClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg hover:bg-slate-100/80 transition-all duration-300 text-slate-400 hover:text-slate-700 group"
          aria-label="Close welcome card"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </motion.button>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: isHovered ? 50 : 0,
              y: isHovered ? -30 : 0,
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: isHovered ? -40 : 0,
              y: isHovered ? 20 : 0,
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${getRoleGradient()} flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 text-white transition-all duration-300`}
              >
                {getRoleIcon()}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg shadow-emerald-400/30"
                />
              </motion.div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl md:text-2xl font-bold text-slate-900"
                  >
                    {getGreeting()},
                  </motion.h1>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  >
                    {user.fullName.split(" ")[0]}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    className="text-2xl"
                  >
                    {getGreetingEmoji()}
                  </motion.span>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-500 text-xs md:text-sm mt-1 max-w-xl font-medium"
                >
                  {getRoleMessage()}
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </motion.div>
                <span className="text-xs text-slate-700 font-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/60 shadow-sm">
                <ClockIcon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-indigo-700 font-mono font-bold">
                  {formattedTime}
                </span>
              </div>
            </div>
          </div>

          {/* Role & Department Tag Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 flex items-center gap-2 flex-wrap"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border border-indigo-200/60 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 text-indigo-900 shadow-sm backdrop-blur-sm"
            >
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-2 h-2 rounded-full bg-indigo-600"
              />
              <span>{getRoleEmoji()}</span>
              <span>{user.role.replace(/_/g, " ").toUpperCase()}</span>
              <span className="text-indigo-300">•</span>
              <span className="text-indigo-700 font-semibold">
                {user.departmentId?.name
                  ? user.departmentId.name
                  : "System Unit"}
              </span>
            </motion.div>
          </motion.div>

          {/* Dashboard Link and Description Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={getDashboardRoute()}
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:via-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl transition-all duration-300 shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {getDashboardIcon()}
                    <span>Open {getDashboardLabel()}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </Link>
              </motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-slate-400 font-medium"
              >
                {getDashboardDescription()}
              </motion.span>
            </div>

            {/* Quick Actions Pills */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 flex-wrap"
            >
              {getQuickActions().map((action, index) => {
                const colors = getColorClasses(action.color);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={action.href}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 ${colors.bg} ${colors.text} ${colors.hover} text-xs font-semibold rounded-xl border ${colors.border} transition-all duration-200 shadow-sm`}
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      {action.label}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Decorative Bottom Gradient */}
          <motion.div
            animate={{
              opacity: isHovered ? 0.6 : 0.2,
            }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
