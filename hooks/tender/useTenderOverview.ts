// hooks/tender/useTenderOverview.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import {
  type TenderOverviewData,
  type UpcomingTender,
  type PerformanceResponse,
  type TenderActivity,
} from "@/lib/api/tender.api";

/* ============================================================
 * One shared cache + in-flight promise for the combined overview
 * ============================================================ */

interface CombinedShape {
  stats?: any[];
  pipeline?: any[];
  stages?: Record<string, number>;
  upcoming?: UpcomingTender[];
  performance?: PerformanceResponse;
  recentActivity?: TenderActivity[];
}

let CACHE: { data: CombinedShape | null; ts: number } = { data: null, ts: 0 };
let IN_FLIGHT: Promise<CombinedShape> | null = null;
const STALE_MS = 15_000;

async function ensureLoaded(): Promise<CombinedShape> {
  if (CACHE.data && Date.now() - CACHE.ts < STALE_MS) return CACHE.data;
  if (IN_FLIGHT) return IN_FLIGHT;

  IN_FLIGHT = api
    .get("/tenders/overview")
    .then((res) => {
      const payload = res.data.data as CombinedShape;
      CACHE = { data: payload, ts: Date.now() };
      IN_FLIGHT = null;
      return payload;
    })
    .catch((e) => {
      IN_FLIGHT = null;
      throw e;
    });

  return IN_FLIGHT;
}

export function invalidateTenderOverview() {
  CACHE = { data: null, ts: 0 };
  IN_FLIGHT = null;
}

/* ---------- Overview stats + pipeline ---------- */
export function useTenderOverview() {
  const [data, setData] = useState<TenderOverviewData | null>(
    (CACHE.data as any) ?? null,
  );
  const [loading, setLoading] = useState(!CACHE.data);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(!CACHE.data);
    ensureLoaded()
      .then((d) => {
        if (!mounted.current) return;
        setData(d as any);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Upcoming deadlines ---------- */
export function useUpcomingDeadlines() {
  const [data, setData] = useState<UpcomingTender[]>(
    CACHE.data?.upcoming ?? [],
  );
  const [loading, setLoading] = useState(!CACHE.data);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(!CACHE.data);
    ensureLoaded()
      .then((d) => {
        if (!mounted.current) return;
        setData(d.upcoming ?? []);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Performance ---------- */
export function useTenderPerformance() {
  const [data, setData] = useState<PerformanceResponse | null>(
    CACHE.data?.performance ?? null,
  );
  const [loading, setLoading] = useState(!CACHE.data);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(!CACHE.data);
    ensureLoaded()
      .then((d) => {
        if (!mounted.current) return;
        setData(d.performance ?? { data: [], winRate: 0 });
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Recent activity ---------- */
export function useRecentActivity(_limit = 10) {
  const [data, setData] = useState<TenderActivity[]>(
    CACHE.data?.recentActivity ?? [],
  );
  const [loading, setLoading] = useState(!CACHE.data);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(!CACHE.data);
    ensureLoaded()
      .then((d) => {
        if (!mounted.current) return;
        setData(d.recentActivity ?? []);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}