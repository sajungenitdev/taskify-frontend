"use client";

import React, {
    useState,
    useMemo,
    useRef,
    useEffect,
    useCallback,
} from "react";
import { ChevronDown, ExternalLink, Loader2, Paperclip } from "lucide-react";
import type {
    TaskStatus,
    Priority,
    EvalRating,
    TaskRowData,
    ManagementReportProps,
    AttendanceStatus,
} from "@/types/management-report/managementReport";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STATUS_OPTIONS: TaskStatus[] = [
    "Done - 100%",
    "Done - 75%",
    "Done - 50%",
    "Not Done",
    "In Progress",
    "Not Yet Started",
];

export const PRIORITY_OPTIONS: Priority[] = ["Low", "Medium", "High"];

export const PERCENT_OPTIONS: EvalRating[] = [
    "100%", "95%", "90%", "85%", "80%", "75%", "70%", "65%", "60%",
    "55%", "50%", "45%", "40%", "35%", "30%", "25%", "20%", "15%",
    "10%", "0%", "--",
];

/** 🆕 Attendance options */
const ATTENDANCE_OPTIONS: AttendanceStatus[] = [
    "Present",
    "Half Day",
    "Double Late",
    "Single Late",
    "Sick Leave",
    "Earn Leave",
    "Casual Leave",
    "Absent",
    "—",
];

/** 🆕 Attendance colors */
const ATTENDANCE_STYLES: Record<
    AttendanceStatus,
    { bg: string; text: string; border: string }
