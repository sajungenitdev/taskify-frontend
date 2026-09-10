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

// ============================================================
// TYPES
// ============================================================
interface TimerState {
  taskId: string | null;
  isRunning: boolean;
  /** total seconds for the CURRENT session (pausedElapsed + running) */
  elapsedSeconds: number;
  /** epoch ms when the current running segment started; null if paused */
  startedAt: number | null;
  /** accumulated seconds from previous pause segments in THIS session */
  pausedElapsed: number;
  /** last time we synced a partial total to the server (floor of minutes) */
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

// ============================================================
// CONSTANTS
// ============================================================
const TIMER_KEY = "taskTimer";
const SYNC_INTERVAL = 30000;   // partial sync every 30s while running
const TICK_INTERVAL = 1000;    // UI tick every second
const MAX_STALE_SECONDS = 12 * 3600; // discard timers older than 12h

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// ============================================================
// HELPERS
// ============================================================
const getTimerKey = (userId: string) => `taskTimer_${userId}`;

const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user._id || user.id || null;
    }
  } catch {
    /* silent */
  }
  return null;
};

const EMPTY_STATE: TimerState = {
  taskId: null,
  isRunning: false,
  elapsedSeconds: 0,
  startedAt: null,
  pausedElapsed: 0,
  lastSyncedMinutes: 0,
  userId: null,
};

/**
 * Rebuild timer state from localStorage.
 * If it was running when the tab closed, compute elapsed from startedAt
 * so no seconds are lost.
 */
function loadPersistedState(): TimerState {
  try {
    const userId = getCurrentUserId();
    if (!userId) return { ...EMPTY_STATE, userId: null };

    const raw = localStorage.getItem(getTimerKey(userId));
    if (!raw) return { ...EMPTY_STATE, userId };

    const parsed = JSON.parse(raw);
    if (!parsed?.taskId) return { ...EMPTY_STATE, userId };

    let elapsed = parsed.pausedElapsed || 0;
    let startedAt: number | null = null;
    let isRunning = false;

    if (parsed.isRunning && parsed.startedAt) {
      const now = Date.now();
      const runningFor = Math.max(0, Math.floor((now - parsed.startedAt) / 1000));
      elapsed = (parsed.pausedElapsed || 0) + runningFor;
      startedAt = parsed.startedAt;
      isRunning = true;

      if (elapsed > MAX_STALE_SECONDS) {
        console.warn("⚠️ Stale running timer discarded");
        return { ...EMPTY_STATE, userId };
      }
    }

    return {
      taskId: parsed.taskId,
      isRunning,
      elapsedSeconds: elapsed,
      startedAt,
      pausedElapsed: parsed.pausedElapsed || 0,
      lastSyncedMinutes: parsed.lastSyncedMinutes || 0,
      userId,
    };
  } catch {
    return EMPTY_STATE;
  }
}

