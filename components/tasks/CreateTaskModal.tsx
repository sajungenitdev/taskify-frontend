"use client";

import { useState, useEffect, useCallback } from "react";
import TaskAssistant from "@/components/AI/TaskAssistant";
import {
  X,
  Calendar,
  Briefcase,
  Flag,
  Hourglass,
  FileText,
  Users,
  AlertTriangle,
  Building2,
  Clock,
  Zap,
  Timer,
  Paperclip,
  Link2,
  FolderKanban,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId?:
    | {
        _id: string;
        name: string;
        code: string;
      }
    | string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  employeeCount: number;
}

interface Project {
  _id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  departmentId?: { _id: string; name: string };
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    revisedDeadline: "",
    priority: "normal",
    estimatedHours: 1,
    actualMinutes: 0,
    isApprovalRequired: false,
    evidenceRequired: false,
    startTime: "",
    endTime: "",
  });

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  // Fetch projects
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

  // Fetch all users
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/auth/users");
      if (response.data.success) {
        const usersData = response.data.data || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      const loadData = async () => {
        await Promise.all([
          fetchDepartments(),
          fetchProjects(),
          fetchAllUsers(),
        ]);
        setIsDataLoaded(true);
      };
      loadData();
    }

    if (!isOpen) {
      setIsDataLoaded(false);
      resetForm();
    }
  }, [isOpen, fetchDepartments, fetchProjects, fetchAllUsers, isDataLoaded]);

  // Filter users by selected department (independent from project)
  useEffect(() => {
    if (selectedDepartment && users.length > 0) {
      const filtered = users.filter((user) => {
        let userDeptId: string | null = null;
        if (user.departmentId) {
          if (
            typeof user.departmentId === "object" &&
            "_id" in user.departmentId
          ) {
            userDeptId = user.departmentId._id;
          } else if (typeof user.departmentId === "string") {
            userDeptId = user.departmentId;
          }
        }
        return userDeptId === selectedDepartment;
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [selectedDepartment, users]);

  // Reset assignee when department changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, assignedTo: "" }));
  }, [selectedDepartment]);

  const handleAddEvidenceUrl = () => {
    if (newUrl && newUrl.trim()) {
      setEvidenceUrls([...evidenceUrls, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const handleRemoveEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.assignedTo ||
      !formData.deadline ||
      !selectedProject ||
      !selectedDepartment
    ) {
      toast.error(
        "Please fill in all required fields including project and department",
      );
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        deadline: formData.deadline,
        projectId: selectedProject,
        departmentId: selectedDepartment,
        revisedDeadline: formData.revisedDeadline || undefined,
        priority: formData.priority,
        estimatedHours: Number(formData.estimatedHours),
        actualMinutes: Number(formData.actualMinutes),
        isApprovalRequired: formData.isApprovalRequired,
        evidenceRequired: formData.evidenceRequired,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
      };

      const response = await api.post("/tasks", taskData);
      if (response.data.success) {
        toast.success("Task created successfully");
        resetForm();
        onTaskCreated();
        onClose();
      }
    } catch (error: any) {
      console.error("Create task error:", error);
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      deadline: "",
      revisedDeadline: "",
      priority: "normal",
      estimatedHours: 1,
      actualMinutes: 0,
      isApprovalRequired: false,
      evidenceRequired: false,
      startTime: "",
      endTime: "",
    });
    setSelectedDepartment("");
    setSelectedProject("");
    setEvidenceUrls([]);
    setNewUrl("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Create New Task
              </h2>
              <p className="text-xs text-slate-400">
                Fill all details to assign a new task
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar"
        >
          {/* Title & Project Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Task Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Project <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name} ({project.code}) - {project.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition resize-none"
              placeholder="Describe the task details..."
              required
            />
          </div>

          <TaskAssistant
            title={formData.title}
            description={formData.description}
            onSuggestion={(field, value) => {
              if (field === "description") {
                setFormData((prev) => ({ ...prev, description: value }));
              } else if (field === "priority") {
                setFormData((prev) => ({ ...prev, priority: value }));
              } else if (field === "estimatedHours") {
                setFormData((prev) => ({ ...prev, estimatedHours: value }));
              }
            }}
          />
          {/* Department & Assign To Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Department <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code}) - {dept.employeeCount} members
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Assign To <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition appearance-none cursor-pointer"
                  required
                  disabled={!selectedDepartment}
                >
                  <option value="">
                    {!selectedDepartment
                      ? "Select department first"
                      : loadingUsers
                        ? "Loading users..."
                        : filteredUsers.length === 0
                          ? "No users in this department"
                          : "Select team member"}
                  </option>
                  {filteredUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName} ({u.email}) - {u.role.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              {selectedDepartment &&
                filteredUsers.length === 0 &&
                !loadingUsers && (
                  <p className="text-xs text-amber-400 mt-1">
                    No users found in this department. Please add users first.
                  </p>
                )}
            </div>
          </div>

          {/* Priority, Estimated Hours, Actual Minutes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Estimated Hours
              </label>
              <div className="relative">
                <Hourglass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedHours: parseFloat(e.target.value),
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                  placeholder="Hours"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Actual Minutes
              </label>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={formData.actualMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actualMinutes: parseInt(e.target.value),
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                  placeholder="Minutes"
                />
              </div>
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                End Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Deadline <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Revised Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={formData.revisedDeadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      revisedDeadline: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                  min={
                    formData.deadline || new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>
          </div>

          {/* Evidence URLs */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Evidence URLs
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-white bg-slate-800/50 border border-slate-700 rounded-lg focus:border-indigo-500 outline-none transition"
                  placeholder="https://example.com/evidence"
                />
              </div>
              <button
                type="button"
                onClick={handleAddEvidenceUrl}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
              >
                Add
              </button>
            </div>
            {evidenceUrls.length > 0 && (
              <div className="space-y-1 mt-2">
                {evidenceUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 truncate flex-1"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidenceUrl(index)}
                      className="text-slate-500 hover:text-rose-400 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggle Options */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Approval Required
                  </p>
                  <p className="text-xs text-slate-400">
                    Task needs manager approval before completion
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    isApprovalRequired: !formData.isApprovalRequired,
                  })
                }
                className={`relative w-10 h-5 rounded-full transition-colors ${formData.isApprovalRequired ? "bg-indigo-500" : "bg-slate-700"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${formData.isApprovalRequired ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800 cursor-pointer hover:bg-slate-800/50 transition">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Evidence Required
                  </p>
                  <p className="text-xs text-slate-400">
                    Submit proof of work upon completion
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    evidenceRequired: !formData.evidenceRequired,
                  })
                }
                className={`relative w-10 h-5 rounded-full transition-colors ${formData.evidenceRequired ? "bg-indigo-500" : "bg-slate-700"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${formData.evidenceRequired ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </div>
              ) : (
                "Create Task"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6);
        }
      `}</style>
    </div>
  );
}
