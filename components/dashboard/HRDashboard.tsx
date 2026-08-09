// app/(dashboard)/dashboard/components/HRDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Users, UserCheck, UserX, BarChart3, Award, Calendar, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function HRDashboard() {
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
      const usersRes = await api.get("/auth/users");
      const users = usersRes.data.data || [];
      
      const activeUsers = users.filter((u: any) => u.isActive).length;
      const inactiveUsers = users.filter((u: any) => !u.isActive).length;
      
      setStats({ totalUsers: users.length, activeUsers, inactiveUsers });
    } catch (error) {
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">HR Dashboard</h1>
            <p className="text-sm text-gray-500">Manage employees and performance</p>
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Employees</p>
            </div>
            <Users className="w-8 h-8 text-indigo-400 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div>
            <p className="text-2xl font-bold text-emerald-600">{stats.activeUsers}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div>
            <p className="text-2xl font-bold text-rose-600">{stats.inactiveUsers}</p>
            <p className="text-xs text-gray-500 mt-0.5">Inactive</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/users" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Manage Employees</p>
              <p className="text-xs text-gray-400">View and manage all employees</p>
            </div>
            <Users className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 text-xs text-indigo-600">View All <ArrowRight size={12} className="inline ml-1" /></div>
        </Link>
        <Link href="/kpi/dashboard" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">KPI Dashboard</p>
              <p className="text-xs text-gray-400">View performance metrics</p>
            </div>
            <BarChart3 className="w-6 h-6 text-purple-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 text-xs text-purple-600">View KPIs <ArrowRight size={12} className="inline ml-1" /></div>
        </Link>
      </div>
    </div>
  );
}