// hooks/tender/useTenderOverview.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  overviewApi,
  type TenderOverviewData,
  type UpcomingTender,
} from "@/lib/api/tender.api";

export function useTenderOverview() {
  const [data, setData] = useState<TenderOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await overviewApi.get();
      setData(res);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load overview";
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

export function useUpcomingDeadlines() {
  const [data, setData] = useState<UpcomingTender[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await overviewApi.upcoming();
      setData(res);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}