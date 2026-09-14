"use client";
import { useCallback, useEffect, useState } from "react";
import { analyticsApi } from "@/lib/api/crm.api";
import type { ForecastRow } from "@/types/crm/crm.types";
import { toast } from "react-hot-toast";

export function useForecast(params?: { from?: string; to?: string; owner?: string }) {
  const [rows, setRows] = useState<ForecastRow[]>([]);
  const [totals, setTotals] = useState({ weighted: 0, raw: 0, count: 0 });
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.forecast(params);
      setRows(res.rows);
      setTotals(res.totals);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rows, totals, loading, refetch };
}

export function useLeaderboard(params?: { month?: number; year?: number }) {
  const [rows, setRows] = useState<
    { userId: string; fullName: string; email: string; wonRevenue: number; wonCount: number; activities: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.leaderboard(params);
      setRows(res.rows);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rows, loading, refetch };
}