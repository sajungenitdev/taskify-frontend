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
  const statCards = [
    ...(hasRole(["super_admin", "admin", "hr_manager"])
      ? [
          {
            title: "Total Users",
            value: stats.totalUsers,
            icon: Users,
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-500",
            change: "+12%",
            changeType: "increase",
          },
        ]
      : []),
    {
      title: "Departments",
      value: stats.totalDepartments,
      icon: Building2,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-500",
      change: "+2",
      changeType: "increase",
    },
    ...(userRole === "employee" || hasRole(["line_manager", "dept_manager"])
      ? [
          {
            title: "My Tasks",
            value: stats.totalTasks,
            icon: Clock,
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-500/10",
            textColor: "text-indigo-500",
            change: `${stats.pendingTasks} pending`,
            changeType: "neutral",
          },
          {
            title: "Completed",
            value: stats.completedTasks,
            icon: CheckCircle,
            color: "from-emerald-500 to-emerald-600",
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-500",
            change: `${Math.round(stats.completionRate)}% rate`,
            changeType: stats.completionRate > 70 ? "increase" : "decrease",
          },
        ]
      : [
          {
            title: "Total Tasks",
            value: stats.totalTasks,
            icon: CheckCircle,
            color: "from-indigo-500 to-indigo-600",
            bgColor: "bg-indigo-500/10",
            textColor: "text-indigo-500",
            change: `${stats.completedTasks} completed`,
            changeType: "neutral",
          },
          {
            title: "Completion Rate",
            value: `${Math.round(stats.completionRate)}%`,
            icon: TrendingUp,
            color: "from-purple-500 to-purple-600",
            bgColor: "bg-purple-500/10",
            textColor: "text-purple-500",
            change: stats.completionRate > 70 ? "Good" : "Needs improvement",
            changeType: stats.completionRate > 70 ? "increase" : "decrease",
          },
        ]),
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: AlertCircle,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-500/10",
      textColor: "text-rose-500",
      change: "Urgent",
      changeType: "decrease",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {statCards.map((stat, index) => (
        <div
          key={stat.title}
          className="relative group bg-slate-900/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-white tracking-tight">
                {stat.value}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={`text-xs font-medium ${
                    stat.changeType === "increase"
                      ? "text-emerald-400"
                      : stat.changeType === "decrease"
                        ? "text-rose-400"
                        : "text-slate-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-xl`}>
              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
            </div>
          </div>
          <div
            className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.color} rounded-b-2xl transition-all duration-300 group-hover:w-full w-1/3`}
          />
        </div>
      ))}
    </div>
  );
}
