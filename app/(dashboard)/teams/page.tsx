"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  X,
  Loader2,
  Building,
  RefreshCw,
  UserPlus,
  ChevronDown,
  LayoutGrid,
  List,
  MoreVertical,
  Mail,
  User,
  Calendar,
  Briefcase,
  Filter,
  SortAsc,
  SortDesc,
  Check,
  AlertCircle,
  UserCircle,
  Phone,
  MapPin,
  Star,
  Crown,
  Shield,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { teamAPI } from "@/lib/team.api";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Team, TeamFormData } from "@/types/team.types";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { userAPI } from "@/lib/user.api";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  profilePhoto?: string;
  isActive?: boolean;
  department?: string;
  position?: string;
}

type ViewMode = "grid" | "table";
type SortField = "name" | "members" | "status" | "department";
type SortOrder = "asc" | "desc";

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_OPTIONS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status", color: "text-gray-500" },
  { value: "active", label: "Active", color: "text-emerald-500" },
  { value: "inactive", label: "Inactive", color: "text-gray-400" },
];

const SORT_OPTIONS: {
  value: SortField;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "name", label: "Name", icon: SortAsc },
  { value: "members", label: "Members", icon: Users },
  { value: "status", label: "Status", icon: CheckCircle },
  { value: "department", label: "Department", icon: Building },
];

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TeamsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // ===== STATE =====
  // Data
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement | null>(null);
  const isDataFetched = useRef(false);

  // Form State
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    description: "",
    department: "",
    lead: "",
    members: [],
    status: "active",
    color: "#6366f1",
    icon: "users",
  });

  // ===== DEBOUNCED SEARCH =====
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ===== REFS =====
  const modalRef = useRef<HTMLDivElement>(null);

  // ===== SIDE EFFECTS =====
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== DATA FETCHING =====


const fetchTeams = useCallback(async () => {
  try {
    const response = await teamAPI.getAllTeams();
    if (response.success) {
      setTeams(response.data);
    }
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }
}, []);
const fetchAllData = async () => {
  try {
    setLoading(true);
    await Promise.all([
      (async () => {
        const response = await teamAPI.getAllTeams();
        if (response.success) setTeams(response.data);
      })(),
      (async () => {
        const response = await api.get("/departments");
        if (response.data && response.data.success) setDepartments(response.data.data);
      })(),
      (async () => {
        const response = await userAPI.getAllUsers();
        if (response.success) setUsers(response.data);
      })(),
    ]);
  } catch (error) {
    console.error("Error fetching data:", error);
    toast.error("Failed to load data");
  } finally {
    setLoading(false);
  }
};

