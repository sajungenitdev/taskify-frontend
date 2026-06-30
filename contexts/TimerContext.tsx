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

// ============ TYPES ============
interface TimerState {
  taskId: string | null;
  isRunning: boolean;
  seconds: number;
  elapsedSeconds: number;
  lastSavedTime: number;
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (taskId: string, initialSeconds?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (taskId: string) => {
    success: boolean;
    minutes: number;
    displayTime: string;
  };
  formatTime: (seconds: number) => string;
  formatTimeShort: (seconds: number) => string;
  getDisplayTimeForTask: (taskId: string, actualMinutes?: number) => string;
  isTimerActiveForTask: (taskId: string) => boolean;
  isTimerRunning: boolean;
  activeTimerTaskId: string | null;
}

// ============ CONSTANTS ============
const TIMER_KEY = "taskTimer";

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
    };
  });

  // ============ REFS ============
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
        }),
      );
    } catch {
      // Silent fail
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

  // ============ TIMER FUNCTIONS ============
  const startTimer = useCallback(
    (taskId: string, initialSeconds: number = 0) => {
      console.log("🟢 TimerContext: startTimer called for task:", taskId);
      setTimerState((prev) => {
        const now = Date.now();
        const newState = {
          taskId,
          isRunning: true,
          seconds: initialSeconds,
          elapsedSeconds: initialSeconds,
          lastSavedTime: now,
        };
        return newState;
      });
    },
    [],
  );

  const pauseTimer = useCallback(() => {
    console.log("🟡 TimerContext: pauseTimer called");
    setTimerState((prev) => {
      if (!prev.isRunning || !prev.taskId) return prev;
      return {
        ...prev,
        isRunning: false,
        lastSavedTime: Date.now(),
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    console.log("🟢 TimerContext: resumeTimer called");
    setTimerState((prev) => {
      if (prev.isRunning || !prev.taskId) return prev;
      return {
        ...prev,
        isRunning: true,
        lastSavedTime: Date.now(),
      };
    });
  }, []);

  // FIXED: Use timerStateRef to always get the latest state
  const stopTimer = useCallback(
    (taskId: string) => {
      console.log("🔴 TimerContext: stopTimer called for task:", taskId);
      console.log(
        "🔴 Current timerState.taskId:",
        timerStateRef.current.taskId,
      );

      // Check if this is the active task using the ref
      if (timerStateRef.current.taskId !== taskId) {
        console.log(
          "❌ Task ID mismatch! Cannot stop timer for different task.",
        );
        return { success: false, minutes: 0, displayTime: "0m" };
      }

      const totalSeconds = timerStateRef.current.elapsedSeconds;
      const minutes = Math.floor(totalSeconds / 60);
      console.log(`⏱️ Timer stopped with ${totalSeconds}s (${minutes}m)`);

      // Clear interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Clear storage
      try {
        localStorage.removeItem(TIMER_KEY);
      } catch {
        // Silent fail
      }

      // Reset timer state
      setTimerState({
        taskId: null,
        isRunning: false,
        seconds: 0,
        elapsedSeconds: 0,
        lastSavedTime: Date.now(),
      });

      // Return result
      if (minutes === 0) {
        return { success: true, minutes: 0, displayTime: "0m" };
      } else {
        // Save tracked time to localStorage
        try {
          const tracked = JSON.parse(
            localStorage.getItem("trackedTime") || "[]",
          );
          tracked.push({
            taskId,
            minutes,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem("trackedTime", JSON.stringify(tracked));
        } catch {
          // Silent fail
        }

        return {
          success: true,
          minutes,
          displayTime: formatTimeShort(totalSeconds),
        };
      }
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
    return timerStateRef.current.taskId === taskId;
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

  // Timer interval
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (timerState.isRunning && timerState.taskId) {
      timerIntervalRef.current = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          seconds: prev.seconds + 1,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.taskId]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timerState.isRunning && timerState.taskId) {
        saveTimerToStorage(timerState);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [timerState, saveTimerToStorage]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
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
