"use client";
import { useCallback, useEffect, useState } from "react";
import { contactApi } from "@/lib/api/crm.api";
import type { Contact } from "@/types/crm/crm.types";
import { toast } from "react-hot-toast";

export function useContacts(params?: {
  search?: string;
  tag?: string;
  owner?: string;
  page?: number;
  limit?: number;
}) {
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactApi.list(params);
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