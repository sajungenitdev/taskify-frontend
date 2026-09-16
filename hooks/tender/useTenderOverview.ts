// hooks/tender/useTenderOverview.ts
"use client";

import { useEffect, useState } from "react";
import {
  overviewApi,
  type TenderOverviewData,
  type UpcomingTender,
  type PerformanceResponse,
  type TenderActivity,
} from "@/lib/api/tender.api";

/* ---------- Overview stats + pipeline ---------- */
export function useTenderOverview() {
  const [data, setData] = useState<TenderOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    overviewApi
      .get()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e as Error); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

/* ---------- Upcoming deadlines ---------- */
export function useUpcomingDeadlines() {
  const [data, setData] = useState<UpcomingTender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    overviewApi
      .upcoming()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e as Error); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

/* ---------- Performance (NEW) ---------- */
export function useTenderPerformance() {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    overviewApi
      .performance()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e as Error); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

/* ---------- Recent activity (NEW) ---------- */
export function useRecentActivity(limit = 10) {
  const [data, setData] = useState<TenderActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    overviewApi
      .recentActivity(limit)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e as Error); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  return { data, loading, error };
}