// In useEffect
useEffect(() => {
  fetchAllData();
}, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Fallback: extract departments from teams
      const depts = Array.from(new Set(teams.map((t) => t.department)));
      setDepartments(
        depts.map((name) => ({
          _id: name,
          name,
          code: name.toUpperCase().slice(0, 3),
        })),
      );
    }
  }, [teams]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/users");
      if (response.data.success && response.data.data) {
        setUsers(response.data.data);
      } else if (user) {
        setUsers([
          {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      if (user) {
        setUsers([
          {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: true,
          },
        ]);
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [user]);

  // ===== DATA PROCESSING =====
  const filteredAndSortedTeams = useMemo(() => {
    let result = teams;

    // Search filter
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(
        (team) =>
          team.name.toLowerCase().includes(search) ||
          (team.description &&
            team.description.toLowerCase().includes(search)) ||
          team.department.toLowerCase().includes(search),
      );
    }

    // Department filter
    if (filterDepartment !== "all") {
      result = result.filter((team) => team.department === filterDepartment);
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((team) => team.status === filterStatus);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "members":
          comparison = (a.teamSize || 0) - (b.teamSize || 0);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "department":
          comparison = a.department.localeCompare(b.department);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    teams,
    debouncedSearch,
    filterDepartment,
    filterStatus,
    sortField,
    sortOrder,
  ]);

  // ===== STATS =====
  const stats = useMemo(
    () => ({
      total: teams.length,
      active: teams.filter((t) => t.status === "active").length,
      members: teams.reduce((acc, team) => acc + (team.teamSize || 0), 0),
      departments: departments.length,
    }),
    [teams, departments],
  );

  // ===== HELPERS =====
  const getDepartmentName = useCallback(
    (deptId: string) => {
      const dept = departments.find(
        (d) => d._id === deptId || d.name === deptId,
      );
      return dept?.name || deptId || "Unknown";
    },
    [departments],
  );

  const getUserDisplayName = useCallback((user: User) => {
    return user.fullName || user.email || "Unknown";
  }, []);

  const getInitials = useCallback((name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "active":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "inactive":
        return "text-gray-500 bg-gray-50 border-gray-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  }, []);

  const getStatusDotColor = useCallback((status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "inactive":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  }, []);

  // ===== CRUD OPERATIONS =====
  const handleCreateTeam = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim()) {
        toast.error("Team name is required");
        return;
      }
      if (!formData.department) {
        toast.error("Department is required");
        return;
      }
      if (!formData.lead) {
        toast.error("Team lead is required");
        return;
      }

      try {
        const response = await teamAPI.createTeam(formData);
        if (response.success) {
          toast.success("Team created successfully!");
          setShowCreateModal(false);
          setFormData({
            name: "",
            description: "",
            department: "",
            lead: "",
            members: [],
            status: "active",
            color: "#6366f1",
            icon: "users",
          });
          setMemberSearch("");
          await fetchTeams();
        }
      } catch (error: any) {
        console.error("Error creating team:", error);
        toast.error(error.response?.data?.message || "Failed to create team");
      }
    },
    [formData, fetchTeams],
  );

  const handleUpdateTeam = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTeamId) return;
      if (!formData.name.trim()) {
        toast.error("Team name is required");
        return;
      }

      try {
        const response = await teamAPI.updateTeam(selectedTeamId, formData);
        if (response.success) {
          toast.success("Team updated successfully!");
          setShowEditModal(false);
          setSelectedTeamId(null);
          await fetchTeams();
        }
      } catch (error: any) {
        console.error("Error updating team:", error);
        toast.error(error.response?.data?.message || "Failed to update team");
      }
    },
    [selectedTeamId, formData, fetchTeams],
  );

  const handleDeleteTeam = useCallback((id: string) => {
    setTeamToDelete(id);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!teamToDelete) return;
    try {
      const response = await teamAPI.deleteTeam(teamToDelete);
      if (response.success) {
        toast.success("Team deleted successfully!");
        setShowDeleteConfirm(false);
        setTeamToDelete(null);
        await fetchTeams();
      }
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    }
  }, [teamToDelete, fetchTeams]);

  const handleAddMembers = useCallback(async () => {
    if (!selectedTeamId || selectedMembers.length === 0) {
      toast.error("Please select members to add");
      return;
    }
    try {
      const response = await teamAPI.addMembers(
        selectedTeamId,
        selectedMembers,
      );
      if (response.success) {
        toast.success("Members added successfully!");
        setShowMembersModal(false);
        setSelectedMembers([]);
        await fetchTeams();
      }
    } catch (error) {
      console.error("Error adding members:", error);
      toast.error("Failed to add members");
    }
  }, [selectedTeamId, selectedMembers, fetchTeams]);

  const handleRemoveMember = useCallback(
    async (teamId: string, memberId: string) => {
      if (!window.confirm("Are you sure you want to remove this member?"))
        return;
      try {
        const response = await teamAPI.removeMember(teamId, memberId);
        if (response.success) {
          toast.success("Member removed successfully!");
          await fetchTeams();
        }
      } catch (error) {
        console.error("Error removing member:", error);
        toast.error("Failed to remove member");
      }
    },
    [fetchTeams],
  );

  // ===== RENDER HELPERS =====
  const renderStatCard = useCallback(
    (
      icon: React.ReactNode,
      label: string,
      value: string | number,
      color: string,
    ) => (
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 bg-gradient-to-br ${color} rounded-xl`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </motion.div>
    ),
    [],
  );

  const renderTeamCard = useCallback(
    (team: Team) => (
      <motion.div
        key={team._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-indigo-200/50 transition-all duration-300"
      >
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg"
                style={{ backgroundColor: team.color || "#6366f1" }}
              >
                {getInitials(team.name)}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Building className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">
                    {getDepartmentName(team.department)}
                  </span>
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 border ${getStatusColor(
                team.status,
              )}`}
            >
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(
                    team.status,
                  )} ${team.status === "active" ? "animate-pulse" : ""}`}
                />
                {team.status === "active" ? "Active" : "Inactive"}
              </span>
            </span>
          </div>

          {team.description && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
              {team.description}
            </p>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50/80 px-3 py-1.5 rounded-xl">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">{team.teamSize || 0} members</span>
            </div>
            {team.lead && typeof team.lead === "object" && (
              <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50/80 px-3 py-1.5 rounded-xl min-w-0">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="truncate">
                  {team.lead.fullName || "Unknown"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedTeamId(team._id);
                setShowMembersModal(true);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transition-all duration-200"
            >
              Manage Members
            </button>
            <button
              onClick={() => {
                setSelectedTeamId(team._id);
                setFormData({
                  name: team.name,
                  description: team.description || "",
                  department: team.department,
                  lead:
                    typeof team.lead === "object" ? team.lead._id : team.lead,
                  members: team.members.map((m) =>
                    typeof m === "object" ? m._id : m,
                  ),
                  status: team.status,
                  color: team.color || "#6366f1",
                  icon: team.icon || "users",
                });
                setShowEditModal(true);
              }}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTeam(team._id)}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    ),
    [
      getInitials,
      getDepartmentName,
      getStatusColor,
      getStatusDotColor,
      handleDeleteTeam,
    ],
  );

  const renderTeamTableRow = useCallback(
    (team: Team) => (
      <tr
        key={team._id}
        className="hover:bg-indigo-50/30 transition-colors group"
      >
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: team.color || "#6366f1" }}
            >
              {getInitials(team.name)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{team.name}</p>
              {team.description && (
                <p className="text-sm text-gray-500 truncate max-w-xs">
                  {team.description}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
            <Building className="w-3 h-3" />
            {getDepartmentName(team.department)}
          </span>
        </td>
        <td className="px-6 py-4">
          {team.lead && typeof team.lead === "object" ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                {getInitials(team.lead.fullName || "Unknown")}
              </div>
              <span className="text-sm text-gray-700">
                {team.lead.fullName || "Unknown"}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {team.teamSize || 0}
            </span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(
              team.status,
            )}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(
                team.status,
              )}`}
            />
            {team.status === "active" ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => {
                setSelectedTeamId(team._id);
                setShowMembersModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Manage Members"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedTeamId(team._id);
                setFormData({
                  name: team.name,
                  description: team.description || "",
                  department: team.department,
                  lead:
                    typeof team.lead === "object" ? team.lead._id : team.lead,
                  members: team.members.map((m) =>
                    typeof m === "object" ? m._id : m,
                  ),
                  status: team.status,
                  color: team.color || "#6366f1",
                  icon: team.icon || "users",
                });
                setShowEditModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Team"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteTeam(team._id)}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Team"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    ),
    [
      getInitials,
      getDepartmentName,
      getStatusColor,
      getStatusDotColor,
      handleDeleteTeam,
    ],
  );

  // ===== LOADING & AUTH =====
  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading teams...</p>
          <p className="text-sm text-gray-400">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    router.push("/login");
    return null;
  }

  // ===== MAIN RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Teams
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400" />
              Manage and organize your teams
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 font-medium"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create Team
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          {renderStatCard(
            <Users className="w-5 h-5 text-indigo-600" />,
            "Total Teams",
            stats.total,
            "from-indigo-50 to-indigo-100/50",
          )}
          {renderStatCard(
            <UserCheck className="w-5 h-5 text-emerald-600" />,
            "Active Teams",
            stats.active,
            "from-emerald-50 to-emerald-100/50",
          )}
          {renderStatCard(
            <UserPlus className="w-5 h-5 text-purple-600" />,
            "Total Members",
            stats.members,
            "from-purple-50 to-purple-100/50",
          )}
          {renderStatCard(
            <Building className="w-5 h-5 text-blue-600" />,
            "Departments",
            stats.departments,
            "from-blue-50 to-blue-100/50",
          )}
        </motion.div>

        {/* Filters & View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 min-w-[140px]"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 min-w-[120px]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 min-w-[120px]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>

              {/* Sort Order Toggle */}
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterDepartment("all");
                  setFilterStatus("all");
                  setSortField("name");
                  setSortOrder("asc");
                }}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Reset Filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Teams Display */}
        <AnimatePresence mode="wait">
          {filteredAndSortedTeams.length > 0 ? (
            viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredAndSortedTeams.map(renderTeamCard)}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Team
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Lead
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Members{" "}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAndSortedTeams.map(renderTeamTableRow)}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 bg-white rounded-2xl border border-gray-100/80"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No teams found
              </h3>
              <p className="text-gray-500 mt-1">
                {debouncedSearch ||
                filterDepartment !== "all" ||
                filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first team to get started"}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                Create Team
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== MODALS ===== */}
      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal
            title="Create New Team"
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTeam}
            submitLabel="Create Team"
          >
            <TeamForm
              formData={formData}
              setFormData={setFormData}
              departments={departments}
              users={users}
              memberSearch={memberSearch}
              setMemberSearch={setMemberSearch}
              isMemberDropdownOpen={isMemberDropdownOpen}
              setIsMemberDropdownOpen={setIsMemberDropdownOpen}
              memberDropdownRef={memberDropdownRef}
              selectedMembersList={users.filter((u) =>
                formData.members.includes(u._id),
              )}
              filteredAvailableMembers={users.filter(
                (u) =>
                  !formData.members.includes(u._id) &&
                  u._id !== formData.lead &&
                  (u.fullName
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(memberSearch.toLowerCase())),
              )}
              toggleMember={(userId) => {
                setFormData((prev) => ({
                  ...prev,
                  members: prev.members.includes(userId)
                    ? prev.members.filter((id) => id !== userId)
                    : [...prev.members, userId],
                }));
              }}
              removeMember={(userId) => {
                setFormData((prev) => ({
                  ...prev,
                  members: prev.members.filter((id) => id !== userId),
                }));
              }}
              colorOptions={COLOR_OPTIONS}
              getUserDisplayName={getUserDisplayName}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Team Modal */}
      <AnimatePresence>
        {showEditModal && selectedTeamId && (
          <Modal
            title="Edit Team"
            onClose={() => {
              setShowEditModal(false);
              setSelectedTeamId(null);
            }}
            onSubmit={handleUpdateTeam}
            submitLabel="Update Team"
          >
            <TeamForm
              formData={formData}
              setFormData={setFormData}
              departments={departments}
              users={users}
              memberSearch={memberSearch}
              setMemberSearch={setMemberSearch}
              isMemberDropdownOpen={isMemberDropdownOpen}
              setIsMemberDropdownOpen={setIsMemberDropdownOpen}
              memberDropdownRef={memberDropdownRef}
              selectedMembersList={users.filter((u) =>
                formData.members.includes(u._id),
              )}
              filteredAvailableMembers={users.filter(
                (u) =>
                  !formData.members.includes(u._id) &&
                  u._id !== formData.lead &&
                  (u.fullName
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase()) ||
                    u.email.toLowerCase().includes(memberSearch.toLowerCase())),
              )}
              toggleMember={(userId) => {
                setFormData((prev) => ({
                  ...prev,
                  members: prev.members.includes(userId)
                    ? prev.members.filter((id) => id !== userId)
                    : [...prev.members, userId],
                }));
              }}
              removeMember={(userId) => {
                setFormData((prev) => ({
                  ...prev,
                  members: prev.members.filter((id) => id !== userId),
                }));
              }}
              colorOptions={COLOR_OPTIONS}
              getUserDisplayName={getUserDisplayName}
              showStatus
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Members Modal */}
      <AnimatePresence>
        {showMembersModal && selectedTeamId && (
          <MembersModal
            team={teams.find((t) => t._id === selectedTeamId)}
            users={users}
            selectedMembers={selectedMembers}
            setSelectedMembers={setSelectedMembers}
            memberSearch={memberSearch}
            setMemberSearch={setMemberSearch}
            onClose={() => {
              setShowMembersModal(false);
              setSelectedTeamId(null);
              setSelectedMembers([]);
              setMemberSearch("");
            }}
            onAddMembers={handleAddMembers}
            onRemoveMember={handleRemoveMember}
            getInitials={getInitials}
            getUserDisplayName={getUserDisplayName}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <ConfirmModal
            title="Delete Team"
            message="Are you sure you want to delete this team? This action cannot be undone and all team data will be permanently removed."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={confirmDelete}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setTeamToDelete(null);
            }}
            type="danger"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// ===== MODAL COMPONENT =====
interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

function Modal({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel,
  isSubmitting,
}: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={onSubmit}>
            {children}
            {onSubmit && (
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    submitLabel || "Submit"
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ===== TEAM FORM COMPONENT =====
interface TeamFormProps {
  formData: TeamFormData;
  setFormData: React.Dispatch<React.SetStateAction<TeamFormData>>;
  departments: Department[];
  users: User[];
  memberSearch: string;
  setMemberSearch: (value: string) => void;
  isMemberDropdownOpen: boolean;
  setIsMemberDropdownOpen: (value: boolean) => void;
  memberDropdownRef: React.RefObject<HTMLDivElement | null>;
  selectedMembersList: User[];
  filteredAvailableMembers: User[];
  toggleMember: (userId: string) => void;
  removeMember: (userId: string) => void;
  colorOptions: string[];
  getUserDisplayName: (user: User) => string;
  showStatus?: boolean;
}

function TeamForm({
  formData,
  setFormData,
  departments,
  users,
  memberSearch,
  setMemberSearch,
  isMemberDropdownOpen,
  setIsMemberDropdownOpen,
  memberDropdownRef,
  selectedMembersList,
  filteredAvailableMembers,
  toggleMember,
  removeMember,
  colorOptions,
  getUserDisplayName,
  showStatus = false,
}: TeamFormProps) {
  return (
    <div className="space-y-4">
      {/* Team Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Team Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="Enter team name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          placeholder="Enter team description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none text-gray-900 placeholder:text-gray-400"
          rows={3}
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Department <span className="text-rose-500">*</span>
        </label>
        <select
          required
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept.name}>
              {dept.name} {dept.code ? `(${dept.code})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Team Lead */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Team Lead <span className="text-rose-500">*</span>
        </label>
        <select
          required
          value={formData.lead}
          onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900"
        >
          <option value="">Select Team Lead</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {getUserDisplayName(user)} ({user.email})
              {user.role && ` - ${user.role.replace("_", " ").toUpperCase()}`}
            </option>
          ))}
        </select>
      </div>

      {/* Color Theme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Color Theme
        </label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-9 h-9 rounded-full transition-all ${
                formData.color === color
                  ? "ring-2 ring-offset-2 ring-indigo-600 scale-110 shadow-md"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Status (Edit mode only) */}
      {showStatus && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "active" | "inactive",
              })
            }
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      {/* Members Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Members
        </label>
        <div ref={memberDropdownRef} className="relative">
          <div
            className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-xl bg-gray-50 min-h-[44px] cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500"
            onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
          >
            {selectedMembersList.length > 0 ? (
              selectedMembersList.map((member) => (
                <span
                  key={member._id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-lg"
                >
                  <span>{getUserDisplayName(member)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMember(member._id);
                    }}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Select members...</span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <span className="text-xs text-gray-400">
                {selectedMembersList.length} selected
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isMemberDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {isMemberDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-400"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-48 overflow-y-auto p-1">
                {filteredAvailableMembers.length > 0 ? (
                  filteredAvailableMembers.map((member) => (
                    <div
                      key={member._id}
                      onClick={() => toggleMember(member._id)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.members.includes(member._id)}
                        onChange={() => {}}
                        className="w-4 h-4 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getUserDisplayName(member)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.email}
                        </p>
                      </div>
                      {member.role && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {member.role.replace("_", " ").toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    {memberSearch ? "No members found" : "No available members"}
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>{filteredAvailableMembers.length} available</span>
                <button
                  type="button"
                  onClick={() => setIsMemberDropdownOpen(false)}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Click to open dropdown, search to filter, click to select/deselect
        </p>
      </div>
    </div>
  );
}

// ===== MEMBERS MODAL COMPONENT =====
interface MembersModalProps {
  team?: Team;
  users: User[];
  selectedMembers: string[];
  setSelectedMembers: (value: string[]) => void;
  memberSearch: string;
  setMemberSearch: (value: string) => void;
  onClose: () => void;
  onAddMembers: () => void;
  onRemoveMember: (teamId: string, memberId: string) => void;
  getInitials: (name: string) => string;
  getUserDisplayName: (user: User) => string;
}

function MembersModal({
  team,
  users,
  selectedMembers,
  setSelectedMembers,
  memberSearch,
  setMemberSearch,
  onClose,
  onAddMembers,
  onRemoveMember,
  getInitials,
  getUserDisplayName,
}: MembersModalProps) {
  const availableMembers = useMemo(() => {
    if (!team) return [];
    const memberIds = team.members.map((m) =>
      typeof m === "object" ? m._id : m,
    );
    return users.filter((user) => {
      if (memberIds.includes(user._id)) return false;
      if (team.lead && typeof team.lead === "object" && "_id" in team.lead) {
        if (user._id === team.lead._id) return false;
      }
      const searchLower = memberSearch.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });
  }, [team, users, memberSearch]);

  const currentMembers = useMemo(() => {
    if (!team) return [];
    return team.members
      .map((m) => (typeof m === "object" ? m : null))
      .filter((m) => m !== null) as User[];
  }, [team]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Manage Members
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Current Members */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Current Members ({currentMembers.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {currentMembers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No members in this team
                </p>
              ) : (
                currentMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-medium flex-shrink-0">
                        {getInitials(member.fullName || "Unknown")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.fullName || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        team && onRemoveMember(team._id, member._id)
                      }
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Members */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Add Members
            </h3>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 max-h-48 overflow-y-auto">
              {availableMembers.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  {memberSearch
                    ? "No members match your search"
                    : "No available members to add"}
                </div>
              ) : (
                availableMembers.map((user) => {
                  const isSelected = selectedMembers.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => {
                        setSelectedMembers(
                          isSelected
                            ? selectedMembers.filter((id) => id !== user._id)
                            : [...selectedMembers, user._id],
                        );
                      }}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50 hover:bg-indigo-100"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 border-gray-300 rounded focus:ring-indigo-500 text-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      {user.role && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full flex-shrink-0">
                          {user.role.replace("_", " ").toUpperCase()}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">
                {selectedMembers.length} member
                {selectedMembers.length !== 1 ? "s" : ""} selected
              </span>
              {selectedMembers.length > 0 && (
                <button
                  onClick={() => setSelectedMembers([])}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <button
              onClick={onAddMembers}
              disabled={selectedMembers.length === 0}
              className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-500/25"
            >
              Add Selected Members ({selectedMembers.length})
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ===== CONFIRM MODAL COMPONENT =====
interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmModalProps) {
  const getColors = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "from-rose-50 to-rose-100",
          iconColor: "text-rose-600",
          buttonBg: "from-rose-600 to-rose-500",
          buttonHover: "from-rose-700 to-rose-600",
          shadow: "shadow-rose-500/25",
        };
      case "warning":
        return {
          iconBg: "from-amber-50 to-amber-100",
          iconColor: "text-amber-600",
          buttonBg: "from-amber-600 to-amber-500",
          buttonHover: "from-amber-700 to-amber-600",
          shadow: "shadow-amber-500/25",
        };
      default:
        return {
          iconBg: "from-blue-50 to-blue-100",
          iconColor: "text-blue-600",
          buttonBg: "from-blue-600 to-blue-500",
          buttonHover: "from-blue-700 to-blue-600",
          shadow: "shadow-blue-500/25",
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-2.5 bg-gradient-to-br ${colors.iconBg} rounded-xl`}
            >
              <Trash2 className={`w-6 h-6 ${colors.iconColor}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${colors.buttonBg} text-white rounded-xl hover:${colors.buttonHover} transition-colors font-medium shadow-lg ${colors.shadow}`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 cursor-pointer"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
