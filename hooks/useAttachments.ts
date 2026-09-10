"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Attachment } from "@/types/tasks";

export function useAttachments(taskId: string) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}/attachments`);
      if (response.data.success) {
        setAttachments(response.data.data || []);
      } else {
        setAttachments([]);
      }
    } catch (err: any) {
      if (err.response?.status !== 403 && err.response?.status !== 404) {
        console.error("Error fetching attachments:", err);
      }
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { attachments, loading, refetch };
}