"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";
import type { Review } from "../_types";

interface ReviewStats {
  total: number;
  averageRating: number;
  ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

const DEFAULT_STATS: ReviewStats = {
  total: 0,
  averageRating: 0,
  ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
};

export function useReviews(taskId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}/reviews`);
      if (response.data.success) {
        setReviews(response.data.data || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        } else {
          setStats(DEFAULT_STATS);
        }
      } else {
        setReviews([]);
        setStats(DEFAULT_STATS);
      }
    } catch (err: any) {
      if (err.response?.status !== 403 && err.response?.status !== 404) {
        console.error("Error fetching reviews:", err);
      }
      setReviews([]);
      setStats(DEFAULT_STATS);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { reviews, stats, loading, refetch };
}