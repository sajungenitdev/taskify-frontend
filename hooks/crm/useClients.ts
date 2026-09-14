"use client";
import { useCallback, useEffect, useState } from "react";
import { clientApi } from "@/lib/api/crm.api";
import type { Client } from "@/types/crm/crm.types";
import { toast } from "react-hot-toast";

export function useClients(params?: {
  sector?: string;
  stage?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientApi.list(params);
      setData(res.data);
      setTotal(res.pagination?.total ?? res.data.length);
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

  return { data, loading, total, refetch };
}