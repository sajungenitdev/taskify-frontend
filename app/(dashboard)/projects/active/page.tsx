"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ArrowRight,
  Home,
  Grid,
  List,
  Star,
  Zap,
  Award,
  Briefcase,
  PieChart,
  ArrowUpRight,
  Archive,
  ArchiveRestore,
  History,
  EyeIcon,
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
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  archivedAt?: string;
  archivedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
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
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<string | null>(
    null,
  );
  const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState<
    string | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team">(
    "overview",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "progress" | "priority">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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

  // Archive project
  const handleArchiveProject = async (id: string) => {
    try {
      setSubmitting(true);
      const response = await api.patch(`/projects/${id}/archive`);
      if (response.data.success) {
        toast.success("Project archived successfully");
        setShowArchiveConfirm(null);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to archive project");
    } finally {
      setSubmitting(false);
    }
  };

  // Unarchive project
  const handleUnarchiveProject = async (id: string) => {
    try {
      setSubmitting(true);
      const response = await api.patch(`/projects/${id}/unarchive`);
      if (response.data.success) {
        toast.success("Project restored from archive");
        setShowUnarchiveConfirm(null);
        fetchData();
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to unarchive project",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Create project
  const handleCreateProject = async (e: React.FormEvent) => {
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
    archived: projects.filter((p) => p.status === "archived").length,
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

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      // Filter by archived status
      if (!showArchived && project.status === "archived") return false;
      if (showArchived && project.status !== "archived") return false;

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

    // Sort
    filtered.sort((a, b) => {
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
        case "priority":
          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
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

    return filtered;
  }, [
    projects,
    searchTerm,
    statusFilter,
    priorityFilter,
    sortBy,
    sortOrder,
    showArchived,
  ]);

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertCircle size={12} className="text-rose-500" />;
      case "high":
        return <AlertTriangle size={12} className="text-amber-500" />;
      case "normal":
        return <Target size={12} className="text-blue-500" />;
      default:
        return <CheckCircle size={12} className="text-emerald-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Activity size={12} className="text-emerald-500" />;
      case "completed":
        return <CheckCircle size={12} className="text-blue-500" />;
      case "on_hold":
        return <Clock size={12} className="text-amber-500" />;
      case "cancelled":
        return <AlertCircle size={12} className="text-rose-500" />;
      case "archived":
        return <Archive size={12} className="text-gray-500" />;
      default:
        return <Target size={12} className="text-gray-500" />;
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
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
          >
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              <Home size={14} />
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">Projects</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <FolderKanban className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Projects
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {stats.total}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Manage and track all your projects
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
                onClick={() => {
                  setEditingProject(null);
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
              >
                <Plus size={16} />
                Create Project
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <FolderKanban className="w-8 h-8 text-indigo-400 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.active}
                </p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.onHold}
                </p>
                <p className="text-xs text-gray-500">On Hold</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-gray-500">
                  {stats.archived}
                </p>
                <p className="text-xs text-gray-500">Archived</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-cyan-600">
                  {stats.avgProgress}%
                </p>
                <p className="text-xs text-gray-500">Avg Progress</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.completedTasks}
                </p>
                <p className="text-xs text-gray-500">Tasks Done</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(stats.totalBudget)}
                </p>
                <p className="text-xs text-gray-500">Total Budget</p>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
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
                placeholder="Search projects by name, code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="progress">Sort by Progress</option>
                <option value="priority">Sort by Priority</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <X size={16} />
              Reset
            </button>
          </motion.div>

          {/* Archive Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-gray-200 shadow-sm"
          >
            <button
              onClick={() => {
                setShowArchived(false);
                setStatusFilter("all");
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                !showArchived
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Active Projects
            </button>
            <button
              onClick={() => {
                setShowArchived(true);
                setStatusFilter("all");
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-2 ${
                showArchived
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Archive size={14} />
              Archived Projects
              {stats.archived > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    showArchived ? "bg-white/20" : "bg-gray-200"
                  }`}
                >
                  {stats.archived}
                </span>
              )}
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
                {showArchived ? (
                  <Archive className="w-10 h-10 text-gray-400" />
                ) : (
                  <FolderKanban className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {showArchived ? "No Archived Projects" : "No Projects Found"}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No projects match your search"
                  : showArchived
                    ? "No projects have been archived yet"
                    : "Create your first project to get started"}
              </p>
              {!searchTerm && !showArchived && (
                <button
                  onClick={() => {
                    setEditingProject(null);
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm"
                >
                  <Plus size={16} className="inline mr-2" />
                  Create Project
                </button>
              )}
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
                  className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group ${
                    project.status === "archived"
                      ? "border-gray-300 opacity-75 hover:opacity-100"
                      : "border-gray-200"
                  }`}
                  onClick={() => openViewModal(project)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            project.status === "archived"
                              ? "bg-gray-100"
                              : "bg-indigo-50"
                          }`}
                        >
                          {project.status === "archived" ? (
                            <Archive className="w-5 h-5 text-gray-500" />
                          ) : (
                            <FolderKanban className="w-5 h-5 text-indigo-500" />
                          )}
                        </div>
                        <div>
                          <h3
                            className={`text-sm font-semibold transition ${
                              project.status === "archived"
                                ? "text-gray-500"
                                : "text-gray-800 group-hover:text-indigo-600"
                            }`}
                          >
                            {project.name}
                          </h3>
                          <span className="text-xs font-mono text-gray-400">
                            {project.code}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${getPriorityColor(project.priority)}`}
                        >
                          {getPriorityIcon(project.priority)}
                          {project.priority}
                        </span>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(project.status)}`}
                      >
                        {getStatusIcon(project.status)}
                        {project.status.replace("_", " ")}
                      </span>
                      {project.managerId && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <User size={10} />
                          {project.managerId.fullName}
                        </span>
                      )}
                      {project.archivedAt && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <History size={10} />
                          {new Date(project.archivedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium text-gray-700">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            project.status === "archived"
                              ? "bg-gray-400"
                              : "bg-gradient-to-r from-indigo-500 to-purple-600"
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(project.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} className="text-emerald-500" />
                        <span>
                          {formatCurrency(project.budget?.allocated || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle size={12} className="text-blue-500" />
                        <span>
                          {project.completedTasks}/{project.tasksCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {project.status === "archived" ? "Archived" : "Updated"}:{" "}
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.status === "archived" ? (
                        <button
                          onClick={() => setShowUnarchiveConfirm(project._id)}
                          className="p-1 cursor-pointer text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Restore from archive"
                        >
                          <ArchiveRestore size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            // onClick={() => openEditModal(project)}
                            onClick={() => router.push(`/projects/${project._id}/edit`)}
                            className="p-1 cursor-pointer text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setShowArchiveConfirm(project._id)}
                            className="p-1 cursor-pointer text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Archive project"
                          >
                            <Archive size={14} />
                          </button>
                          <Link
                            href={`/projects/${project._id}/dashboard`}
                            className="p-1 cursor-pointer text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="View project"
                          >
                            <EyeIcon size={14} />
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => setShowDeleteConfirm(project._id)}
                        className="p-1 cursor-pointer text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
                        Priority
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="text-left w-37.5 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timeline
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
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
                        className={`hover:bg-gray-50 transition cursor-pointer ${
                          project.status === "archived" ? "opacity-75" : ""
                        }`}
                        onClick={() => openViewModal(project)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p
                              className={`font-medium ${
                                project.status === "archived"
                                  ? "text-gray-500"
                                  : "text-gray-800 group-hover:text-indigo-600"
                              }`}
                            >
                              {project.name}
                            </p>
                            <p className="text-gray-400 text-xs font-mono">
                              {project.code}
                            </p>
                            {project.description && (
                              <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 w-fit ${getPriorityColor(project.priority)}`}
                          >
                            {getPriorityIcon(project.priority)}
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
                              <p className="text-sm text-gray-800">
                                {project.managerId.fullName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {project.managerId.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  project.status === "archived"
                                    ? "bg-gray-400"
                                    : "bg-gradient-to-r from-indigo-500 to-purple-600"
                                }`}
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {project.progress}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {project.completedTasks}/{project.tasksCount} tasks
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar size={12} />
                            <span>{formatDate(project.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Calendar size={12} />
                            <span>{formatDate(project.endDate)}</span>
                          </div>
                          {project.archivedAt && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <History size={10} />
                              <span>
                                Archived:{" "}
                                {new Date(
                                  project.archivedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <DollarSign
                              size={14}
                              className="text-emerald-500"
                            />
                            <span className="text-gray-800 text-sm">
                              {formatCurrency(project.budget?.allocated || 0)}
                            </span>
                          </div>
                          {project.budget?.spent &&
                            project.budget.spent > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Spent: {formatCurrency(project.budget.spent)}
                              </p>
                            )}
                        </td>
                        <td
                          className="px-6 py-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openViewModal(project)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {project.status === "archived" ? (
                              <button
                                onClick={() =>
                                  setShowUnarchiveConfirm(project._id)
                                }
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Restore from archive"
                              >
                                <ArchiveRestore size={16} />
                              </button>
                            ) : (
                              <>
                                <Link
  href={`/projects/${project._id}/edit`}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit Project"
                                >
                                  <Edit2 size={16} />
                                </Link>
                                <button
                                  onClick={() =>
                                    setShowArchiveConfirm(project._id)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Archive Project"
                                >
                                  <Archive size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setShowDeleteConfirm(project._id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Project"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
                {filteredProjects.length} projects
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
                      className={`px-3 py-2 rounded-lg text-sm transition ${
                        currentPage === pageNum
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

      {/* Create/Edit Project Modal - Same as before */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingProject ? "Edit Project" : "Create New Project"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
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
                  className="text-gray-400 hover:text-gray-600 transition"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Project Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      placeholder="Enter project name"
                      required
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
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition font-mono"
                      placeholder="e.g., PRJ-001"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                    placeholder="Describe the project goals and objectives..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
                      Project Manager
                    </label>
                    <select
                      value={formData.managerId}
                      onChange={(e) =>
                        setFormData({ ...formData, managerId: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Project Modal - Same as before */}
      <AnimatePresence>
        {showViewModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderKanban size={20} className="text-indigo-500" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedProject.name}
                    </h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(selectedProject.status)}`}
                    >
                      {selectedProject.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {selectedProject.code}
                  </p>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 px-5 bg-gray-50">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-3 text-sm font-medium transition relative ${
                    activeTab === "overview"
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
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
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
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
                      ? "text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Team ({selectedProject.teamMembers?.length || 0})
                  {activeTab === "team" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                  )}
                </button>
              </div>

              {/* Content - Same as before */}
              <div className="p-5">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Progress Section */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <h3 className="text-gray-800 font-medium mb-3">
                        Project Progress
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm text-gray-500 mb-1">
                            <span>Overall Completion</span>
                            <span className="font-medium text-gray-700">
                              {selectedProject.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                selectedProject.status === "archived"
                                  ? "bg-gray-400"
                                  : "bg-gradient-to-r from-indigo-500 to-purple-600"
                              }`}
                              style={{ width: `${selectedProject.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-2xl font-bold text-gray-800">
                            {selectedProject.completedTasks}
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed Tasks
                          </p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-2xl font-bold text-gray-800">
                            {selectedProject.tasksCount}
                          </p>
                          <p className="text-xs text-gray-500">Total Tasks</p>
                        </div>
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">
                          Description
                        </p>
                        <p className="text-gray-800 text-sm">
                          {selectedProject.description ||
                            "No description provided"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Timeline</p>
                        <div className="flex items-center gap-2 text-gray-800 text-sm">
                          <Calendar size={14} className="text-indigo-500" />
                          <span>
                            {formatDate(selectedProject.startDate)} -{" "}
                            {formatDate(selectedProject.endDate)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        <span
                          className={`text-sm px-2 py-1 rounded-full border inline-block ${getPriorityColor(selectedProject.priority)}`}
                        >
                          {selectedProject.priority}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Budget</p>
                        <p className="text-gray-800 text-sm font-medium">
                          {formatCurrency(
                            selectedProject.budget?.allocated || 0,
                          )}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Department</p>
                        <p className="text-gray-800 text-sm">
                          {selectedProject.departmentId?.name || "Not assigned"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">
                          Project Manager
                        </p>
                        <p className="text-gray-800 text-sm">
                          {selectedProject.managerId?.fullName ||
                            "Not assigned"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Created By</p>
                        <p className="text-gray-800 text-sm">
                          {selectedProject.createdBy?.fullName || "Unknown"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Created At</p>
                        <p className="text-gray-800 text-sm">
                          {new Date(
                            selectedProject.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedProject.archivedAt && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Archived</p>
                          <div className="flex items-center gap-2 text-gray-800 text-sm">
                            <Archive size={14} className="text-gray-500" />
                            <span>
                              Archived on{" "}
                              {new Date(
                                selectedProject.archivedAt,
                              ).toLocaleDateString()}
                              {selectedProject.archivedBy && (
                                <> by {selectedProject.archivedBy.fullName}</>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "tasks" && (
                  <div className="text-center py-8">
                    <Link
                      href={`/projects/${selectedProject._id}/tasks`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
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
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                              <User size={18} className="text-indigo-500" />
                            </div>
                            <div>
                              <p className="text-gray-800 font-medium">
                                {member.userId.fullName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {member.userId.email}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 font-medium">
                            {member.role}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No team members assigned yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 p-5 border-t border-gray-200 bg-gray-50">
                {selectedProject.status === "archived" ? (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowUnarchiveConfirm(selectedProject._id);
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ArchiveRestore size={16} />
                    Restore from Archive
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        openEditModal(selectedProject);
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Edit2 size={16} />
                      Edit Project
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setShowArchiveConfirm(selectedProject._id);
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Archive size={16} />
                      Archive Project
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2 p-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Archive className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Archive Project
                  </h2>
                  <p className="text-xs text-gray-500">
                    Project will be moved to archive
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600">
                  Are you sure you want to archive this project? It will be
                  moved to the archived list. All tasks will remain intact and
                  viewable in the history.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleArchiveProject(showArchiveConfirm)}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Archive size={16} />
                    )}
                    Archive
                  </button>
                  <button
                    onClick={() => setShowArchiveConfirm(null)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unarchive Confirmation Modal */}
      <AnimatePresence>
        {showUnarchiveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2 p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <ArchiveRestore className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Restore from Archive
                  </h2>
                  <p className="text-xs text-gray-500">
                    Project will be moved back to active list
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600">
                  Are you sure you want to restore this project from archive? It
                  will be moved back to the active projects list.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleUnarchiveProject(showUnarchiveConfirm)}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArchiveRestore size={16} />
                    )}
                    Restore
                  </button>
                  <button
                    onClick={() => setShowUnarchiveConfirm(null)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2 p-5 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-red-50">
                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Delete Project
                  </h2>
                  <p className="text-xs text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600">
                  Are you sure you want to delete this project? This action
                  cannot be undone and will also delete all associated tasks.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleDeleteProject(showDeleteConfirm)}
                    className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white py-2.5 rounded-lg transition shadow-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
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
