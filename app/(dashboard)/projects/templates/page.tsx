"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Copy,
  FileText,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Star,
  Users,
  CheckCircle,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Edit2, Trash2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  taskCount: number;
  usageCount: number;
  isFeatured: boolean;
  tasks: Array<{
    title: string;
    description: string;
    estimatedHours: number;
    priority: string;
  }>;
  createdBy: { _id: string; fullName: string };
  createdAt: string;
}

export default function TemplatesPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Development",
    estimatedDuration: 30,
    taskCount: 10,
    isFeatured: false,
  });

  const canManage = hasRole(["super_admin", "admin"]);

  // Fetch templates from API - NO STATIC FALLBACK
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/templates");
      if (response.data.success) {
        setTemplates(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch templates");
      }
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load templates. Please try again.",
      );
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) {
      fetchTemplates();
    }
  }, [canManage, fetchTemplates]);

  // Create template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/templates", formData);
      if (response.data.success) {
        toast.success("Template created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create template");
    } finally {
      setSubmitting(false);
    }
  };

  // Update template
  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSubmitting(true);
    try {
      const response = await api.put(
        `/templates/${editingTemplate._id}`,
        formData,
      );
      if (response.data.success) {
        toast.success("Template updated successfully");
        setShowEditModal(false);
        setEditingTemplate(null);
        resetForm();
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update template");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (id: string) => {
    try {
      await api.delete(`/templates/${id}`);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete template");
    }
  };

  // Use template to create project
  const handleUseTemplate = async (templateId: string) => {
    try {
      const response = await api.post(`/templates/${templateId}/apply`);
      if (response.data.success) {
        toast.success("Template applied successfully! Creating new project...");
        router.push("/projects/active");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to apply template");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "Development",
      estimatedDuration: 30,
      taskCount: 10,
      isFeatured: false,
    });
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      estimatedDuration: template.estimatedDuration,
      taskCount: template.taskCount,
      isFeatured: template.isFeatured,
    });
    setShowEditModal(true);
  };

  const categories = [
    "Development",
    "Marketing",
    "Product",
    "Design",
    "HR",
    "Finance",
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTemplates = filteredTemplates.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">
            You don't have permission to view this page
          </p>
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

  if (error && templates.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Unable to Load Templates
          </h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchTemplates}
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/projects"
                className="text-slate-400 hover:text-white text-sm"
              >
                Projects
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-white text-sm">Templates</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Project Templates</h1>
            <p className="text-slate-400 text-sm mt-1">
              Pre-built templates to quickly start new projects
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <Plus size={16} />
              Create Template
            </button>
            <button
              onClick={fetchTemplates}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">{templates.length}</p>
            <p className="text-xs text-slate-400">Total Templates</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">
              {templates.reduce((sum, t) => sum + t.usageCount, 0)}
            </p>
            <p className="text-xs text-slate-400">Total Uses</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">
              {templates.filter((t) => t.isFeatured).length}
            </p>
            <p className="text-xs text-slate-400">Featured Templates</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
            <LayoutTemplate className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No templates found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Create your first template →
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentTemplates.map((template) => (
                <div
                  key={template._id}
                  className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 hover:border-indigo-500/30 transition group"
                >
                  {template.isFeatured && (
                    <div className="flex justify-end mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                        <Star size={10} />
                        Featured
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold">
                        {template.name}
                      </h3>
                      <p className="text-slate-500 text-xs">
                        {template.category}
                      </p>
                    </div>
                    <LayoutTemplate className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <FileText size={12} />
                      <span>{template.taskCount} tasks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{template.estimatedDuration} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{template.usageCount} uses</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleUseTemplate(template._id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg transition flex items-center justify-center gap-1"
                    >
                      <Copy size={14} />
                      Use Template
                    </button>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(template)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this template?",
                          )
                        ) {
                          handleDeleteTemplate(template._id);
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                Create Template
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Est. Duration (days)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDuration: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Task Count
                  </label>
                  <input
                    type="number"
                    value={formData.taskCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taskCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isFeatured: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-400">
                      Featured Template
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    "Create Template"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                Edit Template
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateTemplate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Est. Duration (days)
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDuration: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Task Count
                  </label>
                  <input
                    type="number"
                    value={formData.taskCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taskCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isFeatured: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-400">
                      Featured Template
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin mx-auto" />
                  ) : (
                    "Update Template"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h2 className="text-lg font-semibold text-white">
                {selectedTemplate.name}
              </h2>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Category</p>
                  <p className="text-white">{selectedTemplate.category}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Est. Duration</p>
                  <p className="text-white">
                    {selectedTemplate.estimatedDuration} days
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Total Tasks</p>
                  <p className="text-white">{selectedTemplate.taskCount}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Times Used</p>
                  <p className="text-white">{selectedTemplate.usageCount}</p>
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Description</p>
                <p className="text-white text-sm mt-1">
                  {selectedTemplate.description}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleUseTemplate(selectedTemplate._id)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition"
                >
                  Use This Template
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
