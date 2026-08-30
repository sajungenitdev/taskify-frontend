"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  Building,
  Mail,
  User,
  Calendar,
  Briefcase,
  ChevronRight,
  Shield,
  Clock,
  Star,
  Award,
  Phone,
  MapPin,
  Link2,
  ExternalLink,
  Loader2,
  Sparkles,
  Crown,
  CheckCircle,
  UsersRound,
  Code,
  Palette,
} from "lucide-react";
import { teamAPI } from "@/lib/team.api";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Team } from "@/types/team.types";
import { useAuth } from "@/contexts/AuthContext";

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
  phone?: string;
  location?: string;
  bio?: string;
  joinDate?: string;
}

export default function MyTeamPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyTeams();
    } else if (!isAuthenticated && !loading) {
      router.push("/login");
    }
  }, [isAuthenticated, user]);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getAllTeams();
      if (response.success) {
        // Filter teams where user is a member or lead
        const userTeams = response.data.filter((team: Team) => {
          const isMember = team.members.some(
            (member) => typeof member === "object" && member._id === user?._id,
          );
          const isLead =
            typeof team.lead === "object" && team.lead._id === user?._id;
          return isMember || isLead;
        });
        setTeams(userTeams);
        if (userTeams.length > 0) {
          setSelectedTeamId(userTeams[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load your teams");
    } finally {
      setLoading(false);
    }
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

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string; color: string; icon: any }> = {
      admin: {
        label: "Admin",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Shield,
      },
      manager: {
        label: "Manager",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Briefcase,
      },
      lead: {
        label: "Team Lead",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Crown,
      },
      member: {
        label: "Member",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: User,
      },
      developer: {
        label: "Developer",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: Code,
      },
      designer: {
        label: "Designer",
        color: "bg-pink-50 text-pink-700 border-pink-200",
        icon: Palette,
      },
    };
    return (
      roles[role?.toLowerCase()] || {
        label: role || "Member",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: User,
      }
    );
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-gray-50 text-gray-600 border-gray-200";
  };

  // Get current selected team
  const selectedTeam = useMemo(() => {
    return teams.find((t) => t._id === selectedTeamId);
  }, [teams, selectedTeamId]);

  // Get team members with role info
  const teamMembers = useMemo(() => {
    if (!selectedTeam) return [];
    return selectedTeam.members
      .map((member) => {
        const m = typeof member === "object" ? member : null;
        if (!m) return null;
        const isLead =
          typeof selectedTeam.lead === "object" &&
          selectedTeam.lead._id === m._id;
        return {
          ...m,
          role: isLead ? "lead" : m.role || "member",
          isLead,
        };
      })
      .filter(Boolean);
  }, [selectedTeam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            <div className="w-20 h-20 bg-linear-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              You're not in any team yet
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              Teams help you collaborate with colleagues and stay organized.
              Wait for your team lead to add you, or explore other teams.
            </p>
            <button
              onClick={() => router.push("/teams/all-teams")}
              className="mt-6 px-6 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all font-medium shadow-lg shadow-indigo-500/25"
            >
              Browse All Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-indigo-500" />
              My Teams
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              Teams you're a member of
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {teams.length} team{teams.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => router.push("/teams")}
              className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium flex items-center gap-1"
            >
              View All Teams
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Team Selector Tabs */}
        {teams.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {teams.map((team) => (
              <button
                key={team._id}
                onClick={() => setSelectedTeamId(team._id)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  selectedTeamId === team._id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: team.color || "#6366f1" }}
                >
                  {getInitials(team.name)}
                </div>
                {team.name}
                {team.status === "active" && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedTeamId === team._id
                        ? "bg-white"
                        : "bg-emerald-500"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {selectedTeam && (
          <div className="space-y-6">
            {/* Team Overview Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
              <div
                className="p-6 sm:p-8 relative"
                style={{
                  background: `linear-gradient(135deg, ${selectedTeam.color || "#6366f1"}15, ${selectedTeam.color || "#6366f1"}08)`,
                }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shrink-0"
                    style={{ backgroundColor: selectedTeam.color || "#6366f1" }}
                  >
                    {getInitials(selectedTeam.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedTeam.name}
                      </h2>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          selectedTeam.status,
                        )}`}
                      >
                        {selectedTeam.status === "active" ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          "Inactive"
                        )}
                      </span>
                    </div>
                    {selectedTeam.description && (
                      <p className="text-gray-600 mt-1">
                        {selectedTeam.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Building className="w-4 h-4" />
                        {selectedTeam.department}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        {teamMembers.length} members
                      </div>
                      {selectedTeam.lead &&
                        typeof selectedTeam.lead === "object" && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Crown className="w-4 h-4 text-amber-500" />
                            Lead: {selectedTeam.lead.fullName || "Unknown"}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Members Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UsersRound className="w-5 h-5 text-indigo-500" />
                  Team Members
                  <span className="text-sm font-normal text-gray-400">
                    ({teamMembers.length})
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map((member) => {
                  if (!member) return null;
                  const roleInfo = getRoleBadge(member.role || "member");
                  const RoleIcon = roleInfo.icon;
                  const isCurrentUser = member._id === user?._id;

                  return (
                    <div
                      key={member._id}
                      className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                        isCurrentUser
                          ? "border-indigo-300 ring-2 ring-indigo-500/20"
                          : "border-gray-100/80 hover:border-indigo-200/50"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xl font-bold shrink-0">
                              {getInitials(member.fullName || "Unknown")}
                            </div>
                            {isCurrentUser && (
                              <div className="absolute -top-1 -right-1">
                                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                                  {member.fullName || "Unknown"}
                                  {member.isLead && (
                                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                                  )}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {member.email}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1 shrink-0 ${roleInfo.color}`}
                              >
                                <RoleIcon className="w-3 h-3" />
                                {roleInfo.label}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                              {member.employeeId && (
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                  <Briefcase className="w-3 h-3" />
                                  ID: {member.employeeId}
                                </span>
                              )}
                              {member.department && (
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                  <Building className="w-3 h-3" />
                                  {member.department}
                                </span>
                              )}
                              {member.position && (
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                                  <User className="w-3 h-3" />
                                  {member.position}
                                </span>
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
                              <a
                                href={`mailto:${member.email}`}
                                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Email
                              </a>
                              {member.phone && (
                                <a
                                  href={`tel:${member.phone}`}
                                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  Call
                                </a>
                              )}
                              {isCurrentUser && (
                                <span className="flex items-center gap-1 text-indigo-600">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                Quick Actions
              </h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/teams")}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  View All Teams
                </button>
                <button
                  onClick={() => {
                    // Navigate to team members or chat
                    toast.success("Feature coming soon!");
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-sm text-indigo-700 transition-colors flex items-center gap-2"
                >
                  <UsersRound className="w-4 h-4" />
                  Team Chat
                </button>
                <button
                  onClick={() => {
                    // Navigate to team calendar
                    toast.success("Feature coming soon!");
                  }}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-sm text-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Team Calendar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
