// hooks/crm/useActivities.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { activityApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { DealActivity } from "@/types/crm/crm.types";

export function useActivities(leadId?: string, params?: { type?: string }) {
  const [data, setData] = useState<DealActivity[]>([]);
  const [loading, setLoading] = useState(false);

  // Monotonic request id — prevents a stale response from overwriting
  // a newer one when the caller navigates between leads quickly.
  const reqId = useRef(0);

  const refetch = useCallback(async () => {
    if (!leadId) {
      setData([]);
      setLoading(false);
      return;
    }
    const myId = ++reqId.current;
    setLoading(true);
    try {
      const res = await activityApi.forLead(leadId, params);
      if (myId !== reqId.current) return; // a newer request has started
      setData(res.data);
    } catch (e) {
      if (myId !== reqId.current) return;
      toast.error((e as Error).message);
    } finally {
      if (myId === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, JSON.stringify(params)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}