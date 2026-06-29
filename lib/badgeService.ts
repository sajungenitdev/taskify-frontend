// lib/badgeService.ts

import { BadgeKey } from "./menuItems";

/**
 * Badge Counts Interface
 * Defines all badge types available in the system
 */
export interface BadgeCounts {
  notifications: number;
  pendingLeaves: number;
  pendingApprovals: number;
  myTasks: number;
  messages: number;
  pendingReviews: number;
  upcomingEvents: number;
}

/**
 * Badge Service
 * Manages dynamic badge counts with local state management
 * No API calls - updates are done manually or via events
 */
class BadgeService {
  private static instance: BadgeService;
  private badgeCounts: BadgeCounts = {
    notifications: 0,
    pendingLeaves: 0,
    pendingApprovals: 0,
    myTasks: 0,
    messages: 0,
    pendingReviews: 0,
    upcomingEvents: 0,
  };

  private listeners: ((counts: BadgeCounts) => void)[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BadgeService {
    if (!BadgeService.instance) {
      BadgeService.instance = new BadgeService();
    }
    return BadgeService.instance;
  }

  /**
   * Initialize the badge service
   * Sets up event listeners for badge updates
   */
  async initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true;

    // Listen for badge update events from the application
    if (typeof window !== "undefined") {
      window.addEventListener(
        "badgeUpdate",
        this.handleBadgeUpdate as EventListener,
      );
    }

    // Initial fetch - just notify with current counts
    this.notifyListeners();
  }

  /**
   * Handle badge update events from the application
   */
  private handleBadgeUpdate = (event: CustomEvent) => {
    const { key, count, type } = event.detail;

    if (type === "increment") {
      this.incrementBadge(key, count || 1);
    } else if (type === "decrement") {
      this.decrementBadge(key, count || 1);
    } else if (type === "set") {
      this.setBadge(key, count || 0);
    } else if (type === "refresh") {
      this.refresh();
    }
  };

  /**
   * Get current badge counts
   */
  getBadgeCounts(): BadgeCounts {
    return { ...this.badgeCounts };
  }

  /**
   * Get specific badge count
   */
  getBadgeCount(key: BadgeKey): number {
    return this.badgeCounts[key] || 0;
  }

  /**
   * Set a specific badge count
   */
  setBadge(key: BadgeKey, count: number) {
    this.badgeCounts[key] = Math.max(0, count);
    this.notifyListeners();
  }

  /**
   * Subscribe to badge updates
   * Returns a function to unsubscribe
   */
  subscribe(callback: (counts: BadgeCounts) => void): () => void {
    this.listeners.push(callback);

    // Immediately send current counts
    callback(this.getBadgeCounts());

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all listeners of badge changes
   */
  private notifyListeners() {
    const counts = this.getBadgeCounts();
    this.listeners.forEach((callback) => {
      try {
        callback(counts);
      } catch (error) {
        // Silently handle listener errors
      }
    });
  }

  /**
   * Increment a specific badge count
   */
  incrementBadge(key: BadgeKey, amount: number = 1) {
    this.badgeCounts[key] = (this.badgeCounts[key] || 0) + amount;
    this.notifyListeners();
  }

  /**
   * Decrement a specific badge count
   */
  decrementBadge(key: BadgeKey, amount: number = 1) {
    this.badgeCounts[key] = Math.max(0, (this.badgeCounts[key] || 0) - amount);
    this.notifyListeners();
  }

  /**
   * Reset all badge counts to zero
   */
  resetAllBadges() {
    Object.keys(this.badgeCounts).forEach((key) => {
      this.badgeCounts[key as BadgeKey] = 0;
    });
    this.notifyListeners();
  }

  /**
   * Refresh badges - just notifies listeners with current counts
   * No API calls
   */
  async refresh(): Promise<void> {
    this.notifyListeners();
  }

  /**
   * Update badges from API data (call this when you fetch data)
   */
  updateFromData(data: Partial<BadgeCounts>) {
    Object.keys(data).forEach((key) => {
      if (key in this.badgeCounts) {
        this.badgeCounts[key as BadgeKey] = Math.max(
          0,
          data[key as BadgeKey] || 0,
        );
      }
    });
    this.notifyListeners();
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener(
        "badgeUpdate",
        this.handleBadgeUpdate as EventListener,
      );
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const badgeService = BadgeService.getInstance();
