"use client";

import {
  Users,
  Building2,
  CheckSquare,
  Clock,
  FileText,
  Calendar,
  BarChart3,
  PlusCircle,
  Upload,
  FolderKanban,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  hasRole: (roles: string | string[]) => boolean;
  userRole: string;
}

export default function QuickActions({ hasRole, userRole }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    ...(hasRole(["super_admin", "admin", "hr_manager"])
      ? [
          {
            title: "Add User",
            description: "Create new employee account",
            icon: Users,
            onClick: () => router.push("/dashboard/users"),
            color: "from-indigo-500 to-purple-500",
          },
        ]
      : []),
    ...(hasRole(["super_admin", "admin"])
      ? [
          {
            title: "Create Department",
            description: "Add new department",
            icon: Building2,
            onClick: () => router.push("/dashboard/departments"),
            color: "from-emerald-500 to-teal-500",
          },
        ]
      : []),
    ...(userRole === "employee" ||
    hasRole(["line_manager", "dept_manager", "project_manager"])
      ? [
          {
            title: "New Task",
            description: "Create a new task",
            icon: PlusCircle,
            onClick: () => {
              // Dispatch event to open create task modal
              document.dispatchEvent(new CustomEvent("openCreateTaskModal"));
            },
            color: "from-blue-500 to-cyan-500",
          },
          {
            title: "Bulk Upload",
            description: "Upload multiple tasks",
            icon: Upload,
            onClick: () => router.push("/tasks/bulk-upload"),
            color: "from-emerald-500 to-teal-500",
          },
        ]
      : []),
    {
      title: "Projects",
      description: "View all projects",
      icon: FolderKanban,
      onClick: () => router.push("/dashboard/projects"),
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Time Tracking",
      description: "Log working hours",
      icon: Clock,
      onClick: () => router.push("/dashboard/time-tracking"),
      color: "from-amber-500 to-orange-500",
    },
    ...(hasRole(["super_admin", "admin", "hr_manager"])
      ? [
          {
            title: "Leave Requests",
            description: "Review pending leaves",
            icon: FileText,
            onClick: () => router.push("/dashboard/leaves"),
            color: "from-rose-500 to-pink-500",
          },
        ]
      : []),
    {
      title: "View Reports",
      description: "Analytics & insights",
      icon: BarChart3,
      onClick: () => router.push("/dashboard/reports"),
      color: "from-cyan-500 to-blue-500",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold">Quick Actions</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Common tasks and shortcuts
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-all duration-300 text-left hover:shadow-lg hover:shadow-indigo-500/5"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
            />
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 shadow-lg`}
            >
              <action.icon className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-medium text-white mb-0.5">
              {action.title}
            </h3>
            <p className="text-[10px] text-slate-500 line-clamp-1">
              {action.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
