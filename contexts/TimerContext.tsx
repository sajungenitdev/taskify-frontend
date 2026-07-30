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
  lastSavedTime: number;
  lastSyncedMinutes: number;
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
}

// ============ CONSTANTS ============
const TIMER_KEY = "taskTimer";
const SYNC_INTERVAL = 30000;

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// ============ PROVIDER ============
export function TimerProvider({ children }: { children: ReactNode }) {
  // ============ STATE ============
  const [timerState, setTimerState] = useState<TimerState>(() => {
    try {
      const saved = localStorage.getItem(TIMER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.taskId) {
          const now = Date.now();
          let elapsedSinceSave = 0;
          if (parsed.isRunning && parsed.lastSavedTime) {
            elapsedSinceSave = Math.floor((now - parsed.lastSavedTime) / 1000);
          }
          return {
            taskId: parsed.taskId,
            isRunning: parsed.isRunning || false,
            seconds:
              parsed.elapsedSeconds + (parsed.isRunning ? elapsedSinceSave : 0),
            elapsedSeconds:
              parsed.elapsedSeconds + (parsed.isRunning ? elapsedSinceSave : 0),
            lastSavedTime: now,
            lastSyncedMinutes: parsed.lastSyncedMinutes || 0,
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
    };
  });

  // ============ REFS ============
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateRef = useRef(timerState);

  // Update ref whenever state changes
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  // ============ LOCAL STORAGE HELPERS ============
  const saveTimerToStorage = useCallback((state: TimerState) => {
    try {
      localStorage.setItem(
        TIMER_KEY,
        JSON.stringify({
          taskId: state.taskId,
          isRunning: state.isRunning,
          elapsedSeconds: state.elapsedSeconds,
          lastSavedTime: Date.now(),
          lastSyncedMinutes: state.lastSyncedMinutes,
        }),
      );
    } catch {
      // Silent fail
    }
  }, []);

  // ============ BACKEND SYNC ============
  const syncTimerWithBackend = useCallback(async (taskId: string) => {
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

        await api.patch(`/tasks/${taskId}/status`, {
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
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0
      ? `${hrs}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`
      : `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  }, []);

  const formatTimeShort = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }, []);

  // ============ TIMER FUNCTIONS - FIXED ============
  const startTimer = useCallback(
    (taskId: string, initialSeconds: number = 0) => {
      console.log("🔄 startTimer called with:", { taskId, initialSeconds });

      // Clear any existing timer interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const now = Date.now();
      const minutes = Math.floor(initialSeconds / 60);

      const newState: TimerState = {
        taskId,
        isRunning: true,
        seconds: initialSeconds,
        elapsedSeconds: initialSeconds,
        lastSavedTime: now,
        lastSyncedMinutes: minutes,
      };

      // Update state
      setTimerState(newState);

      // Update ref immediately
      timerStateRef.current = newState;

      // Save to storage
      saveTimerToStorage(newState);

      // Start the timer interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      timerIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          const updated = {
            ...prev,
            seconds: prev.seconds + 1,
            elapsedSeconds: prev.elapsedSeconds + 1,
          };
          timerStateRef.current = updated;
          return updated;
        });
      }, 1000);

      console.log("✅ Timer started, state:", newState);
      console.log("✅ Timer interval set");
    },
    [saveTimerToStorage],
  );

  const pauseTimer = useCallback(() => {
    console.log("⏸️ pauseTimer called");

    setTimerState((prev) => {
      if (!prev.isRunning || !prev.taskId) {
        console.log("⏸️ Timer not running, ignoring pause");
        return prev;
      }

      const newState = {
        ...prev,
        isRunning: false,
        lastSavedTime: Date.now(),
      };

      timerStateRef.current = newState;
      console.log("⏸️ Timer paused, state:", newState);
      return newState;
    });

    // Clear interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    console.log("▶️ resumeTimer called");

    setTimerState((prev) => {
      if (prev.isRunning || !prev.taskId) {
        console.log("▶️ Timer already running or no task, ignoring resume");
        return prev;
      }

      const newState = {
        ...prev,
        isRunning: true,
        lastSavedTime: Date.now(),
      };

      timerStateRef.current = newState;
      console.log("▶️ Timer resumed, state:", newState);
      return newState;
    });

    // Restart interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimerState((prev) => {
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

  const stopTimer = useCallback(
    async (taskId: string) => {
      console.log("⏹️ stopTimer called for task:", taskId);

      if (timerStateRef.current.taskId !== taskId) {
        console.log("⏹️ Timer not active for this task");
        return { success: false, minutes: 0, displayTime: "0m" };
      }

      const totalSeconds = timerStateRef.current.elapsedSeconds;
      const minutes = Math.floor(totalSeconds / 60);

      // Clear intervals
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }

      // Clear storage
      try {
        localStorage.removeItem(TIMER_KEY);
      } catch {
        // Silent fail
      }

      // Save final time to backend
      let savedMinutes = 0;
      if (minutes > 0) {
        try {
          const taskResponse = await api.get(`/tasks/${taskId}`);
          const currentMinutes = taskResponse.data.data?.actualMinutes || 0;
          savedMinutes = currentMinutes + minutes;
          await api.patch(`/tasks/${taskId}/status`, {
            actualMinutes: savedMinutes,
          });
          console.log(`✅ Timer stopped: +${minutes}m (total: ${savedMinutes}m)`);
        } catch (error) {
          console.error("❌ Failed to save final timer:", error);
        }
      }

      // Reset timer state
      const resetState: TimerState = {
        taskId: null,
        isRunning: false,
        seconds: 0,
        elapsedSeconds: 0,
        lastSavedTime: Date.now(),
        lastSyncedMinutes: 0,
      };

      setTimerState(resetState);
      timerStateRef.current = resetState;

      return {
        success: true,
        minutes: savedMinutes > 0 ? savedMinutes : minutes,
        displayTime: formatTimeShort(totalSeconds),
      };
    },
    [formatTimeShort],
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
    [formatTimeShort],
  );

  const isTimerActiveForTask = useCallback((taskId: string): boolean => {
    const isActive = timerStateRef.current.taskId === taskId;
    console.log(`🔍 isTimerActiveForTask: ${taskId} -> ${isActive}`);
    return isActive;
  }, []);

  // ============ COMPUTED VALUES ============
  const isTimerRunning = timerState.isRunning && timerState.taskId !== null;
  const activeTimerTaskId = timerState.taskId;

  // ============ EFFECTS ============

  // Save timer state to storage (debounced)
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveTimerToStorage(timerState);
    }, 200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [timerState, saveTimerToStorage]);

  // Auto-sync timer with backend every 30 seconds
  useEffect(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    if (timerState.isRunning && timerState.taskId) {
      syncIntervalRef.current = setInterval(() => {
        syncTimerWithBackend(timerState.taskId!);
      }, SYNC_INTERVAL);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.taskId, syncTimerWithBackend]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (timerState.isRunning && timerState.taskId) {
        await syncTimerWithBackend(timerState.taskId);
        saveTimerToStorage(timerState);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [timerState, syncTimerWithBackend, saveTimerToStorage]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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
      formatTime,
      formatTimeShort,
      getDisplayTimeForTask,
      isTimerActiveForTask,
      isTimerRunning,
      activeTimerTaskId,
      syncTimerWithBackend,
    }),
    [
      timerState,
      startTimer,
      pauseTimer,
      resumeTimer,
      stopTimer,
      formatTime,
      formatTimeShort,
      getDisplayTimeForTask,
      isTimerActiveForTask,
      isTimerRunning,
      activeTimerTaskId,
      syncTimerWithBackend,
    ],
  );

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

// ============ HOOK ============
export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}