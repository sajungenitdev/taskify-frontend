// hooks/useBadges.ts

import { useState, useEffect, useCallback } from "react";
import { BadgeCounts, badgeService } from "@/lib/badgeService";
import { BadgeKey } from "@/lib/menuItems";

/**
 * Custom hook for using badges in components
 * Provides real-time badge counts with automatic updates
 */
export function useBadges() {
  const [counts, setCounts] = useState<BadgeCounts>(
    badgeService.getBadgeCounts(),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize the badge service
    const initBadges = async () => {
      try {
        await badgeService.initialize();
      } catch (error) {
        // Silently handle initialization errors
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to badge updates
    const unsubscribe = badgeService.subscribe((newCounts) => {
      setCounts(newCounts);
      setLoading(false);
    });

    // Initialize
    initBadges();

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Manually refresh badges
   */
  const refreshBadges = useCallback(async () => {
    setLoading(true);
    try {
      await badgeService.refresh();
    } catch (error) {
      // Silently handle refresh errors
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get count for a specific badge type
   */
  const getBadgeCount = useCallback(
    (key: BadgeKey): number => {
      return counts[key] || 0;
    },
    [counts],
  );

  /**
   * Set a specific badge count
   */
  const setBadge = useCallback((key: BadgeKey, count: number) => {
    badgeService.setBadge(key, count);
  }, []);

  /**
   * Increment a badge count
   */
  const incrementBadge = useCallback((key: BadgeKey, amount: number = 1) => {
    badgeService.incrementBadge(key, amount);
  }, []);

  /**
   * Decrement a badge count
   */
  const decrementBadge = useCallback((key: BadgeKey, amount: number = 1) => {
    badgeService.decrementBadge(key, amount);
  }, []);

  /**
   * Update badges from API data
   */
  const updateFromData = useCallback((data: Partial<BadgeCounts>) => {
    badgeService.updateFromData(data);
  }, []);

  return {
    counts,
    loading,
    refreshBadges,
    getBadgeCount,
    setBadge,
    incrementBadge,
    decrementBadge,
    updateFromData,
    // Convenience getters
    notifications: counts.notifications,
    pendingLeaves: counts.pendingLeaves,
    pendingApprovals: counts.pendingApprovals,
    myTasks: counts.myTasks,
    messages: counts.messages,
    pendingReviews: counts.pendingReviews,
    upcomingEvents: counts.upcomingEvents,
  };
}
