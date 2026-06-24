"use client";

import { Award, Calendar, TrendingUp } from "lucide-react";

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
        return "from-purple-500 to-pink-500";
      case "admin":
        return "from-blue-500 to-cyan-500";
      case "hr_manager":
        return "from-emerald-500 to-teal-500";
      case "dept_manager":
        return "from-orange-500 to-red-500";
      case "project_manager":
        return "from-cyan-500 to-blue-500";
      default:
        return "from-indigo-500 to-purple-500";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm p-6">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50" />

      {/* Subtle animated shimmer */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${getRoleGradient()} flex items-center justify-center shadow-md`}
          >
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-800">
                {getGreeting()},
              </h1>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {user.fullName.split(" ")[0]}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1 max-w-2xl">
              {getRoleMessage()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs text-gray-700 font-medium">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-xs text-gray-700 font-medium">
              {user.role.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}