> = {
    "Present": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    "Half Day": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "Double Late": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    "Single Late": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    "Sick Leave": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    "Earn Leave": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
    "Casual Leave": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "Absent": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    "—": { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-200" },
};

const COLUMNS = [
    "status",
    "priority",
    "startDate",
    "endDate",
    "givenDuration",
    "day",
    "taskDescription",
    "deliverDate",
    "attendance",
    "workLinkText",
    "supervisor",
    "hr",
    "ceo",
    "statusCol",
    "comments",
] as const;

type ColumnKey = (typeof COLUMNS)[number];

const COLUMN_LABELS: Record<ColumnKey, string> = {
    status: "STATUS",
    priority: "PRIORITY",
    startDate: "START DATE",
    endDate: "END DATE",
    givenDuration: "GIVEN DURATION",
    day: "DAY",
    taskDescription: "TASK DESCRIPTION",
    deliverDate: "DELIVER DATE",
    attendance: "ATTENDANCE",
    workLinkText: "Work Activities Link",
    supervisor: "SUPERVISOR",
    hr: "HR",
    ceo: "CEO",
    statusCol: "STATUS",
    comments: "COMMENTS",
};

const DAYS_OF_WEEK = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getDayName(year: number, monthZeroIndexed: number, day: number) {
    return DAYS_OF_WEEK[new Date(year, monthZeroIndexed, day).getDay()];
}

export function toIsoDate(usDateStr: string): string {
    if (!usDateStr) return "";
    const parts = usDateStr.split("/");
    if (parts.length === 3) {
        const [m, d, y] = parts;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    return usDateStr;
}

export function fromIsoDate(isoStr: string): string {
    if (!isoStr) return "";
    const [y, m, d] = isoStr.split("-");
    return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
}

export function calculateStatus(
    sup: EvalRating,
    hr: EvalRating,
    ceo: EvalRating,
): string {
    const parseVal = (v: EvalRating) =>
        v === "--" ? null : parseInt(v.replace("%", ""), 10);
    const s = parseVal(sup);
    const h = parseVal(hr);
    const c = parseVal(ceo);

    const vals = [s, h, c].filter((x): x is number => x !== null);
    if (vals.length === 0) return "#N/A";

    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg === 100) return "OUTSTANDING";
    if (avg >= 85) return "A PERFORMER";
    if (avg >= 70) return "GOOD JOB";
    if (avg > 0) return "BAD";
    return "#N/A";
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

function computeGivenDuration(startUs: string, endUs: string): string {
    if (!startUs || !endUs) return "00:00";

    const parseUs = (us: string): Date | null => {
        const parts = us.split("/").map((p) => parseInt(p, 10));
        if (parts.length !== 3) return null;
        const [m, d, y] = parts;
        if (!m || !d || !y) return null;
        const dt = new Date(y, m - 1, d);
        return isNaN(dt.getTime()) ? null : dt;
    };

    const s = parseUs(startUs);
    const e = parseUs(endUs);
    if (!s || !e) return "00:00";
    if (e < s) return "00:00";

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

function parseEvidenceLinks(raw: string): string[] {
    if (!raw) return [];
    const parts = raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    return parts.filter(
        (s) =>
            /^https?:\/\//i.test(s) ||
            s.startsWith("/uploads") ||
            s.startsWith("/files") ||
            s.startsWith("uploads/"),
    );
}

function resolveMediaUrl(path: string): string {
    if (!path) return "#";
    if (/^https?:\/\//i.test(path)) return path;
    const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const baseUrl = apiUrl.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
    const clean = path.replace(/\\/g, "/");
    return `${baseUrl}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

function autoEvalFromStatus(status: TaskStatus): EvalRating {
    if (status === "Done - 100%") return "100%";
    if (status === "Done - 75%") return "75%";
    if (status === "Done - 50%") return "50%";
    if (status === "Not Done") return "0%";
    return "0%";
}

/** 🆕 Auto-pick attendance when status changes */
function attendanceFromStatus(status: TaskStatus): AttendanceStatus | null {
    if (status === "Done - 100%") return "Present";
    if (status === "In Progress") return "Present";
    if (status === "Not Yet Started") return null;
    if (status === "Not Done") return "Absent";
    return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ManagementReportSheet({
    monthLabel = "",
    rows,
    onRowsChange,
    tabs = [
        "Overview", "PROJECT", "All Proj. Record",
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
    ],
    activeTab = "Aug",
    onTabChange,
    targetLinks = [],
    reportTitle = "TASK REPORT",
    readOnly = false,
    employeeName,
    employeeRole,
    employeeId,
    loading = false,
}: ManagementReportProps) {
    const [selectedCol, setSelectedCol] = useState<ColumnKey | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
    const [selectionRange, setSelectionRange] = useState<{
        startR: number;
        startC: number;
        endR: number;
        endC: number;
    } | null>(null);
    const [, setIsSelecting] = useState(false);
    const [dragFillSource, setDragFillSource] = useState<{ r: number; c: number } | null>(null);

    const tableRef = useRef<HTMLDivElement>(null);

    // -------------------------------------------------------------------------
    // Row updates
    // -------------------------------------------------------------------------

    const updateRow = useCallback(
        <K extends keyof TaskRowData>(id: number, key: K, value: TaskRowData[K]) => {
            if (readOnly || !onRowsChange) return;

            const next = rows.map((r) => {
                if (r.id !== id) return r;
                const updated = { ...r, [key]: value };

                // 🆕 Detect "Official Off" in either taskDescription or workLinkText
                if (key === "taskDescription" || key === "workLinkText") {
                    const descLower = String(updated.taskDescription || "").toLowerCase();
                    const linkLower = String(updated.workLinkText || "").toLowerCase();

                    const isOfficialOff =
                        descLower.includes("official off") ||
                        descLower.includes("off day") ||
                        linkLower.includes("official off") ||
                        linkLower.includes("off day");

                    // Mark red note when text mentions off / leave
                    updated.isRedNote =
                        descLower.includes("off") ||
                        descLower.includes("leave") ||
                        linkLower.includes("off") ||
                        linkLower.includes("leave");

                    if (isOfficialOff) {
                        // Force 100% everywhere
                        updated.status = "Done - 100%" as TaskStatus;
                        updated.supervisor = "100%" as EvalRating;
                        updated.hr = "100%" as EvalRating;
                        updated.ceo = "100%" as EvalRating;
                    } else {
                        // Roll back to defaults when text no longer says Official Off
                        // Only if the current values look auto-set (all 100% + Done 100%)
                        const wasAutoOff =
                            updated.supervisor === "100%" &&
                            updated.hr === "100%" &&
                            updated.ceo === "100%" &&
                            updated.status === "Done - 100%";

                        if (wasAutoOff) {
                            updated.supervisor = "0%" as EvalRating;
                            updated.hr = "0%" as EvalRating;
                            updated.ceo = "0%" as EvalRating;
                            updated.status = "Not Yet Started" as TaskStatus;
                        }
                    }
                }

                // Auto-recompute Given Duration when dates change
                if (key === "startDate" || key === "endDate") {
                    updated.givenDuration = computeGivenDuration(
                        updated.startDate,
                        updated.endDate,
                    );
                }

                // Auto-sync evals when the status dropdown changes
                if (key === "status") {
                    const autoEval = autoEvalFromStatus(value as TaskStatus);
                    updated.supervisor = autoEval;
                    updated.hr = autoEval;
                    updated.ceo = autoEval;
                }

                return updated;
            });

            onRowsChange(next);
        },
        [rows, onRowsChange, readOnly],
    );

    // -------------------------------------------------------------------------
    // Aggregations
    // -------------------------------------------------------------------------

    const {
        avgSupervisor,
        avgHr,
        avgCeo,
        overallStatusLabel,
        threePersonsCombinedAvg,
    } = useMemo(() => {
        let supSum = 0, supCount = 0;
        let hrSum = 0, hrCount = 0;
        let ceoSum = 0, ceoCount = 0;

        rows.forEach((r) => {
            if (r.supervisor !== "--") {
                supSum += parseInt(r.supervisor.replace("%", ""), 10);
                supCount++;
            }
            if (r.hr !== "--") {
                hrSum += parseInt(r.hr.replace("%", ""), 10);
                hrCount++;
            }
            if (r.ceo !== "--") {
                ceoSum += parseInt(r.ceo.replace("%", ""), 10);
                ceoCount++;
            }
        });

        const sAvg = supCount ? supSum / supCount : 0;
        const hAvg = hrCount ? hrSum / hrCount : 0;
        const cAvg = ceoCount ? ceoSum / ceoCount : 0;

        const validScores = [sAvg, hAvg, cAvg].filter((v) => v > 0);
        const combinedAvg =
            validScores.length > 0
                ? validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
                : 0;

        let statusLabel = "#N/A";
        if (combinedAvg === 100) statusLabel = "OUTSTANDING";
        else if (combinedAvg >= 85) statusLabel = "A PERFORMER";
        else if (combinedAvg >= 70) statusLabel = "GOOD JOB";
        else if (combinedAvg > 0) statusLabel = "BAD";

        return {
            avgSupervisor: supCount ? `${Math.round(sAvg)}%` : "0%",
            avgHr: hrCount ? `${Math.round(hAvg)}%` : "0%",
            avgCeo: ceoCount ? `${Math.round(cAvg)}%` : "0%",
            overallStatusLabel: statusLabel,
            threePersonsCombinedAvg: `${Math.round(combinedAvg)}%`,
        };
    }, [rows]);

    // -------------------------------------------------------------------------
    // Cell value extraction
    // -------------------------------------------------------------------------

    const getCellRawValue = useCallback(
        (rowIdx: number, colIdx: number): string => {
            const row = rows[rowIdx];
            if (!row) return "";
            const colKey = COLUMNS[colIdx];
            if (colKey === "statusCol") {
                return calculateStatus(row.supervisor, row.hr, row.ceo);
            }
            const value = (row as any)[colKey];
            if (value === undefined || value === null) return "";
            return String(value);
        },
        [rows],
    );

    // -------------------------------------------------------------------------
    // Copy
    // -------------------------------------------------------------------------

    const handleCopy = useCallback(
        (e: ClipboardEvent) => {
            if (selectedCol) {
                const colIdx = COLUMNS.indexOf(selectedCol);
                const text = rows.map((_, rIdx) => getCellRawValue(rIdx, colIdx)).join("\n");
                e.clipboardData?.setData("text/plain", text);
                e.preventDefault();
                return;
            }

            if (selectionRange) {
                const minR = Math.min(selectionRange.startR, selectionRange.endR);
                const maxR = Math.max(selectionRange.startR, selectionRange.endR);
                const minC = Math.min(selectionRange.startC, selectionRange.endC);
                const maxC = Math.max(selectionRange.startC, selectionRange.endC);

                const lines: string[] = [];
                for (let r = minR; r <= maxR; r++) {
                    const lineCells: string[] = [];
                    for (let c = minC; c <= maxC; c++) {
                        lineCells.push(getCellRawValue(r, c));
                    }
                    lines.push(lineCells.join("\t"));
                }
                e.clipboardData?.setData("text/plain", lines.join("\n"));
                e.preventDefault();
                return;
            }

            if (selectedCell) {
                const text = getCellRawValue(selectedCell.r, selectedCell.c);
                e.clipboardData?.setData("text/plain", text);
                e.preventDefault();
            }
        },
        [selectedCol, selectionRange, selectedCell, rows, getCellRawValue],
    );

    // -------------------------------------------------------------------------
    // Keyboard nav
    // -------------------------------------------------------------------------

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "SELECT"
            ) {
                return;
            }
            if (!selectedCell) return;

            const { r, c } = selectedCell;
            if (e.key === "ArrowUp" && r > 0) {
                setSelectedCell({ r: r - 1, c });
                setSelectionRange(null);
                setSelectedCol(null);
            } else if (e.key === "ArrowDown" && r < rows.length - 1) {
                setSelectedCell({ r: r + 1, c });
                setSelectionRange(null);
                setSelectedCol(null);
            } else if (e.key === "ArrowLeft" && c > 0) {
                setSelectedCell({ r, c: c - 1 });
                setSelectionRange(null);
                setSelectedCol(null);
            } else if (e.key === "ArrowRight" && c < COLUMNS.length - 1) {
                setSelectedCell({ r, c: c + 1 });
                setSelectionRange(null);
                setSelectedCol(null);
            }
        },
        [selectedCell, rows.length],
    );

    useEffect(() => {
        window.addEventListener("copy", handleCopy);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("copy", handleCopy);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleCopy, handleKeyDown]);

    // -------------------------------------------------------------------------
    // Drag fill
    // -------------------------------------------------------------------------

    const handleDragFillEnd = (targetR: number) => {
        if (readOnly || !onRowsChange || !dragFillSource) return;
        const sourceVal = getCellRawValue(dragFillSource.r, dragFillSource.c);
        const colKey = COLUMNS[dragFillSource.c] as keyof TaskRowData;

        const minR = Math.min(dragFillSource.r, targetR);
        const maxR = Math.max(dragFillSource.r, targetR);

        if (colKey === "statusCol") {
            setDragFillSource(null);
            return;
        }

        const next = rows.map((r, idx) =>
            idx >= minR && idx <= maxR ? { ...r, [colKey]: sourceVal } : r,
        );
        onRowsChange(next);
        setDragFillSource(null);
    };

    const isCellSelected = (r: number, c: number) => {
        if (selectedCol && COLUMNS[c] === selectedCol) return true;
        if (selectedCell && selectedCell.r === r && selectedCell.c === c) return true;
        if (selectionRange) {
            const minR = Math.min(selectionRange.startR, selectionRange.endR);
            const maxR = Math.max(selectionRange.startR, selectionRange.endR);
            const minC = Math.min(selectionRange.startC, selectionRange.endC);
            const maxC = Math.max(selectionRange.startC, selectionRange.endC);
            return r >= minR && r <= maxR && c >= minC && c <= maxC;
        }
        return false;
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    return (
        <div
            className="flex h-full w-full flex-col bg-[#f8fafd] text-[#1f1f1f] antialiased select-none font-sans"
            onMouseUp={() => {
                setIsSelecting(false);
                if (dragFillSource && selectedCell) {
                    handleDragFillEnd(selectedCell.r);
                }
            }}
        >
            <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          display: none !important;
          -webkit-appearance: none;
        }
        input[type="date"],
        input[type="time"] { -moz-appearance: textfield; }
      `}</style>

            {/* ==================== HEADER BANNER ==================== */}
            <div className="flex shrink-0 border-b border-[#c4c7c5] bg-white">
                <div className="flex w-52 shrink-0 flex-col justify-center gap-2 border-r border-[#d3d3d3] bg-[#fbf0d9] px-4 py-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Month
                        </span>
                        <span className="font-serif text-xl font-bold leading-tight tracking-tight text-[#a82d44]">
                            {monthLabel}
                        </span>
                    </div>
                    <div className="h-px w-full bg-[#d3d3d3]" />
                    <div className="flex flex-col">
                        <span
                            className="truncate text-[12px] font-bold leading-tight text-indigo-600"
                            title={employeeName}
                        >
                            {employeeName || "—"}
                        </span>
                        <span className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">
                            {employeeRole || "—"}
                        </span>
                    </div>
                </div>

                <div className="flex w-44 shrink-0 flex-col items-center justify-center border-r border-[#184353] bg-[#225c6e] px-3 py-1.5 text-center text-white">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-100">
                        PERFORMANCE
                    </span>
                    <span className="text-[18px] pt-2 font-black uppercase tracking-wider text-[#2ee69c]">
                        {overallStatusLabel}
                    </span>
                </div>

                <div className="flex w-44 shrink-0 flex-col items-center justify-center border-r border-[#184353] bg-[#a9c9d7] px-3 py-1.5 text-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#14323f]">
                        TOTAL AVG
                    </span>
                    <span className="mt-0.5 font-sans text-lg font-black tracking-tight text-[#0f242d] leading-none">
                        {threePersonsCombinedAvg}
                    </span>
                    <div className="mt-1 grid grid-cols-3 gap-1 text-[8px] font-bold text-[#14323f] leading-tight">
                        <span title="Supervisor">{avgSupervisor}</span>
                        <span title="HR">{avgHr}</span>
                        <span title="CEO">{avgCeo}</span>
                    </div>
                    <span className="text-[8px] font-bold uppercase tracking-tight text-[#1e4858]">
                        SUP • HR • CEO
                    </span>
                </div>

                <div className="flex flex-1 items-center justify-center border-r border-[#1e1528] bg-[#611a3b] py-2 text-white">
                    <div className="flex flex-col items-center">
                        <h1 className="text-3xl font-black uppercase tracking-[0.25em] text-white">
                            {reportTitle}
                        </h1>
                        {employeeName && (
                            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                                {employeeName}
                                {employeeRole ? ` • ${employeeRole}` : ""}
                                {employeeId ? ` • ${employeeId}` : ""}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex w-44 shrink-0 items-center justify-center border-r border-[#d8caaa] bg-[#faebd7] px-3 text-center">
                    <span className="font-serif text-lg font-bold leading-tight text-[#1a1a1a]">
                        Target Summary For This Month
                    </span>
                </div>

                <div className="flex flex-1 min-w-[340px] flex-col justify-center bg-[#fdf4e3] px-4 py-2 text-[11px] leading-relaxed text-slate-800">
                    <ul className="space-y-1.5 list-none">
                        <li>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-800 shrink-0" />
                                <span>Description:</span>
                            </div>
                            <ul className="ml-4 mt-0.5 space-y-0.5 text-slate-700">
                                {targetLinks.map((link, i) => (
                                    <li key={i} className="flex items-center gap-1.5 truncate">
                                        <span className="text-slate-400 text-[9px]">•</span>
                                        <span className="shrink-0 font-medium">{link.label}:</span>
                                        {link.url ? (
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[#1a73e8] underline truncate hover:text-blue-800"
                                            >
                                                {link.url}
                                            </a>
                                        ) : (
                                            <span>{link.value || "—"}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>

            {/* ==================== TABLE ==================== */}
            <div className="flex-1 overflow-auto bg-white relative" ref={tableRef}>
                {loading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm font-medium">Loading report…</span>
                        </div>
                    </div>
                )}

                <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-20">
                        <tr className="border-b border-[#0d3c61] text-center text-xs font-bold uppercase tracking-wider text-white">
                            <th colSpan={7} className="border-r border-[#0d3c61] bg-[#0c4a7a] py-2">
                                PROJECT DETAILS
                            </th>
                            <th colSpan={2} className="border-r border-[#265362] bg-[#3a6978] py-2">
                                DELIVERABLES
                            </th>
                            <th colSpan={1} className="border-r border-slate-300 bg-[#748995] py-2">
                                PROOF / LINK
                            </th>
                            <th colSpan={4} className="border-r border-[#153e4d] bg-[#1d4f61] py-2">
                                STATUS
                            </th>
                            <th colSpan={1} className="bg-[#b34718] py-2">
                                COMMENTS
                            </th>
                        </tr>

                        <tr className="border-b border-[#c4c7c5] bg-[#f8f9fa] text-center text-[10px] font-bold uppercase tracking-wide text-slate-700">
                            {COLUMNS.map((colKey) => {
                                const isDeliverable = colKey === "deliverDate";
                                const isAttendance = colKey === "attendance";
                                const isStakeholder =
                                    colKey === "supervisor" || colKey === "hr" || colKey === "ceo";
                                const isStatus = colKey === "statusCol";
                                const isColSelected = selectedCol === colKey;

                                return (
                                    <th
                                        key={colKey}
                                        onClick={() => {
                                            setSelectedCol(colKey);
                                            setSelectedCell(null);
                                            setSelectionRange(null);
                                        }}
                                        className={`cursor-pointer border-r border-[#e0e0e0] px-2 py-2 transition-colors ${isDeliverable
                                            ? "bg-[#e6f4ea] text-slate-800"
                                            : isAttendance
                                                ? "bg-[#d5ebf0] text-slate-800"
                                                : isStakeholder
                                                    ? "bg-[#c2d7e2] text-slate-800"
                                                    : isStatus
                                                        ? "bg-[#1a4454] text-white"
                                                        : "bg-[#f8f9fa] text-slate-700"
                                            } ${isColSelected
                                                ? "!bg-[#d3e3fd] !text-blue-900 ring-2 ring-blue-500 inset-0"
                                                : "hover:bg-slate-200"
                                            }`}
                                    >
                                        {COLUMN_LABELS[colKey]}
                                    </th>
                                );
                            })}
                        </tr>

                        <tr className="border-b border-[#c4c7c5] bg-[#ffffff] text-center text-[9px] text-slate-500">
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal italic">
                                When a task will start
                            </th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal italic">
                                Once a Task completed
                            </th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal font-mono">auto hrs</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] bg-[#e6f4ea] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] bg-[#d5ebf0] py-1 font-normal font-mono">status</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] bg-[#b0cbdb] py-1 font-mono font-bold text-slate-900">
                                {avgSupervisor}
                            </th>
                            <th className="border-r border-[#e0e0e0] bg-[#b0cbdb] py-1 font-mono font-bold text-slate-900">
                                {avgHr}
                            </th>
                            <th className="border-r border-[#e0e0e0] bg-[#b0cbdb] py-1 font-mono font-bold text-slate-900">
                                {avgCeo}
                            </th>
                            <th className="border-r border-[#e0e0e0] bg-[#1a4454] py-1 font-mono font-bold text-white">
                                {overallStatusLabel}
                            </th>
                            <th className="py-1 font-normal">—</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[#e0e0e0]">
                        {rows.length === 0 && !loading && (
                            <tr>
                                <td colSpan={COLUMNS.length} className="py-10 text-center text-slate-400 text-xs">
                                    No data for this month.
                                </td>
                            </tr>
                        )}

                        {rows.map((row, rIdx) => {
                            const currentStatus = calculateStatus(row.supervisor, row.hr, row.ceo);
                            const disabled = readOnly;
                            const isCompleted = row.status === "Done - 100%";
                            const evidenceLinks = parseEvidenceLinks(row.workLinkText);

                            const attStyle =
                                ATTENDANCE_STYLES[row.attendance] || ATTENDANCE_STYLES["—"];

                            return (
                                <tr key={`${row.id}-${rIdx}`} className="hover:bg-[#f8fafd] transition-colors group">
                                    {/* Status (0) */}
                                    <td
                                        onClick={() => {
                                            setSelectedCell({ r: rIdx, c: 0 });
                                            setSelectionRange(null);
                                            setSelectedCol(null);
                                        }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 0) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.status}
                                                disabled={disabled}
                                                onChange={(e) => updateRow(row.id, "status", e.target.value as TaskStatus)}
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1.5 py-0.5 text-center text-[11px] font-medium text-slate-800 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer disabled:cursor-default"
                                            >
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* Priority (1) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 1 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 1) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.priority}
                                                disabled={disabled}
                                                onChange={(e) => updateRow(row.id, "priority", e.target.value as Priority)}
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1.5 py-0.5 text-center text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer disabled:cursor-default"
                                            >
                                                {PRIORITY_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* Start Date (2) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 2 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 2) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <input
                                            type="date"
                                            value={toIsoDate(row.startDate)}
                                            readOnly={disabled}
                                            onChange={(e) => {
                                                if (disabled) return;
                                                const newDate = fromIsoDate(e.target.value);
                                                updateRow(row.id, "startDate", newDate);
                                                if (e.target.value) {
                                                    const [y, m, d] = e.target.value.split("-").map(Number);
                                                    updateRow(row.id, "day", getDayName(y, m - 1, d));
                                                }
                                            }}
                                            onClick={(e) => {
                                                if (disabled) return;
                                                try { (e.target as HTMLInputElement).showPicker?.(); } catch { }
                                            }}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer read-only:cursor-default"
                                        />
                                    </td>

                                    {/* End Date (3) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 3 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 3) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <input
                                            type="date"
                                            value={toIsoDate(row.endDate)}
                                            readOnly={disabled}
                                            onChange={(e) => updateRow(row.id, "endDate", fromIsoDate(e.target.value))}
                                            onClick={(e) => {
                                                if (disabled) return;
                                                try { (e.target as HTMLInputElement).showPicker?.(); } catch { }
                                            }}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer read-only:cursor-default"
                                        />
                                    </td>

                                    {/* Given Duration (4) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 4 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 4) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="flex h-7 items-center justify-center rounded border border-transparent bg-transparent px-1 font-mono text-[11px] text-slate-700">
                                            {computeGivenDuration(row.startDate, row.endDate)}
                                        </div>
                                    </td>

                                    {/* Day (5) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 5 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 5) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.day}
                                                disabled={disabled}
                                                onChange={(e) => updateRow(row.id, "day", e.target.value)}
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1 text-center text-[11px] font-medium text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer disabled:cursor-default"
                                            >
                                                {DAYS_OF_WEEK.map((d) => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* Task Description (6) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 6 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-1 ${isCellSelected(rIdx, 6) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <input
                                            type="text"
                                            value={row.taskDescription}
                                            readOnly={disabled}
                                            onChange={(e) => updateRow(row.id, "taskDescription", e.target.value)}
                                            className={`h-7 w-full rounded border border-transparent bg-transparent px-2 text-[11px] leading-tight hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none ${row.isRedNote ? "font-bold text-rose-600 text-center" : "text-slate-800"}`}
                                        />
                                    </td>

                                    {/* Deliver Date (7) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 7 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] bg-[#eef7f0] p-0.5 text-center ${isCellSelected(rIdx, 7) ? "bg-[#d3e3fd] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <input
                                            type="date"
                                            value={toIsoDate(row.deliverDate)}
                                            readOnly={disabled}
                                            onChange={(e) => updateRow(row.id, "deliverDate", fromIsoDate(e.target.value))}
                                            onClick={(e) => {
                                                if (disabled) return;
                                                try { (e.target as HTMLInputElement).showPicker?.(); } catch { }
                                            }}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer read-only:cursor-default"
                                        />
                                    </td>

                                    {/* 🆕 Attendance (8) — single compact column */}
                                    <td
                                        onClick={() => {
                                            setSelectedCell({ r: rIdx, c: 8 });
                                            setSelectionRange(null);
                                            setSelectedCol(null);
                                        }}
                                        className={`relative border-r border-[#e0e0e0] bg-[#eef7f0] p-0.5 text-center ${isCellSelected(rIdx, 8) ? "bg-[#d3e3fd] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.attendance || "—"}
                                                disabled={disabled}
                                                onChange={(e) =>
                                                    updateRow(row.id, "attendance", e.target.value as AttendanceStatus)
                                                }
                                                className={`h-7 w-full appearance-none rounded border px-1.5 py-0.5 text-center text-[10px] font-bold hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer disabled:cursor-default ${attStyle.bg} ${attStyle.text} ${attStyle.border}`}
                                            >
                                                {ATTENDANCE_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt} className="bg-white text-slate-800">
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-500 opacity-60" />
                                        </div>
                                    </td>

                                    {/* Work Link (9) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 9 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-1 ${isCellSelected(rIdx, 9) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={row.workLinkText}
                                                readOnly={disabled}
                                                onChange={(e) => updateRow(row.id, "workLinkText", e.target.value)}
                                                className={`h-7 flex-1 truncate rounded border border-transparent bg-transparent px-2 text-[11px] hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none ${row.isOffDay ? "font-bold text-rose-600" : "text-[#1a73e8] underline"}`}
                                            />

                                            {evidenceLinks.length > 0 && (
                                                <a
                                                    href={resolveMediaUrl(evidenceLinks[0])}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title={`Evidence (${evidenceLinks.length}): ${evidenceLinks[0]}`}
                                                    className="relative shrink-0 text-amber-600 hover:text-amber-800"
                                                >
                                                    <Paperclip className="h-3.5 w-3.5" />
                                                    {evidenceLinks.length > 1 && (
                                                        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 text-white text-[7px] font-bold px-1 leading-[10px] min-w-[10px] text-center">
                                                            {evidenceLinks.length}
                                                        </span>
                                                    )}
                                                </a>
                                            )}

                                            {row.workLinkUrl && !row.isOffDay && (
                                                <a
                                                    href={row.workLinkUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Open link"
                                                    className="shrink-0 text-slate-400 hover:text-blue-600"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    {/* Supervisor (10) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 10 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 10) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.supervisor}
                                                disabled={disabled}
                                                onChange={(e) => updateRow(row.id, "supervisor", e.target.value as EvalRating)}
                                                className={`h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1 text-center font-mono text-[11px] hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer disabled:cursor-default ${isCompleted ? "text-emerald-700 font-bold" : "text-slate-800"}`}
                                            >
                                                {PERCENT_OPTIONS.map((p) => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* HR (11) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 11 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 11) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.hr}
                                                disabled={disabled}
                                                onChange={(e) => updateRow(row.id, "hr", e.target.value as EvalRating)}
                                                className={`h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1 text-center font-mono text-[11px] hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer disabled:cursor-default ${isCompleted ? "text-emerald-700 font-bold" : "text-slate-800"}`}
                                            >
                                                {PERCENT_OPTIONS.map((p) => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* CEO (12) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 12 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] p-0.5 text-center ${isCellSelected(rIdx, 12) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.ceo}
                                                disabled={disabled}
                                                onChange={(e) => updateRow(row.id, "ceo", e.target.value as EvalRating)}
                                                className={`h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1 text-center font-mono text-[11px] hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer disabled:cursor-default ${isCompleted ? "text-emerald-700 font-bold" : "text-slate-800"}`}
                                            >
                                                {PERCENT_OPTIONS.map((p) => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* Status Badge (13) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 13 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative border-r border-[#e0e0e0] px-2 py-1 text-center whitespace-nowrap ${isCellSelected(rIdx, 13) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <span
                                            className={`inline-block w-full rounded py-0.5 font-mono text-[10px] font-bold ${currentStatus === "OUTSTANDING"
                                                ? "bg-slate-100 text-slate-900 border border-slate-300"
                                                : currentStatus === "A PERFORMER"
                                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                    : currentStatus === "GOOD JOB"
                                                        ? "bg-sky-50 text-sky-800 border border-sky-200"
                                                        : currentStatus === "BAD"
                                                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                            : "bg-slate-100 text-slate-500"
                                                }`}
                                        >
                                            {currentStatus}
                                        </span>
                                    </td>

                                    {/* Comments (14) */}
                                    <td
                                        onClick={() => { setSelectedCell({ r: rIdx, c: 14 }); setSelectionRange(null); setSelectedCol(null); }}
                                        className={`relative p-1 ${isCellSelected(rIdx, 14) ? "bg-[#e8f0fe] ring-2 ring-[#1a73e8] z-10" : ""}`}
                                    >
                                        <input
                                            type="text"
                                            value={row.comments}
                                            readOnly={disabled}
                                            onChange={(e) => updateRow(row.id, "comments", e.target.value)}
                                            placeholder="Add comments..."
                                            className="h-7 w-full rounded border border-transparent bg-transparent px-2 text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                                        />
                                        {!readOnly && selectedCell?.r === rIdx && selectedCell?.c === 14 && (
                                            <div
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setDragFillSource({ r: rIdx, c: 14 });
                                                }}
                                                className="absolute bottom-0 right-0 h-2 w-2 cursor-crosshair bg-[#1a73e8]"
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ==================== TABS ==================== */}
            <footer className="flex h-10 shrink-0 items-center border-t border-[#c4c7c5] bg-[#f0f4f9] px-2">
                <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium text-slate-700">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => onTabChange?.(tab)}
                                className={`flex h-8 items-center gap-1 rounded-t border-t-2 px-3 transition-colors cursor-pointer ${isActive
                                    ? "border-b-0 border-t-[#1a73e8] bg-white font-bold text-[#1a73e8] shadow-2xs"
                                    : "border-transparent text-slate-600 hover:bg-slate-200/60"
                                    }`}
                            >
                                <span>{tab}</span>
                                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[#1a73e8]" />}
                            </button>
                        );
                    })}
                </div>
            </footer>
        </div>
    );
}