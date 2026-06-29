"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
} from "lucide-react";
import { teamAPI } from "@/lib/team.api";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Team, TeamFormData } from "@/types/team.types";
import { useAuth } from "@/contexts/AuthContext";

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  profilePhoto?: string;
  isActive?: boolean;
}

type ViewMode = "grid" | "table";

export default function TeamsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Member multi-select state
  const [memberSearch, setMemberSearch] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Form state
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

  const colorOptions = [
    "#6366f1",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#f97316",
    "#14b8a6",
  ];

  // Close dropdown on click outside
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

  // Fetch all data
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTeams(), fetchDepartments(), fetchUsers()]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getAllTeams();
      if (response.success) {
        setTeams(response.data);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      const depts = Array.from(new Set(teams.map((t) => t.department)));
      setDepartments(
        depts.map((name) => ({
          _id: name,
          name,
          code: name.toUpperCase().slice(0, 3),
        })),
      );
    }
  };

  const fetchUsers = async () => {
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
  };

  // Filter teams
  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const matchesSearch =
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment =
        filterDepartment === "all" || team.department === filterDepartment;
      const matchesStatus =
        filterStatus === "all" || team.status === filterStatus;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [teams, searchTerm, filterDepartment, filterStatus]);

  // Filter available members for multi-select
  const filteredAvailableMembers = useMemo(() => {
    const excludeIds = formData.members;
    return users
      .filter((u) => !excludeIds.includes(u._id) && u._id !== formData.lead)
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(memberSearch.toLowerCase()),
      );
  }, [users, formData.members, formData.lead, memberSearch]);

  // Selected members display
  const selectedMembersList = useMemo(() => {
    return users.filter((u) => formData.members.includes(u._id));
  }, [users, formData.members]);

  // Toggle member selection
  const toggleMember = (userId: string) => {
    setFormData((prev) => {
      const members = prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId];
      return { ...prev, members };
    });
  };

  // Remove member from selection
  const removeMember = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((id) => id !== userId),
    }));
  };

  const stats = useMemo(
    () => ({
      total: teams.length,
      active: teams.filter((t) => t.status === "active").length,
      members: teams.reduce((acc, team) => acc + (team.teamSize || 0), 0),
      departments: departments.length,
    }),
    [teams, departments],
  );

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find((d) => d._id === deptId || d.name === deptId);
    return dept?.name || deptId || "";
  };

  const getUserDisplayName = (user: User) => {
    return user.fullName || user.email;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
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
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
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
  };

  const handleDeleteTeam = (id: string) => {
    setTeamToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
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
  };

  const handleAddMembers = async () => {
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
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
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
  };

  if (loading && teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Teams
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              Manage and organize your teams
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 font-medium"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create Team
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-indigo-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Teams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-emerald-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Teams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-purple-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.members}
                </p>
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-blue-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.departments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[160px]"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-black  px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterDepartment("all");
                  setFilterStatus("all");
                }}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
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
        </div>

        {/* Teams Display */}
        {filteredTeams.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTeams.map((team) => (
                <div
                  key={team._id}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg shadow-indigo-500/20"
                          style={{ backgroundColor: team.color || "#6366f1" }}
                        >
                          {getInitials(team.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            <span className="truncate">
                              {getDepartmentName(team.department)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          team.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-50 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {team.status === "active" ? (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          "Inactive"
                        )}
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
                        <span className="font-medium">
                          {team.teamSize || 0} members
                        </span>
                      </div>
                      {team.lead && typeof team.lead === "object" && (
                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50/80 px-3 py-1.5 rounded-xl">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate max-w-[100px]">
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
                        className="cursor-pointer border-indigo-600 border-2 flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
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
                              typeof team.lead === "object"
                                ? team.lead._id
                                : team.lead,
                            members: team.members.map((m) =>
                              typeof m === "object" ? m._id : m,
                            ),
                            status: team.status,
                            color: team.color || "#6366f1",
                            icon: team.icon || "users",
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 cursor-pointer text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team._id)}
                        className="p-2 cursor-pointer text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
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
                        Members
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
                    {filteredTeams.map((team) => (
                      <tr
                        key={team._id}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: team.color || "#6366f1",
                              }}
                            >
                              {getInitials(team.name)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {team.name}
                              </p>
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
                                {getInitials(
                                  team.lead.fullName || "Unknown"
                                )}
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                              team.status === "active"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-50 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {team.status === "active" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            )}
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
                              className="cursor-pointer p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
                                    typeof team.lead === "object"
                                      ? team.lead._id
                                      : team.lead,
                                  members: team.members.map((m) =>
                                    typeof m === "object" ? m._id : m,
                                  ),
                                  status: team.status,
                                  color: team.color || "#6366f1",
                                  icon: team.icon || "users",
                                });
                                setShowEditModal(true);
                              }}
                              className="cursor-pointer p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Team"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team._id)}
                              className="cursor-pointer p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Team"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100/80">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No teams found
            </h3>
            <p className="text-gray-500 mt-1">
              Create your first team to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Team
            </button>
          </div>
        )}
      </div>

      {/* Create Team Modal with Multi-Select */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Create New Team
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateTeam}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Team Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter team name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter team description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none"
                      rows={3}
                    />
                  </div>

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
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept.name}>
                          {dept.name} {dept.code ? `(${dept.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Team Lead <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.lead}
                      onChange={(e) =>
                        setFormData({ ...formData, lead: e.target.value })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Team Lead</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {getUserDisplayName(user)} ({user.email})
                          {user.role &&
                            ` - ${user.role.replace("_", " ").toUpperCase()}`}
                        </option>
                      ))}
                    </select>
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Members
                    </label>
                    <div ref={memberDropdownRef} className="relative">
                      <div
                        className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-xl bg-gray-50 min-h-[44px] cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500"
                        onClick={() =>
                          setIsMemberDropdownOpen(!isMemberDropdownOpen)
                        }
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
                          <span className="text-gray-400 text-sm">
                            Select members...
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          <span className="text-xs text-gray-400">
                            {selectedMembersList.length} selected
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${isMemberDropdownOpen ? "rotate-180" : ""}`}
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
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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
                                    checked={formData.members.includes(
                                      member._id,
                                    )}
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
                                      {member.role
                                        .replace("_", " ")
                                        .toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                {memberSearch
                                  ? "No members found"
                                  : "No available members"}
                              </div>
                            )}
                          </div>

                          <div className="p-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                            <span>
                              {filteredAvailableMembers.length} available
                            </span>
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
                      Click to open dropdown, search to filter, click to
                      select/deselect
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                  >
                    Create Team
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-white bg-red-500 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeamId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Edit Team
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeamId(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleUpdateTeam}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Team Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter team name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter team description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none"
                      rows={3}
                    />
                  </div>

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
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept.name}>
                          {dept.name} {dept.code ? `(${dept.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Team Lead <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.lead}
                      onChange={(e) =>
                        setFormData({ ...formData, lead: e.target.value })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Team Lead</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {getUserDisplayName(user)} ({user.email})
                          {user.role &&
                            ` - ${user.role.replace("_", " ").toUpperCase()}`}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                  >
                    Update Team
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTeamId(null);
                    }}
                    className="text-white bg-red-500 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showMembersModal && selectedTeamId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Manage Members
                </h2>
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    setSelectedTeamId(null);
                    setSelectedMembers([]);
                    setMemberSearch("");
                  }}
                  className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Current Members */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Current Members (
                  {teams.find((t) => t._id === selectedTeamId)?.members
                    .length || 0}
                  )
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {teams.find((t) => t._id === selectedTeamId)?.members
                    .length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No members in this team
                    </p>
                  ) : (
                    teams
                      .find((t) => t._id === selectedTeamId)
                      ?.members.map((member) => {
                        const m = typeof member === "object" ? member : null;
                        if (!m) return null;
                        return (
                          <div
                            key={m._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-medium flex-shrink-0">
                                {getInitials(m.fullName || "Unknown")}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {m.fullName || "Unknown"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {m.email}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveMember(selectedTeamId, m._id)
                              }
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Add Members - Searchable Multi-Select */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Add Members
                </h3>

                {/* Search Input */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members by name or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>

                {/* Member List with Checkboxes */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 max-h-48 overflow-y-auto">
                  {users.filter((user) => {
                    const team = teams.find((t) => t._id === selectedTeamId);
                    if (team && team.members) {
                      const memberIds = team.members.map((m) =>
                        typeof m === "object" ? m._id : m,
                      );
                      if (memberIds.includes(user._id)) return false;
                      if (user._id === team.lead?._id) return false;
                    }
                    // Apply search filter
                    const searchLower = memberSearch.toLowerCase();
                    return (
                      user.fullName.toLowerCase().includes(searchLower) ||
                      user.email.toLowerCase().includes(searchLower)
                    );
                  }).length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      {memberSearch
                        ? "No members match your search"
                        : "No available members to add"}
                    </div>
                  ) : (
                    users
                      .filter((user) => {
                        const team = teams.find(
                          (t) => t._id === selectedTeamId,
                        );
                        if (team && team.members) {
                          const memberIds = team.members.map((m) =>
                            typeof m === "object" ? m._id : m,
                          );
                          if (memberIds.includes(user._id)) return false;
                          if (user._id === team.lead?._id) return false;
                        }
                        const searchLower = memberSearch.toLowerCase();
                        return (
                          user.fullName.toLowerCase().includes(searchLower) ||
                          user.email.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((user) => {
                        const isSelected = selectedMembers.includes(user._id);
                        return (
                          <div
                            key={user._id}
                            onClick={() => {
                              setSelectedMembers((prev) =>
                                prev.includes(user._id)
                                  ? prev.filter((id) => id !== user._id)
                                  : [...prev, user._id],
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

                {/* Selected Count & Actions */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">
                    {selectedMembers.length} member
                    {selectedMembers.length !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    {selectedMembers.length > 0 && (
                      <button
                        onClick={() => setSelectedMembers([])}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAddMembers}
                  disabled={selectedMembers.length === 0}
                  className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-indigo-500/25"
                >
                  Add Selected Members ({selectedMembers.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Team</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this team? This action cannot be
                undone and all team data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 cursor-pointer py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-700 hover:to-rose-600 transition-colors font-medium shadow-lg shadow-rose-500/25"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setTeamToDelete(null);
                  }}
                  className="flex-1 text-white bg-red-500 px-4 py-2.5 border border-gray-200 rounded-xl cursor-pointer transition-colors font-medium"
                >
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
