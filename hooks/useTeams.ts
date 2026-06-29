import { useState, useEffect, useCallback } from "react";
import { Team, TeamFormData,  TeamStats, User } from "@/types/team.types";
import toast from "react-hot-toast";
import { teamAPI } from "@/lib/team.api";
import { userAPI } from "@/lib/user.api";

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);

  // Fetch all teams
  const fetchTeams = useCallback(
    async (params?: {
      department?: string;
      status?: string;
      search?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const response = await teamAPI.getAllTeams(params);
        setTeams(response.data || []);
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to load teams";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Fetch single team
  const fetchTeamById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamAPI.getTeamById(id);
      setSelectedTeam(response.data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load team";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch team members
  const fetchTeamMembers = useCallback(async (teamId: string) => {
    try {
      setLoading(true);
      const response = await teamAPI.getTeamMembers(teamId);
      setTeamMembers(response.data || []);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to load team members";
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available users (for adding to teams)
  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await userAPI.getAllUsers();
      setAvailableUsers(response.data || []);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to load users";
      toast.error(message);
      throw err;
    }
  }, []);

  // Fetch team statistics
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getTeamStats();
      setStats(response.data);
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to load statistics";
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create team
  const createTeam = useCallback(
    async (data: TeamFormData) => {
      try {
        setLoading(true);
        const response = await teamAPI.createTeam(data);
        toast.success("Team created successfully!");
        await fetchTeams(); // Refresh list
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to create team";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTeams],
  );

  // Update team
  const updateTeam = useCallback(
    async (id: string, data: Partial<TeamFormData>) => {
      try {
        setLoading(true);
        const response = await teamAPI.updateTeam(id, data);
        toast.success("Team updated successfully!");
        await fetchTeams();
        if (selectedTeam?._id === id) {
          setSelectedTeam(response.data);
        }
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to update team";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTeams, selectedTeam],
  );

  // Delete team
  const deleteTeam = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        await teamAPI.deleteTeam(id);
        toast.success("Team deleted successfully!");
        await fetchTeams();
        if (selectedTeam?._id === id) {
          setSelectedTeam(null);
        }
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to delete team";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTeams, selectedTeam],
  );

  // Add members to team
  const addMembers = useCallback(
    async (teamId: string, memberIds: string[]) => {
      try {
        setLoading(true);
        const response = await teamAPI.addMembers(teamId, memberIds);
        toast.success("Members added successfully!");
        await fetchTeams();
        if (selectedTeam?._id === teamId) {
          setSelectedTeam(response.data);
        }
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to add members";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTeams, selectedTeam],
  );

  // Remove member from team
  const removeMember = useCallback(
    async (teamId: string, memberId: string) => {
      try {
        setLoading(true);
        const response = await teamAPI.removeMember(teamId, memberId);
        toast.success("Member removed successfully!");
        await fetchTeams();
        if (selectedTeam?._id === teamId) {
          setSelectedTeam(response.data);
        }
        return response.data;
      } catch (err: any) {
        const message =
          err.response?.data?.message || "Failed to remove member";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTeams, selectedTeam],
  );

  // Initial load
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    selectedTeam,
    teamMembers,
    availableUsers,
    stats,
    fetchTeams,
    fetchTeamById,
    fetchTeamMembers,
    fetchAvailableUsers,
    fetchStats,
    createTeam,
    updateTeam,
    deleteTeam,
    addMembers,
    removeMember,
    setSelectedTeam,
  };
};
