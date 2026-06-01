"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Plus,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Play,
  Pause,
  Copy,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Zap,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Activity,
  Mail,
  MessageSquare,
  Tag,
  Filter,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Workflow {
  _id: string;
  name: string;
  description: string;
  trigger: {
    type: "task_created" | "task_completed" | "deadline_approaching" | "status_changed" | "user_joined" | "custom";
    condition?: string;
  };
  actions: Array<{
    type: "send_email" | "send_notification" | "assign_task" | "update_status" | "webhook" | "create_task";
    config: any;
  }>;
  status: "active" | "inactive" | "draft";
  executionCount: number;
  lastExecuted?: string;
  createdBy: { _id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  category: "task" | "approval" | "notification" | "automation";
  priority: "low" | "normal" | "high";
}

export default function WorkflowsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "automation",
    priority: "normal",
    triggerType: "task_created",
    triggerCondition: "",
    actionType: "send_notification",
    actionConfig: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const canManage = hasRole(["super_admin", "admin"]);

  // Fetch workflows from API
  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/workflows");
      if (response.data.success) {
        setWorkflows(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch workflows");
      }
    } catch (error: any) {
      console.error("Error fetching workflows:", error);
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view workflows");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch workflows");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) {
      fetchWorkflows();
    }
  }, [canManage, fetchWorkflows]);

  // Toggle workflow status
  const handleToggleStatus = async (workflowId: string, currentStatus: string) => {
    try {
      const response = await api.patch(`/workflows/${workflowId}/toggle`);
      if (response.data.success) {
        toast.success(`Workflow ${response.data.data.status === "active" ? "activated" : "deactivated"}`);
        fetchWorkflows();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to toggle workflow status");
    }
  };

  // Delete workflow
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/workflows/${id}`);
      toast.success("Workflow deleted successfully");
      setShowDeleteConfirm(null);
      fetchWorkflows();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete workflow");
    }
  };

  // Duplicate workflow
  const handleDuplicate = async (workflow: Workflow) => {
    try {
      const response = await api.post(`/workflows/${workflow._id}/duplicate`);
      if (response.data.success) {
        toast.success(`"${workflow.name}" duplicated successfully`);
        fetchWorkflows();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to duplicate workflow");
    }
  };

  // Create workflow
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        trigger: {
          type: formData.triggerType,
          condition: formData.triggerCondition || undefined,
        },
        actions: [{
          type: formData.actionType,
          config: { message: formData.actionConfig || "Workflow triggered" },
        }],
      };
      
      const response = await api.post("/workflows", payload);
      if (response.data.success) {
        toast.success("Workflow created successfully");
        setShowCreateModal(false);
        resetForm();
        fetchWorkflows();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create workflow");
    } finally {
      setSubmitting(false);
    }
  };

  // Update workflow
  const handleUpdateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkflow) return;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
      };
      
      const response = await api.put(`/workflows/${editingWorkflow._id}`, payload);
      if (response.data.success) {
        toast.success("Workflow updated successfully");
        setShowEditModal(false);
        setEditingWorkflow(null);
        resetForm();
        fetchWorkflows();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update workflow");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "automation",
      priority: "normal",
      triggerType: "task_created",
      triggerCondition: "",
      actionType: "send_notification",
      actionConfig: "",
    });
  };

  const openEditModal = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || "",
      category: workflow.category,
      priority: workflow.priority,
      triggerType: workflow.trigger.type,
      triggerCondition: workflow.trigger.condition || "",
      actionType: workflow.actions[0]?.type || "send_notification",
      actionConfig: workflow.actions[0]?.config?.message || "",
    });
    setShowEditModal(true);
  };

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === "active").length,
    inactive: workflows.filter(w => w.status === "inactive").length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executionCount, 0),
  };

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || workflow.category === selectedCategory;
    const matchesStatus = !selectedStatus || workflow.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentWorkflows = filteredWorkflows.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-emerald-500/20 text-emerald-400",
      inactive: "bg-rose-500/20 text-rose-400",
      draft: "bg-amber-500/20 text-amber-400",
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "task": return <FileText size={14} />;
      case "approval": return <CheckCircle size={14} />;
      case "notification": return <Bell size={14} />;
      case "automation": return <Zap size={14} />;
      default: return <Layers size={14} />;
    }
  };

  const categories = [
    { id: "all", label: "All", icon: Layers },
    { id: "task", label: "Task", icon: FileText },
    { id: "approval", label: "Approval", icon: CheckCircle },
    { id: "notification", label: "Notification", icon: Bell },
    { id: "automation", label: "Automation", icon: Zap },
  ];

  const triggerTypes = [
    { value: "task_created", label: "Task Created" },
    { value: "task_completed", label: "Task Completed" },
    { value: "deadline_approaching", label: "Deadline Approaching" },
    { value: "status_changed", label: "Status Changed" },
    { value: "user_joined", label: "User Joined" },
    { value: "custom", label: "Custom" },
  ];

  const actionTypes = [
    { value: "send_email", label: "Send Email" },
    { value: "send_notification", label: "Send Notification" },
    { value: "assign_task", label: "Assign Task" },
    { value: "update_status", label: "Update Status" },
    { value: "webhook", label: "Webhook" },
    { value: "create_task", label: "Create Task" },
  ];

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">You need administrator privileges to access this page</p>
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
            <h1 className="text-2xl font-bold text-white">Workflow Builder</h1>
            <p className="text-slate-400 text-sm mt-1">Create and manage automation workflows</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <Plus size={16} />
              Create Workflow
            </button>
            <button onClick={fetchWorkflows} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition">
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
                <p className="text-xs text-slate-400 mt-0.5">Total Workflows</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
                <p className="text-xs text-slate-400 mt-0.5">Active</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-rose-400">{stats.inactive}</p>
                <p className="text-xs text-slate-400 mt-0.5">Inactive</p>
              </div>
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <Pause className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalExecutions.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Executions</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === "all" ? "" : cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                (!selectedCategory && cat.id === "all") || selectedCategory === cat.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedStatus("");
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            <X size={16} />
            Reset
          </button>
        </div>

        {/* Workflows Table */}
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
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Workflow</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Trigger</th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">Actions</th>
                      <th className="text-center px-6 py-3 text-xs text-slate-400 uppercase">Executions</th>
                      <th className="text-center px-6 py-3 text-xs text-slate-400 uppercase">Status</th>
                      <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentWorkflows.map((workflow) => (
                      <tr key={workflow._id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(workflow.category)}
                              <p className="text-white font-medium">{workflow.name}</p>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">{workflow.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-300 bg-slate-800/50 px-2 py-1 rounded-full">
                            {workflow.trigger.type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {workflow.actions.map((action, idx) => (
                              <span key={idx} className="text-xs text-slate-400">
                                {action.type.replace("_", " ")}
                                {idx < workflow.actions.length - 1 && " → "}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-300">
                          {workflow.executionCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(workflow._id, workflow.status)}
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}
                          >
                            {workflow.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedWorkflow(workflow)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 transition"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(workflow)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 transition"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(workflow)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 transition"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(workflow._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition"
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
              {filteredWorkflows.length === 0 && (
                <div className="text-center py-12">
                  <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No workflows found</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    Create your first workflow →
                  </button>
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

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h2 className="text-lg font-semibold text-white">Create Workflow</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateWorkflow} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Workflow Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="automation">Automation</option>
                    <option value="notification">Notification</option>
                    <option value="approval">Approval</option>
                    <option value="task">Task</option>
                  </select>
                </div>
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
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Trigger Type</label>
                  <select
                    value={formData.triggerType}
                    onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    {triggerTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Trigger Condition</label>
                  <input
                    type="text"
                    value={formData.triggerCondition}
                    onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })}
                    placeholder="e.g., priority = high"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Action Type</label>
                  <select
                    value={formData.actionType}
                    onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    {actionTypes.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Action Config</label>
                  <input
                    type="text"
                    value={formData.actionConfig}
                    onChange={(e) => setFormData({ ...formData, actionConfig: e.target.value })}
                    placeholder="e.g., Notification message"
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
                  {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Workflow"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workflow Modal */}
      {showEditModal && editingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Edit Workflow</h2>
              <button onClick={() => { setShowEditModal(false); setEditingWorkflow(null); }} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateWorkflow} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Workflow Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <label className="block text-sm text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="automation">Automation</option>
                    <option value="notification">Notification</option>
                    <option value="approval">Approval</option>
                    <option value="task">Task</option>
                  </select>
                </div>
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
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Update Workflow"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingWorkflow(null); }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Details Modal */}
      {selectedWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h2 className="text-lg font-semibold text-white">{selectedWorkflow.name}</h2>
              <button onClick={() => setSelectedWorkflow(null)} className="text-slate-500 hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Category</p>
                  <p className="text-white capitalize mt-1">{selectedWorkflow.category}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Priority</p>
                  <p className="text-white capitalize mt-1">{selectedWorkflow.priority}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Trigger</p>
                  <p className="text-white text-sm mt-1">{selectedWorkflow.trigger.type.replace("_", " ")}</p>
                  {selectedWorkflow.trigger.condition && (
                    <p className="text-xs text-slate-400 mt-1">Condition: {selectedWorkflow.trigger.condition}</p>
                  )}
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Actions</p>
                  {selectedWorkflow.actions.map((action, idx) => (
                    <p key={idx} className="text-white text-sm mt-1">{action.type.replace("_", " ")}</p>
                  ))}
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Execution Count</p>
                  <p className="text-white mt-1">{selectedWorkflow.executionCount.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Last Executed</p>
                  <p className="text-white mt-1">{selectedWorkflow.lastExecuted ? new Date(selectedWorkflow.lastExecuted).toLocaleString() : "Never"}</p>
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Description</p>
                <p className="text-white text-sm mt-1">{selectedWorkflow.description}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedWorkflow(null);
                    openEditModal(selectedWorkflow);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition"
                >
                  Edit Workflow
                </button>
                <button onClick={() => setSelectedWorkflow(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Delete Workflow</h2>
            </div>
            <div className="p-5">
              <p className="text-slate-300">Are you sure you want to delete this workflow? This action cannot be undone.</p>
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

// Add missing import
import { Edit2, Trash2 } from "lucide-react";