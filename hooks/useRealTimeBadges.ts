// hooks/useRealTimeBadges.ts

import { useEffect } from "react";
import { badgeService } from "@/lib/badgeService";
import { useWebSocket } from "./useWebSocket";

/**
 * Hook for real-time badge updates via WebSocket
 */
export function useRealTimeBadges() {
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !socket) return;

    // Handler for incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "badge_update") {
          // Update specific badge count
          if (data.key && data.count !== undefined) {
            // Refresh all badges to get latest counts
            badgeService.refresh();
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Add event listener
    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, isConnected]);
}
