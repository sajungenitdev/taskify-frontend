"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Users,
  DollarSign,
  FolderKanban,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: {
    _id: string;
    fullName: string;
    email: string;
  };
  parentDepartment?: {
    _id: string;
    name: string;
    code: string;
  };
  employeeCount: number;
  budget?: {
    allocated: number;
    spent: number;
  };
  assets?: {
    total: number;
    value: number;
  };
  settings?: {
    workStartTime: string;
    workEndTime: string;
    allowRemoteCheckIn: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

export default function AllDepartmentsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const canManage = hasRole(["super_admin", "admin"]);
  const canEdit = hasRole(["super_admin", "admin"]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/departments", formData);
      if (response.data.success) {
        toast.success("Department created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", code: "", description: "" });
        fetchDepartments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create department");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    try {
      const response = await api.put(`/departments/${editingDept._id}`, formData);
      if (response.data.success) {
        toast.success("Department updated successfully");
        setShowCreateModal(false);
        setEditingDept(null);
        setFormData({ name: "", code: "", description: "" });
        fetchDepartments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update department");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/departments/${id}`);
      toast.success("Department deleted successfully");
      setShowDeleteConfirm(null);
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete department");
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartments = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">You don't have permission to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 pe-0">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Departments</h1>
            <p className="text-slate-400 text-sm mt-1">Manage and view all departments in the system</p>
          </div>
          <div className="flex gap-3">
            {canEdit && (
              <button
                onClick={() => {
                  setEditingDept(null);
                  setFormData({ name: "", code: "", description: "" });
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
              >
                <Plus size={16} />
                Add Department
              </button>
            )}
            <button onClick={fetchDepartments} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition">
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
                <p className="text-2xl font-bold text-white">{departments.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Departments</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{departments.reduce((sum, d) => sum + d.employeeCount, 0)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Employees</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  ${departments.reduce((sum, d) => sum + (d.budget?.allocated || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Total Budget</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{departments.reduce((sum, d) => sum + (d.assets?.total || 0), 0)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Assets</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Departments Table */}
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
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Department</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Code</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Head</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase">Members</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">Budget</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">Assets</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentDepartments.map((dept) => (
                      <tr key={dept._id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{dept.name}</p>
                              {dept.description && (
                                <p className="text-slate-500 text-xs line-clamp-1">{dept.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-slate-800 text-slate-300 font-mono">
                            {dept.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {dept.headOfDepartment?.fullName || "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-300">
                          {dept.employeeCount}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-300">
                          ${(dept.budget?.allocated || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-300">
                          {dept.assets?.total || 0}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 text-xs rounded-full ${dept.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {dept.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/departments/${dept._id}`}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 transition"
                            >
                              <Eye size={16} />
                            </Link>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingDept(dept);
                                    setFormData({
                                      name: dept.name,
                                      code: dept.code,
                                      description: dept.description || "",
                                    });
                                    setShowCreateModal(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-blue-400 transition"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(dept._id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredDepartments.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No departments found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">{editingDept ? "Edit Department" : "Create Department"}</h2>
              <button onClick={() => { setShowCreateModal(false); setEditingDept(null); }} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingDept ? handleUpdate : handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Department Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Department Code *</label>
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
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition">
                  {editingDept ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingDept(null); }}
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
              <h2 className="text-lg font-semibold text-white">Delete Department</h2>
            </div>
            <div className="p-5">
              <p className="text-slate-300">Are you sure you want to delete this department? This action cannot be undone.</p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg transition">
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