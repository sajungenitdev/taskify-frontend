// hooks/tender/useSubmissions.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  submissionApi,
  type SubmissionDetail,
  type SubmissionRow,
} from "@/lib/api/tender.api";

export function useSubmissions() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await submissionApi.list();
      setRows(res);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load submissions";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rows, loading, error, refetch };
}

export function useSubmissionDetail(id: string | null) {
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await submissionApi.get(id);
      setData(res);
    } catch (e) {
      const msg = (e as Error).message || "Failed to load submission detail";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}