"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useRouter } from "next/navigation";
import { Award, AwardIcon, CalendarIcon, Check, ChevronRight, HistoryIcon, Pause, TimerIcon, CalendarClock } from "lucide-react";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Layers,
  Zap,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  Eye,
  Play,
  Send,
  RefreshCw,
  Calendar,
  Briefcase,
  Edit2,
  Trash2,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  List,
  Star,
  MessageSquare,
  Paperclip,
  Link2,
  Clock as ClockIcon,
  Home,
  Download,
  LayoutGrid,
  Square,
  Trash,
  ExternalLink,
  Upload,
  Users,
  Building2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status:
  | "pending"
  | "in_progress"
  | "submitted"
  | "completed"
  | "overdue"
  | "rejected";
  deadline: string;
  estimatedHours: number;
  actualMinutes?: number;
  assignedTo: { _id: string; fullName: string; email: string; avatar?: string; department?: { _id: string; name: string } };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  departmentId?: { _id: string; name: string; code: string };
  isStarred?: boolean;
  isApprovalRequired?: boolean;
  evidenceRequired?: boolean;
  evidenceUrls?: string[];
  rejectionReason?: string;
  commentsCount?: number;
  attachmentsCount?: number;
  reviewsCount?: number;
  averageRating?: number;
  approvalNote?: string;
  evidenceSubmitted?: boolean;
  evidenceSubmittedAt?: string;
  comments?: number;
  attachments?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Extended user type with department
interface ExtendedUser {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  departmentId?: string;
}

