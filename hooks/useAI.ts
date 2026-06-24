"use client";

import { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface AIResponse {
  success: boolean;
  data: any;
}

export function useAI() {
  const [loading, setLoading] = useState(false);

  // Generate task description
  const generateDescription = async (title: string): Promise<string | null> => {
    setLoading(true);
    try {
      const response = await api.post('/ai/generate-description', { title });
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('AI description error:', error);
      toast.error('Failed to generate description');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Suggest priority
  const suggestPriority = async (title: string, description: string) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/suggest-priority', { title, description });
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('AI priority error:', error);
      toast.error('Failed to suggest priority');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Estimate duration
  const estimateDuration = async (title: string, description: string) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/estimate-duration', { title, description });
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('AI duration error:', error);
      toast.error('Failed to estimate duration');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Generate subtasks
  const generateSubtasks = async (title: string, description: string) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/generate-subtasks', { title, description });
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('AI subtasks error:', error);
      toast.error('Failed to generate subtasks');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get smart recommendations
  const getRecommendations = async (tasks: any[], userRole: string) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/recommendations', { tasks, userRole });
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('AI recommendations error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Chat assistant
  const chatAssistant = async (message: string, taskContext?: string) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/chat', { message, taskContext });
      if (response.data.success) {
        return response.data.data;
      }
      return "I'm having trouble processing your request.";
    } catch (error) {
      console.error('AI chat error:', error);
      return "Sorry, I'm having trouble connecting. Please try again.";
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateDescription,
    suggestPriority,
    estimateDuration,
    generateSubtasks,
    getRecommendations,
    chatAssistant,
  };
}