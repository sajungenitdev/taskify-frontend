// app/(dashboard)/projects/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Save,
  X,
  Loader2,
  Home,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Building2,
  User,
  Calendar,
  DollarSign,
  Flag,
  Users,
  Briefcase,
  AlertTriangle,
  Archive,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";

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
  status:
    | "planning"
    | "active"
    | "on_hold"
    | "completed"
    | "cancelled"
    | "archived";
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
  teamMembers?: User[];
}

export default function EditProjectPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    departmentId: "",
    managerId: "",
    status: "active",
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

  // Fetch project data
  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectRes, deptsRes, usersRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get("/departments"),
        api.get("/auth/users"),
      ]);

      if (projectRes.data.success) {
        const projectData = projectRes.data.data;
        setProject(projectData);
        setFormData({
          name: projectData.name,
          code: projectData.code,
          description: projectData.description || "",
          departmentId: projectData.departmentId?._id || "",
          managerId: projectData.managerId?._id || "",
          status: projectData.status,
          priority: projectData.priority,
          startDate: projectData.startDate.split("T")[0],
          endDate: projectData.endDate.split("T")[0],
          allocatedBudget: projectData.budget?.allocated || 0,
        });
      }

      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data || []);
      }

      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching project:", error);
      setError(error.response?.data?.message || "Failed to fetch project");
      toast.error(error.response?.data?.message || "Failed to fetch project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!canManage) {
      router.push("/projects");
      return;
    }
    // Avoid calling setState synchronously during effect to prevent
    // cascading renders. Schedule fetching after paint.
    const t = setTimeout(() => {
      fetchProject();
    }, 0);

    return () => clearTimeout(t);
  }, [canManage, fetchProject, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    setSaving(true);
    try {
      const response = await api.put(`/projects/${projectId}`, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        departmentId: formData.departmentId || undefined,
        managerId: formData.managerId || undefined,
        status: formData.status,
        priority: formData.priority,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: formData.allocatedBudget,
      });

      if (response.data.success) {
        toast.success("Project updated successfully!");
        router.push(`/projects/${projectId}`);
      }
    } catch (error: any) {
      console.error("Error updating project:", error);
      toast.error(error.response?.data?.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-gray-100 text-gray-700 border-gray-200",
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      on_hold: "bg-amber-50 text-amber-700 border-amber-200",
      completed: "bg-blue-50 text-blue-700 border-blue-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
      archived: "bg-gray-100 text-gray-500 border-gray-200",
    };
    return colors[status] || colors.planning;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      normal: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-amber-50 text-amber-700 border-amber-200",
      critical: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[priority] || colors.normal;
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            You don't have permission to edit this project
          </p>
          <button
            onClick={() => router.push("/projects")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Failed to Load Project
          </h3>
          <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
          <button
            onClick={fetchProject}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter users for manager selection
  const availableManagers = users.filter((u) =>
    ["super_admin", "admin", "project_manager", "dept_manager"].includes(
      u.role,
    ),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm mb-6"
          >
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              <Home size={14} />
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link
              href="/projects"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              Projects
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link
              href={`/projects/${projectId}`}
              className="text-gray-400 hover:text-gray-600 transition truncate max-w-[150px]"
            >
              {project.name}
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-indigo-600 font-medium">Edit</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <Link
                href={`/projects/${projectId}`}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      Edit Project
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-gray-400">
                        {project.code}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition flex items-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </motion.div>

          {/* Edit Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Project Status Banner */}
              {project.status === "archived" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <Archive
                    size={18}
                    className="text-amber-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Archived Project
                    </p>
                    <p className="text-xs text-amber-700">
                      This project is archived. You can update it, but it will
                      remain in the archived list.
                    </p>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project Code <span className="text-rose-500">*</span>
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition font-mono"
                    placeholder="e.g., PRJ-001"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  placeholder="Describe the project goals and objectives..."
                />
              </div>

              {/* Department & Manager */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Building2
                      size={14}
                      className="inline mr-1 text-gray-400"
                    />
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User size={14} className="inline mr-1 text-gray-400" />
                    Project Manager
                  </label>
                  <select
                    value={formData.managerId}
                    onChange={(e) =>
                      setFormData({ ...formData, managerId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="">Select Manager</option>
                    {availableManagers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.role.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Flag size={14} className="inline mr-1 text-gray-400" />
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <AlertTriangle
                      size={14}
                      className="inline mr-1 text-gray-400"
                    />
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Dates & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar size={14} className="inline mr-1 text-gray-400" />
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar size={14} className="inline mr-1 text-gray-400" />
                    End Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <DollarSign
                      size={14}
                      className="inline mr-1 text-gray-400"
                    />
                    Budget (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.allocatedBudget}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allocatedBudget: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Project Stats (Read-only) */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Project Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Progress</p>
                    <p className="text-lg font-bold text-gray-800">
                      {project.progress}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Tasks</p>
                    <p className="text-lg font-bold text-gray-800">
                      {project.tasksCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Completed Tasks</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {project.completedTasks}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Team Members</p>
                    <p className="text-lg font-bold text-gray-800">
                      {project.teamMembers?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/projects/${projectId}`)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          cursor: pointer;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
