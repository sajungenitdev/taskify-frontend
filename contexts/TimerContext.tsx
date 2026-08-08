// contexts/TimerContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// ============ TYPES ============
interface TimerState {
  taskId: string | null;
  isRunning: boolean;
  seconds: number;
  elapsedSeconds: number;
  startedAt: number | null;
  lastSavedTime: number;
  lastSyncedMinutes: number;
  userId: string | null;
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (taskId: string, initialSeconds?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (taskId: string) => Promise<{
    success: boolean;
    minutes: number;
    displayTime: string;
  }>;
  formatTime: (seconds: number) => string;
  formatTimeShort: (seconds: number) => string;
  getDisplayTimeForTask: (taskId: string, actualMinutes?: number) => string;
  isTimerActiveForTask: (taskId: string) => boolean;
  isTimerRunning: boolean;
  activeTimerTaskId: string | null;
  syncTimerWithBackend: (taskId: string) => Promise<void>;
  resetTimer: () => void;
  stopTimerAutomatically: (taskId: string) => Promise<{
    success: boolean;
    minutes: number;
    displayTime: string;
  }>;
  isTimerValidForUser: (userId: string) => boolean;
  getTimerOwner: () => string | null;
}

// ============ CONSTANTS ============
const TIMER_KEY = "taskTimer";
const SYNC_INTERVAL = 30000;

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// ============ HELPER FUNCTIONS ============
const getTimerKey = (userId: string) => `taskTimer_${userId}`;
const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user._id || user.id || null;
    }
    return null;
  } catch {
    return null;
  }
};

