"use client";

import { Award, Sparkles, Calendar, TrendingUp } from "lucide-react";

interface WelcomeCardProps {
  user: {
    fullName: string;
    role: string;
  };
}

export default function WelcomeCard({ user }: WelcomeCardProps) {
  const getRoleMessage = () => {
    switch (user.role) {
      case "super_admin":
        return "You have full system access. Manage users, departments, and all settings.";
      case "admin":
        return "You can manage users, departments, and view reports.";
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
        return "from-purple-600 to-pink-600";
      case "admin":
        return "from-blue-600 to-cyan-600";
      case "hr_manager":
        return "from-emerald-600 to-teal-600";
      case "dept_manager":
        return "from-orange-600 to-red-600";
      case "project_manager":
        return "from-cyan-600 to-blue-600";
      default:
        return "from-indigo-600 to-purple-600";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 p-6">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${getRoleGradient()} flex items-center justify-center shadow-lg`}
          >
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{getGreeting()},</h1>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {user.fullName.split(" ")[0]}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {getRoleMessage()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-slate-300">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-300">
              Role: {user.role.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
