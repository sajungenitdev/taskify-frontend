"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Comment } from "../_types";

export function useComments(taskId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}/comments`);
      if (response.data.success) {
        setComments(response.data.data || []);
      } else {
        setComments([]);
      }
    } catch (err: any) {
      // silent — comments are optional
      if (err.response?.status !== 403 && err.response?.status !== 404) {
        console.error("Error fetching comments:", err);
      }
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { comments, loading, refetch };
}