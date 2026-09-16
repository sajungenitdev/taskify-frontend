// hooks/tender/useTenders.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  tenderApi,
  securityApi,
  type Tender,
  type TenderStage,
} from "@/lib/api/tender.api";

export function useTenders(params?: {
  stage?: string;
  tenderType?: string;
  search?: string;
  limit?: number;
}) {
  const [data, setData] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenderApi.list(params);
      setData(res.data);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load tenders";
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

/* ============================================================
 * Grouped tenders — all 5 stages fetched in parallel
 * ============================================================ */
export function useTendersGrouped() {
  const [groups, setGroups] = useState<Record<TenderStage, Tender[]>>({
    potential: [],
    active: [],
    submitted: [],
    lost: [],
    won: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, a, s, l, w] = await Promise.all([
        tenderApi.list({ stage: "potential", limit: 200 }),
        tenderApi.list({ stage: "active", limit: 200 }),
        tenderApi.list({ stage: "submitted", limit: 200 }),
        tenderApi.list({ stage: "lost", limit: 200 }),
        tenderApi.list({ stage: "won", limit: 200 }),
      ]);
      setGroups({
        potential: p.data,
        active: a.data,
        submitted: s.data,
        lost: l.data,
        won: w.data,
      });
    } catch (e) {
      const msg = (e as Error).message || "Failed to load tenders";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { groups, loading, error, refetch };
}

/* ============================================================
 * Stats — 5 KPI tiles
 * ============================================================ */
export function useTenderStats() {
  const { groups, loading, refetch } = useTendersGrouped();

  const [securityPending, setSecurityPending] = useState<{
    amount: number;
    entities: number;
  }>({ amount: 0, entities: 0 });

  // Fetch security pending — separate endpoint
  const refetchSecurity = useCallback(async () => {
    try {
      const s = await securityApi.stats();
      setSecurityPending({
        amount: s.totalPending ?? 0,
        entities: s.entitiesAffected ?? 0,
      });
    } catch {
      // silent — security stats are optional
      setSecurityPending({ amount: 0, entities: 0 });
    }
  }, []);

  useEffect(() => {
    refetchSecurity();
  }, [refetchSecurity]);

  // Combine refetches so callers get everything fresh
  const refetchAll = useCallback(async () => {
    await Promise.all([refetch(), refetchSecurity()]);
  }, [refetch, refetchSecurity]);

  const won = groups.won.length;
  const lost = groups.lost.length;
  const decided = won + lost;
  const winRate = decided === 0 ? 0 : Math.round((won / decided) * 100);

  const stats = [
    {
      label: "Potential (Under Review)",
      value: String(groups.potential.length),
      hint: "Awaiting go/no-go decision",
    },
    {
      label: "Active Participation",
      value: String(groups.active.length),
      hint: "Docs in preparation",
    },
    {
      label: "Awaiting Result",
      value: String(groups.submitted.length),
      hint: "Submitted, pending decision",
    },
    {
      label: "Win Rate (FY26)",
      value: `${winRate}%`,
      hint: `${won} Won · ${lost} Lost`,
    },
    {
      label: "Tender Security Pending",
      value: `৳${securityPending.amount.toLocaleString("en-IN")}`,
      hint: `Across ${securityPending.entities} ${securityPending.entities === 1 ? "entity" : "entities"
        }`,
      highlighted: true,
    },
  ];

  return { groups, stats, loading, refetch: refetchAll };
}