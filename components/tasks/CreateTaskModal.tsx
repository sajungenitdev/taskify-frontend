// components/tasks/CreateTaskModal.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Gauge,
  AlertCircle,
  Diamond,
  GitBranch,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// ============ TYPE DEFINITIONS ============
interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  department?:
  | {
    _id: string;
    name: string;
    code: string;
  }
  | string
  | null;
  departmentId?:
  | {
    _id: string;
    name: string;
    code: string;
  }
  | string
  | null;
  managerId?:
  | {
    _id: string;
    fullName: string;
    email: string;
  }
  | string;
  profilePhoto?: string;
  avatar?: string;
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

interface WorkloadInfo {
  userId: string;
  capacityPercentage: number;
  statusColor: "green" | "amber" | "red";
  activeHours: number;
  taskCount: number;
  monthlyCapacity: number;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  isMilestone?: boolean;
  parentTaskId?: string | null;
  projectId?: string | { _id: string; name: string } | null;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

// ============ TYPE GUARDS ============
const isDepartmentObject = (
  dept: string | { _id: string; name: string; code: string } | null | undefined,
): dept is { _id: string; name: string; code: string } => {
  return typeof dept === "object" && dept !== null && "_id" in dept;
};

const isManagerObject = (
  manager:
    | string
    | { _id: string; fullName: string; email: string }
    | undefined,
): manager is { _id: string; fullName: string; email: string } => {
  return typeof manager === "object" && manager !== null && "_id" in manager;
};

// ============ HELPER FUNCTIONS ============
const getDepartmentId = (user: User | null | undefined): string | null => {
  if (!user) return null;

  if (user.department) {
    if (isDepartmentObject(user.department)) {
      return user.department._id;
    }
    if (typeof user.department === "string") {
      return user.department;
    }
  }

  if (user.departmentId) {
    if (isDepartmentObject(user.departmentId)) {
      return user.departmentId._id;
    }
    if (typeof user.departmentId === "string") {
      return user.departmentId;
    }
  }

  return null;
};

const getManagerId = (user: User | null | undefined): string | null => {
  if (!user) return null;
  if (!user.managerId) return null;
  if (isManagerObject(user.managerId)) {
    return user.managerId._id;
  }
  return user.managerId;
};

// ============ TOAST HELPER ============
const showInfoToast = (message: string) => {
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-blue-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <AlertCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-blue-700">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-blue-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  ));
};

// ============ TOGGLE SWITCH COMPONENT ============
const ToggleSwitch = ({
  enabled,
  onToggle,
  size = "md",
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
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
      disabled={disabled}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
        ${sizeConfig.container}
        ${enabled ? "bg-indigo-600" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
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

// ============ WORKLOAD BADGE COMPONENT ============
const WorkloadBadge = ({
  user,
  workloadData
}: {
  user: User | null;
  workloadData: Record<string, WorkloadInfo>;
}) => {
  if (!user) return null;

  const getWorkloadStatus = (userId: string) => {
    const workload = workloadData[userId];
    if (!workload) return null;

    const statusConfig = {
      green: {
        label: "Good Capacity",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: <CheckSquare className="w-4 h-4 text-emerald-500" />,
      },
      amber: {
        label: "Near Full",
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      },
      red: {
        label: "Over Capacity",
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      },
    };

    return {
      ...workload,
      status: statusConfig[workload.statusColor],
    };
  };

  const workload = getWorkloadStatus(user._id);
  if (!workload) {
    return (
      <div className="mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500">Workload data not available</p>
      </div>
    );
  }

  return (
    <div
      className={`mt-1.5 p-2 rounded-lg border ${workload.status.bg} ${workload.status.border}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {workload.status.icon}
          <span className={`text-xs font-medium ${workload.status.color}`}>
            {workload.status.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {workload.activeHours}h / {workload.monthlyCapacity}h
          </span>
          <span className={`text-xs font-bold ${workload.status.color}`}>
            {workload.capacityPercentage}%
          </span>
        </div>
      </div>
      <div className="mt-1.5 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${workload.statusColor === "red"
            ? "bg-red-500"
            : workload.statusColor === "amber"
              ? "bg-amber-500"
              : "bg-emerald-500"
            }`}
          style={{ width: `${Math.min(workload.capacityPercentage, 100)}%` }}
        />
      </div>
      {workload.statusColor === "red" && (
        <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Overloaded! Assigning more tasks may cause burnout.
        </p>
      )}
      {workload.statusColor === "amber" && (
        <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Near capacity. Consider workload distribution.
        </p>
      )}
    </div>
  );
};

// ============ MAIN COMPONENT ============
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
  const [workloadData, setWorkloadData] = useState<
    Record<string, WorkloadInfo>
  >({});

  // Milestone & Sub-task states
  const [isMilestone, setIsMilestone] = useState(false);
  const [isSubTask, setIsSubTask] = useState(false);
  const [parentTaskId, setParentTaskId] = useState("");
  const [availableParentTasks, setAvailableParentTasks] = useState<Task[]>([]);
  const [loadingParentTasks, setLoadingParentTasks] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    deadline: "",
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

  const canAssignToOthers =
    isSuperAdmin ||
    isAdmin ||
    isHrManager ||
    isDeptManager ||
    isProjectManager ||
    isLineManager;

  const canViewWorkload = useMemo(() => {
    return isSuperAdmin || isAdmin || isHrManager || isDeptManager || isLineManager || isProjectManager;
  }, [isSuperAdmin, isAdmin, isHrManager, isDeptManager, isLineManager, isProjectManager]);

  // ============ FETCH WORKLOAD DATA ============
  const fetchWorkloadData = useCallback(async (usersList: User[]) => {
    if (!canViewWorkload || !usersList || usersList.length === 0) {
      setWorkloadData({});
      return;
    }

    try {
      const response = await api.get("/workload/capacity");
      if (response.data.success) {
        const workloadMap: Record<string, WorkloadInfo> = {};
        response.data.data.forEach((item: any) => {
          workloadMap[item.user._id] = {
            userId: item.user._id,
            capacityPercentage: item.workload.capacityPercentage,
            statusColor: item.workload.statusColor,
            activeHours: item.workload.activeHours,
            taskCount: item.workload.taskCount,
            monthlyCapacity: item.workload.monthlyCapacity,
          };
        });
        setWorkloadData(workloadMap);
      }
    } catch (error: any) {
      if (error?.response?.status !== 403) {
        console.error("Error fetching workload data:", error);
      }
      setWorkloadData({});
    }
  }, [canViewWorkload]);

  // ============ API CALLS ============
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

  const fetchParentTasks = useCallback(async () => {
    // 🆕 যদি ইতিমধ্যে tasks লোড হয়ে থাকে এবং সেগুলো খালি না হয়, তাহলে আবার fetch করবেন না
    if (availableParentTasks.length > 0 && !loadingParentTasks) {
      console.log("✅ Tasks already loaded, skipping fetch");
      return;
    }

    if (!isSubTask) {
      setAvailableParentTasks([]);
      return;
    }

    try {
      setLoadingParentTasks(true);
      console.log("🔍 Fetching parent tasks...");

      const response = await api.get('/tasks');

      if (response.data.success) {
        const allTasks = response.data.data || [];

        let tasks = allTasks.filter((t: any) => {
          const isValidStatus = t.status === 'pending' || t.status === 'in_progress';
          if (!isValidStatus) return false;
          if (t.isMilestone === true) return false;
          if (t._id === parentTaskId) return false;
          return true;
        });

        if (selectedProject) {
          tasks = tasks.filter((t: any) => {
            const pid = typeof t.projectId === 'object' ? t.projectId?._id : t.projectId;
            return pid === selectedProject;
          });
        }

        console.log(`✅ Available parent tasks: ${tasks.length}`);
        setAvailableParentTasks(tasks);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("Failed to load parent tasks");
    } finally {
      setLoadingParentTasks(false);
    }
  }, [selectedProject, isSubTask, parentTaskId, availableParentTasks.length, loadingParentTasks]);

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);

      let endpoint = "/users";

      if (isProjectManager) {
        const deptId = getDepartmentId(user);
        if (deptId) {
          endpoint = `/users/department/${deptId}`;
        }
      }

      const response = await api.get(endpoint);

      if (response.data.success) {
        const usersData = response.data.data || [];

        let filtered: User[] = usersData;

        if (isProjectManager) {
          const managerDeptId = getDepartmentId(user);
          if (managerDeptId) {
            filtered = usersData.filter((u: User) => {
              if (u.role === "super_admin") return false;
              const userDeptId = getDepartmentId(u);
              const userDeptName = getDepartmentName(u);
              const managerDeptName = getDepartmentName(user);
              return userDeptId === managerDeptId ||
                (userDeptName && managerDeptName && userDeptName === managerDeptName);
            });
          } else {
            filtered = usersData.filter((u: User) => u.role !== "super_admin");
          }
        } else if (isDeptManager) {
          const managerDeptId = getDepartmentId(user);
          filtered = usersData.filter((u: User) => {
            if (u.role === "super_admin") return false;
            const userDeptId = getDepartmentId(u);
            return userDeptId === managerDeptId;
          });
        } else if (isLineManager) {
          filtered = usersData.filter((u: User) => {
            if (u.role === "super_admin") return false;
            const userManagerId = getManagerId(u);
            return userManagerId === user?._id;
          });
        } else if (isEmployee) {
          filtered = usersData.filter((u: User) => u._id === user?._id);
        }

        setUsers(filtered);
        setFilteredUsers(filtered);

        if (canViewWorkload) {
          await fetchWorkloadData(filtered);
        } else {
          setWorkloadData({});
        }
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, [user, isProjectManager, isDeptManager, isLineManager, isEmployee, canViewWorkload, fetchWorkloadData]);

  const getDepartmentName = (user: User | null | undefined): string | null => {
    if (!user) return null;

    if (user.department) {
      if (isDepartmentObject(user.department)) {
        return user.department.name;
      }
    }

    if (user.departmentId) {
      if (isDepartmentObject(user.departmentId)) {
        return user.departmentId.name;
      }
    }

    return null;
  };

  // ============ EFFECTS ============
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

  // 🆕 শুধু Sub-task টগল অন করলে বা Project পরিবর্তন হলে fetch করবে
  useEffect(() => {
    if (isSubTask) {
      if (availableParentTasks.length === 0) {
        fetchParentTasks();
      }
    } else {
      setAvailableParentTasks([]);
      setParentTaskId("");
    }
  }, [isSubTask, selectedProject]); // 🆕 fetchParentTasks dependency সরিয়ে দিন

  // 🆕 Auto-detect deadline from end time
  useEffect(() => {
    if (formData.endTime) {
      const endDate = new Date(formData.endTime);
      if (!isNaN(endDate.getTime())) {
        const deadlineStr = endDate.toISOString().split('T')[0];
        setFormData(prev => ({
          ...prev,
          deadline: deadlineStr
        }));
      }
    }
  }, [formData.endTime]);

  // ============ AUTO-SELECT DEPARTMENT FOR PROJECT MANAGER ============
  useEffect(() => {
    if (isProjectManager && user && isOpen) {
      const deptId = getDepartmentId(user);
      if (deptId) {
        setSelectedDepartment(deptId);
      } else {
        const deptName = getDepartmentName(user);
        if (deptName) {
          const dept = departments.find(d => d.name === deptName);
          if (dept) {
            setSelectedDepartment(dept._id);
          }
        }
      }
    }
  }, [isProjectManager, user, isOpen, departments]);

  // Filter users by selected department
  const filteredUsersByDepartment = useMemo(() => {
    if (isProjectManager && selectedDepartment) {
      const filtered = users.filter((u) => {
        const userDeptId = getDepartmentId(u);
        const userDeptName = getDepartmentName(u);
        const selectedDept = departments.find(d => d._id === selectedDepartment);
        return userDeptId === selectedDepartment ||
          (userDeptName && selectedDept && userDeptName === selectedDept.name);
      });
      return filtered;
    }

    if (selectedDepartment && users.length > 0) {
      return users.filter((u) => {
        const userDeptId = getDepartmentId(u);
        return userDeptId === selectedDepartment;
      });
    }
    return users;
  }, [selectedDepartment, users, isProjectManager, departments]);

  useEffect(() => {
    setFilteredUsers(filteredUsersByDepartment);
  }, [filteredUsersByDepartment]);

  // Handle department change
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartment(deptId);
    setFormData((prev) => ({ ...prev, assignedTo: "" }));
  };

  // Update workload when assignee changes
  const selectedUser = useMemo(() => {
    if (formData.assignedTo) {
      return users.find((u) => u._id === formData.assignedTo) || null;
    }
    return null;
  }, [formData.assignedTo, users]);

  const userWorkload = useMemo(() => {
    if (formData.assignedTo && workloadData[formData.assignedTo]) {
      return workloadData[formData.assignedTo];
    }
    return null;
  }, [formData.assignedTo, workloadData]);

  const selectedAssignee = selectedUser;
  const selectedUserWorkload = userWorkload;

  // Handle quick task toggle
  useEffect(() => {
    if (isQuickTask && user) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData((prev) => ({
        ...prev,
        assignedTo: user._id || "",
        deadline: prev.deadline || tomorrow.toISOString().split("T")[0],
      }));
    } else if (!isEmployee) {
      setFormData((prev) => ({
        ...prev,
        assignedTo: "",
        deadline: "",
      }));
    }
  }, [isQuickTask, user, isEmployee]);

  // Employee auto-assignment
  useEffect(() => {
    if (isEmployee && user?._id) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      setFormData((prev) => ({
        ...prev,
        assignedTo: user._id || "",
        deadline: prev.deadline || tomorrow.toISOString().split("T")[0],
      }));

      const userDeptId = getDepartmentId(user);
      if (userDeptId && !selectedDepartment) {
        setSelectedDepartment(userDeptId);
      }
    }
  }, [isEmployee, user]);

