"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import type { ExtensionRequest } from "@/types/tasks";

export function useExtensionRequests(taskId: string) {
  const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}/extension-requests`);
      if (response.data.success) {
        setExtensionRequests(response.data.data || []);
      } else {
        setExtensionRequests([]);
      }
    } catch (err: any) {
      // 403 = no permission; just hide the section
      if (err.response?.status !== 403 && err.response?.status !== 404) {
        console.error("Error fetching extension requests:", err);
      }
      setExtensionRequests([]);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { extensionRequests, loading, refetch };
}