// ============ PROVIDER ============
export function TimerProvider({ children }: { children: ReactNode }) {
  // ============ STATE ============
  const [timerState, setTimerState] = useState<TimerState>(() => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return {
          taskId: null,
          isRunning: false,
          seconds: 0,
          elapsedSeconds: 0,
          lastSavedTime: Date.now(),
          lastSyncedMinutes: 0,
          userId: null,
        };
      }

      const key = getTimerKey(userId);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.taskId) {
          const now = Date.now();
          let elapsedSinceSave = 0;
          if (parsed.isRunning && parsed.lastSavedTime) {
            elapsedSinceSave = Math.floor((now - parsed.lastSavedTime) / 1000);
          }

          const totalElapsed = parsed.elapsedSeconds + (parsed.isRunning ? elapsedSinceSave : 0);

          // If elapsed time is more than 1 hour and not running, reset it
          if (!parsed.isRunning && totalElapsed > 3600) {
            console.log("⚠️ Stale timer detected, resetting");
            return {
              taskId: null,
              isRunning: false,
              seconds: 0,
              elapsedSeconds: 0,
              lastSavedTime: now,
              lastSyncedMinutes: 0,
              userId: userId,
            };
          }

          return {
            taskId: parsed.taskId,
            isRunning: parsed.isRunning || false,
            seconds: parsed.elapsedSeconds + (parsed.isRunning ? elapsedSinceSave : 0),
            elapsedSeconds: parsed.elapsedSeconds + (parsed.isRunning ? elapsedSinceSave : 0),
            lastSavedTime: now,
            lastSyncedMinutes: parsed.lastSyncedMinutes || 0,
            userId: userId,
          };
        }
      }
    } catch {
      // Silent fail
    }
    return {
      taskId: null,
      isRunning: false,
      seconds: 0,
      elapsedSeconds: 0,
      lastSavedTime: Date.now(),
      lastSyncedMinutes: 0,
      userId: null,
    };
  });

  // ============ REFS ============
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateRef = useRef(timerState);
  const isStoppingRef = useRef(false);
  const isStoppedRef = useRef(false);
  const intervalIdRef = useRef(0);

  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  // ============ LOCAL STORAGE HELPERS ============
  const saveTimerToStorage = useCallback((state: TimerState) => {
    try {
      const userId = state.userId || getCurrentUserId();
      if (!userId) return;

      const key = getTimerKey(userId);
      localStorage.setItem(
        key,
        JSON.stringify({
          taskId: state.taskId,
          isRunning: state.isRunning,
          elapsedSeconds: state.elapsedSeconds,
          lastSavedTime: Date.now(),
          lastSyncedMinutes: state.lastSyncedMinutes,
        })
      );
    } catch {
      // Silent fail
    }
  }, []);

  // ============ RESET TIMER ============
  const resetTimer = useCallback(() => {
    console.log("🔄 resetTimer called - Clearing timer state");

    isStoppedRef.current = false;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    intervalIdRef.current += 1;

    try {
      const userId = getCurrentUserId();
      if (userId) {
        localStorage.removeItem(getTimerKey(userId));
      }
      localStorage.removeItem(TIMER_KEY);
    } catch {
      // Silent fail
    }

    const resetState: TimerState = {
      taskId: null,
      isRunning: false,
      seconds: 0,
      elapsedSeconds: 0,
      lastSavedTime: Date.now(),
      lastSyncedMinutes: 0,
      userId: getCurrentUserId(),
    };

    setTimerState(resetState);
    timerStateRef.current = resetState;
    isStoppingRef.current = false;
    console.log("✅ Timer reset successfully");
  }, []);

  // ============ BACKEND SYNC ============
  const syncTimerWithBackend = useCallback(async (taskId: string) => {
    if (isStoppedRef.current || isStoppingRef.current) {
      console.log("⏹️ Sync skipped - timer is stopped");
      return;
    }

    const currentState = timerStateRef.current;
    if (currentState.taskId !== taskId) return;

    const totalSeconds = currentState.elapsedSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const newMinutes = minutes - currentState.lastSyncedMinutes;

    if (newMinutes > 0) {
      try {
        const taskResponse = await api.get(`/tasks/${taskId}`);
        const currentMinutes = taskResponse.data.data?.actualMinutes || 0;
        const updatedMinutes = currentMinutes + newMinutes;

        await api.patch(`/tasks/${taskId}/time`, {
          actualMinutes: updatedMinutes,
        });

        setTimerState((prev) => ({
          ...prev,
          lastSyncedMinutes: minutes,
        }));

        console.log(`✅ Timer synced: +${newMinutes}m (total: ${updatedMinutes}m)`);
      } catch (error) {
        console.error("❌ Failed to sync timer with backend:", error);
      }
    }
  }, []);

  // ============ FORMAT FUNCTIONS ============
  const formatTime = useCallback((seconds: number): string => {
    const roundedSeconds = Math.round(seconds * 10) / 10;
    const hrs = Math.floor(roundedSeconds / 3600);
    const mins = Math.floor((roundedSeconds % 3600) / 60);
    const secs = Math.floor(roundedSeconds % 60);

    return hrs > 0
      ? `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`
      : `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  }, []);

  const formatTimeShort = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }, []);

  const startTimer = useCallback(
    (taskId: string, initialSeconds: number = 0) => {
      console.log("🔄 startTimer called:", {
        taskId,
        initialSeconds,
      });

      isStoppedRef.current = false;
      isStoppingRef.current = false;

      const userId = getCurrentUserId();

      if (!userId) {
        console.error("❌ No user found, cannot start timer");
        return;
      }

      // Clear existing intervals
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }

      intervalIdRef.current += 1;
      const currentIntervalId = intervalIdRef.current;

      const now = Date.now();

      const newState: TimerState = {
        taskId,
        isRunning: true,
        seconds: initialSeconds,
        elapsedSeconds: initialSeconds,
        startedAt: now - initialSeconds * 1000,
        lastSavedTime: now,
        lastSyncedMinutes: Math.floor(initialSeconds / 60),
        userId,
      };

      setTimerState(newState);
      timerStateRef.current = newState;

      saveTimerToStorage(newState);

      timerIntervalRef.current = setInterval(() => {
        if (currentIntervalId !== intervalIdRef.current) {
          return;
        }

        if (
          isStoppedRef.current ||
          !timerStateRef.current.isRunning ||
          !timerStateRef.current.startedAt
        ) {
          return;
        }

        const elapsedSeconds = Math.floor(
          (Date.now() - timerStateRef.current.startedAt) / 1000
        );

        setTimerState((prev) => {
          if (!prev.isRunning || isStoppedRef.current) {
            return prev;
          }

          const updated = {
            ...prev,
            seconds: elapsedSeconds,
            elapsedSeconds,
            lastSavedTime: Date.now(),
          };

          timerStateRef.current = updated;

          return updated;
        });
      }, 250);

      // Backend sync every 30 seconds
      syncIntervalRef.current = setInterval(() => {
        if (
          !isStoppingRef.current &&
          !isStoppedRef.current &&
          timerStateRef.current.isRunning
        ) {
          syncTimerWithBackend(taskId);
        }
      }, SYNC_INTERVAL);

      console.log("✅ Timer started");
    },
    [saveTimerToStorage, syncTimerWithBackend]
  );

  const pauseTimer = useCallback(() => {
    console.log("⏸️ pauseTimer called");

    // Don't pause if already paused or no task
    if (!timerStateRef.current.isRunning || !timerStateRef.current.taskId) {
      console.log("⏸️ Timer not running, ignoring pause");
      return;
    }

    setTimerState((prev) => {
      const newState = {
        ...prev,
        isRunning: false,
        lastSavedTime: Date.now(),
      };
      timerStateRef.current = newState;
      return newState;
    });

    // Clear interval but keep the elapsed time
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Increment interval ID to kill any stale intervals
    intervalIdRef.current += 1;
  }, []);

  const resumeTimer = useCallback(() => {
    console.log("▶️ resumeTimer called");

    // Don't resume if already running or no task
    if (timerStateRef.current.isRunning || !timerStateRef.current.taskId) {
      console.log("▶️ Timer already running or no task, ignoring resume");
      return;
    }

    // Check if timer is stopped
    if (isStoppedRef.current) {
      console.log("▶️ Timer is stopped, cannot resume");
      toast.error("Timer is stopped. Please start a new timer.");
      return;
    }

    setTimerState((prev) => {
      const newState = {
        ...prev,
        isRunning: true,
        lastSavedTime: Date.now(),
      };
      timerStateRef.current = newState;
      return newState;
    });

    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Increment interval ID to track which interval is current
    intervalIdRef.current += 1;
    const currentIntervalId = intervalIdRef.current;

    // Start a SINGLE new interval with ID check
    timerIntervalRef.current = setInterval(() => {
      // Check if this interval is still the current one
      if (currentIntervalId !== intervalIdRef.current) {
        console.log("⏹️ Stale interval detected, skipping");
        return;
      }

      setTimerState((prev) => {
        if (!prev.isRunning || isStoppedRef.current) {
          return prev;
        }
        const updated = {
          ...prev,
          seconds: prev.seconds + 1,
          elapsedSeconds: prev.elapsedSeconds + 1,
        };
        timerStateRef.current = updated;
        return updated;
      });
    }, 1000);
  }, []);

  // ============ STOP TIMER ============
  const stopTimer = useCallback(
    async (taskId: string) => {
      console.log("⏹️ stopTimer called for task:", taskId);

      if (isStoppedRef.current) {
        console.log("⏹️ Timer already stopped");
        return { success: true, minutes: 0, displayTime: "0m" };
      }

      if (timerStateRef.current.taskId !== taskId) {
        console.log("⏹️ Timer not active for this task");
        return { success: false, minutes: 0, displayTime: "0m" };
      }

      // Mark as stopped immediately
      isStoppedRef.current = true;
      isStoppingRef.current = true;

      // Clear intervals immediately
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }

      // Increment interval ID to kill any stale intervals
      intervalIdRef.current += 1;

      // Get the elapsed time since timer started (seconds from 0)
      const elapsedSeconds = timerStateRef.current.elapsedSeconds;
      const displayTime = formatTimeShort(elapsedSeconds);

      console.log(`⏹️ Timer stopped: ${elapsedSeconds}s (${displayTime})`);

      try {
        const userId = getCurrentUserId();
        if (userId) {
          localStorage.removeItem(getTimerKey(userId));
        }
        localStorage.removeItem(TIMER_KEY);
      } catch {
        // Silent fail
      }

      let savedMinutes = 0;

      // Only save if time was tracked
      if (elapsedSeconds > 0) {
        try {
          // Get current task to get the current actualMinutes
          const taskResponse = await api.get(`/tasks/${taskId}`);
          const currentMinutes = taskResponse.data.data?.actualMinutes || 0;

          // Calculate the incremental minutes (only what was tracked in this session)
          const incrementalMinutes = elapsedSeconds / 60;
          savedMinutes = Math.round((currentMinutes + incrementalMinutes) * 100) / 100;

          console.log(`📊 Current: ${currentMinutes}m, Adding: ${incrementalMinutes}m, Total: ${savedMinutes}m`);

          // Update task time
          await api.patch(`/tasks/${taskId}/time`, {
            actualMinutes: savedMinutes,
          });

          // Create timer entry
          try {
            await api.post("/timer/entries", {
              taskId: taskId,
              description: `Timer stopped - ${displayTime} tracked`,
              duration: elapsedSeconds,
            });
            console.log("✅ Timer entry created");
          } catch (timerError) {
            console.error("❌ Failed to create timer entry:", timerError);
          }
        } catch (error) {
          console.error("❌ Failed to save timer:", error);
          savedMinutes = Math.round((elapsedSeconds / 60) * 100) / 100;
        }
      } else {
        console.log("⏹️ No time tracked, not saving");
      }

      // Reset state
      const resetState: TimerState = {
        taskId: null,
        isRunning: false,
        seconds: 0,
        elapsedSeconds: 0,
        lastSavedTime: Date.now(),
        lastSyncedMinutes: 0,
        userId: getCurrentUserId(),
      };

      setTimerState(resetState);
      timerStateRef.current = resetState;
      isStoppingRef.current = false;

      return {
        success: true,
        minutes: savedMinutes,
        displayTime: displayTime,
      };
    },
    [formatTimeShort]
  );

  const stopTimerAutomatically = useCallback(
    async (taskId: string) => {
      return stopTimer(taskId);
    },
    [stopTimer]
  );

  const getDisplayTimeForTask = useCallback(
    (taskId: string, actualMinutes: number = 0): string => {
      if (timerStateRef.current.taskId === taskId) {
        return formatTimeShort(timerStateRef.current.elapsedSeconds);
      }
      if (actualMinutes > 0) {
        return `${actualMinutes}m`;
      }
      return "0m";
    },
    [formatTimeShort]
  );

  const isTimerActiveForTask = useCallback((taskId: string): boolean => {
    return timerStateRef.current.taskId === taskId;
  }, []);

  const isTimerValidForUser = useCallback((userId: string): boolean => {
    if (!userId) return false;
    return timerStateRef.current.userId === userId;
  }, []);

  const getTimerOwner = useCallback((): string | null => {
    return timerStateRef.current.userId;
  }, []);

  const isTimerRunning = timerState.isRunning && timerState.taskId !== null;
  const activeTimerTaskId = timerState.taskId;

  // ============ EFFECTS ============

  useEffect(() => {
    if (!isMountedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimerToStorage(timerState);
    }, 200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [timerState, saveTimerToStorage]);

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ============ CONTEXT VALUE ============
  const value = useMemo(
    () => ({
      timerState,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      stopTimerAutomatically,
      formatTime,
      formatTimeShort,
      getDisplayTimeForTask,
      isTimerActiveForTask,
      isTimerRunning,
      activeTimerTaskId,
      syncTimerWithBackend,
      resetTimer,
      isTimerValidForUser,
      getTimerOwner,
    }),
    [
      timerState,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      stopTimerAutomatically,
      formatTime,
      formatTimeShort,
      getDisplayTimeForTask,
      isTimerActiveForTask,
      isTimerRunning,
      activeTimerTaskId,
      syncTimerWithBackend,
      resetTimer,
      isTimerValidForUser,
      getTimerOwner,
    ]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

// ============ HOOK ============
export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}