// hooks/tender/useSecurity.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  securityApi,
  type TenderSecurity,
  type TenderSecurityStats,
} from "@/lib/api/tender.api";

export function useSecurity(params?: {
  entity?: string;
  type?: string;
  docs?: string;
  page?: number;
  limit?: number;
}) {
  const [rows, setRows] = useState<TenderSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.list(params);
      setRows(res.data);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load security records";
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

  return { rows, loading, error, refetch };
}

export function useSecurityStats() {
  const [stats, setStats] = useState<TenderSecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.stats();
      setStats(res);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load stats";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { stats, loading, error, refetch };
}