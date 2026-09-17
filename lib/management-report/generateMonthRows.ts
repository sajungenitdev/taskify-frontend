// lib/management-report/generateMonthRows.ts

import type {
  TaskRowData,
  TaskStatus,
  Priority,
  EvalRating,
  AttendanceStatus,
} from "@/types/management-report/managementReport";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

export function getDayName(year: number, monthZeroIndexed: number, day: number) {
  return DAYS_OF_WEEK[new Date(year, monthZeroIndexed, day).getDay()];
}

function isWorkingDay(
  year: number,
  monthZeroIndexed: number,
  day: number,
): boolean {
  const dt = new Date(year, monthZeroIndexed, day);
  const dow = dt.getDay();
  if (dow === 5) return false;
  if (dow === 6) {
    const satIndex = Math.floor((day - 1) / 7) + 1;
    return satIndex % 2 === 0;
  }
  return true;
}

export function computeGivenDurationFromDates(
  startIso: string,
  endIso: string,
): string {
  if (!startIso || !endIso) return "00:00";
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return "00:00";
  let workingDays = 0;
  const cursor = new Date(s);
  while (cursor <= e) {
    if (isWorkingDay(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())) {
      workingDays++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return `${String(workingDays * 8).padStart(2, "0")}:00`;
}

export interface GenerateMonthOptions {
  year: number;
  month: number;
  specialOffDays?: number[];
  leaveDays?: Record<number, string>;
}

export function generateMonthRows({
  year,
  month,
  specialOffDays = [],
  leaveDays = {},
}: GenerateMonthOptions): TaskRowData[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: TaskRowData[] = [];

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateObj = new Date(year, month, dayNum);
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];
    const working = isWorkingDay(year, month, dayNum);
    const isSpecialOff = specialOffDays.includes(dayNum);
    const leaveLabel = leaveDays[dayNum];
    const dateStr = `${month + 1}/${dayNum}/${year}`;

    // Off day (weekend / holiday)
    if (!working || isSpecialOff) {
      rows.push({
        id: dayNum,
        dayNum,
        status: "Not Yet Started" as TaskStatus,
        priority: "Medium" as Priority,
        startDate: dateStr,
        endDate: dateStr,
        givenDuration: "00:00",
        day: dayName,
        taskDescription: "Official Off",
        isRedNote: true,
        deliverDate: dateStr,
        attendance: "—" as AttendanceStatus,
        workLinkText: isSpecialOff
          ? "Official Off (Holiday)"
          : "Official Off Day",
        isOffDay: true,
        supervisor: "100%" as EvalRating,
        hr: "100%" as EvalRating,
        ceo: "100%" as EvalRating,
        comments: "",
      });
      continue;
    }

    // Leave day
    if (leaveLabel) {
      const lower = leaveLabel.toLowerCase();
      let att: AttendanceStatus = "Absent";
      if (lower.includes("sick")) att = "Sick Leave";
      else if (lower.includes("earn") || lower.includes("annual")) att = "Earn Leave";
      else if (lower.includes("casual")) att = "Casual Leave";

      rows.push({
        id: dayNum,
        dayNum,
        status: "Not Yet Started" as TaskStatus,
        priority: "Medium" as Priority,
        startDate: dateStr,
        endDate: dateStr,
        givenDuration: "00:00",
        day: dayName,
        taskDescription: leaveLabel,
        isRedNote: true,
        deliverDate: dateStr,
        attendance: att,
        workLinkText: "Official Off Day",
        isOffDay: true,
        supervisor: "0%" as EvalRating,
        hr: "0%" as EvalRating,
        ceo: "0%" as EvalRating,
        comments: `${leaveLabel} Applied`,
      });
      continue;
    }

    // Blank working day
    rows.push({
      id: dayNum,
      dayNum,
      status: "Not Yet Started" as TaskStatus,
      priority: "Medium" as Priority,
      startDate: dateStr,
      endDate: dateStr,
      givenDuration: "08:00",
      day: dayName,
      taskDescription: "",
      deliverDate: dateStr,
      attendance: "—" as AttendanceStatus,
      workLinkText: "",
      supervisor: "0%" as EvalRating,
      hr: "0%" as EvalRating,
      ceo: "0%" as EvalRating,
      comments: "",
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Merge tasks
// ---------------------------------------------------------------------------

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
  // 🆕 Optional fields to derive attendance
  lateCount?: number;
  isHalfDay?: boolean;
  absentReason?: string;
}

export function mergeTasksIntoMonth(
  template: TaskRowData[],
  tasks: ApiTask[],
): TaskRowData[] {
  const byDay = new Map<number, ApiTask[]>();
  for (const t of tasks) {
    const d = new Date(t.startDate || t.createdAt);
    const day = d.getDate();
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(t);
  }

  const result: TaskRowData[] = [];
  let rowId = 1;

  for (const row of template) {
    const dayTasks = byDay.get(row.dayNum);

    if (row.isOffDay || !dayTasks || dayTasks.length === 0) {
      result.push({ ...row, id: rowId++ });
      continue;
    }

    dayTasks.forEach((task) => {
      const startIso = toIso(task.startDate || task.createdAt);
      const endIso = toIso(task.deadline);
      const isCompleted = task.status === "completed";

      // 🆕 Combine description + link text for detection
      const descText = `${task.title} ${task.description || ""}`.toLowerCase();
      const linkText = [task.workLinkUrl, ...(task.evidenceUrls || [])]
        .filter(Boolean)
        .join("\n")
        .toLowerCase();
      const isOfficialOff =
        descText.includes("official off") ||
        descText.includes("off day") ||
        linkText.includes("official off") ||
        linkText.includes("off day");

      const attendance = deriveAttendance(task);

      // 🆕 If it's an Official Off row → force 100% on all evals
      const evalValue: EvalRating = isOfficialOff
        ? "100%"
        : isCompleted
          ? "100%"
          : toEval(task.supervisor);

      result.push({
        ...row,
        id: rowId++,
        status: isOfficialOff
          ? ("Done - 100%" as TaskStatus)
          : toSheetStatus(task.status),
        priority: toSheetPriority(task.priority),
        startDate: toUsDate(startIso),
        endDate: toUsDate(endIso),
        givenDuration: computeGivenDurationFromDates(startIso, endIso),
        taskDescription:
          task.title + (task.description ? ` — ${task.description}` : ""),
        deliverDate: toUsDate(endIso),
        attendance,
        workLinkText: [task.workLinkUrl, ...(task.evidenceUrls || [])]
          .filter(Boolean)
          .join("\n"),
        workLinkUrl: task.workLinkUrl || (task.evidenceUrls?.[0] ?? ""),
        isRedNote: /off|leave/i.test(task.title) || isOfficialOff,
        // 🆕 Force 100% when Official Off
        supervisor: isOfficialOff ? "100%" : isCompleted ? "100%" : toEval(task.supervisor),
        hr: isOfficialOff ? "100%" : isCompleted ? "100%" : toEval(task.hr),
        ceo: isOfficialOff ? "100%" : isCompleted ? "100%" : toEval(task.ceo),
        comments: task.comments || "",
        taskId: task._id,
      });
    });
  }

  return result;
}

/**
 * 🆕 Derive attendance from a task.
 * Priority order:
 *   1. Explicit absence reason (leave types)
 *   2. Half-day flag
 *   3. lateCount >= 2 → Double Late
 *   4. lateCount === 1 → Single Late
 *   5. Completed / In progress / Submitted → Present
 *   6. Otherwise → Absent
 */
function deriveAttendance(task: ApiTask): AttendanceStatus {
  const reason = (task.absentReason || "").toLowerCase();
  if (reason.includes("sick")) return "Sick Leave";
  if (reason.includes("earn") || reason.includes("annual")) return "Earn Leave";
  if (reason.includes("casual")) return "Casual Leave";

  if (task.isHalfDay) return "Half Day";

  const lateCount = task.lateCount || 0;
  if (lateCount >= 2) return "Double Late";
  if (lateCount === 1) return "Single Late";

  if (
    task.status === "completed" ||
    task.status === "submitted" ||
    task.status === "in_progress"
  ) {
    return "Present";
  }
  if (task.status === "rejected" || task.status === "overdue") {
    return "Absent";
  }
  return "Absent";
}

// ---------------------------------------------------------------------------
// Adapter helpers
// ---------------------------------------------------------------------------

function toSheetPriority(p: string): Priority {
  switch (p) {
    case "urgent":
    case "high": return "High";
    case "normal": return "Medium";
    default: return "Low";
  }
}

function toSheetStatus(s: string): TaskStatus {
  switch (s) {
    case "completed": return "Done - 100%";
    case "submitted": return "Done - 75%";
    case "in_progress": return "In Progress";
    case "overdue":
    case "rejected": return "Not Done";
    default: return "Not Yet Started";
  }
}

const PERCENT_VALUES = [
  0, 10, 15, 20, 25, 30, 35, 40, 45, 50,
  55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
];

function toEval(raw?: string | number | null): EvalRating {
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

function toUsDate(s: string): string {
  if (!s) return "";
  const iso = toIso(s);
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
}