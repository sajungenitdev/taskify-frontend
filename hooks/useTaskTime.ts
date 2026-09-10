"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";

export function useTaskTime(taskId: string) {
    const [persistedSeconds, setPersistedSeconds] = useState(0);
    const [runningSeconds, setRunningSeconds] = useState(0);
    const [loading, setLoading] = useState(false);

    const refetch = useCallback(async () => {
        if (!taskId) return;
        try {
            setLoading(true);
            const res = await api.get(`/tasks/${taskId}/time`);
            const data = res.data?.data || {};

            setPersistedSeconds(Number(data.totalSeconds) || 0);
            setRunningSeconds(Number(data.runningSeconds) || 0);

            console.log(
                `⏱️ Task ${taskId} persisted=${data.totalSeconds}s running=${data.runningSeconds}s`
            );
        } catch (err: any) {
            if (err.response?.status !== 404) {
                console.error("Error fetching task time:", err);
            }
            setPersistedSeconds(0);
            setRunningSeconds(0);
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { persistedSeconds, runningSeconds, loading, refetch };
}