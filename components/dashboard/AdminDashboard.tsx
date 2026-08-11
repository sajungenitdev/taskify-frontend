// app/(dashboard)/dashboard/components/AdminDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Users,
  Building2,
  Shield,
  UserCheck,
  UserX,
  Activity,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
  Crown,
  TrendingUp,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Area,
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"];

export default function AdminDashboard() {
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
      
      const [usersRes, departmentsRes, tasksRes] = await Promise.all([
        api.get("/auth/users"),
        api.get("/departments"),
        api.get("/tasks"),
      ]);

      const users = usersRes.data.data || [];
      const departments = departmentsRes.data.data || [];
      const tasks = tasksRes.data.data || [];

      const activeUsers = users.filter((u: any) => u.isActive).length;
      const inactiveUsers = users.filter((u: any) => !u.isActive).length;
      const completedTasks = tasks.filter((t: any) => t.status === "completed").length;
      const pendingTasks = tasks.filter((t: any) => t.status === "pending").length;

      // Department-wise user distribution
      const departmentDistribution = departments.map((dept: any) => ({
        name: dept.name,
        count: users.filter((u: any) => u.departmentId?._id === dept._id).length,
      }));

      // Recent activities
      const recentActivities = users.slice(0, 5).map((u: any) => ({
        _id: u._id,
        user: u.fullName,
        action: "User login",
        timestamp: u.lastLogin || u.createdAt,
        details: `${u.fullName} logged into the system`,
      }));

      setStats({
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        totalDepartments: departments.length,
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        departmentDistribution,
        recentActivities,
      });
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard data");
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
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.fullName?.split(" ")[0]}!
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
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
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
            </div>
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className="text-emerald-600">+{stats.activeUsers} active</span>
            <span className="text-gray-300">•</span>
            <span className="text-rose-600">{stats.inactiveUsers} inactive</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalDepartments}</p>
              <p className="text-xs text-gray-500 mt-0.5">Departments</p>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
            </div>
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className="text-emerald-600">{stats.completedTasks} completed</span>
            <span className="text-gray-300">•</span>
            <span className="text-amber-600">{stats.pendingTasks} pending</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Completion Rate</p>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link href="/users" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-gray-800">Manage Users</p>
          <p className="text-xs text-gray-400">Add, edit, or remove users</p>
        </Link>

        <Link href="/departments" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
            <Building2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-gray-800">Departments</p>
          <p className="text-xs text-gray-400">Manage departments</p>
        </Link>

        <Link href="/tasks/tasks-board" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
            <Activity className="w-6 h-6 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-gray-800">Tasks</p>
          <p className="text-xs text-gray-400">View all tasks</p>
        </Link>

        <Link href="/kpi/dashboard" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group text-center">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-800">KPI Dashboard</p>
          <p className="text-xs text-gray-400">View performance metrics</p>
        </Link>
      </motion.div>
    </div>
  );
}