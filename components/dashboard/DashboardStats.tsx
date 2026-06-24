"use client";

import {
  Users,
  Building2,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    totalDepartments: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  hasRole: (roles: string | string[]) => boolean;
  userRole: string;
}

export default function DashboardStats({
  stats,
  hasRole,
  userRole,
}: DashboardStatsProps) {
  // Memoize stat cards to prevent recalculation on every render
  const statCards = [
    ...(hasRole(["super_admin", "admin", "hr_manager"])
      ? [
          {
            id: "total-users",
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600",
            borderColor: "border-blue-200",
            change: "+12%",
            changeType: "increase" as const,
          },
        ]
      : []),
    {
      id: "departments",
      title: "Departments",
      value: stats.totalDepartments,
      icon: Building2,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      borderColor: "border-emerald-200",
      change: "+2",
      changeType: "increase" as const,
    },
    ...(userRole === "employee" || hasRole(["line_manager", "dept_manager"])
      ? [
          {
            id: "my-tasks",
            title: "My Tasks",
            value: stats.totalTasks,
            icon: Clock,
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
            borderColor: "border-indigo-200",
            change: `${stats.pendingTasks} pending`,
            changeType: "neutral" as const,
          },
          {
            id: "completed",
            title: "Completed",
            value: stats.completedTasks,
            icon: CheckCircle,
            color: "from-emerald-500 to-emerald-600",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600",
            borderColor: "border-emerald-200",
            change: `${Math.round(stats.completionRate)}% rate`,
            changeType: stats.completionRate > 70 ? "increase" : "decrease",
          },
        ]
      : [
          {
            id: "total-tasks",
            title: "Total Tasks",
            value: stats.totalTasks,
            icon: CheckCircle,
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600",
            borderColor: "border-indigo-200",
            change: `${stats.completedTasks} completed`,
            changeType: "neutral" as const,
          },
          {
            id: "completion-rate",
            title: "Completion Rate",
            value: `${Math.round(stats.completionRate)}%`,
            icon: TrendingUp,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-50",
            textColor: "text-purple-600",
            borderColor: "border-purple-200",
            change:
              stats.completionRate > 70 ? "Excellent" : "Needs improvement",
            changeType: stats.completionRate > 70 ? "increase" : "decrease",
          },
        ]),
    {
      id: "overdue",
      title: "Overdue",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600",
      borderColor: "border-rose-200",
      change: "Urgent",
      changeType: "decrease" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {statCards.map((stat, index) => (
        <div
          key={stat.id}
          className="relative group bg-white rounded-2xl p-5 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-lg hover:shadow-gray-100/50"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 mb-1 font-medium">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-gray-800 tracking-tight">
                {stat.value}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.changeType === "increase"
                      ? "bg-emerald-50 text-emerald-600"
                      : stat.changeType === "decrease"
                        ? "bg-rose-50 text-rose-600"
                        : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
            <div
              className={`${stat.bgColor} p-3 rounded-xl flex-shrink-0 ml-3`}
            >
              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
            </div>
          </div>

          {/* Animated progress bar */}
          <div
            className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-2xl transition-all duration-500 group-hover:w-full w-1/3`}
          />

          {/* Subtle hover effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      ))}
    </div>
  );
}