  // 🆕 IMPORTANT: When milestone is enabled, disable sub-task
  useEffect(() => {
    if (isMilestone && isSubTask) {
      setIsSubTask(false);
      setParentTaskId("");
      setAvailableParentTasks([]);
    }
  }, [isMilestone]);

  // 🆕 Fetch parent tasks when sub-task toggle or project changes
  useEffect(() => {
    if (isSubTask && availableParentTasks.length === 0) {
      fetchParentTasks();
    } else if (!isSubTask) {
      setAvailableParentTasks([]);
      setParentTaskId("");
    }
  }, [isSubTask, selectedProject]); // fetchParentTasks সরিয়ে দিন

  // ============ HANDLERS ============
  const handleAddEvidenceUrl = () => {
    if (newUrl && newUrl.trim()) {
      setEvidenceUrls([...evidenceUrls, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const handleRemoveEvidenceUrl = (index: number) => {
    setEvidenceUrls(evidenceUrls.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      deadline: "",
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
    setIsMilestone(false);
    setIsSubTask(false);
    setParentTaskId("");
    setAvailableParentTasks([]);
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

    // Validation for sub-task
    if (isSubTask && !parentTaskId) {
      toast.error("Please select a parent task for this sub-task");
      return;
    }

    // Milestone cannot be a sub-task
    if (isMilestone && isSubTask) {
      toast.error("Milestone cannot be a sub-task");
      return;
    }

    // Deadline validation
    if (!formData.deadline) {
      toast.error("Please set a deadline or end time");
      return;
    }

    let finalAssignedTo = formData.assignedTo;
    let finalDepartment = selectedDepartment;
    let finalDeadline = formData.deadline;
    let finalProjectId = selectedProject;

    // For sub-tasks, inherit project from parent
    if (isSubTask && parentTaskId) {
      try {
        const parentTask = await api.get(`/tasks/${parentTaskId}`);
        if (parentTask.data.success) {
          const parent = parentTask.data.data;
          finalProjectId = parent.projectId?._id || parent.projectId;
          finalDepartment = parent.departmentId?._id || parent.departmentId;
          if (!formData.assignedTo) {
            finalAssignedTo = parent.assignedTo?._id || parent.assignedTo;
          }
        }
      } catch (error) {
        console.error("Error fetching parent task:", error);
        toast.error("Failed to fetch parent task details");
        return;
      }
    }

    if (isEmployee) {
      if (!user?._id) {
        toast.error("User not found");
        return;
      }
      finalAssignedTo = user._id;

      if (!selectedDepartment) {
        const userDeptId = getDepartmentId(user);
        if (userDeptId) {
          finalDepartment = userDeptId;
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
    } else if (isQuickTask) {
      if (!user?._id) {
        toast.error("User not found");
        return;
      }
      finalAssignedTo = user._id;

      if (!selectedDepartment) {
        const userDeptId = getDepartmentId(user);
        if (userDeptId) {
          finalDepartment = userDeptId;
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

      if (selectedUserWorkload && selectedUserWorkload.statusColor === "red") {
        if (
          !confirm(
            `⚠️ This user is at ${selectedUserWorkload.capacityPercentage}% capacity (OVERLOADED). Assigning this task may cause burnout. Continue anyway?`,
          )
        ) {
          return;
        }
      }

      if (!canAssignToOthers && formData.assignedTo !== user?._id) {
        toast.error("You can only assign tasks to yourself");
        return;
      }

      if (isDeptManager) {
        const assignedUser = users.find((u) => u._id === formData.assignedTo);
        if (assignedUser) {
          const assignedUserDept = getDepartmentId(assignedUser);
          const managerDept = getDepartmentId(user);
          if (assignedUserDept !== managerDept) {
            toast.error("You can only assign tasks to users in your department");
            return;
          }
        }
      }

      if (isProjectManager) {
        const assignedUser = users.find((u) => u._id === formData.assignedTo);
        if (assignedUser) {
          const assignedUserDept = getDepartmentId(assignedUser);
          const managerDept = getDepartmentId(user);
          if (assignedUserDept !== managerDept) {
            toast.error("You can only assign tasks to users in your department");
            return;
          }
        }
      }

      if (isLineManager) {
        const assignedUser = users.find((u) => u._id === formData.assignedTo);
        if (assignedUser) {
          const managerId = getManagerId(assignedUser);
          if (managerId !== user?._id) {
            toast.error("You can only assign tasks to your direct reports");
            return;
          }
        }
      }
    }

    // For sub-tasks, project is inherited from parent
    if (!isSubTask && !finalProjectId) {
      const deptProject = projects.find(
        (p) =>
          p.departmentId &&
          typeof p.departmentId === "object" &&
          "_id" in p.departmentId &&
          p.departmentId._id === finalDepartment,
      );
      if (deptProject) {
        finalProjectId = deptProject._id;
      } else {
        toast.error("No project selected. Task will be created without a project.");
      }
    }

    setLoading(true);
    const toastId = toast.loading("Creating task...");

    try {
      const taskData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: finalAssignedTo,
        deadline: finalDeadline,
        departmentId: finalDepartment,
        priority: formData.priority,
        estimatedHours: Number(formData.estimatedHours),
        actualMinutes: Number(formData.actualMinutes),
        isApprovalRequired: formData.isApprovalRequired,
        evidenceRequired: formData.evidenceRequired,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        evidenceUrls: evidenceUrls.length > 0 ? evidenceUrls : undefined,
        isMilestone: isMilestone,
        parentTaskId: isSubTask ? parentTaskId : undefined,
        startDate: formData.startTime ? new Date(formData.startTime).toISOString().split('T')[0] : finalDeadline,
      };

      if (finalProjectId) {
        taskData.projectId = finalProjectId;
      }

      if (isMilestone) {
        taskData.estimatedHours = 0;
        taskData.progress = 100;
      }

      if (isSubTask && parentTaskId) {
        taskData.isMilestone = false;
      }

      const response = await api.post("/tasks", taskData);
      toast.dismiss(toastId);

      if (response.data.success) {
        const message = isMilestone ? "Milestone created successfully! 🎯" :
          isSubTask ? "Sub-task created successfully! 📌" :
            "Task created successfully! 🎉";
        toast.success(message);
        resetForm();
        onTaskCreated();
        onClose();
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error("Create task error:", error);
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // ============ GET AVAILABLE USERS ============
  const getAvailableUsers = useCallback(() => {
    if (isSuperAdmin || isAdmin || isHrManager) {
      return filteredUsers;
    }

    if (isDeptManager) {
      const managerDeptId = getDepartmentId(user);
      return filteredUsers.filter((u) => {
        if (u.role === "super_admin") return false;
        if (!canAssignToOthers && u._id === user?._id) return false;
        const userDeptId = getDepartmentId(u);
        return userDeptId === managerDeptId;
      });
    }

    if (isProjectManager) {
      const managerDeptId = getDepartmentId(user);
      const managerDeptName = getDepartmentName(user);

      if (managerDeptId) {
        return filteredUsers.filter((u) => {
          if (u.role === "super_admin") return false;
          const userDeptId = getDepartmentId(u);
          const userDeptName = getDepartmentName(u);
          return userDeptId === managerDeptId ||
            (userDeptName && managerDeptName && userDeptName === managerDeptName);
        });
      }
      return filteredUsers.filter((u) => u.role !== "super_admin");
    }

    if (isLineManager) {
      return filteredUsers.filter((u) => {
        if (u.role === "super_admin") return false;
        const managerId = getManagerId(u);
        return managerId === user?._id;
      });
    }

    if (isEmployee) {
      return filteredUsers.filter((u) => u._id === user?._id);
    }

    return filteredUsers;
  }, [isSuperAdmin, isAdmin, isHrManager, isDeptManager, isProjectManager, isLineManager, isEmployee, filteredUsers, user, canAssignToOthers]);

  const availableUsers = getAvailableUsers();

  if (!isOpen) return null;

  // ============ RENDER ============
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {isMilestone ? "Create Milestone" : isSubTask ? "Create Sub-Task" : "Create New Task"}
              </h2>
              <p className="text-xs text-gray-500">
                {isMilestone
                  ? "Mark a key project checkpoint (displays as diamond on Gantt)"
                  : isSubTask
                    ? "Add a sub-task to an existing task"
                    : isEmployee
                      ? "Create a task for yourself"
                      : "Fill all details to assign a new task"}
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Employee Banner */}
          {isEmployee && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
              <UserIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Employee Mode</p>
                <p className="text-xs text-green-700">
                  Tasks will be automatically assigned to you. You can only create tasks for yourself.
                </p>
              </div>
            </div>
          )}

          {/* Quick Task Toggle (Only for Admins) */}
          {(isSuperAdmin || isAdmin) && !isEmployee && !isMilestone && !isSubTask && (
            <div className="p-4 bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Quick Task</p>
                    <p className="text-xs text-gray-500">Auto-assign to yourself and simplify the form</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={isQuickTask}
                  onToggle={() => setIsQuickTask(!isQuickTask)}
                  size="md"
                />
              </div>
              {isQuickTask && (
                <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  Task will be assigned to you with default settings
                </p>
              )}
            </div>
          )}

          {/* Role Info Banners */}
          {isDeptManager && !isEmployee && (
            <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
              <Users className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-700">You can assign tasks to users in your department only.</p>
            </div>
          )}

          {isLineManager && !isEmployee && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <Users className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-700">You can assign tasks to your direct reports only.</p>
            </div>
          )}

          {isProjectManager && !isEmployee && (
            <div className="flex items-center gap-2 p-2.5 bg-purple-50 rounded-lg border border-purple-200">
              <Users className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-700">You can assign tasks to team members in your department.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title & Project Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {isMilestone ? "Milestone Title" : isSubTask ? "Sub-Task Title" : "Task Title"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                  placeholder={isMilestone ? "Enter milestone title" : isSubTask ? "Enter sub-task title" : "Enter task title"}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Project {!isSubTask && <span className="text-gray-400 text-xs">(Optional)</span>}
                  {isSubTask && <span className="text-gray-400 text-xs">(Inherited from parent)</span>}
                </label>
                <div className="relative">
                  <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      // If sub-task is on, refetch parent tasks
                      if (isSubTask) {
                        fetchParentTasks();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer"
                    disabled={isSubTask}
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-1">Select a project if needed, or leave empty</p>
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
                placeholder={isMilestone ? "Describe what this milestone represents..." : "Describe the task details..."}
                required
              />
            </div>

            {/* Department & Assign To Row - Hide for employees */}
            {!isEmployee && !isSubTask && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Department{" "}
                    {!isQuickTask && !isProjectManager && <span className="text-rose-500">*</span>}
                    {isQuickTask && (
                      <span className="text-gray-400 text-xs"> (Auto-assigned)</span>
                    )}
                    {isProjectManager && !isQuickTask && (
                      <span className="text-gray-400 text-xs"> (Auto-set from your department)</span>
                    )}
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer"
                      required={!isQuickTask && !isProjectManager}
                      disabled={isQuickTask || isProjectManager}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {isProjectManager && selectedDepartment && (
                    <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Department: {departments.find(d => d._id === selectedDepartment)?.name || 'Loading...'}
                    </p>
                  )}
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
                      disabled={
                        isQuickTask || (!canAssignToOthers && !isQuickTask)
                      }
                    >
                      <option value="">
                        {!selectedDepartment && !isQuickTask
                          ? "Select department first"
                          : loadingUsers
                            ? "Loading users..."
                            : availableUsers.length === 0
                              ? isDeptManager || isProjectManager
                                ? "No users in your department"
                                : isLineManager
                                  ? "No direct reports found"
                                  : "No users available"
                              : "Select team member"}
                      </option>
                      {availableUsers.map((u) => {
                        let deptName = "";
                        if (
                          u.department &&
                          typeof u.department === "object" &&
                          "name" in u.department
                        ) {
                          deptName = ` (${u.department.name})`;
                        } else if (
                          u.departmentId &&
                          typeof u.departmentId === "object" &&
                          "name" in u.departmentId
                        ) {
                          deptName = ` (${u.departmentId.name})`;
                        }

                        const isCurrentUser = u._id === user?._id;

                        return (
                          <option key={u._id} value={u._id}>
                            {u.fullName} ({u.email}) - {u.role.replace(/_/g, " ")}
                            {deptName}
                            {isCurrentUser && " (You)"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Workload Badge */}
                  {formData.assignedTo && !isQuickTask && (
                    <WorkloadBadge user={selectedAssignee} workloadData={workloadData} />
                  )}

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

                  {!isQuickTask && isProjectManager && (
                    <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
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
                </div>
              </div>
            )}

            {/* Employee info */}
            {isEmployee && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">
                    Department
                  </label>
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <Building2 className="w-4 h-4" />
                    {departments.find(d => d._id === selectedDepartment)?.name || "Auto-selected"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">
                    Assigned To
                  </label>
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <UserIcon className="w-4 h-4" />
                    {user?.fullName} (You)
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Task Info - Show inherited fields */}
            {isSubTask && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-medium text-blue-700 mb-2">📋 Inherited from Parent Task</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-blue-600">Project:</span>
                    <p className="text-gray-800 font-medium">
                      {projects.find(p => p._id === selectedProject)?.name || "Will be inherited"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-600">Department:</span>
                    <p className="text-gray-800 font-medium">
                      {departments.find(d => d._id === selectedDepartment)?.name || "Will be inherited"}
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  {isMilestone && <span className="text-purple-600 text-xs ml-1">(Auto: 0h)</span>}
                </label>
                <div className="relative">
                  <Hourglass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={isMilestone ? 0 : formData.estimatedHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedHours: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition placeholder:text-gray-400"
                    placeholder="Hours"
                    disabled={isMilestone}
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
                  {isMilestone && <span className="text-purple-600 text-xs ml-1">(Milestone date)</span>}
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
                  End Time <span className="text-gray-400 text-xs">(Auto-sets deadline)</span>
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
                {formData.endTime && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Deadline auto-set to: {new Date(formData.endTime).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Deadline {!isQuickTask && !isEmployee && !isSubTask && <span className="text-rose-500">*</span>}
                {formData.endTime && <span className="text-green-600 text-xs ml-1">(Auto-set from end time)</span>}
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
                  required={!isQuickTask && !isEmployee && !isSubTask}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={!!formData.endTime || isQuickTask || isEmployee || isSubTask}
                />
              </div>
              {isEmployee && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Auto-set to tomorrow
                </p>
              )}
              {isSubTask && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Will inherit deadline from parent task
                </p>
              )}
            </div>

            {/* 🆕 MILESTONE & SUB-TASK TOGGLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Milestone Toggle */}
              <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isMilestone ? "bg-purple-50 border-purple-300" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMilestone ? "bg-purple-200" : "bg-gray-200"}`}>
                    <Diamond className={`w-4 h-4 ${isMilestone ? "text-purple-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Milestone</p>
                    <p className="text-xs text-gray-500">Key checkpoint (diamond on Gantt)</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={isMilestone}
                  onToggle={() => {
                    // 🆕 When enabling milestone, disable sub-task
                    setIsMilestone(!isMilestone);
                    if (!isMilestone) {
                      setIsSubTask(false);
                      setParentTaskId("");
                      setAvailableParentTasks([]);
                    }
                  }}
                  size="sm"
                  disabled={isSubTask}
                />
              </div>

              {/* Sub-Task Toggle */}
              <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isSubTask ? "bg-blue-50 border-blue-300" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSubTask ? "bg-blue-200" : "bg-gray-200"}`}>
                    <GitBranch className={`w-4 h-4 ${isSubTask ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sub-Task</p>
                    <p className="text-xs text-gray-500">Child of an existing task</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={isSubTask}
                  onToggle={() => {
                    // 🆕 When enabling sub-task, disable milestone
                    setIsSubTask(!isSubTask);
                    if (!isSubTask) {
                      setIsMilestone(false);
                    }
                    // Fetch parent tasks when sub-task is enabled
                    if (!isSubTask) {
                      fetchParentTasks();
                    }
                  }}
                  size="sm"
                  disabled={isMilestone}
                />
              </div>
            </div>

            {isSubTask && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <label className="block text-xs font-medium text-blue-700 mb-1.5">
                  Parent Task <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  <select
                    value={parentTaskId || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log("🟢 Selected:", value);
                      setParentTaskId(value);
                    }}
                    // 🆕 onClick এ fetch করবেন না, শুধু onChange এ কাজ করবে
                    className="w-full pl-9 pr-3 py-2 text-sm text-gray-800 bg-white border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition appearance-none cursor-pointer"
                    required={isSubTask}
                  >
                    <option value="">-- Select Parent Task --</option>
                    {loadingParentTasks ? (
                      <option value="" disabled>Loading tasks...</option>
                    ) : availableParentTasks.length === 0 ? (
                      <option value="" disabled>No available parent tasks</option>
                    ) : (
                      availableParentTasks.map((task) => {
                        const projectName = typeof task.projectId === 'object'
                          ? task.projectId?.name
                          : task.projectId;
                        return (
                          <option key={task._id} value={task._id}>
                            {task.title} ({task.status})
                            {projectName && ` - ${projectName}`}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                {/* 🆕 Selected task info */}
                {parentTaskId && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      Selected: {
                        availableParentTasks.find(t => t._id === parentTaskId)?.title || 'Loading...'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Milestone Info Banner */}
            {isMilestone && (
              <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg">
                <p className="text-xs text-purple-700 flex items-center gap-2">
                  <Diamond className="w-4 h-4" />
                  Milestone will appear as a <strong>diamond</strong> on the Gantt chart with 0 duration and 100% progress
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  ⚡ Estimated Hours will be set to 0 • Progress set to 100%
                </p>
              </div>
            )}

            {/* Sub-Task Info Banner */}
            {isSubTask && (
              <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Sub-task will inherit <strong>project</strong> and <strong>department</strong> from parent task
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  📌 Sub-tasks appear indented under parent in Gantt chart
                </p>
              </div>
            )}

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
                className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading || isCreatingProject ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isCreatingProject
                      ? "Creating Project..."
                      : isMilestone
                        ? "Creating Milestone..."
                        : isSubTask
                          ? "Creating Sub-Task..."
                          : "Creating Task..."}
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {isEmployee
                      ? "Create Task for Yourself"
                      : isMilestone
                        ? "Create Milestone"
                        : isSubTask
                          ? "Create Sub-Task"
                          : "Create Task"}
                  </>
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
      </motion.div>

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