// hooks/crm/useLeads.ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { leadApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { Lead, PipelineSummary } from "@/types/crm/crm.types";

export function useLeads(params?: {
  stage?: string;
  owner?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leadApi.list(params);
      setData(res.data);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load leads";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function usePipeline() {
  const [data, setData] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leadApi.pipeline();
      setData(res);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load pipeline";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}