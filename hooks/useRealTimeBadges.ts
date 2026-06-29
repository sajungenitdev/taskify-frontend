// hooks/useRealTimeBadges.ts

import { useEffect } from 'react';
import { badgeService } from '@/lib/badgeService';
import { useWebSocket } from './useWebSocket'; // Your WebSocket hook

/**
 * Hook for real-time badge updates via WebSocket
 */
export function useRealTimeBadges() {
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !socket) return;

    // Listen for badge update events
    const handleBadgeUpdate = (data: any) => {
      if (data.type === 'badge_update') {
        // Update specific badge count
        if (data.key && data.count !== undefined) {
          // Refresh all badges to get latest counts
          badgeService.refresh();
        }
      }
    };

    socket.on('badge_update', handleBadgeUpdate);

    return () => {
      socket.off('badge_update', handleBadgeUpdate);
    };
  }, [socket, isConnected]);
}