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
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue";
  deadline: string;
  estimatedHours: number;
  actualMinutes: number;
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
}

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
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
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
      // Fetch departments - using correct endpoint
      try {
        const deptsRes = await api.get("/departments");
        if (deptsRes.data?.success) {
          const deptCount =
            deptsRes.data.data?.length || deptsRes.data.count || 0;
          setStats((prev) => ({ ...prev, totalDepartments: deptCount }));
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }

      // Fetch users (admin only)
      if (hasRole(["super_admin", "admin", "hr_manager"])) {
        try {
          const usersRes = await api.get("/auth/users");
          if (usersRes.data?.success) {
            const userCount =
              usersRes.data.data?.length || usersRes.data.count || 0;
            setStats((prev) => ({ ...prev, totalUsers: userCount }));
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }

      // Fetch tasks - using correct endpoint
      try {
        const tasksUrl = "/tasks";
        const tasksRes = await api.get(tasksUrl);

        let tasks: Task[] = [];
        if (tasksRes.data?.success) {
          tasks = tasksRes.data.data || [];
        } else if (Array.isArray(tasksRes.data)) {
          tasks = tasksRes.data;
        }

        // Calculate task stats
        const pendingTasks = tasks.filter(
          (t: Task) => t.status === "pending",
        ).length;
        const inProgressTasks = tasks.filter(
          (t: Task) => t.status === "in_progress",
        ).length;
        const submittedTasks = tasks.filter(
          (t: Task) => t.status === "submitted",
        ).length;
        const completedTasks = tasks.filter(
          (t: Task) => t.status === "completed",
        ).length;
        const overdueTasks = tasks.filter(
          (t: Task) => t.status === "overdue",
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
          { status: "Submitted", count: submittedTasks, color: "#8b5cf6" },
          { status: "Completed", count: completedTasks, color: "#10b981" },
          { status: "Overdue", count: overdueTasks, color: "#ef4444" },
        ]);

        // Set recent tasks (last 5)
        setRecentTasks(tasks.slice(0, 5));

        // Set upcoming deadlines
        const upcoming = tasks
          .filter(
            (t: Task) => t.status !== "completed" && t.status !== "rejected",
          )
          .sort(
            (a: Task, b: Task) =>
              new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
          )
          .slice(0, 5);
        setUpcomingTasks(upcoming);
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
      }
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <WelcomeCard user={user} />
      <DashboardStats stats={stats} hasRole={hasRole} userRole={user.role} />
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
