// app/(dashboard)/dashboard/components/ProjectDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Briefcase, Users, CheckSquare, BarChart3, Loader2, RefreshCw, ArrowRight, Target } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function ProjectDashboard() {
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
      const [projectsRes, tasksRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
      ]);

      const projects = projectsRes.data.data || [];
      const tasks = tasksRes.data.data || [];
      
      // Get projects managed by this user
      const managedProjects = projects.filter((p: any) => p.projectManager?._id === user?._id);
      const projectIds = managedProjects.map((p: any) => p._id);
      
      // Get tasks for these projects
      const projectTasks = tasks.filter((t: any) => projectIds.includes(t.projectId?._id));
      const completedTasks = projectTasks.filter((t: any) => t.status === "completed").length;

      setStats({
        totalProjects: managedProjects.length,
        totalTasks: projectTasks.length,
        completedTasks,
        completionRate: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0,
      });
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
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Project Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your projects</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2 disabled:opacity-50">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Projects</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{stats.completedTasks}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">{stats.completionRate}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Completion Rate</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/projects" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-800">All Projects</p><p className="text-xs text-gray-400">View all projects</p></div>
            <Briefcase className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 text-xs text-cyan-600">View Projects <ArrowRight size={12} className="inline ml-1" /></div>
        </Link>
        <Link href="/tasks" className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-800">Project Tasks</p><p className="text-xs text-gray-400">View project tasks</p></div>
            <CheckSquare className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition" />
          </div>
          <div className="mt-2 text-xs text-indigo-600">View Tasks <ArrowRight size={12} className="inline ml-1" /></div>
        </Link>
      </div>
    </div>
  );
}