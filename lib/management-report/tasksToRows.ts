// lib/management-report/tasksToRows.ts

import type {
    TaskRowData,
    TaskStatus,
    Priority,
    EvalRating,
    AttendanceStatus,
} from "@/types/management-report/managementReport";

export interface ApiTask {
    _id: string;
    title: string;
    description: string;
    priority: "low" | "normal" | "high" | "urgent";
    status:
    | "pending" | "in_progress" | "submitted"
    | "completed" | "overdue" | "rejected";
    deadline: string;
    estimatedHours?: number;
    actualMinutes?: number;
    startDate?: string;
    createdAt: string;
    workLinkUrl?: string;
    evidenceUrls?: string[];
    comments?: string;
    supervisor?: string;
    hr?: string;
    ceo?: string;
}

const toSheetPriority = (p: string): Priority => {
    switch (p) {
        case "urgent":
        case "high": return "High";
        case "normal": return "Medium";
        default: return "Low";
    }
};

const toSheetStatus = (s: string): TaskStatus => {
    switch (s) {
        case "completed": return "Done - 100%";
        case "submitted": return "Done - 75%";
        case "in_progress": return "In Progress";
        case "overdue":
        case "rejected": return "Not Done";
        default: return "Not Yet Started";
    }
};

const PERCENT_VALUES = [
    0, 10, 15, 20, 25, 30, 35, 40, 45, 50,
    55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
];

function toEvalRating(raw: string | number | undefined): EvalRating {
    if (raw === undefined || raw === null || raw === "" || raw === "--") {
        return "0%";
    }
    const n =
        typeof raw === "number" ? raw : parseInt(String(raw).replace("%", ""), 10);
    if (isNaN(n)) return "0%";
    const closest = PERCENT_VALUES.reduce((prev, curr) =>
        Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev,
    );
    return `${closest}%` as EvalRating;
}

function toIso(s: string): string {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

function toUsDate(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
}

export function tasksToRows(tasks: ApiTask[]): TaskRowData[] {
    return tasks.map((task, index) => {
        const startIso = toIso(task.startDate || task.createdAt);
        const endIso = toIso(task.deadline);
        const deliverIso = endIso;

        const estHrs = task.estimatedHours ?? 0;
        const givenDuration =
            estHrs > 0 ? `${String(estHrs).padStart(2, "0")}:00` : "00:00";

        const dayName = startIso
            ? new Date(startIso).toLocaleDateString("en-US", { weekday: "long" })
            : "";

        const dayNum = startIso ? new Date(startIso).getDate() : index + 1;

        const isOff =
            /off|leave/i.test(task.title) ||
            /off|leave/i.test(task.description || "");

        const isCompleted = task.status === "completed";
        const attendance: AttendanceStatus = isCompleted ? "Present" : "Absent";

        return {
            id: index + 1,
            dayNum,
            status: toSheetStatus(task.status),
            priority: toSheetPriority(task.priority),
            startDate: toUsDate(startIso),
            endDate: toUsDate(endIso),
            givenDuration,
            day: dayName,
            taskDescription:
                task.title + (task.description ? ` — ${task.description}` : ""),
            isRedNote: isOff,
            deliverDate: toUsDate(deliverIso),
            attendance,
            workLinkText: [task.workLinkUrl, ...(task.evidenceUrls || [])]
                .filter(Boolean)
                .join("\n"),
            workLinkUrl: task.workLinkUrl,
            isOffDay: isOff,
            supervisor: isCompleted ? "100%" : toEvalRating(task.supervisor),
            hr: isCompleted ? "100%" : toEvalRating(task.hr),
            ceo: isCompleted ? "100%" : toEvalRating(task.ceo),
            comments: task.comments || "",
        };
    });
}