// hooks/tender/useCompanyDocs.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  companyDocApi,
  type CompanyDocument,
  type CompanyDocCategory,
} from "@/lib/api/tender.api";

export function useCompanyDocs(params?: {
  category?: CompanyDocCategory;
  sector?: string;
  duration?: string;
  volume?: string;
}) {
  const [rows, setRows] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyDocApi.list(params);
      setRows(data);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load documents";
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

export function useCompanyDocCounts() {
  const [counts, setCounts] = useState<Record<CompanyDocCategory, number>>({
    legal: 0,
    profiles: 0,
    experience: 0,
    certificates: 0,
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await companyDocApi.counts();
      setCounts(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { counts, loading, refetch };
}