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
  };
  teamMembers: Array<{
    userId: { _id: string; fullName: string; email: string };
    role: string;
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
}

export default function ActiveProjectsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    departmentId: "",
    managerId: "",
    priority: "normal",
    startDate: "",
    endDate: "",
    budget: 0,
  });

  const canManage = hasRole(["super_admin", "admin", "dept_manager", "project_manager"]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/projects?status=active");
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view projects");
        setTimeout(() => router.push("/dashboard"), 2000);
      } else if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch projects");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (canManage) {
      fetchProjects();
    }
  }, [canManage, fetchProjects]);

  // Create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/projects", {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget,
      });
      if (response.data.success) {
        toast.success("Project created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchProjects();
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
    setSubmitting(true);
    try {
      const response = await api.put(`/projects/${editingProject._id}`, {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.budget,
      });
      if (response.data.success) {
        toast.success("Project updated successfully");
        setShowCreateModal(false);
        setEditingProject(null);
        resetForm();
        fetchProjects();
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
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted successfully");
      setShowDeleteConfirm(null);
      fetchProjects();
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
      budget: 0,
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
      budget: project.budget?.allocated || 0,
    });
    setShowCreateModal(true);
  };

  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "active").length,
    completed: projects.filter((p) => p.status === "completed").length,
    onHold: projects.filter((p) => p.status === "on_hold").length,
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    const colors = {
      planning: "bg-slate-500/20 text-slate-400",
      active: "bg-emerald-500/20 text-emerald-400",
      on_hold: "bg-amber-500/20 text-amber-400",
      completed: "bg-blue-500/20 text-blue-400",
      cancelled: "bg-rose-500/20 text-rose-400",
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-500/20 text-emerald-400",
      normal: "bg-blue-500/20 text-blue-400",
      high: "bg-amber-500/20 text-amber-400",
      critical: "bg-rose-500/20 text-rose-400",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/projects" className="text-slate-400 hover:text-white text-sm">Projects</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white text-sm">Active</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Active Projects</h1>
            <p className="text-slate-400 text-sm mt-1">Manage ongoing projects</p>
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
            <button onClick={fetchProjects} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Projects</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{stats.inProgress}</p>
                <p className="text-xs text-slate-400 mt-0.5">In Progress</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-400">{stats.onHold}</p>
                <p className="text-xs text-slate-400 mt-0.5">On Hold</p>
              </div>
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
                <p className="text-xs text-slate-400 mt-0.5">Completed</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          />
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
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Project</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Priority</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Status</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Manager</th>
                      <th className="text-center px-6 py-3 text-xs text-slate-400 uppercase">Progress</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Timeline</th>
                      <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentProjects.map((project) => (
                      <tr key={project._id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white font-medium">{project.name}</p>
                            <p className="text-slate-500 text-xs">{project.code}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {project.managerId?.fullName || "Unassigned"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-700 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${project.progress}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/projects/${project._id}`} className="p-1.5 text-slate-400 hover:text-indigo-400 transition">
                              <Eye size={16} />
                            </Link>
                            <button onClick={() => openEditModal(project)} className="p-1.5 text-slate-400 hover:text-blue-400 transition">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => setShowDeleteConfirm(project._id)} className="p-1.5 text-slate-400 hover:text-rose-400 transition">
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
                  <p className="text-slate-400">No active projects found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h2 className="text-lg font-semibold text-white">{editingProject ? "Edit Project" : "Create Project"}</h2>
              <button onClick={() => { setShowCreateModal(false); setEditingProject(null); resetForm(); }} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Project Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingProject ? "Update" : "Create")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingProject(null); resetForm(); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Delete Project</h2>
            </div>
            <div className="p-5">
              <p className="text-slate-300">Are you sure you want to delete this project? This action cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => handleDeleteProject(showDeleteConfirm)} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg transition">
                  Delete
                </button>
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition">
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