// ============================================================
// PROVIDER
// ============================================================
export function TimerProvider({ children }: { children: ReactNode }) {
  const [timerState, setTimerState] = useState<TimerState>(() => loadPersistedState());

  // Refs
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const syncRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const timerStateRef = useRef(timerState);
  const isStoppingRef = useRef(false);
  const isStoppedRef = useRef(false);

  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  // ============================================================
  // FORMAT (must be declared before anything that uses them)
  // ============================================================
  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "00m 00s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
    }
    return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  }, []);

  const formatTimeShort = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return "0m";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }, []);

  // ============================================================
  // PERSISTENCE
  // ============================================================
  const persist = useCallback((state: TimerState) => {
    try {
      const userId = state.userId || getCurrentUserId();
      if (!userId) return;

      if (!state.taskId) {
        localStorage.removeItem(getTimerKey(userId));
        return;
      }

      localStorage.setItem(
        getTimerKey(userId),
        JSON.stringify({
          taskId: state.taskId,
          isRunning: state.isRunning,
          startedAt: state.startedAt,
          pausedElapsed: state.pausedElapsed,
          lastSyncedMinutes: state.lastSyncedMinutes,
        })
      );
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    persist(timerState);
  }, [timerState, persist]);

  // ============================================================
  // INTERVAL CLEANUP HELPERS
  // ============================================================
  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const clearSync = useCallback(() => {
    if (syncRef.current) {
      clearInterval(syncRef.current);
      syncRef.current = null;
    }
  }, []);

  // ============================================================
  // PARTIAL SYNC (while running) — additive to server total
  // NOTE: this only creates/updates a live "running" entry.
  // The FINAL timer entry is created on STOP.
  // ============================================================
  const syncTimerWithBackend = useCallback(async (taskId: string) => {
    const state = timerStateRef.current;
    if (state.taskId !== taskId) return;
    if (isStoppingRef.current || isStoppedRef.current) return;

    const totalMinutes = Math.floor(state.elapsedSeconds / 60);
    const delta = totalMinutes - state.lastSyncedMinutes;
    if (delta <= 0) return;

    try {
      // Fetch current persisted task time and add the delta
      const taskRes = await api.get(`/tasks/${taskId}`);
      const currentMinutes = taskRes.data?.data?.actualMinutes || 0;
      const updatedMinutes = Math.round((currentMinutes + delta) * 100) / 100;

      await api.patch(`/tasks/${taskId}/time`, {
        actualMinutes: updatedMinutes,
      });

      setTimerState((prev) => ({
        ...prev,
        lastSyncedMinutes: totalMinutes,
      }));

      console.log(`⏱️ Synced +${delta}m → task ${taskId} = ${updatedMinutes}m`);
    } catch (err) {
      console.error("❌ Sync failed:", err);
    }
  }, []);

  // ============================================================
  // TICK LOOP
  // ============================================================
  const startTickLoop = useCallback(
    (taskId: string) => {
      clearTick();

      tickRef.current = setInterval(() => {
        const state = timerStateRef.current;

        if (
          isStoppedRef.current ||
          isStoppingRef.current ||
          state.taskId !== taskId ||
          !state.isRunning ||
          !state.startedAt
        ) {
          return;
        }

        const runningFor = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
        const elapsed = state.pausedElapsed + runningFor;

        setTimerState((prev) => {
          if (prev.elapsedSeconds === elapsed) return prev;
          return { ...prev, elapsedSeconds: elapsed };
        });
      }, TICK_INTERVAL);
    },
    [clearTick]
  );

  const startSyncLoop = useCallback(
    (taskId: string) => {
      clearSync();
      syncRef.current = setInterval(() => {
        if (
          !isStoppingRef.current &&
          !isStoppedRef.current &&
          timerStateRef.current.isRunning
        ) {
          syncTimerWithBackend(taskId);
        }
      }, SYNC_INTERVAL);
    },
    [clearSync, syncTimerWithBackend]
  );

  // ============================================================
  // PUBLIC: START (fresh session, from 0)
  // ============================================================
  const startTimer = useCallback(
    (taskId: string, initialSeconds: number = 0) => {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error("❌ No user; cannot start timer");
        return;
      }

      isStoppedRef.current = false;
      isStoppingRef.current = false;

      clearTick();
      clearSync();

      const now = Date.now();

      const next: TimerState = {
        taskId,
        isRunning: true,
        elapsedSeconds: 0,
        startedAt: now,
        pausedElapsed: 0,
        lastSyncedMinutes: 0,
        userId,
      };

      timerStateRef.current = next;
      setTimerState(next);

      startTickLoop(taskId);
      startSyncLoop(taskId);

      console.log("▶️ Timer started for task", taskId);
    },
    [clearSync, clearTick, startSyncLoop, startTickLoop]
  );

  // ============================================================
  // PUBLIC: PAUSE (freeze current session total)
  // ============================================================
  const pauseTimer = useCallback(() => {
    const state = timerStateRef.current;
    if (!state.taskId || !state.isRunning) return;

    const runningFor = state.startedAt
      ? Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000))
      : 0;
    const frozen = state.pausedElapsed + runningFor;

    const next: TimerState = {
      ...state,
      isRunning: false,
      startedAt: null,
      pausedElapsed: frozen,
      elapsedSeconds: frozen,
    };

    timerStateRef.current = next;
    setTimerState(next);

    clearTick();
    clearSync();

    console.log("⏸️ Paused at", frozen, "s");
  }, [clearSync, clearTick]);

  // ============================================================
  // PUBLIC: RESUME (continue from pausedElapsed, not 0)
  // ============================================================
  const resumeTimer = useCallback(() => {
    const state = timerStateRef.current;

    if (!state.taskId) {
      console.warn("No active task to resume");
      return;
    }
    if (state.isRunning) {
      console.warn("Already running");
      return;
    }
    if (isStoppedRef.current) {
      toast.error("Timer was stopped. Start a new one.");
      return;
    }

    const now = Date.now();

    const next: TimerState = {
      ...state,
      isRunning: true,
      startedAt: now, // new segment starts now
      // pausedElapsed remains — it's the accumulated total
    };

    timerStateRef.current = next;
    setTimerState(next);

    startTickLoop(state.taskId);
    startSyncLoop(state.taskId);

    console.log("▶️ Resumed from", state.pausedElapsed, "s");
  }, [startSyncLoop, startTickLoop]);

  // ============================================================
  // PUBLIC: STOP (create timer entry, sync task total, reset)
  // ============================================================
  const stopTimer = useCallback(
    async (taskId: string) => {
      const state = timerStateRef.current;

      if (isStoppedRef.current) {
        return { success: true, minutes: 0, displayTime: "0m" };
      }
      if (state.taskId !== taskId) {
        return { success: false, minutes: 0, displayTime: "0m" };
      }

      isStoppedRef.current = true;
      isStoppingRef.current = true;

      clearTick();
      clearSync();

      const runningFor =
        state.isRunning && state.startedAt
          ? Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000))
          : 0;
      const totalElapsedSeconds = state.pausedElapsed + runningFor;
      const displayTime = formatTimeShort(totalElapsedSeconds);

      console.log(`⏹️ Stopping: ${totalElapsedSeconds}s (${displayTime})`);

      try {
        const userId = getCurrentUserId();
        if (userId) localStorage.removeItem(getTimerKey(userId));
        localStorage.removeItem(TIMER_KEY);
      } catch {
        /* silent */
      }

      let savedMinutes = 0;

      if (totalElapsedSeconds > 0) {
        try {
          // 1. Save this session as a TimerEntry (duration in SECONDS)
          try {
            await api.post("/timer/entries", {
              taskId,
              description: `Session: ${displayTime}`,
              duration: totalElapsedSeconds, // 👈 SECONDS
            });
            console.log("✅ TimerEntry created:", totalElapsedSeconds, "s");
          } catch (entryErr: any) {
            console.warn(
              "⚠️ TimerEntry POST failed:",
              entryErr?.response?.data?.message
            );
          }

          // 2. Ask the backend for the fresh authoritative total
          let totalSecondsFromServer: number | null = null;
          try {
            const timeRes = await api.get(`/tasks/${taskId}/time`);
            totalSecondsFromServer =
              timeRes.data?.data?.combinedSeconds ??
              timeRes.data?.data?.totalSeconds ??
              null;
            console.log(
              "📊 Server total (seconds):",
              totalSecondsFromServer
            );
          } catch (timeErr: any) {
            console.warn(
              "⚠️ /tasks/:id/time GET failed:",
              timeErr?.response?.data?.message
            );
          }

          // 3. Fall back to additive if the endpoint is missing
          if (totalSecondsFromServer === null) {
            const taskRes = await api.get(`/tasks/${taskId}`);
            const currentMinutes = taskRes.data?.data?.actualMinutes || 0;
            totalSecondsFromServer =
              currentMinutes * 60 + totalElapsedSeconds;
          }

          // 4. Persist as MINUTES on the task
          const minutesToSave =
            Math.round((totalSecondsFromServer / 60) * 100) / 100;

          await api.patch(`/tasks/${taskId}/time`, {
            actualMinutes: minutesToSave,
          });

          savedMinutes = minutesToSave;
          console.log(
            `✅ Task ${taskId} actualMinutes = ${minutesToSave} (from ${totalSecondsFromServer}s)`
          );
        } catch (err) {
          console.error("❌ Failed to save timer:", err);
          savedMinutes =
            Math.round((totalElapsedSeconds / 60) * 100) / 100;
        }
      } else {
        console.log("⏹️ No time tracked, not saving");
      }

      const resetState: TimerState = {
        ...EMPTY_STATE,
        userId: getCurrentUserId(),
      };
      timerStateRef.current = resetState;
      setTimerState(resetState);
      isStoppingRef.current = false;

      return {
        success: true,
        minutes: savedMinutes,
        displayTime,
      };
    },
    [clearSync, clearTick, formatTimeShort]
  );

  const stopTimerAutomatically = useCallback(
    async (taskId: string) => stopTimer(taskId),
    [stopTimer]
  );

  // ============================================================
  // PUBLIC: RESET
  // ============================================================
  const resetTimer = useCallback(() => {
    clearTick();
    clearSync();
    try {
      const userId = getCurrentUserId();
      if (userId) localStorage.removeItem(getTimerKey(userId));
      localStorage.removeItem(TIMER_KEY);
    } catch {
      /* silent */
    }
    const resetState: TimerState = {
      ...EMPTY_STATE,
      userId: getCurrentUserId(),
    };
    timerStateRef.current = resetState;
    setTimerState(resetState);
    isStoppedRef.current = false;
    isStoppingRef.current = false;
    console.log("🔄 Timer reset");
  }, [clearSync, clearTick]);

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================
  const getDisplayTimeForTask = useCallback(
    (taskId: string, actualMinutes: number = 0): string => {
      const state = timerStateRef.current;
      if (state.taskId === taskId) {
        return formatTimeShort(state.elapsedSeconds);
      }
      if (actualMinutes > 0) return `${actualMinutes}m`;
      return "0m";
    },
    [formatTimeShort]
  );

  const isTimerActiveForTask = useCallback(
    (taskId: string): boolean => timerStateRef.current.taskId === taskId,
    []
  );

  const isTimerValidForUser = useCallback(
    (userId: string): boolean => timerStateRef.current.userId === userId,
    []
  );

  const getTimerOwner = useCallback(
    (): string | null => timerStateRef.current.userId,
    []
  );

  const isTimerRunning = timerState.isRunning && timerState.taskId !== null;
  const activeTimerTaskId = timerState.taskId;

  // ============================================================
  // BOOT: if persisted state says "running", restart loops
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true;

    const state = timerStateRef.current;
    if (state.taskId && state.isRunning && state.startedAt) {
      console.log("🔁 Rehydrated running timer for task", state.taskId);
      const runningFor = Math.max(
        0,
        Math.floor((Date.now() - state.startedAt) / 1000)
      );
      const elapsed = state.pausedElapsed + runningFor;
      setTimerState((prev) => ({ ...prev, elapsedSeconds: elapsed }));
      startTickLoop(state.taskId);
      startSyncLoop(state.taskId);
    }

    return () => {
      isMountedRef.current = false;
      clearTick();
      clearSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
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

// ============================================================
// HOOK
// ============================================================
export function useTimer() {
  const ctx = useContext(TimerContext);
  if (ctx === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return ctx;
}