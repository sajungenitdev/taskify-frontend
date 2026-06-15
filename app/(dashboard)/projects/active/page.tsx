"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  X,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Activity,
  Building2,
  User,
  Filter,
  Download,
  Upload,
  TrendingUp,
  Target,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  managerId?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  teamMembers: Array<{
    userId: { _id: string; fullName: string; email: string };
    role: string;
    joinedAt: string;
  }>;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "critical";
  startDate: string;
  endDate: string;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  progress: number;
  tasksCount: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId?: string;
}

export default function ProjectsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team">(
    "overview",
  );
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    departmentId: "",
    managerId: "",
    priority: "normal",
    startDate: "",
    endDate: "",
    allocatedBudget: 0,
  });

  const canManage = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
  ]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectsRes, deptsRes, usersRes] = await Promise.all([
        api.get("/projects"),
        api.get("/departments"),
        api.get("/auth/users"),
      ]);

      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data || []);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data || []);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) {
      fetchData();
    }
  }, [canManage, fetchData]);

  // Create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Project code is required");
      return;
    }
    if (!formData.startDate) {
      toast.error("Start date is required");
      return;
    }
    if (!formData.endDate) {
      toast.error("End date is required");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/projects", {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        departmentId: formData.departmentId || undefined,
        managerId: formData.managerId || undefined,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.allocatedBudget,
      });

      if (response.data.success) {
        toast.success("Project created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  // Update project
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Project code is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.put(`/projects/${editingProject._id}`, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        departmentId: formData.departmentId || undefined,
        managerId: formData.managerId || undefined,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.allocatedBudget,
      });

      if (response.data.success) {
        toast.success("Project updated successfully");
        setShowCreateModal(false);
        setEditingProject(null);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      if (response.data.success) {
        toast.success("Project deleted successfully");
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete project");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      departmentId: "",
      managerId: "",
      priority: "normal",
      startDate: "",
      endDate: "",
      allocatedBudget: 0,
    });
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || "",
      departmentId: project.departmentId?._id || "",
      managerId: project.managerId?._id || "",
      priority: project.priority,
      startDate: project.startDate.split("T")[0],
      endDate: project.endDate.split("T")[0],
      allocatedBudget: project.budget?.allocated || 0,
    });
    setShowCreateModal(true);
  };

  const openViewModal = (project: Project) => {
    setSelectedProject(project);
    setActiveTab("overview");
    setShowViewModal(true);
  };

  // Statistics
  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    planning: projects.filter((p) => p.status === "planning").length,
    onHold: projects.filter((p) => p.status === "on_hold").length,
    completed: projects.filter((p) => p.status === "completed").length,
    cancelled: projects.filter((p) => p.status === "cancelled").length,
    totalBudget: projects.reduce(
      (sum, p) => sum + (p.budget?.allocated || 0),
      0,
    ),
    totalTasks: projects.reduce((sum, p) => sum + p.tasksCount, 0),
    completedTasks: projects.reduce((sum, p) => sum + p.completedTasks, 0),
    avgProgress:
      projects.length > 0
        ? Math.round(
            projects.reduce((sum, p) => sum + p.progress, 0) / projects.length,
          )
        : 0,
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-slate-500/20 text-slate-400 border-slate-500/20",
      active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
      on_hold: "bg-amber-500/20 text-amber-400 border-amber-500/20",
      completed: "bg-blue-500/20 text-blue-400 border-blue-500/20",
      cancelled: "bg-rose-500/20 text-rose-400 border-rose-500/20",
    };
    return colors[status] || colors.planning;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
      normal: "bg-blue-500/20 text-blue-400 border-blue-500/20",
      high: "bg-amber-500/20 text-amber-400 border-amber-500/20",
      critical: "bg-rose-500/20 text-rose-400 border-rose-500/20",
    };
    return colors[priority] || colors.normal;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Activity size={14} />;
      case "completed":
        return <CheckCircle size={14} />;
      case "on_hold":
        return <Clock size={14} />;
      case "cancelled":
        return <AlertCircle size={14} />;
      default:
        return <Target size={14} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">
            You don't have permission to view this page
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-6 pe-0 ps-8">
        <div className="w-full mx-auto space-y-6 px-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/dashboard"
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Dashboard
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-white text-sm font-medium">Projects</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Projects</h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage and track all your projects
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingProject(null);
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
              >
                <Plus size={16} />
                Create Project
              </button>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <FolderKanban className="w-8 h-8 text-indigo-400 opacity-50" />
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {stats.active}
                </p>
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div>
                <p className="text-2xl font-bold text-amber-400">
                  {stats.onHold}
                </p>
                <p className="text-xs text-slate-400">On Hold</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.completed}
                </p>
                <p className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div>
                <p className="text-2xl font-bold text-cyan-400">
                  {stats.avgProgress}%
                </p>
                <p className="text-xs text-slate-400">Avg Progress</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {stats.completedTasks}
                </p>
                <p className="text-xs text-slate-400">Tasks Done</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div>
                <p className="text-xl font-bold text-purple-400">
                  {formatCurrency(stats.totalBudget)}
                </p>
                <p className="text-xs text-slate-400">Total Budget</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects by name, code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <X size={16} />
              Reset
            </button>
          </div>

          {/* Projects Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50 border-b border-slate-800">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Project
                        </th>
                        <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Priority
                        </th>
                        <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Manager
                        </th>
                        <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Progress
                        </th>
                        <th className="w-[15%] text-left px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Timeline
                        </th>
                        <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Budget
                        </th>
                        <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {currentProjects.map((project) => (
                        <tr
                          key={project._id}
                          className="hover:bg-slate-800/30 transition cursor-pointer"
                          onClick={() => openViewModal(project)}
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">
                                {project.name}
                              </p>
                              <p className="text-slate-500 text-xs">
                                {project.code}
                              </p>
                              {project.description && (
                                <p className="text-slate-500 text-xs mt-1 line-clamp-1">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(project.priority)}`}
                            >
                              {project.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 w-fit ${getStatusColor(project.status)}`}
                            >
                              {getStatusIcon(project.status)}
                              {project.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {project.managerId ? (
                              <div>
                                <p className="text-sm text-white">
                                  {project.managerId.fullName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {project.managerId.email}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-700 rounded-full h-2">
                                <div
                                  className="bg-indigo-500 h-2 rounded-full transition-all"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">
                                {project.progress}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {project.completedTasks}/{project.tasksCount}{" "}
                              tasks
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm text-slate-400">
                              <Calendar size={12} />
                              <span>{formatDate(project.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                              <Calendar size={12} />
                              <span>{formatDate(project.endDate)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <DollarSign
                                size={14}
                                className="text-emerald-400"
                              />
                              <span className="text-white text-sm">
                                {formatCurrency(project.budget?.allocated || 0)}
                              </span>
                            </div>
                            {project.budget?.spent &&
                              project.budget.spent > 0 && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Spent: {formatCurrency(project.budget.spent)}
                                </p>
                              )}
                          </td>
                          <td
                            className="px-6 py-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openViewModal(project)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 transition rounded-lg hover:bg-slate-700"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(project)}
                                className="p-1.5 text-slate-400 hover:text-blue-400 transition rounded-lg hover:bg-slate-700"
                                title="Edit Project"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  setShowDeleteConfirm(project._id)
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-700"
                                title="Delete Project"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No projects found</p>
                    <button
                      onClick={() => {
                        setEditingProject(null);
                        resetForm();
                        setShowCreateModal(true);
                      }}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                    >
                      Create your first project
                    </button>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50 hover:bg-slate-700 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
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
                        className={`px-3 py-2 rounded-lg transition ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
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
                    className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50 hover:bg-slate-700 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editingProject ? "Edit Project" : "Create New Project"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingProject
                    ? "Update project information"
                    : "Fill in the details to create a new project"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProject(null);
                  resetForm();
                }}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={
                editingProject ? handleUpdateProject : handleCreateProject
              }
              className="p-5 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Project Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none transition"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Project Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none transition"
                    placeholder="e.g., PRJ-001"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none transition resize-none"
                  placeholder="Describe the project goals and objectives..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Project Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) =>
                      setFormData({ ...formData, managerId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select Manager</option>
                    {users
                      .filter((u) =>
                        [
                          "super_admin",
                          "admin",
                          "project_manager",
                          "dept_manager",
                        ].includes(u.role),
                      )
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName} ({u.role.replace(/_/g, " ")})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Budget (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="number"
                      value={formData.allocatedBudget}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allocatedBudget: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Start Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    End Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingProject ? (
                    "Update Project"
                  ) : (
                    "Create Project"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProject(null);
                    resetForm();
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Project Modal */}
      {showViewModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <FolderKanban size={20} className="text-indigo-400" />
                  <h2 className="text-lg font-semibold text-white">
                    {selectedProject.name}
                  </h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(selectedProject.status)}`}
                  >
                    {selectedProject.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedProject.code}
                </p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-500 hover:text-slate-300 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 px-5">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "overview"
                    ? "text-indigo-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Overview
                {activeTab === "overview" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "tasks"
                    ? "text-indigo-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Tasks ({selectedProject.tasksCount})
                {activeTab === "tasks" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "team"
                    ? "text-indigo-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Team ({selectedProject.teamMembers?.length || 0})
                {activeTab === "team" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Progress Section */}
                  <div className="bg-slate-800/30 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-3">
                      Project Progress
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-slate-400 mb-1">
                          <span>Overall Completion</span>
                          <span>{selectedProject.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <div
                            className="bg-indigo-500 h-3 rounded-full transition-all"
                            style={{ width: `${selectedProject.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                          {selectedProject.completedTasks}
                        </p>
                        <p className="text-xs text-slate-400">
                          Completed Tasks
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                          {selectedProject.tasksCount}
                        </p>
                        <p className="text-xs text-slate-400">Total Tasks</p>
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Description</p>
                      <p className="text-white text-sm">
                        {selectedProject.description ||
                          "No description provided"}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Timeline</p>
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Calendar size={14} />
                        <span>
                          {formatDate(selectedProject.startDate)} -{" "}
                          {formatDate(selectedProject.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Priority</p>
                      <span
                        className={`text-sm px-2 py-1 rounded-full border inline-block ${getPriorityColor(selectedProject.priority)}`}
                      >
                        {selectedProject.priority}
                      </span>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Budget</p>
                      <p className="text-white text-sm">
                        {formatCurrency(selectedProject.budget?.allocated || 0)}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Department</p>
                      <p className="text-white text-sm">
                        {selectedProject.departmentId?.name || "Not assigned"}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">
                        Project Manager
                      </p>
                      <p className="text-white text-sm">
                        {selectedProject.managerId?.fullName || "Not assigned"}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Created By</p>
                      <p className="text-white text-sm">
                        {selectedProject.createdBy?.fullName || "Unknown"}
                      </p>
                    </div>
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs text-slate-400 mb-1">Created At</p>
                      <p className="text-white text-sm">
                        {new Date(
                          selectedProject.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="text-center py-8">
                  <Link
                    href={`/projects/${selectedProject._id}/tasks`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
                  >
                    View All Tasks
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              {activeTab === "team" && (
                <div className="space-y-3">
                  {selectedProject.teamMembers &&
                  selectedProject.teamMembers.length > 0 ? (
                    selectedProject.teamMembers.map((member) => (
                      <div
                        key={member.userId._id}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <User size={18} className="text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {member.userId.fullName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {member.userId.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300">
                          {member.role}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">
                        No team members assigned yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 p-5 border-t border-slate-800 bg-slate-900">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedProject);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Edit Project
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">
                  Delete Project
                </h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-slate-300">
                Are you sure you want to delete this project? This action cannot
                be undone and will also delete all associated tasks.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDeleteProject(showDeleteConfirm)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing imports
import { ArrowRight } from "lucide-react";
