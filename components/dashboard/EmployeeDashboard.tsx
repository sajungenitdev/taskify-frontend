// app/(dashboard)/dashboard/components/EmployeeDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Loader2,
  RefreshCw,
  ArrowRight,
  Calendar,
  TrendingUp,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [tasksRes] = await Promise.all([
        api.get(`/tasks?assignedTo=${user?._id}`),
      ]);

      const tasks = tasksRes.data.data || [];
      
      const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
      const pendingTasks = tasks.filter((t: any) => t.status === "pending").length;
      const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
      const overdueTasks = tasks.filter((t: any) => t.status === "overdue").length;

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.fullName?.split(" ")[0]}!
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
            </div>
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completedTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Completed</p>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pending</p>
            </div>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-rose-600">{stats.overdueTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
            </div>
            <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        <Link href="/tasks/my" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">My Tasks</p>
              <p className="text-xs text-gray-400">View all your tasks</p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-indigo-600">
            View Tasks <ArrowRight size={12} className="ml-1" />
          </div>
        </Link>

        <Link href="/kpi/dashboard" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">My KPI</p>
              <p className="text-xs text-gray-400">View your performance</p>
            </div>
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-purple-600">
            View KPI <ArrowRight size={12} className="ml-1" />
          </div>
        </Link>

        <Link href="/tasks/create" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Create Task</p>
              <p className="text-xs text-gray-400">Create a new task</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-600">
            Create Now <ArrowRight size={12} className="ml-1" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}