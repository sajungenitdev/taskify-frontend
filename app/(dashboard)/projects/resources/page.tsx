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
  Users,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Briefcase,
  Clock,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

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
}

export default function ResourcesPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  const canManage = hasRole(["super_admin", "admin", "dept_manager", "project_manager"]);

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
  const handleUpdateResource = async (e: React.FormEvent) =>{
    e.preventDefault();
    if (!editingResource) return;
    setSubmitting(true);
    try {
      const response = await api.put(`/resources/${editingResource._id}`, formData);
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
      case "human": return <Users size={14} />;
      case "equipment": return <Briefcase size={14} />;
      case "software": return <FolderKanban size={14} />;
      default: return <FolderKanban size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: "bg-emerald-500/20 text-emerald-400",
      in_use: "bg-blue-500/20 text-blue-400",
      maintenance: "bg-amber-500/20 text-amber-400",
      retired: "bg-rose-500/20 text-rose-400",
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  const filteredResources = resources.filter((resource) =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResources = filteredResources.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error && resources.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Resources</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchResources}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="w-full mx-auto space-y-6 ps-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/projects" className="text-slate-400 hover:text-white text-sm">Projects</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white text-sm">Resources</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Project Resources</h1>
            <p className="text-slate-400 text-sm mt-1">Manage resources allocated to projects</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingResource(null);
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <Plus size={16} />
              Allocate Resource
            </button>
            <button onClick={fetchResources} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">{resources.length}</p>
            <p className="text-xs text-slate-400">Total Resources</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-emerald-400">{resources.filter(r => r.status === "available").length}</p>
            <p className="text-xs text-slate-400">Available</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-blue-400">{resources.filter(r => r.status === "in_use").length}</p>
            <p className="text-xs text-slate-400">In Use</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">{Math.round(resources.reduce((sum, r) => sum + r.utilization, 0) / (resources.length || 1))}%</p>
            <p className="text-xs text-slate-400">Avg Utilization</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          >
            <option value="">All Types</option>
            <option value="human">Human Resources</option>
            <option value="equipment">Equipment</option>
            <option value="software">Software</option>
            <option value="material">Material</option>
          </select>
        </div>

        {/* Resources Table */}
        {resources.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No resources found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Allocate your first resource →
            </button>
          </div>
        ) : (
          <>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Resource</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Type</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Assigned To</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Project</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Status</th>
                      <th className="text-center px-6 py-3 text-xs text-slate-400 uppercase">Utilization</th>
                      <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentResources.map((resource) => (
                      <tr key={resource._id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{resource.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(resource.type)}
                            <span className="text-slate-300 capitalize">{resource.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {resource.assignedTo?.fullName || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {resource.projectId?.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(resource.status)}`}>
                            {resource.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-indigo-500 h-2 rounded-full"
                                style={{ width: `${resource.utilization}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">{resource.utilization}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 text-slate-400 hover:text-indigo-400 transition">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => openEditModal(resource)} className="p-1.5 text-slate-400 hover:text-blue-400 transition">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => setShowDeleteConfirm(resource._id)} className="p-1.5 text-slate-400 hover:text-rose-400 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Create/Edit Resource Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">{editingResource ? "Edit Resource" : "Allocate Resource"}</h2>
              <button onClick={() => { setShowCreateModal(false); setEditingResource(null); }} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingResource ? handleUpdateResource : handleCreateResource} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Resource Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                >
                  <option value="human">Human Resource</option>
                  <option value="equipment">Equipment</option>
                  <option value="software">Software</option>
                  <option value="material">Material</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Project</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Assigned To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Utilization (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.utilization}
                    onChange={(e) => setFormData({ ...formData, utilization: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingResource ? "Update" : "Create")}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingResource(null); }}
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
              <h2 className="text-lg font-semibold text-white">Delete Resource</h2>
            </div>
            <div className="p-5">
              <p className="text-slate-300">Are you sure you want to delete this resource? This action cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => handleDeleteResource(showDeleteConfirm)} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg transition">
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