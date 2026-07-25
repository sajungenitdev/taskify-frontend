// app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardStats from "@/components/dashboard/DashboardStats";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import RecentTasks from "@/components/dashboard/RecentTasks";
import QuickActions from "@/components/dashboard/QuickActions";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";
import TaskStatusChart from "@/components/dashboard/TaskStatusChart";
import { Loader2 } from "lucide-react";
import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import HRDashboard from "@/components/dashboard/HRDashboard";
import DepartmentDashboard from "@/components/dashboard/DepartmentDashboard";
import ProjectDashboard from "@/components/dashboard/ProjectDashboard";
import LineManagerDashboard from "@/components/dashboard/LineManagerDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

// Import role-based dashboard components

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "pending"
    | "in_progress"
    | "submitted"
    | "completed"
    | "overdue"
    | "rejected";
  deadline: string;
  estimatedHours: number;
  actualMinutes: number;
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  stats: {
    totalUsers: number;
    totalDepartments: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  recentTasks: Task[];
  upcomingTasks: Task[];
  taskStatusData: Array<{ status: string; count: number; color: string }>;
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalUsers: 0,
      totalDepartments: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
    },
    recentTasks: [],
    upcomingTasks: [],
    taskStatusData: [
      { status: "Pending", count: 0, color: "#f59e0b" },
      { status: "In Progress", count: 0, color: "#3b82f6" },
      { status: "Completed", count: 0, color: "#10b981" },
      { status: "Overdue", count: 0, color: "#ef4444" },
    ],
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Memoize the role check to prevent unnecessary re-renders
  const canViewUsers = useMemo(
    () => hasRole(["super_admin", "admin", "hr_manager"]),
    [hasRole],
  );

  // Check if user has any admin role
  const isSuperAdmin = hasRole(["super_admin"]);
  const isAdmin = hasRole(["admin"]);
  const isHRManager = hasRole(["hr_manager"]);
  const isDeptManager = hasRole(["dept_manager"]);
  const isProjectManager = hasRole(["project_manager"]);
  const isLineManager = hasRole(["line_manager"]);
  const isEmployee = hasRole(["employee"]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Run all promises in parallel for better performance
      const [departmentsRes, usersRes, tasksRes] = await Promise.allSettled([
        api.get("/departments"),
        canViewUsers ? api.get("/auth/users") : Promise.resolve(null),
        api.get("/tasks"),
      ]);

      // Process departments data
      let totalDepartments = 0;
      if (
        departmentsRes.status === "fulfilled" &&
        departmentsRes.value.data?.success
      ) {
        totalDepartments = departmentsRes.value.data.data?.length || 0;
      }

      // Process users data
      let totalUsers = 0;
      if (usersRes.status === "fulfilled" && usersRes.value?.data?.success) {
        totalUsers = usersRes.value.data.data?.length || 0;
      }

      // Process tasks data
      let tasks: Task[] = [];
      if (tasksRes.status === "fulfilled" && tasksRes.value.data?.success) {
        tasks = tasksRes.value.data.data || [];
      }

      // Calculate task stats efficiently
      const taskStats = tasks.reduce(
        (acc, task) => {
          acc.total++;
          switch (task.status) {
            case "pending":
              acc.pending++;
              break;
            case "in_progress":
              acc.inProgress++;
              break;
            case "submitted":
              acc.submitted++;
              break;
            case "completed":
              acc.completed++;
              break;
            case "overdue":
              acc.overdue++;
              break;
          }
          return acc;
        },
        {
          total: 0,
          pending: 0,
          inProgress: 0,
          submitted: 0,
          completed: 0,
          overdue: 0,
        },
      );

      const { total, pending, inProgress, submitted, completed, overdue } =
        taskStats;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      // Get upcoming tasks (not completed or rejected)
      const upcomingTasks = tasks
        .filter((t) => t.status !== "completed" && t.status !== "rejected")
        .sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        )
        .slice(0, 5);

      // Update dashboard data
      setDashboardData({
        stats: {
          totalUsers,
          totalDepartments,
          totalTasks: total,
          completedTasks: completed,
          pendingTasks: pending,
          overdueTasks: overdue,
          completionRate,
        },
        recentTasks: tasks.slice(0, 5),
        upcomingTasks,
        taskStatusData: [
          { status: "Pending", count: pending, color: "#f59e0b" },
          { status: "In Progress", count: inProgress, color: "#3b82f6" },
          { status: "Submitted", count: submitted, color: "#8b5cf6" },
          { status: "Completed", count: completed, color: "#10b981" },
          { status: "Overdue", count: overdue, color: "#ef4444" },
        ],
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, canViewUsers]);

  // Load dashboard data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isAuthenticated && user && isMounted) {
        await fetchDashboardData();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, fetchDashboardData]);

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ============================================================
  // ROLE-BASED DASHBOARD RENDERING
  // ============================================================

  // For Super Admin - Full admin dashboard with all data
  if (isSuperAdmin) {
    return (
      <div className="p-4 md:p-6 lg:p-4">
        <div className="container mx-auto space-y-6">
          <WelcomeCard user={user} />
          <SuperAdminDashboard />
        </div>
      </div>
    );
  }

  // For Admin - Admin specific dashboard
  if (isAdmin) {
    return (
      <div className="p-4 md:p-6 lg:p-4">
        <div className="container mx-auto space-y-6">
          <WelcomeCard user={user} />
          <AdminDashboard />
        </div>
      </div>
    );
  }

  // For HR Manager - HR specific dashboard
  if (isHRManager) {
    return (
      <div className="p-4 md:p-6 lg:p-4">
        <div className="container mx-auto space-y-6">
          <WelcomeCard user={user} />
          <HRDashboard />
        </div>
      </div>
    );
  }

  // For Department Manager - Department specific dashboard
  if (isDeptManager) {
    return (
      <div className="p-4 md:p-6 lg:p-4">
        <div className="container mx-auto space-y-6">
          <WelcomeCard user={user} />
          <DepartmentDashboard />
        </div>
      </div>
    );
  }

  // For Project Manager - Project specific dashboard
  if (isProjectManager) {
    return (
      <div className="p-4 md:p-6 lg:p-4">
        <div className="container mx-auto space-y-6">
          <WelcomeCard user={user} />
          <ProjectDashboard />
        </div>
      </div>
    );
  }

  // For Line Manager - Team specific dashboard
  if (isLineManager) {
    return (
      <div className="p-4 md:p-6 lg:p-4">
        <div className="container mx-auto space-y-6">
          <WelcomeCard user={user} />
          <LineManagerDashboard />
        </div>
      </div>
    );
  }

  // For Employee - Personal dashboard
  if (isEmployee) {
    return (
      <div className="p-4 md:p-6 lg:p-4">
        <div className="container mx-auto space-y-6">
          <WelcomeCard user={user} />
          <EmployeeDashboard />
        </div>
      </div>
    );
  }

  // Fallback: Show the original dashboard for any other role
  return (
    <div className="p-4 md:p-6 lg:p-4 space-y-6 w-full mx-auto">
      <WelcomeCard user={user} />

      <DashboardStats
        stats={dashboardData.stats}
        hasRole={hasRole}
        userRole={user.role}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentTasks tasks={dashboardData.recentTasks} />
          <QuickActions hasRole={hasRole} userRole={user.role} />
        </div>
        <div className="space-y-6">
          <TaskStatusChart data={dashboardData.taskStatusData} />
          <UpcomingDeadlines tasks={dashboardData.upcomingTasks} />
        </div>
      </div>
    </div>
  );
}
