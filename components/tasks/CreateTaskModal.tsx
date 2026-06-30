"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Calendar,
  Flag,
  Hourglass,
  Users,
  AlertTriangle,
  Building2,
  Clock,
  Timer,
  Paperclip,
  Link2,
  FolderKanban,
  Loader2,
  User as UserIcon,
  Sparkles,
  CheckSquare,
  Zap,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  managerId?:
    | {
        _id: string;
        fullName: string;
        email: string;
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
  const { user } = useAuth();
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
  const [isQuickTask, setIsQuickTask] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
    revisedDeadline: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    estimatedHours: 1,
    actualMinutes: 0,
    isApprovalRequired: false,
    evidenceRequired: false,
    startTime: "",
    endTime: "",
  });

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const isHrManager = user?.role === "hr_manager";
  const isDeptManager = user?.role === "dept_manager";
  const isProjectManager = user?.role === "project_manager";
  const isLineManager = user?.role === "line_manager";
  const isEmployee = user?.role === "employee";

  // Check if user can assign to others
  const canAssignToOthers =
    isSuperAdmin ||
    isAdmin ||
    isHrManager ||
    isDeptManager ||
    isProjectManager ||
    isLineManager;

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

  // Fetch all users with role-based filtering
  // components/CreateTaskModal.tsx - Updated fetchAllUsers

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      // Use the /users endpoint (NOT /auth/users)
      const response = await api.get("/users");
      console.log("Users API Response:", response.data);

      if (response.data.success) {
        const usersData = response.data.data || [];

        // The backend already filters based on role,
        // but we can do additional filtering if needed
        let filtered: User[] = usersData;

        // Additional frontend filtering if needed
        if (isDeptManager) {
          const managerDeptId =
            user?.departmentId?._id?.toString() ||
            user?.departmentId?.toString();
          filtered = usersData.filter((u: User) => {
            if (u.role === "super_admin") return false;
            const userDeptId =
              u.departmentId?._id?.toString() || u.departmentId?.toString();
            return userDeptId === managerDeptId;
          });
        } else if (isLineManager) {
          filtered = usersData.filter((u: User) => {
            if (u.role === "super_admin") return false;
            const managerId =
              u.managerId?._id?.toString() || u.managerId?.toString();
            return managerId === user?._id;
          });
        } else if (isEmployee) {
          filtered = usersData.filter((u: User) => u._id === user?._id);
        }

        setUsers(filtered);
        setFilteredUsers(filtered);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [user, isDeptManager, isLineManager, isEmployee]);

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

  // Filter users by selected department
  useEffect(() => {
    if (selectedDepartment && users.length > 0) {
      const filtered = users.filter((u) => {
        let userDeptId: string | null = null;
        if (u.departmentId) {
          if (typeof u.departmentId === "object" && "_id" in u.departmentId) {
            userDeptId = u.departmentId._id;
          } else if (typeof u.departmentId === "string") {
            userDeptId = u.departmentId;
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

  // Handle quick task toggle
  useEffect(() => {
    if (isQuickTask && user) {
      setFormData((prev) => ({ ...prev, assignedTo: user._id }));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData((prev) => ({
        ...prev,
        deadline: tomorrow.toISOString().split("T")[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        assignedTo: "",
        deadline: "",
      }));
    }
  }, [isQuickTask, user]);

  const handleAddEvidenceUrl = () => {
    if (newUrl && newUrl.trim()) {
      setEvidenceUrls([...evidenceUrls, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const handleRemoveEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  // Create a default project
  const createDefaultProject = async (
    departmentId: string,
  ): Promise<string | null> => {
    try {
      setIsCreatingProject(true);
      const response = await api.post("/projects", {
        name: "General Tasks",
        code: "GEN",
        description: "Default project for general tasks",
        status: "active",
        departmentId: departmentId,
      });
      if (response.data.success) {
        const newProject = response.data.data;
        setProjects((prev) => [...prev, newProject]);
        return newProject._id;
      }
      return null;
    } catch (error) {
      console.error("Error creating default project:", error);
      return null;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a task description");
      return;
    }

    let finalAssignedTo = formData.assignedTo;
    let finalDepartment = selectedDepartment;
    let finalDeadline = formData.deadline;
    let finalProjectId = selectedProject;

    if (isQuickTask) {
      if (!user?._id) {
        toast.error("User not found");
        return;
      }
      finalAssignedTo = user._id;

      if (!selectedDepartment) {
        const userDept = users.find((u) => u._id === user._id)?.departmentId;
        if (userDept) {
          finalDepartment =
            typeof userDept === "object" ? userDept._id : userDept;
        } else if (departments.length > 0) {
          finalDepartment = departments[0]._id;
        } else {
          toast.error("No department available");
          return;
        }
      }

      if (!finalDeadline) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        finalDeadline = tomorrow.toISOString().split("T")[0];
      }
    } else {
      if (!formData.assignedTo) {
        toast.error("Please assign the task to someone");
        return;
      }
      if (!selectedDepartment) {
        toast.error("Please select a department");
        return;
      }
      if (!formData.deadline) {
        toast.error("Please set a deadline");
        return;
      }

      // Additional validation for role-based assignment
      if (!canAssignToOthers && formData.assignedTo !== user?._id) {
        toast.error("You can only assign tasks to yourself");
        return;
      }

      // Department Manager: Check if assigned user is in their department
      if (isDeptManager) {
        const assignedUser = users.find((u) => u._id === formData.assignedTo);
        if (assignedUser) {
          const assignedUserDept =
            assignedUser.departmentId?._id?.toString() ||
            assignedUser.departmentId?.toString();
          const managerDept =
            user?.departmentId?._id?.toString() ||
            user?.departmentId?.toString();
          if (assignedUserDept !== managerDept) {
            toast.error(
              "You can only assign tasks to users in your department",
            );
            return;
          }
        }
      }

      // Line Manager: Check if assigned user is a direct report
      if (isLineManager) {
        const assignedUser = users.find((u) => u._id === formData.assignedTo);
        if (assignedUser) {
          const managerId =
            assignedUser.managerId?._id?.toString() ||
            assignedUser.managerId?.toString();
          if (managerId !== user?._id) {
            toast.error("You can only assign tasks to your direct reports");
            return;
          }
        }
      }
    }

    // Always ensure we have a projectId
    if (!finalProjectId) {
      const deptProject = projects.find(
        (p) =>
          p.departmentId &&
          typeof p.departmentId === "object" &&
          "_id" in p.departmentId &&
          p.departmentId._id === finalDepartment,
      );
      if (deptProject) {
        finalProjectId = deptProject._id;
      }
    }

    if (!finalProjectId) {
      toast.loading("Creating default project...", { id: "create-project" });
      const newProjectId = await createDefaultProject(finalDepartment);
      toast.dismiss("create-project");

      if (newProjectId) {
        finalProjectId = newProjectId;
        toast.success("Default project created");
      } else {
        toast.error(
          "Failed to create default project. Please create a project first.",
        );
        return;
      }
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: finalAssignedTo,
        deadline: finalDeadline,
        projectId: finalProjectId,
        departmentId: finalDepartment,
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
        toast.success("Task created successfully! 🎉");
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
    setIsQuickTask(false);
  };

  if (!isOpen) return null;

  const getAvailableUsers = () => {
    // Super Admin, Admin, HR can see all filtered users
    if (isSuperAdmin || isAdmin || isHrManager) {
      return filteredUsers;
    }

    // Department Manager: Only see users in their department
    if (isDeptManager) {
      const managerDeptId =
        user?.departmentId?._id?.toString() || user?.departmentId?.toString();
      return filteredUsers.filter((u) => {
        // Don't show super admins
        if (u.role === "super_admin") return false;
        // Don't show self if not allowed
        if (!canAssignToOthers && u._id === user?._id) return false;

        const userDeptId =
          u.departmentId?._id?.toString() || u.departmentId?.toString();
        return userDeptId === managerDeptId;
      });
    }

    // Project Manager: Show project team members
    if (isProjectManager) {
      return filteredUsers.filter((u) => {
        if (u.role === "super_admin") return false;
        return true;
      });
    }

    // Line Manager: Show direct reports
    if (isLineManager) {
      return filteredUsers.filter((u) => {
        if (u.role === "super_admin") return false;
        const managerId =
          u.managerId?._id?.toString() || u.managerId?.toString();
        return managerId === user?._id;
      });
    }

    // Employee: Only show themselves
    if (isEmployee) {
      return filteredUsers.filter((u) => u._id === user?._id);
    }

    return filteredUsers;
  };

  const availableUsers = getAvailableUsers();

  // Toggle switch component
  const ToggleSwitch = ({
    enabled,
    onToggle,
    size = "md",
  }: {
    enabled: boolean;
    onToggle: () => void;
    size?: "sm" | "md" | "lg";
  }) => {
    const sizes = {
      sm: { container: "w-8 h-4", dot: "w-3 h-3", translate: "translate-x-4" },
      md: { container: "w-11 h-6", dot: "w-5 h-5", translate: "translate-x-5" },
      lg: { container: "w-14 h-7", dot: "w-6 h-6", translate: "translate-x-7" },
    };

    const sizeConfig = sizes[size] || sizes.md;

    return (
      <button
        type="button"
        onClick={onToggle}
        className={`
          relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
          ${sizeConfig.container}
          ${enabled ? "bg-indigo-600" : "bg-gray-300"}
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        `}
      >
        <span
          className={`
            inline-block transform rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out
            ${sizeConfig.dot}
            ${enabled ? sizeConfig.translate : "translate-x-0.5"}
          `}
        />
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Create New Task
              </h2>
              <p className="text-xs text-gray-500">
                Fill all details to assign a new task
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Task Toggle - Hide for Department Managers */}
        {(isSuperAdmin || isAdmin || isEmployee) && (
          <div className="px-5 pt-5 pb-0">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Quick Task
                  </p>
                  <p className="text-xs text-gray-500">
                    Auto-assign to yourself and simplify the form
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={isQuickTask}
                onToggle={() => setIsQuickTask(!isQuickTask)}
                size="md"
              />
            </div>
            {isQuickTask && (
              <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1 animate-fade-in">
                <CheckSquare className="w-3 h-3" />
                Task will be assigned to you with default settings
              </p>
            )}
          </div>
        )}

        {/* Role Info Banner for Department Managers */}
        {isDeptManager && (
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-700">
                You can assign tasks to users in your department only.
              </p>
            </div>
          </div>
        )}

        {isLineManager && (
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <Users className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-700">
                You can assign tasks to your direct reports only.
              </p>
            </div>
          </div>
        )}

        {isEmployee && (
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
              <UserIcon className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-amber-700">
                You can only create tasks for yourself.
              </p>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar"
        >
          {/* Title & Project Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Project{" "}
                <span className="text-gray-400 text-xs">
                  (Auto-assigned if empty)
                </span>
              </label>
              <div className="relative">
                <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer"
                >
                  <option value="">Auto-assign Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name} ({project.code})
                    </option>
                  ))}
                </select>
              </div>
              {isCreatingProject && (
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Creating default project...
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none placeholder:text-gray-400"
              placeholder="Describe the task details..."
              required
            />
          </div>

          {/* Department & Assign To Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Department{" "}
                {!isQuickTask && <span className="text-rose-500">*</span>}
                {isQuickTask && (
                  <span className="text-gray-400 text-xs">
                    {" "}
                    (Auto-assigned)
                  </span>
                )}
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer"
                  required={!isQuickTask}
                  disabled={isQuickTask}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Assign To{" "}
                {!isQuickTask && <span className="text-rose-500">*</span>}
                {isQuickTask && (
                  <span className="text-gray-400 text-xs"> (You)</span>
                )}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer"
                  required={!isQuickTask}
                  disabled={isQuickTask || (!canAssignToOthers && !isQuickTask)}
                >
                  <option value="">
                    {!selectedDepartment && !isQuickTask
                      ? "Select department first"
                      : loadingUsers
                        ? "Loading users..."
                        : availableUsers.length === 0
                          ? isDeptManager
                            ? "No users in your department"
                            : isLineManager
                              ? "No direct reports found"
                              : "No users available"
                          : "Select team member"}
                  </option>
                  {availableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName} ({u.email}) - {u.role.replace(/_/g, " ")}
                      {u._id === user?._id && " (You)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role-based info messages */}
              {!isQuickTask && !canAssignToOthers && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  You can only assign tasks to yourself
                </p>
              )}

              {!isQuickTask && isDeptManager && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  You can assign tasks to users in your department
                </p>
              )}

              {!isQuickTask && isLineManager && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  You can assign tasks to your direct reports
                </p>
              )}

              {!isQuickTask && (isSuperAdmin || isAdmin || isHrManager) && (
                <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  You can assign tasks to anyone in the system
                </p>
              )}

              {selectedDepartment &&
                availableUsers.length === 0 &&
                !loadingUsers &&
                !isQuickTask && (
                  <p className="text-xs text-amber-500 mt-1">
                    {isDeptManager
                      ? "No users available in your department."
                      : isLineManager
                        ? "No direct reports found."
                        : "No users available in this department."}
                  </p>
                )}
            </div>
          </div>

          {/* Priority, Estimated Hours, Actual Minutes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as
                        | "low"
                        | "normal"
                        | "high"
                        | "urgent",
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Estimated Hours
              </label>
              <div className="relative">
                <Hourglass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedHours: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                  placeholder="Hours"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Actual Minutes
              </label>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={formData.actualMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actualMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                  placeholder="Minutes"
                />
              </div>
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                End Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Deadline{" "}
                {!isQuickTask && <span className="text-rose-500">*</span>}
                {isQuickTask && (
                  <span className="text-gray-400 text-xs"> (Auto-set)</span>
                )}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required={!isQuickTask}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={isQuickTask}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Revised Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.revisedDeadline}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      revisedDeadline: e.target.value,
                    })
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  min={
                    formData.deadline || new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>
          </div>

          {/* Evidence URLs */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Evidence URLs
              {formData.evidenceRequired && (
                <span className="text-xs text-amber-600 font-medium ml-2">
                  (Required for submission)
                </span>
              )}
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                  placeholder="https://example.com/evidence"
                />
              </div>
              <button
                type="button"
                onClick={handleAddEvidenceUrl}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition shadow-sm"
              >
                Add
              </button>
            </div>
            {evidenceUrls.length > 0 && (
              <div className="space-y-1 mt-2">
                {evidenceUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:text-indigo-800 truncate flex-1"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidenceUrl(index)}
                      className="text-gray-400 hover:text-rose-500 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggle Options */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Approval Required
                  </p>
                  <p className="text-xs text-gray-500">
                    Task needs manager approval before completion
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={formData.isApprovalRequired}
                onToggle={() =>
                  setFormData({
                    ...formData,
                    isApprovalRequired: !formData.isApprovalRequired,
                  })
                }
                size="md"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Paperclip className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Evidence Required
                  </p>
                  <p className="text-xs text-gray-500">
                    Submit proof of work upon completion
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={formData.evidenceRequired}
                onToggle={() =>
                  setFormData({
                    ...formData,
                    evidenceRequired: !formData.evidenceRequired,
                  })
                }
                size="md"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || isCreatingProject}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isCreatingProject ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {isCreatingProject
                    ? "Creating Project..."
                    : "Creating Task..."}
                </div>
              ) : (
                "Create Task"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-all"
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
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c4c4c4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}
