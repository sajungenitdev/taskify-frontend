"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  TrendingUp,
  Home,
  Users,
  Clock,
  Star,
  BarChart3,
  Download,
  Filter,
  Grid,
  List,
  ArrowUpRight,
  Trophy,
  Zap,
  Crown,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  managerId?: { _id: string; fullName: string };
  startDate: string;
  endDate: string;
  progress: number;
  completedAt?: string;
  tasksCount: number;
  completedTasks: number;
  departmentId?: { _id: string; name: string; code: string };
  teamMembers?: Array<{ userId: { _id: string; fullName: string } }>;
  status?: string;
  updatedAt?: string;
}

export default function CompletedProjectsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "progress" | "completedAt">(
    "completedAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canManage = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
  ]);

  // Check if a project is completed based on multiple criteria
  const isProjectCompleted = (project: Project): boolean => {
    // Check if ALL tasks are completed (most reliable)
    const allTasksCompleted = project.tasksCount > 0 &&
      project.completedTasks === project.tasksCount;

    // Check progress
    const hasFullProgress = project.progress === 100;

    // Check status
    const hasCompletedStatus = project.status === "completed" ||
      project.status === "complete";

    // Check if completedAt exists
    const hasCompletedDate = project.completedAt !== null &&
      project.completedAt !== undefined;

    // Project is completed if ANY of these conditions are met
    return allTasksCompleted || hasFullProgress || hasCompletedStatus || hasCompletedDate;
  };

  // Calculate actual progress based on tasks
  const calculateActualProgress = (project: Project): number => {
    if (project.tasksCount === 0) return 0;
    return Math.round((project.completedTasks / project.tasksCount) * 100);
  };

  // FIXED: Fetch projects with better completion detection
  const fetchProjects = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setIsRefreshing(true);
      setError(null);

      console.log("🔍 Fetching all projects...");

      // Get ALL projects first
      const response = await api.get("/projects?limit=1000");
      console.log("📦 Raw API Response:", response.data);

      if (response.data.success) {
        const allProjects = response.data.data || [];
        console.log(`📊 Total projects found: ${allProjects.length}`);

        // Log the first project to see its structure
        if (allProjects.length > 0) {
          console.log("🔍 Sample project structure:", allProjects[0]);
        }

        // Filter for completed projects using the improved detection
        const completedProjects = allProjects.filter((project: any) => {
          // Check if project is completed based on MULTIPLE criteria
          const isCompleted =
            // All tasks are completed (even if progress is 0%)
            (project.tasksCount > 0 && project.completedTasks === project.tasksCount) ||
            // Progress is 100%
            project.progress === 100 ||
            // Status is completed
            project.status === "completed" ||
            project.status === "complete" ||
            // Has completed date
            (project.completedAt !== null && project.completedAt !== undefined);

          if (isCompleted) {
            const actualProgress = project.tasksCount > 0
              ? Math.round((project.completedTasks / project.tasksCount) * 100)
              : project.progress;
            console.log(`✅ Completed project found: ${project.name} (${project.code}) - Tasks: ${project.completedTasks}/${project.tasksCount} - Progress: ${actualProgress}%`);
          }
          return isCompleted;
        });

        console.log(`🎯 Completed projects found: ${completedProjects.length}`);

        // Update the progress field to reflect actual task completion
        const projectsWithCorrectProgress = completedProjects.map((project: any) => ({
          ...project,
          progress: project.tasksCount > 0
            ? Math.round((project.completedTasks / project.tasksCount) * 100)
            : project.progress
        }));

        setProjects(projectsWithCorrectProgress);
        setFilteredProjects(projectsWithCorrectProgress);

        if (completedProjects.length === 0) {
          toast.custom((t) => (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">No Completed Projects Found</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Projects with all tasks completed will appear here
                  </p>
                </div>
              </div>
            </div>
          ), { duration: 5000 });
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch projects");
      }
    } catch (error: any) {
      console.error("❌ Error fetching projects:", error);
      setError(error.message || "Failed to fetch projects");
      toast.error("Failed to fetch projects");
    } finally {
      if (showLoading) setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Apply search and filters
  const applyFilters = useCallback(() => {
    let result = [...projects];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(term) ||
          project.code.toLowerCase().includes(term) ||
          project.description?.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "progress":
          aVal = a.progress;
          bVal = b.progress;
          break;
        case "completedAt":
          aVal = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          bVal = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    setFilteredProjects(result);
    setCurrentPage(1);
  }, [projects, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Debug function to check project status
  const debugProjects = () => {
    console.log("=== DEBUG PROJECTS ===");
    console.log("Total projects in state:", projects.length);
    console.log("Filtered projects:", filteredProjects.length);
    console.log("Search term:", searchTerm);

    projects.forEach((p, index) => {
      const allTasksDone = p.tasksCount > 0 && p.completedTasks === p.tasksCount;
      const isComplete = isProjectCompleted(p);
      console.log(`\n${index + 1}. Project: ${p.name}`);
      console.log(`   - Code: ${p.code}`);
      console.log(`   - Tasks: ${p.completedTasks}/${p.tasksCount}`);
      console.log(`   - Progress from API: ${p.progress}%`);
      console.log(`   - All tasks done? ${allTasksDone}`);
      console.log(`   - Status: ${p.status || 'N/A'}`);
      console.log(`   - Completed At: ${p.completedAt || 'N/A'}`);
      console.log(`   - Is completed? ${isComplete}`);
    });

    toast.success("Check console for debug info");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stats = {
    total: projects.length,
    totalTasks: projects.reduce((sum, p) => sum + p.completedTasks, 0),
    avgProgress:
      projects.length > 0
        ? Math.round(
          projects.reduce((sum, p) => sum + p.progress, 0) / projects.length,
        )
        : 0,
    totalMembers: projects.reduce(
      (sum, p) => sum + (p.teamMembers?.length || 0),
      0,
    ),
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            You don't have permission to view this page
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">
          {/* Header with Debug Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Completed Projects
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  {stats.total}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                View successfully completed projects (based on task completion)
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={debugProjects}
                className="px-3 py-2 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 text-yellow-700 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <AlertCircle size={14} />
                Debug
              </button>
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                {viewMode === "grid" ? <List size={14} /> : <Grid size={14} />}
                {viewMode === "grid" ? "List View" : "Grid View"}
              </button>
              <button
                onClick={() => fetchProjects(true)}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading || isRefreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Completed Projects
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalTasks}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tasks Completed
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">
                    {stats.avgProgress}%
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Avg Completion</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalMembers}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Team Members</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search completed projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="completedAt">Sort by Completed Date</option>
              <option value="name">Sort by Name</option>
              <option value="progress">Sort by Progress</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </motion.div>

          {/* Projects Display */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No Completed Projects
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm
                  ? "No projects match your search"
                  : "Projects with all tasks completed will appear here"}
              </p>
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {currentProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-gray-800 font-semibold group-hover:text-emerald-600 transition">
                        {project.name}
                      </h3>
                      <p className="text-gray-400 text-xs font-mono">
                        {project.code}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Completion Rate</span>
                      <span className="text-emerald-600 font-medium">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Calendar size={12} />
                      <span>
                        Completed:{" "}
                        {project.completedAt
                          ? formatDate(project.completedAt)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <CheckCircle size={12} className="text-blue-500" />
                      <span>
                        {project.completedTasks}/{project.tasksCount}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {project.managerId && (
                      <span className="text-xs text-gray-400">
                        Manager: {project.managerId.fullName}
                      </span>
                    )}
                    <Link
                      href={`/projects/${project._id}`}
                      className="text-indigo-600 hover:text-indigo-700 text-xs font-medium flex items-center gap-1"
                    >
                      View Details
                      <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentProjects.map((project, index) => (
                      <motion.tr
                        key={project._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-800 font-medium">
                              {project.name}
                            </p>
                            <p className="text-gray-400 text-xs font-mono">
                              {project.code}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {project.managerId?.fullName || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {project.completedAt
                            ? formatDate(project.completedAt)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {project.completedTasks}/{project.tasksCount}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {project.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/projects/${project._id}`}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-block"
                          >
                            <Eye size={16} />
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between pt-4"
            >
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, filteredProjects.length)} of{" "}
                {filteredProjects.length} completed projects
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm transition ${currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}