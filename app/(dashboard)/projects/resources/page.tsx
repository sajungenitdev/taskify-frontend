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
  Users,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Briefcase,
  Clock,
  AlertCircle,
  Home,
  Grid,
  List,
  Download,
  Filter,
  ArrowUpRight,
  Award,
  Zap,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Server,
  HardDrive,
  Cpu,
  Database,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Resource {
  _id: string;
  name: string;
  type: "human" | "equipment" | "software" | "material";
  assignedTo: { _id: string; fullName: string } | null;
  projectId: { _id: string; name: string };
  startDate: string;
  endDate: string;
  status: "available" | "in_use" | "maintenance" | "retired";
  utilization: number;
  createdAt: string;
  updatedAt: string;
}

export default function ResourcesPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "type" | "utilization">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [formData, setFormData] = useState({
    name: "",
    type: "human",
    projectId: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    status: "available",
    utilization: 0,
  });
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ _id: string; fullName: string }[]>([]);

  const canManage = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
  ]);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/resources");
      if (response.data.success) {
        setResources(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch resources");
      }
    } catch (error: any) {
      console.error("Error fetching resources:", error);
      setError(error.response?.data?.message || "Failed to load resources");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projects for dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  // Fetch users for dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/auth/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  useEffect(() => {
    if (canManage) {
      fetchResources();
      fetchProjects();
      fetchUsers();
    }
  }, [canManage, fetchResources, fetchProjects, fetchUsers]);

  // Create resource
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/resources", formData);
      if (response.data.success) {
        toast.success("Resource created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchResources();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create resource");
    } finally {
      setSubmitting(false);
    }
  };

  // Update resource
  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setSubmitting(true);
    try {
      const response = await api.put(
        `/resources/${editingResource._id}`,
        formData,
      );
      if (response.data.success) {
        toast.success("Resource updated successfully");
        setShowCreateModal(false);
        setEditingResource(null);
        resetForm();
        fetchResources();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update resource");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (id: string) => {
    try {
      await api.delete(`/resources/${id}`);
      toast.success("Resource deleted successfully");
      setShowDeleteConfirm(null);
      fetchResources();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete resource");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "human",
      projectId: "",
      assignedTo: "",
      startDate: "",
      endDate: "",
      status: "available",
      utilization: 0,
    });
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      projectId: resource.projectId?._id || "",
      assignedTo: resource.assignedTo?._id || "",
      startDate: resource.startDate?.split("T")[0] || "",
      endDate: resource.endDate?.split("T")[0] || "",
      status: resource.status,
      utilization: resource.utilization,
    });
    setShowCreateModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "human":
        return <Users size={14} className="text-blue-500" />;
      case "equipment":
        return <Server size={14} className="text-amber-500" />;
      case "software":
        return <Database size={14} className="text-purple-500" />;
      case "material":
        return <HardDrive size={14} className="text-emerald-500" />;
      default:
        return <FolderKanban size={14} className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      human: "bg-blue-50 text-blue-700 border-blue-200",
      equipment: "bg-amber-50 text-amber-700 border-amber-200",
      software: "bg-purple-50 text-purple-700 border-purple-200",
      material: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
    return colors[type as keyof typeof colors] || colors.human;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: "bg-emerald-50 text-emerald-700 border-emerald-200",
      in_use: "bg-blue-50 text-blue-700 border-blue-200",
      maintenance: "bg-amber-50 text-amber-700 border-amber-200",
      retired: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle size={12} className="text-emerald-500" />;
      case "in_use":
        return <Activity size={12} className="text-blue-500" />;
      case "maintenance":
        return <Clock size={12} className="text-amber-500" />;
      case "retired":
        return <AlertCircle size={12} className="text-rose-500" />;
      default:
        return <CheckCircle size={12} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let filtered = resources.filter((resource) => {
      const matchesSearch = resource.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = !selectedType || resource.type === selectedType;
      const matchesStatus =
        !selectedStatus || resource.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "utilization":
          aVal = a.utilization;
          bVal = b.utilization;
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
  }, [resources, searchTerm, selectedType, selectedStatus, sortBy, sortOrder]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResources = filteredResources.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);

  const stats = {
    total: resources.length,
    available: resources.filter((r) => r.status === "available").length,
    inUse: resources.filter((r) => r.status === "in_use").length,
    maintenance: resources.filter((r) => r.status === "maintenance").length,
    retired: resources.filter((r) => r.status === "retired").length,
    avgUtilization:
      resources.length > 0
        ? Math.round(
            resources.reduce((sum, r) => sum + r.utilization, 0) /
              resources.length,
          )
        : 0,
    types: {
      human: resources.filter((r) => r.type === "human").length,
      equipment: resources.filter((r) => r.type === "equipment").length,
      software: resources.filter((r) => r.type === "software").length,
      material: resources.filter((r) => r.type === "material").length,
    },
  };

  const handleExport = () => {
    const headers = [
      "Resource Name",
      "Type",
      "Project",
      "Assigned To",
      "Status",
      "Utilization",
      "Start Date",
      "End Date",
    ];
    const rows = filteredResources.map((r) => [
      r.name,
      r.type,
      r.projectId?.name || "N/A",
      r.assignedTo?.fullName || "Unassigned",
      r.status.replace("_", " "),
      r.utilization + "%",
      formatDate(r.startDate),
      formatDate(r.endDate),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resources_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Resources exported successfully");
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
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error && resources.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Unable to Load Resources
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchResources}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">
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
            <Link
              href="/projects"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              Projects
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">Resources</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Project Resources
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {stats.total}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Manage resources allocated to projects
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <Download size={14} />
                Export
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
                onClick={() => {
                  setEditingResource(null);
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
              >
                <Plus size={16} />
                Allocate Resource
              </button>
              <button
                onClick={fetchResources}
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
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.available}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Available</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.inUse}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">In Use</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.maintenance}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Maintenance</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.avgUtilization}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Avg Utilization</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.types.software}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Software</p>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
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
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="">All Types</option>
              <option value="human">Human Resources</option>
              <option value="equipment">Equipment</option>
              <option value="software">Software</option>
              <option value="material">Material</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="name">Sort by Name</option>
              <option value="type">Sort by Type</option>
              <option value="utilization">Sort by Utilization</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </motion.div>

          {/* Resources Display */}
          {resources.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No Resources Found
              </h3>
              <p className="text-gray-500">
                Allocate your first resource to get started
              </p>
              <button
                onClick={() => {
                  setEditingResource(null);
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition"
              >
                <Plus size={16} className="inline mr-2" />
                Allocate Resource
              </button>
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {currentResources.map((resource, index) => (
                <motion.div
                  key={resource._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg border ${getTypeColor(resource.type)}`}
                      >
                        {getTypeIcon(resource.type)}
                      </div>
                      <div>
                        <h3 className="text-gray-800 font-semibold group-hover:text-indigo-600 transition">
                          {resource.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${getTypeColor(resource.type)}`}
                        >
                          {resource.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(resource.status)}`}
                      >
                        {getStatusIcon(resource.status)}
                        {resource.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Utilization</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${resource.utilization}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {resource.utilization}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Project</span>
                      <span className="text-gray-700 text-sm">
                        {resource.projectId?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Assigned To</span>
                      <span className="text-gray-700 text-sm">
                        {resource.assignedTo?.fullName || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                    <span>Start: {formatDate(resource.startDate)}</span>
                    <span>End: {formatDate(resource.endDate)}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(resource)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(resource._id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
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
                        Resource
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilization
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentResources.map((resource, index) => (
                      <motion.tr
                        key={resource._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(resource.type)}
                            <span className="text-gray-800 font-medium">
                              {resource.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getTypeColor(resource.type)}`}
                          >
                            {resource.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {resource.projectId?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {resource.assignedTo?.fullName || "Unassigned"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${getStatusColor(resource.status)}`}
                          >
                            {getStatusIcon(resource.status)}
                            {resource.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-indigo-500 h-1.5 rounded-full"
                                style={{ width: `${resource.utilization}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {resource.utilization}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(resource)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(resource._id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={14} />
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
                {Math.min(indexOfLastItem, filteredResources.length)} of{" "}
                {filteredResources.length} resources
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

      {/* Create/Edit Resource Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingResource ? "Edit Resource" : "Allocate Resource"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingResource
                      ? "Update resource information"
                      : "Add a new resource to a project"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingResource(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={
                  editingResource ? handleUpdateResource : handleCreateResource
                }
                className="p-5 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Resource Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    placeholder="Enter resource name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="human">Human Resource</option>
                    <option value="equipment">Equipment</option>
                    <option value="software">Software</option>
                    <option value="material">Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) =>
                      setFormData({ ...formData, projectId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assigned To
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="">Select User</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Utilization (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.utilization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          utilization: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : editingResource ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingResource(null);
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
              <div className="flex items-center gap-2 p-5 border-b border-gray-200 bg-linear-to-r from-rose-50 to-red-50">
                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Delete Resource
                  </h2>
                  <p className="text-xs text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-gray-600">
                  Are you sure you want to delete this resource? This action
                  cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleDeleteResource(showDeleteConfirm)}
                    className="flex-1 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white py-2.5 rounded-lg transition shadow-sm"
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
    </div>
  );
}
