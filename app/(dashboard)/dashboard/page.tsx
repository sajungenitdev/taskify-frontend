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

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [taskStatusData, setTaskStatusData] = useState([
    { status: "Pending", count: 0, color: "#f59e0b" },
    { status: "In Progress", count: 0, color: "#3b82f6" },
    { status: "Completed", count: 0, color: "#10b981" },
    { status: "Overdue", count: 0, color: "#ef4444" },
  ]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch departments
      const deptsRes = await api.get("/departments");
      setStats((prev) => ({
        ...prev,
        totalDepartments: deptsRes.data.count || 0,
      }));

      // Fetch users (admin only)
      if (hasRole(["super_admin", "admin", "hr_manager"])) {
        const usersRes = await api.get("/auth/users");
        setStats((prev) => ({ ...prev, totalUsers: usersRes.data.count || 0 }));
      }

      // Fetch tasks
      let tasksUrl = "/tasks/my-tasks";
      if (hasRole(["super_admin", "admin", "dept_manager"])) {
        tasksUrl = "/tasks";
      }

      const tasksRes = await api.get(tasksUrl);
      const tasks = tasksRes.data.data || [];

      // Calculate task stats
      const pendingTasks = tasks.filter(
        (t: any) => t.status === "pending",
      ).length;
      const inProgressTasks = tasks.filter(
        (t: any) => t.status === "in_progress",
      ).length;
      const completedTasks = tasks.filter(
        (t: any) => t.status === "completed",
      ).length;
      const overdueTasks = tasks.filter(
        (t: any) => t.status === "overdue",
      ).length;
      const totalTasks = tasks.length;
      const completionRate =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      setStats((prev) => ({
        ...prev,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
      }));

      setTaskStatusData([
        { status: "Pending", count: pendingTasks, color: "#f59e0b" },
        { status: "In Progress", count: inProgressTasks, color: "#3b82f6" },
        { status: "Completed", count: completedTasks, color: "#10b981" },
        { status: "Overdue", count: overdueTasks, color: "#ef4444" },
      ]);

      // Set recent tasks (last 5)
      setRecentTasks(tasks.slice(0, 5));

      // Set upcoming deadlines
      const upcoming = tasks
        .filter((t: any) => t.status !== "completed")
        .sort(
          (a: any, b: any) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        )
        .slice(0, 5);
      setUpcomingTasks(upcoming);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, hasRole]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
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
    <div className="p-6 space-y-6">
      {/* Welcome Card */}
      <WelcomeCard user={user} />

      {/* Stats Grid */}
      <DashboardStats stats={stats} hasRole={hasRole} userRole={user.role} />

      {/* Charts and Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentTasks tasks={recentTasks} />
          <QuickActions hasRole={hasRole} userRole={user.role} />
        </div>
        <div className="space-y-6">
          <TaskStatusChart data={taskStatusData} />
          <UpcomingDeadlines tasks={upcomingTasks} />
        </div>
      </div>
    </div>
  );
}
