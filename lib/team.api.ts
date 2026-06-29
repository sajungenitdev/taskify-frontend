import api from "./axios";
import {
  Team,
  TeamFormData,
  TeamStats,
  ApiResponse,
  TeamMember,
} from "@/types/team.types";

export const teamAPI = {
  // Get all teams with filters
  getAllTeams: async (params?: {
    department?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Team[]>> => {
    const response = await api.get("/teams", { params });
    return response.data;
  },

  // Get team by ID
  getTeamById: async (id: string): Promise<ApiResponse<Team>> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  // Get teams by department
  getTeamsByDepartment: async (
    department: string,
  ): Promise<ApiResponse<Team[]>> => {
    const response = await api.get(
      `/teams/department/${encodeURIComponent(department)}`,
    );
    return response.data;
  },

  // Get user's teams
  getUserTeams: async (userId: string): Promise<ApiResponse<Team[]>> => {
    const response = await api.get(`/teams/user/${userId}`);
    return response.data;
  },

  // Get team members
  getTeamMembers: async (
    teamId: string,
  ): Promise<ApiResponse<TeamMember[]>> => {
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  },

  // Create team
  createTeam: async (data: TeamFormData): Promise<ApiResponse<Team>> => {
    const response = await api.post("/teams", data);
    return response.data;
  },

  // Update team
  updateTeam: async (
    id: string,
    data: Partial<TeamFormData>,
  ): Promise<ApiResponse<Team>> => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  // Delete team
  deleteTeam: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  // Add members to team
  addMembers: async (
    teamId: string,
    memberIds: string[],
  ): Promise<ApiResponse<Team>> => {
    const response = await api.post(`/teams/${teamId}/members`, { memberIds });
    return response.data;
  },

  // Remove member from team
  removeMember: async (
    teamId: string,
    memberId: string,
  ): Promise<ApiResponse<Team>> => {
    const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return response.data;
  },

  // Get team statistics
  getTeamStats: async (): Promise<ApiResponse<TeamStats>> => {
    const response = await api.get("/teams/stats");
    return response.data;
  },
};

export default teamAPI;
