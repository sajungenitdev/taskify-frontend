// hooks/useTimerHandlers.ts
import { useCallback } from "react";
import { useTimer } from "@/contexts/TimerContext";
import toast from "react-hot-toast";
import { Task } from "@/types/task";

export const useTimerHandlers = (
    tasks: Task[],
    fetchTasks: () => Promise<void>,
    isTaskAssignee: (task: Task) => boolean,
    isTimerValidForCurrentUser: () => boolean
) => {
    const {
        timerState,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        isTimerActiveForTask,
        isTimerRunning,
        activeTimerTaskId,
    } = useTimer();

    const handleStartTimer = useCallback(async (taskId: string) => {
        const task = tasks.find((t) => t._id === taskId);
        if (!task) {
            toast.error("Task not found");
            return;
        }

        if (!isTaskAssignee(task)) {
            toast.error("You don't have permission to start timer for this task");
            return;
        }

        if (activeTimerTaskId && activeTimerTaskId !== taskId) {
            if (isTimerValidForCurrentUser()) {
                const currentTask = tasks.find((t) => t._id === activeTimerTaskId);
                toast.error(
                    `⚠️ A timer is already running for "${currentTask?.title || 'another task'}". Please stop that timer first.`,
                    { duration: 4000 }
                );
                return;
            } else {
                resetTimer();
            }
        }

        if (timerState.taskId === null && timerState.elapsedSeconds > 0) {
            resetTimer();
        }

        const baselineSeconds = (task.actualMinutes || 0) * 60;
        startTimer(taskId, baselineSeconds);
        toast.success(`⏱️ Timer started for "${task.title}"`);
    }, [tasks, isTaskAssignee, activeTimerTaskId, isTimerValidForCurrentUser, timerState, startTimer, resetTimer]);

    const handlePauseTimer = useCallback(() => {
        pauseTimer();
        toast.success("⏸️ Timer paused");
    }, [pauseTimer]);

    const handleResumeTimer = useCallback(() => {
        resumeTimer();
        toast.success("▶️ Timer resumed");
    }, [resumeTimer]);

    const handleStopTimer = useCallback(async (taskId: string) => {
        try {
            const result = await stopTimer(taskId);
            if (result.success) {
                if (result.minutes > 0) {
                    toast.success(`⏱️ Time tracked: ${result.displayTime}`);
                    await fetchTasks();
                } else {
                    toast.success("⏱️ Timer stopped - no time tracked");
                }
                return result;
            } else {
                toast.error("Failed to stop timer");
                return result;
            }
        } catch (error) {
            console.error("Error stopping timer:", error);
            toast.error("Failed to stop timer");
            return { success: false, minutes: 0, displayTime: "0m" };
        }
    }, [stopTimer, fetchTasks]);

    const handleResetTimer = useCallback(() => {
        resetTimer();
        toast.success("Timer state reset successfully");
    }, [resetTimer]);

    return {
        timerState,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        isTimerActiveForTask,
        isTimerRunning,
        activeTimerTaskId,
        handleStartTimer,
        handlePauseTimer,
        handleResumeTimer,
        handleStopTimer,
        handleResetTimer,
    };
};