interface ExtensionRequest {
  _id: string;
  taskId: string;  // This is required
  taskTitle: string;
  requestedDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: { _id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  task?: {
    _id: string;
    title: string;
    priority: string;
    status: string;
    deadline: string;
    assignedTo: { _id: string; fullName: string };
  };
}
export default function TasksPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // ============ TIMER CONTEXT ============
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    stopTimerAutomatically,
    formatTime,
    formatTimeShort,
    getDisplayTimeForTask,
    isTimerActiveForTask,
    isTimerRunning,
    activeTimerTaskId,
    syncTimerWithBackend,
    resetTimer,
    isTimerValidForUser,
    getTimerOwner,
  } = useTimer();

  // ============ STATE ============
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "createdAt">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false);
  const [newEvidenceUrl, setNewEvidenceUrl] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    submitted: 0,
    rejected: 0,
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
    status: "pending",
    deadline: "",
    estimatedHours: 0,
    assignedTo: "",
    projectId: "",
  });
  const [users, setUsers] = useState<
    { _id: string; fullName: string; email: string; department?: { _id: string; name: string } }[]
  >([]);
  const [projects, setProjects] = useState<
    { _id: string; name: string; code: string }[]
  >([]);
  const [departmentUsers, setDepartmentUsers] = useState<
    { _id: string; fullName: string; email: string }[]
  >([]);

  // Bulk selection state
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // ============ STATE FOR TASK ACTIONS ============
  const [isCompleting, setIsCompleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [isReworking, setIsReworking] = useState<string | null>(null);

  // ============ EXTENSION REQUESTS STATE ============
  const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);
  const [myExtensionRequests, setMyExtensionRequests] = useState<ExtensionRequest[]>([]);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedTaskForExtension, setSelectedTaskForExtension] = useState<Task | null>(null);
  const [extensionData, setExtensionData] = useState({
    requestedDate: "",
    reason: "",
  });
  const [submittingExtension, setSubmittingExtension] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "extensions">("tasks");
  const [extensionFilter, setExtensionFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [loadingExtensions, setLoadingExtensions] = useState(false);
  const [approvingExtension, setApprovingExtension] = useState<string | null>(null);

  // ============ ROLE CHECKS ============
  const userRole = user?.role;
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";
  const isHrManager = userRole === "hr_manager";
  const isDeptManager = userRole === "dept_manager";
  const isProjectManager = userRole === "project_manager";
  const isLineManager = userRole === "line_manager";

  const canManage = isSuperAdmin || isAdmin || isHrManager || isDeptManager || isProjectManager || isLineManager;
  const canApprove = isSuperAdmin || isAdmin || isHrManager || isDeptManager || isProjectManager || isLineManager;

  // Get user's department ID
  const userDepartmentId = useMemo(() => {
    const extendedUser = user as ExtendedUser;
    return extendedUser?.department?._id || extendedUser?.departmentId || null;
  }, [user]);

  // Check if user is a department manager or project manager
  const isDepartmentManager = useMemo(() => {
    return isDeptManager || isProjectManager || isLineManager;
  }, [isDeptManager, isProjectManager, isLineManager]);

  // Check if user can manage extensions
  const canManageExtensions = useMemo(() => {
    return isSuperAdmin || isAdmin || isHrManager || isDepartmentManager;
  }, [isSuperAdmin, isAdmin, isHrManager, isDepartmentManager]);

  // ============ CHECK IF USER IS TASK ASSIGNEE ============
  const isTaskAssignee = useCallback((task: Task): boolean => {
    if (!user || !task) return false;

    if (task.assignedTo && typeof task.assignedTo === 'object') {
      const assigneeId = task.assignedTo._id || (task.assignedTo as any).id;
      const userId = user._id || (user as any).id;
      return assigneeId === userId;
    }

    if (typeof task.assignedTo === 'string') {
      return task.assignedTo === (user._id || (user as any).id);
    }

    return false;
  }, [user]);

  // ============ CHECK IF TIMER BELONGS TO CURRENT USER ============
  const isTimerValidForCurrentUser = useCallback((): boolean => {
    if (!user) return false;
    const userId = user._id || (user as any).id || '';
    return isTimerValidForUser(userId);
  }, [user, isTimerValidForUser]);

  // ============ CHECK IF ACTIVE TIMER BELONGS TO USER'S TASK ============
  const hasValidActiveTimer = useCallback((): boolean => {
    if (!activeTimerTaskId) return false;
    const task = tasks.find(t => t._id === activeTimerTaskId);
    if (!task) return false;
    return isTaskAssignee(task) && isTimerValidForCurrentUser();
  }, [activeTimerTaskId, tasks, isTaskAssignee, isTimerValidForCurrentUser]);

  // ============ EFFECTS ============
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // ============ FETCH FUNCTIONS ============
  const fetchDepartmentUsers = async () => {
    try {
      if (!userDepartmentId) {
        console.log("⚠️ No department ID found for user");
        setDepartmentUsers([]);
        return;
      }

      console.log(`🔍 Fetching users for department: ${userDepartmentId}`);

      try {
        const response = await api.get(`/auth/users/department/${userDepartmentId}`);
        if (response.data.success) {
          const users = response.data.data || [];
          setDepartmentUsers(users);
          console.log(`✅ Found ${users.length} users in department via auth endpoint`);
          return;
        }
      } catch (authError) {
        console.warn("⚠️ Auth endpoint failed, trying users endpoint:", authError);
      }

      try {
        const response = await api.get(`/users/department/${userDepartmentId}`);
        if (response.data.success) {
          const users = response.data.data || [];
          setDepartmentUsers(users);
          console.log(`✅ Found ${users.length} users in department via users endpoint`);
          return;
        }
      } catch (usersError) {
        console.warn("⚠️ Users endpoint also failed:", usersError);
      }

      try {
        const allUsersResponse = await api.get('/users');
        if (allUsersResponse.data.success) {
          const allUsers = allUsersResponse.data.data || [];
          const filteredUsers = allUsers.filter((u: any) => {
            const userDeptId = u.departmentId || u.department?._id || u.department;
            return userDeptId === userDepartmentId;
          });
          setDepartmentUsers(filteredUsers);
          console.log(`✅ Found ${filteredUsers.length} users in department via fallback`);
          return;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }

      if (tasks && tasks.length > 0) {
        const userMap = new Map();
        tasks.forEach(task => {
          if (task.assignedTo && task.assignedTo._id) {
            userMap.set(task.assignedTo._id, {
              _id: task.assignedTo._id,
              fullName: task.assignedTo.fullName,
              email: task.assignedTo.email
            });
          }
        });
        const taskUsers = Array.from(userMap.values());
        setDepartmentUsers(taskUsers);
        console.log(`✅ Extracted ${taskUsers.length} users from tasks`);
        return;
      }

      setDepartmentUsers([]);
      console.warn("⚠️ No users found for department");
    } catch (error) {
      console.error("❌ Error fetching department users:", error);
      setDepartmentUsers([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (filter !== "all") {
        params.append("status", filter);
      }

      if (isProjectManager && userDepartmentId) {
        params.append("departmentId", userDepartmentId);
        console.log(`📋 Project Manager - fetching all tasks for department: ${userDepartmentId}`);
      } else if (isDeptManager && userDepartmentId) {
        params.append("departmentId", userDepartmentId);
        console.log(`🏢 Department Manager - filtering by departmentId: ${userDepartmentId}`);
      }

      const queryString = params.toString();
      const url = queryString ? `/tasks?${queryString}` : "/tasks";

      console.log(`🔍 Fetching tasks with URL: ${url}`);

      const response = await api.get(url);

      if (response.data.success) {
        if (response.data.stats) {
          setStats(response.data.stats);
        }

        const tasksWithCounts = await Promise.all(
          (response.data.data || []).map(async (task: Task) => {
            try {
              const commentsResponse = await api.get(`/tasks/${task._id}/comments`);
              const commentsCount = commentsResponse.data.data?.length || 0;

              const attachmentsResponse = await api.get(`/tasks/${task._id}/attachments`);
              const attachmentsCount = attachmentsResponse.data.data?.length || 0;

              return {
                ...task,
                comments: commentsCount,
                attachments: attachmentsCount,
                isStarred: false,
              };
            } catch (error) {
              console.error(`Error fetching counts for task ${task._id}:`, error);
              return {
                ...task,
                comments: 0,
                attachments: 0,
                isStarred: false,
              };
            }
          })
        );

        setTasks(tasksWithCounts);
        console.log(`📊 Loaded ${tasksWithCounts.length} tasks with real counts`);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  // ============ FETCH MY EXTENSION REQUESTS ============
  const fetchMyExtensionRequests = async () => {
    try {
      const allRequests: ExtensionRequest[] = [];

      const tasksResponse = await api.get("/tasks");
      if (tasksResponse.data.success) {
        const tasks = tasksResponse.data.data || [];

        for (const task of tasks) {
          try {
            const response = await api.get(`/tasks/${task._id}/extension-requests`);
            if (response.data.success && response.data.data) {
              const requests = response.data.data.map((req: any) => ({
                ...req,
                task: {
                  _id: task._id,
                  title: task.title,
                  priority: task.priority,
                  status: task.status,
                  deadline: task.deadline,
                  assignedTo: task.assignedTo,
                }
              }));
              allRequests.push(...requests);
            }
          } catch (err) {
            continue;
          }
        }
      }

      const userId = user?._id || (user as any)?.id;
      const myRequests = allRequests.filter(req =>
        req.task && (req.task as any).assignedTo?._id === userId
      );

      setMyExtensionRequests(myRequests);
    } catch (error: any) {
      console.error("Error fetching my extension requests:", error);
      setMyExtensionRequests([]);
    }
  };

  // ============ FETCH ALL EXTENSION REQUESTS ============
  const fetchAllExtensionRequests = async () => {
    if (!canManageExtensions) {
      setExtensionRequests([]);
      return;
    }

    setLoadingExtensions(true);
    try {
      const tasksResponse = await api.get("/tasks");
      if (tasksResponse.data.success) {
        const tasks = tasksResponse.data.data || [];
        const allRequests: ExtensionRequest[] = [];

        for (const task of tasks) {
          try {
            const response = await api.get(`/tasks/${task._id}/extension-requests`);
            if (response.data.success && response.data.data) {
              const requests = response.data.data.map((req: any) => ({
                ...req,
                task: {
                  _id: task._id,
                  title: task.title,
                  priority: task.priority,
                  status: task.status,
                  deadline: task.deadline,
                  assignedTo: task.assignedTo,
                }
              }));
              allRequests.push(...requests);
            }
          } catch (err) {
            continue;
          }
        }

        setExtensionRequests(allRequests);
      } else {
        setExtensionRequests([]);
      }
    } catch (error: any) {
      console.error("Error fetching extension requests:", error);
      setExtensionRequests([]);
    } finally {
      setLoadingExtensions(false);
    }
  };

  // ============ UPDATE EXTENSION STATUS IN STATE ============
  const updateExtensionStatus = (extensionId: string, status: "approved" | "rejected") => {
    setExtensionRequests(prev =>
      prev.map(req =>
        req._id === extensionId
          ? { ...req, status: status }
          : req
      )
    );

    setMyExtensionRequests(prev =>
      prev.map(req =>
        req._id === extensionId
          ? { ...req, status: status }
          : req
      )
    );
  };

  // ============ REQUEST EXTENSION ============
  const handleRequestExtension = async () => {
    if (!extensionData.requestedDate) {
      toast.error("Please select a new deadline");
      return;
    }

    if (!extensionData.reason.trim()) {
      toast.error("Please provide a reason for extension");
      return;
    }

    if (!selectedTaskForExtension) return;

    setSubmittingExtension(true);
    try {
      const response = await api.post(`/tasks/${selectedTaskForExtension._id}/request-extension`, {
        requestedDate: extensionData.requestedDate,
        reason: extensionData.reason.trim(),
      });

      if (response.data.success) {
        toast.success("✅ Extension request submitted successfully!");
        setShowExtensionModal(false);
        setExtensionData({ requestedDate: "", reason: "" });
        setSelectedTaskForExtension(null);

        await fetchMyExtensionRequests();
        if (canManageExtensions) {
          await fetchAllExtensionRequests();
        }
        await fetchTasks();
      }
    } catch (error: any) {
      console.error("Error requesting extension:", error);
      toast.error(error.response?.data?.message || "Failed to request extension");
    } finally {
      setSubmittingExtension(false);
    }
  };

  // Update the handleApproveExtension function
  const handleApproveExtension = async (extensionId: string, taskId: string, newDeadline: string) => {
    if (!confirm("Approve this extension request?")) return;

    setApprovingExtension(extensionId);
    try {
      // Find the extension request to get the correct task ID
      const extension = extensionRequests.find(req => req._id === extensionId) ||
        myExtensionRequests.find(req => req._id === extensionId);

      // Use the taskId from the extension, or fallback to the passed taskId
      const actualTaskId = extension?.taskId || taskId;

      if (!actualTaskId) {
        toast.error("Could not find task ID for this extension request");
        setApprovingExtension(null);
        return;
      }

      console.log(`✅ Approving extension for task: ${actualTaskId}`);

      // Try the primary endpoint
      try {
        const response = await api.post(`/tasks/${actualTaskId}/approve-extension/${extensionId}`, {
          newDeadline: newDeadline,
        });

        if (response.data.success) {
          toast.success("✅ Extension approved successfully!");
          updateExtensionStatus(extensionId, "approved");
          await fetchTasks();
          await fetchAllExtensionRequests();
          await fetchMyExtensionRequests();
          return;
        }
      } catch (primaryError: any) {
        console.warn("Primary approve endpoint failed:", primaryError);
      }

      // Try alternative endpoint
      try {
        const response = await api.patch(`/tasks/extension-requests/${extensionId}/approve`, {
          newDeadline: newDeadline,
          taskId: actualTaskId,
        });

        if (response.data.success) {
          toast.success("✅ Extension approved successfully!");
          updateExtensionStatus(extensionId, "approved");
          await fetchTasks();
          await fetchAllExtensionRequests();
          await fetchMyExtensionRequests();
          return;
        }
      } catch (altError: any) {
        console.warn("Alternative approve endpoint failed:", altError);
      }

      // Try updating the task deadline directly
      try {
        const response = await api.patch(`/tasks/${actualTaskId}`, {
          deadline: newDeadline,
        });

        if (response.data.success) {
          toast.success("✅ Extension approved! Task deadline updated.");
          updateExtensionStatus(extensionId, "approved");
          await fetchTasks();
          await fetchAllExtensionRequests();
          await fetchMyExtensionRequests();
          return;
        }
      } catch (taskUpdateError: any) {
        console.error("Task update failed:", taskUpdateError);
      }

      // If all attempts fail, update locally
      toast.error("Could not update on server. Updating locally.");
      updateExtensionStatus(extensionId, "approved");

    } catch (error: any) {
      console.error("Error approving extension:", error);
      toast.error(error.response?.data?.message || "Failed to approve extension. Please try again.");
    } finally {
      setApprovingExtension(null);
    }
  };

  // Update the handleRejectExtension function
  const handleRejectExtension = async (extensionId: string) => {
    if (!confirm("Reject this extension request?")) return;

    setApprovingExtension(extensionId);
    try {
      // Find the extension request
      const extension = extensionRequests.find(req => req._id === extensionId) ||
        myExtensionRequests.find(req => req._id === extensionId);

      const actualTaskId = extension?.taskId;

      if (!actualTaskId) {
        toast.error("Could not find task for this extension request");
        setApprovingExtension(null);
        return;
      }

      console.log(`❌ Rejecting extension for task: ${actualTaskId}`);

      try {
        const response = await api.patch(`/tasks/extension-requests/${extensionId}/reject`);

        if (response.data.success) {
          toast.success("❌ Extension rejected");
          updateExtensionStatus(extensionId, "rejected");
          await fetchAllExtensionRequests();
          await fetchMyExtensionRequests();
          return;
        }
      } catch (primaryError: any) {
        console.warn("Primary reject endpoint failed:", primaryError);
      }

      try {
        const response = await api.post(`/tasks/extension-requests/${extensionId}/reject`);

        if (response.data.success) {
          toast.success("❌ Extension rejected");
          updateExtensionStatus(extensionId, "rejected");
          await fetchAllExtensionRequests();
          await fetchMyExtensionRequests();
          return;
        }
      } catch (altError: any) {
        console.warn("Alternative reject endpoint failed:", altError);
      }

      // If all attempts fail, update locally
      toast.error("Could not reject on server. Updating locally.");
      updateExtensionStatus(extensionId, "rejected");

    } catch (error: any) {
      console.error("Error rejecting extension:", error);
      toast.error(error.response?.data?.message || "Failed to reject extension. Please try again.");
    } finally {
      setApprovingExtension(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadAllData = async () => {
      try {
        // Use Promise.all to fetch data in parallel
        await Promise.all([
          fetchTasks(),
          fetchUsers(),
          fetchProjects(),
          fetchDepartmentUsers(),
          fetchMyExtensionRequests(),
          fetchAllExtensionRequests()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadAllData();
  }, [isAuthenticated, user, filter]); // Add all dependencies here

  // ============ FILTER USERS ============
  const getAvailableUsers = useMemo(() => {
    if (isSuperAdmin || isAdmin || isHrManager) {
      return users;
    }

    if (isDepartmentManager && userDepartmentId) {
      if (departmentUsers.length > 0) {
        return departmentUsers;
      }

      const filtered = users.filter(u =>
        (u as any).department?._id === userDepartmentId ||
        (u as any).departmentId === userDepartmentId
      );

      if (filtered.length === 0) {
        console.warn("⚠️ No department users found, showing all users as fallback");
        return users;
      }

      return filtered;
    }

    return users;
  }, [users, isSuperAdmin, isAdmin, isHrManager, isDepartmentManager, userDepartmentId, departmentUsers]);

  // ============ TASK ACTION HANDLERS ============

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        const statusMessages: Record<string, string> = {
          in_progress: "🚀 Task started! Moving to In Progress",
          submitted: "📤 Task submitted for review!",
          pending: "🔄 Task sent back for rework",
          completed: "🎉 Task completed! Great job!",
          rejected: "❌ Task rejected",
        };
        toast.success(statusMessages[newStatus] || "Status updated");
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async (taskId: string) => {
    setApproving(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "completed",
      });
      if (response.data.success) {
        toast.success("✅ Task approved and completed!");
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve task");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setRejecting(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      if (response.data.success) {
        toast.success("Task rejected. Feedback sent to assignee");
        setShowRejectModal(false);
        setRejectionReason("");
        fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject task");
    } finally {
      setRejecting(false);
    }
  };

  // ============ MARK COMPLETE ============
  const handleMarkComplete = async (taskId: string) => {
    if (isCompleting === taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    if (task.evidenceRequired && (!task.evidenceUrls || task.evidenceUrls.length === 0)) {
      toast.error("⚠️ Evidence required! Please upload evidence before completing this task.");
      return;
    }

    setIsCompleting(taskId);
    try {
      let actualMinutes = task.actualMinutes || 0;
      if (isTimerActiveForTask(taskId)) {
        const timerResult = await stopTimerAutomatically(taskId);
        if (timerResult.success && timerResult.minutes > 0) {
          actualMinutes = timerResult.minutes;
          toast.success(`⏱️ Time tracked: ${timerResult.displayTime}`);
        }
      }

      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "completed",
        actualMinutes: actualMinutes,
        approvalNote: "Task marked as complete by assignee",
      });

      if (response.data.success) {
        toast.success(`✅ Task marked as complete! ${actualMinutes > 0 ? `Time tracked: ${formatTimeShort(actualMinutes * 60)}` : ''}`);
        await fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      console.error("Error marking task complete:", error);
      toast.error(error.response?.data?.message || "Failed to mark task as complete");
    } finally {
      setIsCompleting(null);
    }
  };

  // ============ SUBMIT FOR REVIEW ============
  const handleSubmitForReview = async (taskId: string) => {
    if (isSubmitting === taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    if (task.evidenceRequired && (!task.evidenceUrls || task.evidenceUrls.length === 0)) {
      toast.error("⚠️ Evidence required! Please upload evidence before submitting.");
      return;
    }

    setIsSubmitting(taskId);
    try {
      if (isTimerActiveForTask(taskId)) {
        const timerResult = await stopTimerAutomatically(taskId);
        if (timerResult.success && timerResult.minutes > 0) {
          toast.success(`⏱️ Time tracked: ${timerResult.displayTime}`);
        }
      }

      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "submitted",
      });

      if (response.data.success) {
        toast.success(`✅ Task submitted for review!`);
        await fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      console.error("Error submitting task:", error);
      toast.error(error.response?.data?.message || "Failed to submit task");
    } finally {
      setIsSubmitting(null);
    }
  };

  // ============ SEND FOR REWORK ============
  const handleSendForRework = async (taskId: string) => {
    if (isReworking === taskId) return;

    if (!confirm("Send this task back for rework?")) return;

    setIsReworking(taskId);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: "pending",
      });

      if (response.data.success) {
        toast.success(`🔄 Task sent back for rework!`);
        await fetchTasks();
        setSelectedTask(null);
      }
    } catch (error: any) {
      console.error("Error sending for rework:", error);
      toast.error(error.response?.data?.message || "Failed to send for rework");
    } finally {
      setIsReworking(null);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (updatingStatus === taskId) return;

    if (newStatus === "completed") {
      await handleMarkComplete(taskId);
      return;
    }

    if (newStatus === "submitted") {
      await handleSubmitForReview(taskId);
      return;
    }

    setUpdatingStatus(taskId);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId
              ? { ...task, status: newStatus as Task["status"] }
              : task,
          ),
        );
        if (newStatus === "completed" && activeTimerTaskId === taskId) {
          await stopTimerAutomatically(taskId);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
      await fetchTasks();
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ============ TIMER HANDLERS ============
  const handleStartTimer = async (taskId: string) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) {
      toast.error("Task not found");
      return;
    }

    if (!isTaskAssignee(task)) {
      toast.error("You don't have permission to start timer for this task");
      return;
    }

    if (activeTimerTaskId && activeTimerTaskId !== taskId) {
      if (isTimerValidForCurrentUser()) {
        const currentTask = tasks.find((t) => t._id === activeTimerTaskId);
        toast.error(
          `⚠️ A timer is already running for "${currentTask?.title || 'another task'}". Please stop that timer first before starting a new one.`,
          { duration: 4000 }
        );
        return;
      } else {
        resetTimer();
      }
    }

    if (timerState.taskId === null && timerState.elapsedSeconds > 0) {
      console.log("🧹 Cleaning up ghost timer state");
      resetTimer();
    }

    const baselineSeconds = (task.actualMinutes || 0) * 60;
    startTimer(taskId, baselineSeconds);
    toast.success(`⏱️ Timer started for "${task.title}"`);
  };

  const handlePauseTimer = () => {
    pauseTimer();
    toast.success("⏸️ Timer paused");
  };

  const handleResumeTimer = () => {
    resumeTimer();
    toast.success("▶️ Timer resumed");
  };

  // Replace the handleStopTimer function with this:
  const handleStopTimer = useCallback(
    async (taskId: string) => {
      try {
        const result = await stopTimer(taskId);

        if (result.success) {
          if (result.minutes > 0) {
            toast.success(`⏱️ Time tracked: ${result.displayTime}`);
            await fetchTasks();
          } else {
            toast.success("⏱️ Timer stopped - no time tracked");
          }
          return result;
        } else {
          toast.error("Failed to stop timer");
          return result;
        }
      } catch (error) {
        console.error("Error stopping timer:", error);
        toast.error("Failed to stop timer");
        return { success: false, minutes: 0, displayTime: "0m" };
      }
    },
    [stopTimer, fetchTasks],
  );

  // ============ OTHER HANDLERS ============
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully");
        setShowDeleteConfirm(null);
        fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      const response = await api.put(`/tasks/${editingTask._id}`, editFormData);
      if (response.data.success) {
        toast.success("Task updated successfully");
        setShowEditModal(false);
        setEditingTask(null);
        fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  };

  const toggleStar = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, isStarred: !task.isStarred } : task,
      ),
    );
    const task = tasks.find((t) => t._id === taskId);
    toast.success(task?.isStarred ? "Task unstarred" : "Task starred");
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline.split("T")[0],
      estimatedHours: task.estimatedHours,
      assignedTo: task.assignedTo?._id || "",
      projectId: task.projectId?._id || "",
    });
    setShowEditModal(true);
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map((t) => t._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) {
      toast.error("No tasks selected");
      return;
    }

    setIsBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedTasks).map((taskId) =>
        api.delete(`/tasks/${taskId}`),
      );
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedTasks.size} tasks`);
      setSelectedTasks(new Set());
      setIsBulkDeleteModalOpen(false);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete tasks");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Add this after your tasks state
  useEffect(() => {
    const calculateStats = () => {
      const total = tasks.length;
      const pending = tasks.filter(t => t.status === "pending").length;
      const inProgress = tasks.filter(t => t.status === "in_progress").length;
      const submitted = tasks.filter(t => t.status === "submitted").length;
      const completed = tasks.filter(t => t.status === "completed").length;
      const overdue = tasks.filter(t => t.status === "overdue").length;
      const rejected = tasks.filter(t => t.status === "rejected").length;

      setStats({
        total,
        pending,
        inProgress,
        completed,
        overdue,
        submitted,
        rejected,
      });
    };

    calculateStats();
  }, [tasks]);
  // ============ HELPERS ============
  const getPriorityConfig = (priority: string) => {
    const config = {
      low: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "🟢",
        label: "Low",
        gradient: "from-emerald-400 to-emerald-600",
        bg: "bg-emerald-500/10",
        border: "border-emerald-200",
      },
      normal: {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: "🔵",
        label: "Normal",
        gradient: "from-blue-400 to-blue-600",
        bg: "bg-blue-500/10",
        border: "border-blue-200",
      },
      high: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "🟠",
        label: "High",
        gradient: "from-amber-400 to-amber-600",
        bg: "bg-amber-500/10",
        border: "border-amber-200",
      },
      urgent: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "🔴",
        label: "Urgent",
        gradient: "from-rose-400 to-rose-600",
        bg: "bg-rose-500/10",
        border: "border-rose-200",
      },
    };
    return config[priority as keyof typeof config] || config.normal;
  };

  const getStatusConfig = (status: string) => {
    const config = {
      pending: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "⏳",
        label: "Pending",
        dot: "bg-amber-500",
        ring: "ring-amber-400",
      },
      in_progress: {
        color: "bg-sky-50 text-sky-700 border-sky-200",
        icon: "🔄",
        label: "In Progress",
        dot: "bg-sky-500",
        ring: "ring-sky-400",
      },
      submitted: {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: "📬",
        label: "Submitted",
        dot: "bg-purple-500",
        ring: "ring-purple-400",
      },
      completed: {
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "✅",
        label: "Done",
        dot: "bg-emerald-500",
        ring: "ring-emerald-400",
      },
      overdue: {
        color: "bg-rose-50 text-rose-700 border-rose-200",
        icon: "⚠️",
        label: "Overdue",
        dot: "bg-rose-500",
        ring: "ring-rose-400",
      },
      rejected: {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: "❌",
        label: "Rejected",
        dot: "bg-red-500",
        ring: "ring-red-400",
      },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days left`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "No date set";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleExport = () => {
    const headers = [
      "Title",
      "Priority",
      "Status",
      "Assignee",
      "Deadline",
      "Created At",
    ];
    const rows = filteredTasks.map((t) => [
      t.title,
      t.priority,
      t.status.replace("_", " "),
      t.assignedTo?.fullName || "Unassigned",
      new Date(t.deadline ?? 0).toLocaleDateString(),
      new Date(t.createdAt ?? 0).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported successfully");
  };

  // ============ FILTERED TASKS ============
  const getFilteredTasks = useCallback(() => {
    return tasks
      .filter((task) => {
        if (filter !== "all" && task.status !== filter) return false;
        if (
          searchTerm &&
          !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          return sortOrder === "asc"
            ? new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()
            : new Date(b.deadline ?? 0).getTime() - new Date(a.deadline ?? 0).getTime();
        } else if (sortBy === "priority") {
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          return sortOrder === "asc"
            ? (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
            : (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        } else {
          return sortOrder === "asc"
            ? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
            : new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        }
      });
  }, [tasks, filter, searchTerm, sortBy, sortOrder]);

  const filteredTasks = getFilteredTasks();

  // ============ STATS CARDS ============
  const statCards = [
    {
      label: "Total",
      value: stats.total,
      icon: Layers,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      gradient: "from-gray-400 to-gray-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      gradient: "from-amber-400 to-amber-600",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      gradient: "from-sky-400 to-sky-600",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Send,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      gradient: "from-purple-400 to-purple-600",
    },
    {
      label: "Done",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      gradient: "from-emerald-400 to-emerald-600",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      gradient: "from-rose-400 to-rose-600",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-50",
      gradient: "from-red-400 to-red-600",
    },
  ];

  // Extension stats
  const extensionStats = {
    total: extensionRequests.length,
    pending: extensionRequests.filter(req => req.status === "pending").length,
    approved: extensionRequests.filter(req => req.status === "approved").length,
    rejected: extensionRequests.filter(req => req.status === "rejected").length,
  };

  const myExtensionStats = {
    total: myExtensionRequests.length,
    pending: myExtensionRequests.filter(req => req.status === "pending").length,
    approved: myExtensionRequests.filter(req => req.status === "approved").length,
    rejected: myExtensionRequests.filter(req => req.status === "rejected").length,
  };

  // Show department info for project managers
  const departmentInfo = useMemo(() => {
    const extendedUser = user as ExtendedUser;
    if (isDepartmentManager && extendedUser?.department) {
      return {
        name: extendedUser.department.name,
        code: extendedUser.department.code,
        memberCount: departmentUsers.length,
      };
    }
    return null;
  }, [user, isDepartmentManager, departmentUsers]);

  // ============ RESET TIMER ============
  const handleResetTimer = () => {
    resetTimer();
    toast.success("Timer state reset successfully");
  };

  // ============ LOADING STATE ============
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading tasks...
          </p>
        </div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
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
            <span className="text-gray-700 font-medium">Tasks</span>
          </motion.div>

          {/* Department Info Banner */}
          {isDepartmentManager && departmentInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm border border-indigo-200/50 rounded-xl p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/25">
                  <Building2 size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {departmentInfo.name} Department
                    {departmentInfo.code && ` (${departmentInfo.code})`}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Users size={12} />
                    {departmentInfo.memberCount} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-3 py-1 bg-white/80 rounded-full border border-indigo-200 text-indigo-700 shadow-sm">
                  {isProjectManager ? "Project Manager" : "Department Manager"}
                </span>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <CheckSquare className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Task Workspace
                </h1>
                <span className="ml-2 px-3 py-0.5 text-xs font-medium bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full border border-indigo-200 shadow-sm">
                  {stats.total}
                </span>
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                {isDepartmentManager && departmentInfo
                  ? `Managing tasks for ${departmentInfo.name} department`
                  : "Manage, track, and collaborate on tasks efficiently"}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Download size={14} />
                Export
              </button>
              <div className="flex bg-white/80 backdrop-blur-sm rounded-xl p-0.5 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${viewMode === "grid"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <LayoutGrid size={14} />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${viewMode === "list"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <List size={14} />
                  List
                </button>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
                >
                  <Plus size={16} />
                  Create Task
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4"
          >
            {statCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`${stat.bgColor} rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                  <div
                    className={`w-9 h-9 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-2 h-0.5 w-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2.5 text-sm font-medium transition-all relative ${activeTab === "tasks"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                My Tasks
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                  {stats.total}
                </span>
              </div>
              {activeTab === "tasks" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600"
                />
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("extensions");
                fetchAllExtensionRequests();
                fetchMyExtensionRequests();
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-all relative ${activeTab === "extensions"
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4" />
                Extension Requests
                {canManageExtensions && extensionStats.pending > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                    {extensionStats.pending}
                  </span>
                )}
                {!canManageExtensions && myExtensionStats.pending > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                    {myExtensionStats.pending}
                  </span>
                )}
              </div>
              {activeTab === "extensions" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600"
                />
              )}
            </button>
          </div>

          {activeTab === "tasks" ? (
            <>
              {/* Search & Filters - Tasks */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 relative min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition shadow-sm"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm ${showFilters
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {showFilters ? (
                    <ChevronRight size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="submitted">Submitted</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="createdAt">Sort by Date</option>
                        <option value="deadline">Sort by Deadline</option>
                        <option value="priority">Sort by Priority</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition"
                      >
                        {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                      </button>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilter("all");
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tasks Grid/List View */}
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No tasks found
                  </h3>
                  <p className="text-gray-500">
                    {isDepartmentManager && departmentInfo
                      ? `No tasks found for ${departmentInfo.name} department. Try adjusting your filters or create a new task.`
                      : "Try adjusting your filters or create a new task"}
                  </p>
                  {canManage && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg inline-flex items-center gap-2 shadow-md hover:shadow-lg transition"
                    >
                      <Plus size={16} />
                      Create Task
                    </button>
                  )}
                </motion.div>
              ) : viewMode === "grid" ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  {filteredTasks.map((task, idx) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      idx={idx}
                      user={user}
                      canManage={canManage}
                      canApprove={canApprove}
                      updating={updating}
                      approving={approving}
                      rejecting={rejecting}
                      onUpdateStatus={updateTaskStatus}
                      onApprove={handleApprove}
                      onRejectClick={() => {
                        setSelectedTask(task);
                        setShowRejectModal(true);
                      }}
                      onEdit={openEditModal}
                      onDelete={(id: string) => setShowDeleteConfirm(id)}
                      onStar={toggleStar}
                      onViewDetails={setSelectedTask}
                      getPriorityConfig={getPriorityConfig}
                      getStatusConfig={getStatusConfig}
                      formatDate={formatDate}
                      getRelativeTime={getRelativeTime}
                      onRequestExtension={() => {
                        setSelectedTaskForExtension(task);
                        setShowExtensionModal(true);
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                // List View
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50/80 to-indigo-50/80 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3">
                            <button
                              onClick={toggleAllTasks}
                              className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-indigo-600 transition"
                            >
                              {selectedTasks.size === filteredTasks.length &&
                                selectedTasks.size > 0 ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Task
                          </th>
                          <th className="w-36 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="w-44 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="w-56 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assignee
                          </th>
                          <th className="w-36 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Deadline
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTasks.map((task) => {
                          const isAssignee = isTaskAssignee(task);
                          return (
                            <tr
                              key={task._id}
                              className={`hover:bg-indigo-50/30 transition-colors duration-200 ${selectedTasks.has(task._id)
                                ? "bg-indigo-50/50 border-l-4 border-indigo-500"
                                : ""
                                }`}
                            >
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => toggleTaskSelection(task._id)}
                                  className="p-1 rounded-lg hover:bg-indigo-100 transition"
                                >
                                  {selectedTasks.has(task._id) ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleStar(task._id)}
                                    className="text-gray-400 hover:text-amber-400 transition"
                                  >
                                    <Star
                                      size={14}
                                      className={
                                        task.isStarred
                                          ? "fill-amber-400 text-amber-400"
                                          : ""
                                      }
                                    />
                                  </button>
                                  <div>
                                    <p className="text-gray-800 text-sm font-medium hover:text-indigo-600 transition">
                                      {task.title}
                                    </p>
                                    <p className="text-gray-400 text-xs line-clamp-1">
                                      {task.description}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color} shadow-sm`}
                                >
                                  <span className="mr-1">
                                    {getPriorityConfig(task.priority).icon}
                                  </span>
                                  {task.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(task.status).dot}`}
                                  />
                                  <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color}`}
                                  >
                                    {getStatusConfig(task.status).icon}{" "}
                                    {task.status.replace("_", " ")}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-[10px] font-bold">
                                      {task.assignedTo?.fullName?.charAt(0) || "?"}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {task.assignedTo?.fullName ?? "Unassigned"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${new Date(task.deadline) < new Date() &&
                                    task.status !== "completed"
                                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                                    : "bg-gray-50 text-gray-600 border border-gray-200"
                                    }`}
                                >
                                  {formatDate(task.deadline)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => setSelectedTask(task)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="View Details"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  {canManage && (
                                    <>
                                      <button
                                        onClick={() => openEditModal(task)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      {(isSuperAdmin || isAdmin) && (
                                        <button
                                          onClick={() => setShowDeleteConfirm(task._id)}
                                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                          title="Delete"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {isAssignee && task.status !== "completed" &&
                                    task.status !== "submitted" &&
                                    task.status !== "rejected" && (
                                      <button
                                        onClick={() => handleStartTimer(task._id)}
                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                        title="Start Timer"
                                      >
                                        <Play size={14} />
                                      </button>
                                    )}
                                  <button
                                    onClick={() => {
                                      setSelectedTaskForExtension(task);
                                      setShowExtensionModal(true);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                    title="Request Extension"
                                  >
                                    <CalendarClock size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            // ============ EXTENSION REQUESTS TAB ============
            <div className="space-y-6">
              {/* Extension Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Total Requests</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {canManageExtensions ? extensionStats.total : myExtensionStats.total}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {canManageExtensions ? extensionStats.pending : myExtensionStats.pending}
                  </p>
                  {(canManageExtensions ? extensionStats.pending : myExtensionStats.pending) > 0 && (
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mt-1" />
                  )}
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Approved</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {canManageExtensions ? extensionStats.approved : myExtensionStats.approved}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-4 border border-rose-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-rose-700">
                    {canManageExtensions ? extensionStats.rejected : myExtensionStats.rejected}
                  </p>
                </div>
              </div>

              {/* Extension Filters */}
              {canManageExtensions && (
                <div className="flex flex-wrap gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setExtensionFilter("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${extensionFilter === "all"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    All ({extensionStats.total})
                  </button>
                  <button
                    onClick={() => setExtensionFilter("pending")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${extensionFilter === "pending"
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    Pending ({extensionStats.pending})
                  </button>
                  <button
                    onClick={() => setExtensionFilter("approved")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${extensionFilter === "approved"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    Approved ({extensionStats.approved})
                  </button>
                  <button
                    onClick={() => setExtensionFilter("rejected")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${extensionFilter === "rejected"
                      ? "bg-rose-500 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    Rejected ({extensionStats.rejected})
                  </button>
                  <button
                    onClick={fetchAllExtensionRequests}
                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingExtensions ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              )}

              {/* Extension Requests List */}
              {loadingExtensions && canManageExtensions ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="ml-3 text-gray-500">Loading extension requests...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const requestsToShow = canManageExtensions
                      ? extensionFilter === "all"
                        ? extensionRequests
                        : extensionRequests.filter(req => req.status === extensionFilter)
                      : myExtensionRequests;

                    if (requestsToShow.length === 0) {
                      return (
                        <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <CalendarClock className="w-12 h-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            No extension requests found
                          </h3>
                          <p className="text-gray-500 text-sm max-w-md mx-auto">
                            {canManageExtensions && extensionFilter !== "all"
                              ? `No ${extensionFilter} extension requests at the moment.`
                              : "You haven't submitted any extension requests yet."}
                          </p>
                          {!canManageExtensions && (
                            <button
                              onClick={() => setActiveTab("tasks")}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
                            >
                              <Plus className="w-4 h-4" />
                              Request Extension
                            </button>
                          )}
                        </div>
                      );
                    }

                    return requestsToShow.map((request, index) => {
                      const task = tasks.find(t => t._id === request.taskId) || request.task;
                      const isPending = request.status === "pending";
                      const isApproved = request.status === "approved";
                      const isRejected = request.status === "rejected";
                      const isProcessing = approvingExtension === request._id;

                      return (
                        <motion.div
                          key={request._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`bg-white/80 backdrop-blur-sm rounded-xl p-5 border shadow-sm hover:shadow-md transition-all ${isPending
                            ? "border-amber-200 hover:border-amber-300"
                            : isApproved
                              ? "border-emerald-200 hover:border-emerald-300"
                              : "border-rose-200 hover:border-rose-300"
                            }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border-2 ${isPending
                                    ? "bg-amber-50 border-amber-200 text-amber-700"
                                    : isApproved
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : "bg-rose-50 border-rose-200 text-rose-700"
                                    }`}
                                >
                                  {isPending ? (
                                    <ClockIcon className="w-3 h-3" />
                                  ) : isApproved ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <X className="w-3 h-3" />
                                  )}
                                  {request.status.toUpperCase()}
                                </span>
                                {task && (
                                  <>
                                    <span
                                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border-2 ${getPriorityConfig((task as any).priority || "normal").bg} ${getPriorityConfig((task as any).priority || "normal").border}`}
                                    >
                                      {getPriorityConfig((task as any).priority || "normal").icon}
                                      {((task as any).priority || "NORMAL").toUpperCase()}
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border-2 ${getStatusConfig((task as any).status || "pending").color}`}
                                    >
                                      {(task as any).status?.replace("_", " ") || "PENDING"}
                                    </span>
                                  </>
                                )}
                              </div>

                              <h4 className="text-lg font-semibold text-gray-800">
                                {task ? (task as any).title || "Unknown Task" : "Unknown Task"}
                              </h4>

                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Reason:</span> {request.reason}
                                </p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <span className="text-gray-500">
                                    <span className="font-medium">Current Deadline:</span> {task ? formatDate((task as any).deadline) : "N/A"}
                                  </span>
                                  <span className="text-gray-500">
                                    <span className="font-medium">Requested:</span> {formatDate(request.requestedDate)}
                                  </span>
                                  <span className="text-gray-500">
                                    <span className="font-medium">Submitted:</span> {formatDateTime(request.createdAt)}
                                  </span>
                                  {request.approvedBy && (
                                    <span className="text-gray-500">
                                      <span className="font-medium">Approved By:</span> {request.approvedBy.fullName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {task && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    Assigned to: <span className="font-medium">{(task as any).assignedTo?.fullName || "Unassigned"}</span>
                                  </span>
                                  <Link
                                    href={`/tasks/${(task as any)._id}`}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                                  >
                                    View Task →
                                  </Link>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isPending && canManageExtensions && (
                                <>
                                  <button
                                    onClick={() => {
                                      const taskId = request.taskId || request.task?._id || '';
                                      if (taskId) {
                                        handleApproveExtension(request._id, taskId, request.requestedDate);
                                      } else {
                                        toast.error("Could not find task ID for this request");
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectExtension(request._id)}
                                    disabled={isProcessing}
                                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                    Reject
                                  </button>
                                </>
                              )}
                              {isPending && !canManageExtensions && (
                                <span className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                                  ⏳ Awaiting Approval
                                </span>
                              )}
                              {isApproved && (
                                <span className="text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-4 h-4" />
                                  Approved
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-sm text-rose-600 font-medium bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 flex items-center gap-1">
                                  <X className="w-4 h-4" />
                                  Rejected
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={() => {
          fetchTasks();
          setShowCreateModal(false);
        }}
      />

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-3xl bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${getPriorityConfig(selectedTask.priority).gradient} shadow-md`}
                  >
                    {getPriorityConfig(selectedTask.priority).icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedTask.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold text-black px-2.5 py-1 rounded-full border-2 ${getPriorityConfig(selectedTask.priority).bg} ${getPriorityConfig(selectedTask.priority).border}`}
                      >
                        {selectedTask.priority.toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 ${getStatusConfig(selectedTask.status).color}`}
                      >
                        {selectedTask.status.replace("_", " ").toUpperCase()}
                      </span>

                      {selectedTask.evidenceRequired && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 bg-amber-50 border-amber-200 text-amber-700">
                          <Paperclip className="w-3 h-3" />
                          Evidence Required
                        </span>
                      )}

                      {selectedTask.evidenceUrls && selectedTask.evidenceUrls.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 bg-emerald-50 border-emerald-200 text-emerald-700">
                          <Paperclip className="w-3 h-3" />
                          Evidence ({selectedTask.evidenceUrls.length})
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 bg-gray-50 border-gray-200 text-gray-600">
                        <HistoryIcon className="w-3 h-3" />
                        {getDisplayTimeForTask(
                          selectedTask._id,
                          selectedTask.actualMinutes,
                        )}
                      </span>

                      {isTimerActiveForTask(selectedTask._id) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border-2 bg-indigo-50 border-indigo-200 text-indigo-700">
                          <TimerIcon className="w-3 h-3" />
                          Timer Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedTask.description}</p>
                </div>

                {/* Rejection Reason */}
                {selectedTask.status === "rejected" && selectedTask.rejectionReason && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 rounded-xl border border-red-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <X size={16} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                          ❌ Rejection Reason
                        </p>
                        <p className="text-sm text-red-700 mt-1 leading-relaxed">
                          {selectedTask.rejectionReason}
                        </p>
                        <p className="text-xs text-red-500 mt-2">
                          Please review the feedback and resubmit with improvements.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Approval Note */}
                {selectedTask.status === "completed" && selectedTask.approvalNote && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 rounded-xl border border-emerald-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <ThumbsUp size={16} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                          ✅ Approval Note
                        </p>
                        <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                          {selectedTask.approvalNote}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Evidence Section */}
                {selectedTask.evidenceUrls && selectedTask.evidenceUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Paperclip size={16} className="text-emerald-500" />
                      Evidence ({selectedTask.evidenceUrls.length})
                      {selectedTask.evidenceRequired && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Required
                        </span>
                      )}
                      {selectedTask.status === "submitted" && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Submitted with Evidence
                        </span>
                      )}
                      {selectedTask.status === "completed" && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Approved
                        </span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      {selectedTask.evidenceUrls.map((url: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-200 transition group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Link2 size={14} className="text-emerald-600" />
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-sm text-indigo-600 hover:text-indigo-800 truncate transition"
                          >
                            {url}
                          </a>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition opacity-0 group-hover:opacity-100"
                          >
                            Open
                          </a>
                        </div>
                      ))}
                    </div>
                    {selectedTask.evidenceSubmittedAt && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock size={12} />
                        Evidence submitted on {new Date(selectedTask.evidenceSubmittedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Evidence Required Message */}
                {selectedTask.evidenceRequired && (!selectedTask.evidenceUrls || selectedTask.evidenceUrls.length === 0) && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-700">Evidence Required</p>
                        <p className="text-xs text-amber-600">
                          This task requires evidence to be submitted upon completion.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Project</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {selectedTask.projectId?.name || "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Assigned By</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {selectedTask.assignedBy?.fullName || "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Assigned To</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">
                          {selectedTask.assignedTo?.fullName?.charAt(0) || "?"}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm font-semibold">
                        {selectedTask.assignedTo?.fullName || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Deadline</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold flex items-center gap-2">
                      <CalendarIcon size={14} className="text-gray-400" />
                      {new Date(selectedTask.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Estimated Hours</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {selectedTask.estimatedHours}h
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Time Logged</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {getDisplayTimeForTask(selectedTask._id, selectedTask.actualMinutes)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Created</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {new Date(selectedTask.createdAt || "").toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Last Updated</p>
                    <p className="text-gray-800 text-sm mt-1 font-semibold">
                      {new Date(selectedTask.updatedAt || "").toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Extension Requests for this task */}
                {(() => {
                  const taskExtensions = extensionRequests.filter(req => req.taskId === selectedTask._id);
                  if (taskExtensions.length > 0) {
                    return (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <CalendarClock className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-800">
                            Extension Requests ({taskExtensions.length})
                          </p>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {taskExtensions.map((req) => (
                            <div key={req._id} className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Requested: {formatDate(req.requestedDate)}
                                  </p>
                                  <p className="text-xs text-gray-700 mt-1">{req.reason}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${req.status === "approved"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : req.status === "rejected"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-amber-100 text-amber-700"
                                      }`}
                                  >
                                    {req.status.toUpperCase()}
                                  </span>
                                  // In the task details modal, update the Approve button:
                                  {canApprove && req.status === "pending" && (
                                    <button
                                      onClick={() => {
                                        const taskId = req.taskId || selectedTask?._id || '';
                                        if (taskId) {
                                          handleApproveExtension(req._id, taskId, req.requestedDate);
                                        } else {
                                          toast.error("Could not find task ID for this request");
                                        }
                                      }}
                                      className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] rounded transition"
                                    >
                                      Approve
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Timer Controls */}
                {(() => {
                  const isAssignee = isTaskAssignee(selectedTask);
                  const canShowTimer = isAssignee &&
                    selectedTask.status !== "completed" &&
                    selectedTask.status !== "submitted" &&
                    selectedTask.status !== "rejected";

                  return canShowTimer ? (
                    <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-xl p-4 border border-indigo-100">
                      <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <TimerIcon className="w-4 h-4 text-indigo-600" />
                        Time Tracking
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {isTimerActiveForTask(selectedTask._id) && isTimerValidForCurrentUser() ? (
                          <>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-mono font-bold text-indigo-700 tabular-nums">
                                  {formatTime(timerState.elapsedSeconds)}
                                </span>
                                <span
                                  className={`text-xs font-medium ${isTimerRunning ? "text-emerald-600" : "text-amber-600"}`}
                                >
                                  {isTimerRunning ? "● Running" : "● Paused"}
                                </span>
                                {selectedTask.actualMinutes && selectedTask.actualMinutes > 0 && (
                                  <span className="text-[10px] text-gray-400">(Saved: {selectedTask.actualMinutes}m)</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isTimerRunning ? (
                                <button
                                  onClick={() => {
                                    handlePauseTimer();
                                    setSelectedTask(null);
                                  }}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                  <Pause className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleResumeTimer();
                                    setSelectedTask(null);
                                  }}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleStopTimer(selectedTask._id);
                                  setSelectedTask(null);
                                }}
                                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <span className="text-sm text-gray-500">
                                {selectedTask.actualMinutes
                                  ? `${selectedTask.actualMinutes} minutes logged`
                                  : "No time tracked yet"}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                handleStartTimer(selectedTask._id);
                                setSelectedTask(null);
                              }}
                              className={`px-4 py-2 text-white text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 ${activeTimerTaskId && activeTimerTaskId !== selectedTask._id
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                }`}
                              disabled={!!activeTimerTaskId && activeTimerTaskId !== selectedTask._id}
                              title={
                                activeTimerTaskId && activeTimerTaskId !== selectedTask._id
                                  ? "Another task timer is running"
                                  : "Start Timer"
                              }
                            >
                              <Play className="w-4 h-4" />
                              Start Timer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      handleStatusChange(selectedTask._id, e.target.value);
                      setSelectedTask(null);
                    }}
                    disabled={
                      updatingStatus === selectedTask._id ||
                      isCompleting === selectedTask._id ||
                      isSubmitting === selectedTask._id
                    }
                    className="cursor-pointer flex-1 min-w-[120px] px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {selectedTask.status === "rejected" && isTaskAssignee(selectedTask) && (
                    <button
                      onClick={() => {
                        handleSendForRework(selectedTask._id);
                        setSelectedTask(null);
                      }}
                      disabled={isReworking === selectedTask._id}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {isReworking === selectedTask._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Send for Rework
                    </button>
                  )}

                  {isTaskAssignee(selectedTask) &&
                    selectedTask.status !== "completed" &&
                    selectedTask.status !== "submitted" &&
                    selectedTask.status !== "rejected" && (
                      <>
                        <button
                          onClick={() => {
                            handleSubmitForReview(selectedTask._id);
                            setSelectedTask(null);
                          }}
                          disabled={isSubmitting === selectedTask._id}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmitting === selectedTask._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                          Submit Review
                        </button>
                        <button
                          onClick={() => {
                            handleMarkComplete(selectedTask._id);
                            setSelectedTask(null);
                          }}
                          disabled={isCompleting === selectedTask._id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {isCompleting === selectedTask._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          Complete
                        </button>
                      </>
                    )}

                  {selectedTask.status === "submitted" && canApprove && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedTask._id);
                          setSelectedTask(null);
                        }}
                        disabled={approving}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                      >
                        {approving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ThumbsUp size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTask(selectedTask);
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <ThumbsDown size={16} />
                        Reject
                      </button>
                    </>
                  )}

                  {isTaskAssignee(selectedTask) &&
                    selectedTask.status !== "completed" &&
                    selectedTask.status !== "submitted" &&
                    selectedTask.status !== "rejected" && (
                      <button
                        onClick={() => {
                          setSelectedTaskForExtension(selectedTask);
                          setShowExtensionModal(true);
                          setSelectedTask(null);
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <CalendarClock size={16} />
                        Request Extension
                      </button>
                    )}

                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex-1 min-w-[80px]"
                  >
                    Close
                  </button>

                  <Link
                    href={`/tasks/${selectedTask._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition flex items-center gap-2 border border-indigo-200"
                  >
                    <Eye size={16} />
                    View Full Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Extension Request Modal */}
      <AnimatePresence>
        {showExtensionModal && selectedTaskForExtension && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                    <CalendarClock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Request Deadline Extension</h3>
                    <p className="text-xs text-gray-500">{selectedTaskForExtension.title}</p>
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-4">
                  Request a new deadline for this task. Your manager will review the request.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={extensionData.requestedDate}
                    onChange={(e) =>
                      setExtensionData({
                        ...extensionData,
                        requestedDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Current deadline: {formatDate(selectedTaskForExtension.deadline)}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={extensionData.reason}
                    onChange={(e) =>
                      setExtensionData({
                        ...extensionData,
                        reason: e.target.value,
                      })
                    }
                    placeholder="Explain why you need an extension..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRequestExtension}
                    disabled={submittingExtension}
                    className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {submittingExtension ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock size={14} />}
                    Submit Request
                  </button>
                  <button
                    onClick={() => {
                      setShowExtensionModal(false);
                      setExtensionData({ requestedDate: "", reason: "" });
                      setSelectedTaskForExtension(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowRejectModal(false);
              setRejectionReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                    <ThumbsDown className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Reject Task
                    </h3>
                    <p className="text-xs text-gray-500">
                      Provide feedback for the assignee
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this task is being rejected..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This feedback will be sent to the assignee.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (selectedTask) {
                        handleReject(selectedTask._id);
                      }
                    }}
                    disabled={rejecting || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {rejecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ThumbsDown size={14} />
                        Reject Task
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                    }}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Delete Task
                </h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete this task? This action cannot
                  be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (showDeleteConfirm) {
                        handleDeleteTask(showDeleteConfirm);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Modal */}
      <AnimatePresence>
        {isBulkDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsBulkDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Delete Multiple Tasks
                </h3>
                <p className="text-gray-500 mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-rose-600">
                    {selectedTasks.size}
                  </span>{" "}
                  tasks? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isBulkDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Delete All"
                    )}
                  </button>
                  <button
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Edit Task
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={editFormData.priority}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            priority: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editFormData.status}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="submitted">Submitted</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={editFormData.deadline}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            deadline: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        value={editFormData.estimatedHours}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            estimatedHours: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assign To
                      </label>
                      <select
                        value={editFormData.assignedTo}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            assignedTo: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="">Select Assignee</option>
                        {getAvailableUsers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.fullName} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project
                      </label>
                      <select
                        value={editFormData.projectId}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            projectId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      >
                        <option value="">Select Project</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleUpdateTask}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition shadow-md"
                  >
                    Update Task
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ TASK CARD COMPONENT ============
function TaskCard({
  task,
  idx,
  user,
  canManage,
  canApprove,
  updating,
  approving,
  rejecting,
  onUpdateStatus,
  onApprove,
  onRejectClick,
  onEdit,
  onDelete,
  onStar,
  onViewDetails,
  onRequestExtension,
  getPriorityConfig,
  getStatusConfig,
  formatDate,
  getRelativeTime,
}: any) {
  const isAssignee = task.assignedTo?._id === user?._id;
  const isOverdue =
    new Date(task.deadline) < new Date() && task.status !== "completed";
  const isRejected = task.status === "rejected";
  const hasEvidence = task.evidenceUrls && task.evidenceUrls.length > 0;
  const rejectionReason = task.rejectionReason || "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.05 }}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/50 shadow-md overflow-hidden ${isRejected
        ? "border-red-200 hover:border-red-300"
        : "border-gray-200 hover:border-indigo-300"
        }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-700 pointer-events-none" />

      <div
        className={`h-1 bg-gradient-to-r ${isRejected
          ? "from-red-400 to-red-600"
          : getPriorityConfig(task.priority).gradient
          }`}
      />

      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color} shadow-sm flex items-center gap-1`}
            >
              <span>{getPriorityConfig(task.priority).icon}</span>
              {task.priority.toUpperCase()}
            </span>
            <span
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color} shadow-sm flex items-center gap-1`}
            >
              <span>{getStatusConfig(task.status).icon}</span>
              {task.status.replace("_", " ").toUpperCase()}
            </span>

            {hasEvidence && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-1">
                <Paperclip size={10} />
                Evidence ({task.evidenceUrls.length})
              </span>
            )}

            {isRejected && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 flex items-center gap-1 animate-pulse">
                <X size={10} />
                Rejected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStar(task._id)}
              className="p-1.5 text-gray-300 hover:text-amber-400 transition-all hover:scale-110"
            >
              <Star
                size={14}
                className={`transition-all ${task.isStarred ? "fill-amber-400 text-amber-400" : ""
                  }`}
              />
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                >
                  <Edit2 size={12} />
                </button>
                {/* Delete button - Only for Super Admin and Admin */}
                {user?.role === "super_admin" || user?.role === "admin" ? (
                  <button
                    onClick={() => onDelete(task._id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  >
                    <Trash2 size={12} />
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        <h3 className="text-gray-800 font-semibold text-base mb-2 line-clamp-2 group-hover:text-indigo-600 transition-all duration-300">
          {task.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>

        {isRejected && rejectionReason && (
          <div className="mb-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle
                size={14}
                className="text-red-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs font-medium text-red-700">
                  Rejection Reason
                </p>
                <p className="text-xs text-red-600 mt-0.5 line-clamp-2">
                  {rejectionReason}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {task.projectId && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/50">
              <Briefcase size={10} />
              <span>{task.projectId.name}</span>
            </div>
          )}
          {isOverdue && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/50 animate-pulse">
              <AlertCircle size={10} />
              <span>Overdue</span>
            </div>
          )}
          {hasEvidence && (
            <div className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
              <Paperclip size={10} />
              <span>Has Evidence</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
                <span className="text-white text-[10px] font-bold">
                  {task.assignedTo?.fullName?.charAt(0) || "?"}
                </span>
              </div>
              {task.assignedTo?._id === user?._id && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <p className="text-gray-800 text-[11px] font-medium leading-tight">
                {task.assignedTo?.fullName || "Unassigned"}
              </p>
              <p className="text-gray-400 text-[9px] flex items-center gap-1">
                <ClockIcon size={8} />
                {getRelativeTime(task.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <Calendar size={10} />
              <span className={isOverdue ? "text-rose-500 font-semibold" : ""}>
                {formatDate(task.deadline)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100/80">
          {task.status === "pending" && (
            <button
              onClick={() => onUpdateStatus(task._id, "in_progress")}
              disabled={updating}
              className="flex-1 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 hover:from-indigo-600 hover:to-indigo-700 text-indigo-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-indigo-200/50 hover:border-transparent shadow-sm hover:shadow-md"
            >
              <Play size={12} />
              Start            </button>
          )}

          {task.status === "in_progress" && (
            <button
              onClick={() => onUpdateStatus(task._id, "submitted")}
              disabled={updating}
              className="flex-1 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-600 hover:to-purple-700 text-purple-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-purple-200/50 hover:border-transparent shadow-sm hover:shadow-md"
            >
              <Send size={12} />
              Submit
            </button>
          )}

          {task.status === "submitted" && canApprove && (
            <>
              <button
                onClick={() => onApprove(task._id)}
                disabled={approving}
                className="flex-1 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 hover:from-emerald-600 hover:to-emerald-700 text-emerald-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-emerald-200/50 hover:border-transparent shadow-sm hover:shadow-md"
              >
                <ThumbsUp size={12} />
                Approve
              </button>
              <button
                onClick={() => onRejectClick(task)}
                className="flex-1 py-1.5 bg-gradient-to-r from-rose-50 to-rose-100/50 hover:from-rose-600 hover:to-rose-700 text-rose-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-rose-200/50 hover:border-transparent shadow-sm hover:shadow-md"
              >
                <ThumbsDown size={12} />
                Reject
              </button>
            </>
          )}

          {task.status === "rejected" && (
            <button
              onClick={() => onUpdateStatus(task._id, "pending")}
              disabled={updating}
              className="flex-1 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-600 hover:to-amber-700 text-amber-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 border border-amber-200/50 hover:border-transparent shadow-sm hover:shadow-md"
            >
              <RefreshCw size={12} />
              Rework
            </button>
          )}

          <button
            onClick={() => onViewDetails(task)}
            className="py-1.5 px-3 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-200 hover:to-gray-300 text-gray-700 text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-gray-200/50 hover:border-transparent shadow-sm hover:shadow-md"
          >
            <Eye size={12} />
            View
          </button>
          <Link
            href={`/tasks/${task._id}`}
            className="py-1.5 px-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-600 hover:to-purple-600 text-indigo-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-indigo-200/50 hover:border-transparent shadow-sm hover:shadow-md"
          >
            <ExternalLink size={12} />
            Details
          </Link>
          {isAssignee && task.status !== "completed" &&
            task.status !== "submitted" &&
            task.status !== "rejected" && (
              <button
                onClick={() => onRequestExtension(task)}
                className="py-1.5 px-3 bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-600 hover:to-amber-700 text-amber-600 hover:text-white text-[11px] font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 border border-amber-200/50 hover:border-transparent shadow-sm hover:shadow-md"
              >
                <CalendarClock size={12} />
                Extend
              </button>
            )}
        </div>
      </div>
    </motion.div>
  );
}