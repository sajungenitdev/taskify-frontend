import axios from './axios';
import { User, ApiResponse } from '@/types/team.types';

export const userAPI = {
  // Get all users
  getAllUsers: async (params?: { 
    role?: string; 
    department?: string; 
    status?: string;
    search?: string;
  }): Promise<ApiResponse<User[]>> => {
    const response = await axios.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  },

  // Get active users
  getActiveUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await axios.get('/auth/active-users');
    return response.data;
  },

  // Create user (admin only)
  createUser: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await axios.post('/users', data);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await axios.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axios.delete(`/users/${id}`);
    return response.data;
  },

  // Change user role
  changeUserRole: async (id: string, role: string): Promise<ApiResponse<User>> => {
    const response = await axios.put(`/users/${id}/role`, { role });
    return response.data;
  },

  // Get users by role
  getUsersByRole: async (role: string): Promise<ApiResponse<User[]>> => {
    const response = await axios.get(`/users/role/${role}`);
    return response.data;
  },

  // Get users by department
  getUsersByDepartment: async (department: string): Promise<ApiResponse<User[]>> => {
    const response = await axios.get(`/users/department/${department}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await axios.put('/users/profile', data);
    return response.data;
  },

  // Upload profile photo
  uploadProfilePhoto: async (formData: FormData): Promise<ApiResponse<{ avatar: string }>> => {
    const response = await axios.post('/users/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> => {
    const response = await axios.post('/users/change-password', data);
    return response.data;
  },

  // Export users
  exportUsers: async (): Promise<Blob> => {
    const response = await axios.get('/users/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Bulk import users
  bulkImportUsers: async (formData: FormData): Promise<ApiResponse<{ imported: number; errors: string[] }>> => {
    const response = await axios.post('/users/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};