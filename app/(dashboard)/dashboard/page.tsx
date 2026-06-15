"use client";

import { useEffect, useState, useCallback } from "react";
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Run all promises in parallel for better performance
      const [departmentsRes, usersRes, tasksRes] = await Promise.allSettled([
        api.get("/departments"),
        hasRole(["super_admin", "admin", "hr_manager"])
          ? api.get("/auth/users")
          : Promise.resolve(null),
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

      // Calculate task stats
      const pendingTasks = tasks.filter((t) => t.status === "pending").length;
      const inProgressTasks = tasks.filter(
        (t) => t.status === "in_progress",
      ).length;
      const submittedTasks = tasks.filter(
        (t) => t.status === "submitted",
      ).length;
      const completedTasks = tasks.filter(
        (t) => t.status === "completed",
      ).length;
      const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
      const totalTasks = tasks.length;
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Set all state at once to avoid multiple renders
      setDashboardData({
        stats: {
          totalUsers,
          totalDepartments,
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          completionRate,
        },
        recentTasks: tasks.slice(0, 5),
        upcomingTasks: tasks
          .filter((t) => t.status !== "completed" && t.status !== "rejected")
          .sort(
            (a, b) =>
              new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
          )
          .slice(0, 5),
        taskStatusData: [
          { status: "Pending", count: pendingTasks, color: "#f59e0b" },
          { status: "In Progress", count: inProgressTasks, color: "#3b82f6" },
          { status: "Submitted", count: submittedTasks, color: "#8b5cf6" },
          { status: "Completed", count: completedTasks, color: "#10b981" },
          { status: "Overdue", count: overdueTasks, color: "#ef4444" },
        ],
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [user, hasRole]);

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

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 container mx-auto">
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
