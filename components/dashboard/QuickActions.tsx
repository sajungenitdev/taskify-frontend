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
import { useMemo } from "react";

interface QuickActionsProps {
  hasRole: (roles: string | string[]) => boolean;
  userRole: string;
}

export default function QuickActions({ hasRole, userRole }: QuickActionsProps) {
  const router = useRouter();

  // Memoize actions to prevent recalculation on every render
  const actions = useMemo(() => {
    const actionList = [];

    // Add User - Admin only
    if (hasRole(["super_admin", "admin", "hr_manager"])) {
      actionList.push({
        id: "add-user",
        title: "Add User",
        description: "Create new employee account",
        icon: Users,
        onClick: () => router.push("/dashboard/users"),
        color: "from-indigo-500 to-purple-500",
        gradient: "from-indigo-50 to-purple-50",
        borderColor: "border-indigo-200",
        textColor: "text-indigo-600",
      });
    }

    // Create Department - Admin only
    if (hasRole(["super_admin", "admin"])) {
      actionList.push({
        id: "create-department",
        title: "Create Department",
        description: "Add new department",
        icon: Building2,
        onClick: () => router.push("/dashboard/departments"),
        color: "from-emerald-500 to-teal-500",
        gradient: "from-emerald-50 to-teal-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-600",
      });
    }

    // Task actions - Employees and Managers
    if (
      userRole === "employee" ||
      hasRole(["line_manager", "dept_manager", "project_manager"])
    ) {
      actionList.push({
        id: "new-task",
        title: "New Task",
        description: "Create a new task",
        icon: PlusCircle,
        onClick: () => {
          document.dispatchEvent(new CustomEvent("openCreateTaskModal"));
        },
        color: "from-blue-500 to-cyan-500",
        gradient: "from-blue-50 to-cyan-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-600",
      });

      actionList.push({
        id: "bulk-upload",
        title: "Bulk Upload",
        description: "Upload multiple tasks",
        icon: Upload,
        onClick: () => router.push("/tasks/bulk-upload"),
        color: "from-emerald-500 to-teal-500",
        gradient: "from-emerald-50 to-teal-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-600",
      });
    }

    // Common actions for all users
    actionList.push({
      id: "projects",
      title: "Projects",
      description: "View all projects",
      icon: FolderKanban,
      onClick: () => router.push("/dashboard/projects"),
      color: "from-purple-500 to-pink-500",
      gradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
    });

    actionList.push({
      id: "time-tracking",
      title: "Time Tracking",
      description: "Log working hours",
      icon: Clock,
      onClick: () => router.push("/dashboard/time-tracking"),
      color: "from-amber-500 to-orange-500",
      gradient: "from-amber-50 to-orange-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-600",
    });

    // Leave Requests - HR and Admin
    if (hasRole(["super_admin", "admin", "hr_manager"])) {
      actionList.push({
        id: "leave-requests",
        title: "Leave Requests",
        description: "Review pending leaves",
        icon: FileText,
        onClick: () => router.push("/dashboard/leaves"),
        color: "from-rose-500 to-pink-500",
        gradient: "from-rose-50 to-pink-50",
        borderColor: "border-rose-200",
        textColor: "text-rose-600",
      });
    }

    // Reports - All users
    actionList.push({
      id: "reports",
      title: "View Reports",
      description: "Analytics & insights",
      icon: BarChart3,
      onClick: () => router.push("/dashboard/reports"),
      color: "from-cyan-500 to-blue-500",
      gradient: "from-cyan-50 to-blue-50",
      borderColor: "border-cyan-200",
      textColor: "text-cyan-600",
    });

    return actionList;
  }, [hasRole, userRole, router]);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-black font-semibold">Quick Actions</h2>
          <p className="text-black text-xs mt-0.5">
            Common tasks and shortcuts
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="group relative overflow-hidden bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300 text-left hover:shadow-lg hover:shadow-gray-100/50"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {/* Gradient background on hover */}
            <div
              className={`absolute inset-0 bg-linear-to-r ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />

            {/* Icon */}
            <div
              className={`relative w-9 h-9 rounded-xl bg-linear-to-r ${action.color} flex items-center justify-center mb-3 shadow-md shadow-indigo-500/20`}
            >
              <action.icon className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="relative">
              <h3 className="text-sm font-medium text-gray-800 mb-0.5 group-hover:text-gray-900 transition-colors">
                {action.title}
              </h3>
              <p className="text-[10px] text-gray-500 line-clamp-1">
                {action.description}
              </p>
            </div>

            {/* Subtle border accent on hover */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
