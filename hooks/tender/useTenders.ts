// hooks/tender/useTenders.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { tenderApi, type Tender, type TenderStage } from "@/lib/api/tender.api";

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

/** Fetch all four stages in parallel and return grouped counts + rows. */
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
      const [p, a, s, l] = await Promise.all([
        tenderApi.list({ stage: "potential", limit: 200 }),
        tenderApi.list({ stage: "active", limit: 200 }),
        tenderApi.list({ stage: "submitted", limit: 200 }),
        tenderApi.list({ stage: "lost", limit: 200 }),
      ]);
      setGroups({
        potential: p.data,
        active: a.data,
        submitted: s.data,
        lost: l.data,
        won: [],
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

/** Compute the 5 stat tiles from the grouped data. */
export function useTenderStats() {
  const { groups, loading, refetch } = useTendersGrouped();

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
      value: (() => {
        const won = groups.won.length;
        const lost = groups.lost.length;
        if (won + lost === 0) return "0%";
        return `${Math.round((won / (won + lost)) * 100)}%`;
      })(),
      hint: `${groups.won.length} Won · ${groups.lost.length} Lost`,
    },
    {
      label: "Tender Security Pending",
      value: "৳0",
      hint: "Across 0 entities",
      highlighted: true,
    },
  ];

  return { groups, stats, loading, refetch };
}