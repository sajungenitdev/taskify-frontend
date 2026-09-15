"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

export type TaskStatus =
    | "Done - 100%"
    | "Done - 75%"
    | "Done - 50%"
    | "Not Done"
    | "In Progress"
    | "Not Yet Started";

export type Priority = "Low" | "Medium" | "High";

export type EvalRating =
    | "0%"
    | "10%"
    | "15%"
    | "20%"
    | "25%"
    | "30%"
    | "35%"
    | "40%"
    | "45%"
    | "50%"
    | "55%"
    | "60%"
    | "65%"
    | "70%"
    | "75%"
    | "80%"
    | "85%"
    | "90%"
    | "95%"
    | "100%"
    | "--";

export interface TaskRowData {
    id: number;
    dayNum: number;
    status: TaskStatus;
    priority: Priority;
    startDate: string;
    endDate: string;
    givenDuration: string;
    day: string;
    taskDescription: string;
    isRedNote?: boolean;
    deliverDate: string;
    totalHrs: string;
    workLinkText: string;
    workLinkUrl?: string;
    isOffDay?: boolean;
    supervisor: EvalRating;
    hr: EvalRating;
    ceo: EvalRating;
    comments: string;
}

const STATUS_OPTIONS: TaskStatus[] = [
    "Done - 100%",
    "Done - 75%",
    "Done - 50%",
    "Not Done",
    "In Progress",
    "Not Yet Started",
];

const PRIORITY_OPTIONS: Priority[] = ["Low", "Medium", "High"];

const PERCENT_OPTIONS: EvalRating[] = [
    "100%",
    "95%",
    "90%",
    "85%",
    "80%",
    "75%",
    "70%",
    "65%",
    "60%",
    "55%",
    "50%",
    "45%",
    "40%",
    "35%",
    "30%",
    "25%",
    "20%",
    "15%",
    "10%",
    "0%",
    "--",
];

const DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

function getDayName(year: number, monthZeroIndexed: number, day: number) {
    return DAYS_OF_WEEK[new Date(year, monthZeroIndexed, day).getDay()];
}

const INITIAL_ROWS: TaskRowData[] = Array.from({ length: 31 }, (_, idx) => {
    const dayNum = idx + 1;
    const dayName = getDayName(2026, 7, dayNum);
    const isWeekend = dayName === "Friday" || dayName === "Saturday";
    const isSpecialOff = dayNum === 5;
    const dateStr = `8/${dayNum}/2026`;

    if (isSpecialOff) {
        return {
            id: dayNum,
            dayNum,
            status: "Done - 100%",
            priority: "Medium",
            startDate: dateStr,
            endDate: dateStr,
            givenDuration: "0:00",
            day: dayName,
            taskDescription: "Official Off",
            isRedNote: true,
            deliverDate: dateStr,
            totalHrs: "0:00",
            workLinkText: "Official Off (July Mass Uprising Day)",
            isOffDay: true,
            supervisor: "100%",
            hr: "100%",
            ceo: "100%",
            comments: "",
        };
    }

    if (isWeekend) {
        return {
            id: dayNum,
            dayNum,
            status: "Done - 100%",
            priority: "Medium",
            startDate: dateStr,
            endDate: dateStr,
            givenDuration: "0:00",
            day: dayName,
            taskDescription: "Official Off",
            isRedNote: true,
            deliverDate: dateStr,
            totalHrs: "0:00",
            workLinkText: "Official Off Day",
            isOffDay: true,
            supervisor: "100%",
            hr: "100%",
            ceo: "100%",
            comments: "",
        };
    }

    if (dayNum === 12) {
        return {
            id: dayNum,
            dayNum,
            status: "Done - 100%",
            priority: "Medium",
            startDate: dateStr,
            endDate: dateStr,
            givenDuration: "0:00",
            day: dayName,
            taskDescription: "Sick Leave Taken",
            isRedNote: true,
            deliverDate: dateStr,
            totalHrs: "0:00",
            workLinkText: "Official Off Day",
            isOffDay: true,
            supervisor: "0%",
            hr: "0%",
            ceo: "0%",
            comments: "Sick Leave Applied",
        };
    }

    const sampleDescriptions: Record<
        number,
        { desc: string; sup: EvalRating; hr: EvalRating; ceo: EvalRating }
    > = {
        2: {
            desc: "Timer begins counting up. Timer persists and syncs with live elapsed time.",
            sup: "75%",
            hr: "75%",
            ceo: "80%",
        },
        3: {
            desc: "Daily bar chart displays correct hours per day. Task-by-task timer log matches actual sessions performed.",
            sup: "85%",
            hr: "85%",
            ceo: "85%",
        },
        4: {
            desc: "Daily bar chart displays correct hours per day. Task-by-task timer log matches actual sessions performed.",
            sup: "80%",
            hr: "75%",
            ceo: "75%",
        },
        6: {
            desc: "Project Module are created and also fully working. User can now assign under a project.",
            sup: "90%",
            hr: "80%",
            ceo: "90%",
        },
        8: {
            desc: "Project Calculation now fully calculate the accurate Cost. And logic fully working.",
            sup: "75%",
            hr: "85%",
            ceo: "80%",
        },
        9: {
            desc: "Ai Services Basement Creation Complete with github connect also vercel and others Credential added.",
            sup: "80%",
            hr: "80%",
            ceo: "85%",
        },
        10: {
            desc: "Make the frontend home page complete with same to same design as give.",
            sup: "75%",
            hr: "75%",
            ceo: "80%",
        },
        11: {
            desc: "Make the others page as static but complete other pages and also live push for view.",
            sup: "90%",
            hr: "90%",
            ceo: "90%",
        },
        13: {
            desc: "Task management design update and also some error solve, with new user register with team.",
            sup: "85%",
            hr: "75%",
            ceo: "75%",
        },
    };

    const sample = sampleDescriptions[dayNum] || {
        desc: "Feature updates, UI responsive adjustments, bug fixing and client review sync.",
        sup: "85%",
        hr: "80%",
        ceo: "80%",
    };

    return {
        id: dayNum,
        dayNum,
        status: "Done - 100%",
        priority: "Medium",
        startDate: dateStr,
        endDate: dateStr,
        givenDuration: "0:00",
        day: dayName,
        taskDescription: sample.desc,
        deliverDate: dateStr,
        totalHrs: "0:00",
        workLinkText: "https://taskify-frontend-alpha.vercel.app/login",
        workLinkUrl: "https://taskify-frontend-alpha.vercel.app/login",
        supervisor: sample.sup,
        hr: sample.hr,
        ceo: sample.ceo,
        comments: "",
    };
});

const MONTH_TABS = [
    "Overview",
    "PROJECT",
    "All Proj. Record",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
];

function calculateStatus(sup: EvalRating, hr: EvalRating, ceo: EvalRating): string {
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
    return "BAD";
}

export default function ManagementReportPage() {
    const [rows, setRows] = useState<TaskRowData[]>(INITIAL_ROWS);
    const [activeTab, setActiveTab] = useState("Aug");

    const updateRow = <K extends keyof TaskRowData>(
        id: number,
        key: K,
        value: TaskRowData[K]
    ) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const updated = { ...r, [key]: value };
                if (key === "taskDescription") {
                    updated.isRedNote =
                        String(value).toLowerCase().includes("off") ||
                        String(value).toLowerCase().includes("leave");
                }
                return updated;
            })
        );
    };

    const {
        avgSupervisor,
        avgHr,
        avgCeo,
        overallPerformancePercent,
        overallStatusLabel,
        threePersonsCombinedAvg,
    } = useMemo(() => {
        let supSum = 0,
            supCount = 0;
        let hrSum = 0,
            hrCount = 0;
        let ceoSum = 0,
            ceoCount = 0;

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
            overallPerformancePercent: `${Math.round(combinedAvg)}%`,
            overallStatusLabel: statusLabel,
            threePersonsCombinedAvg: `${Math.round(combinedAvg)}%`,
        };
    }, [rows]);

    return (
        <div className="flex h-screen w-full flex-col bg-[#f8fafd] text-[#1f1f1f] antialiased select-none font-sans">
            {/* =========================================================================
          TOP BANNER / HEADER BLOCK
      ========================================================================= */}
            <div className="flex shrink-0 border-b border-[#c4c7c5] bg-white">
                {/* Month Title */}
                <div className="flex w-52 shrink-0 items-center border-r border-[#d3d3d3] bg-[#fbf0d9] px-4 py-2">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
                            MONTH <br /> <span className="font-serif text-2xl font-bold tracking-tight text-[#a82d44]">
                                Aug-2026
                            </span>
                        </span>
                    </div>
                </div>
                {/* ------------------------------------------------------------- */}
                {/* BOX 1: PERFORMANCE AVERAGE BOX                                 */}
                {/* ------------------------------------------------------------- */}
                <div className="flex w-44 shrink-0 flex-col items-center justify-center border-r border-[#184353] bg-[#225c6e] px-3 py-1.5 text-center text-white">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-100">
                        PERFORMANCE
                    </span>
                    <span className="font-sans text-2xl font-black tracking-tight text-white leading-none my-1">
                        {overallPerformancePercent}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#2ee69c]">
                        {overallStatusLabel}
                    </span>
                </div>
                {/* ------------------------------------------------------------- */}
                {/* BOX 2: 3 PERSON MARK COMBINED AVERAGE                         */}
                {/* ------------------------------------------------------------- */}
                <div className="flex w-44 shrink-0 flex-col items-center justify-center border-r border-[#184353] bg-[#a9c9d7] px-3 py-1.5 text-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#14323f]">
                        TOTAL AVG
                    </span>
                    <span className="mt-1 font-sans text-2xl font-black tracking-tight text-[#0f242d] leading-none">
                        {threePersonsCombinedAvg}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-tight text-[#1e4858] mt-0.5">
                        (Sup + HR + CEO)
                    </span>
                </div>

                {/* Task Report Header */}
                <div className="flex flex-1 items-center justify-center border-r border-[#1e1528] bg-[#611a3b] py-2 text-white">
                    <h1 className="text-3xl font-black uppercase tracking-[0.25em] text-white">
                        TASK REPORT
                    </h1>
                </div>





                {/* Target Header */}
                <div className="flex w-44 shrink-0 items-center justify-center border-r border-[#d8caaa] bg-[#faebd7] px-3 text-center">
                    <span className="font-serif text-lg font-bold leading-tight text-[#1a1a1a]">
                        Target Summary For This Month
                    </span>
                </div>

                {/* Live Project Deployment Box */}
                <div className="flex flex-1 min-w-[340px] flex-col justify-center bg-[#fdf4e3] px-4 py-2 text-[11px] leading-relaxed text-slate-800">
                    <ul className="space-y-1.5 list-none">
                        {/* Project 1 */}
                        <li>
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-800 shrink-0" />
                                <span>Description:</span>
                            </div>
                            <ul className="ml-4 mt-0.5 space-y-0.5 text-slate-700">
                                <li className="flex items-center gap-1.5 truncate">
                                    <span className="text-slate-400 text-[9px]">•</span>
                                    <span className="shrink-0 font-medium">Ai Service Frontend:</span>
                                    <a
                                        href="https://ngenit-ai-services.vercel.app/"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#1a73e8] underline truncate hover:text-blue-800"
                                    >
                                        https://ngenit-ai-services.vercel.app/
                                    </a>
                                </li>
                                <li className="flex items-center gap-1.5 truncate">
                                    <span className="text-slate-400 text-[9px]">•</span>
                                    <span className="shrink-0 font-medium">Ai Services Backend:</span>
                                    <a
                                        href="https://ngenit-ai-services.vercel.app/admin"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#1a73e8] underline truncate hover:text-blue-800"
                                    >
                                        https://ngenit-ai-services.vercel.app/admin
                                    </a>
                                </li>
                                <li className="flex items-center gap-1.5 truncate">
                                    <span className="text-slate-400 text-[9px]">•</span>
                                    <span className="shrink-0 font-medium">Ai Services Backend:</span>
                                    <a
                                        href="https://ngenit-ai-services.vercel.app/admin"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#1a73e8] underline truncate hover:text-blue-800"
                                    >
                                        https://ngenit-ai-services.vercel.app/admin
                                    </a>
                                </li>
                                <li className="flex items-center gap-1.5 truncate">
                                    <span className="text-slate-400 text-[9px]">•</span>
                                    <span className="shrink-0 font-medium">Ai Services Backend:</span>
                                    <a
                                        href="https://ngenit-ai-services.vercel.app/admin"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#1a73e8] underline truncate hover:text-blue-800"
                                    >
                                        https://ngenit-ai-services.vercel.app/admin
                                    </a>
                                </li>
                                <li className="flex items-center gap-1.5 truncate">
                                    <span className="text-slate-400 text-[9px]">•</span>
                                    <span className="shrink-0 font-medium">Ai Services Backend:</span>
                                    <a
                                        href="https://ngenit-ai-services.vercel.app/admin"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[#1a73e8] underline truncate hover:text-blue-800"
                                    >
                                        https://ngenit-ai-services.vercel.app/admin
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>

            {/* =========================================================================
          SPREADSHEET TABLE GRID
      ========================================================================= */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        {/* Primary Category Headings */}
                        <tr className="border-b border-[#0d3c61] text-center text-xs font-bold uppercase tracking-wider text-white">
                            <th colSpan={7} className="border-r border-[#0d3c61] bg-[#0c4a7a] py-2">
                                PROJECT DETAILS
                            </th>
                            <th colSpan={3} className="border-r border-[#265362] bg-[#3a6978] py-2">
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

                        {/* Column Identifiers */}
                        <tr className="border-b border-[#c4c7c5] bg-[#f8f9fa] text-center text-[10px] font-bold uppercase tracking-wide text-slate-700">
                            <th className="w-32 border-r border-[#e0e0e0] px-2 py-2">STATUS</th>
                            <th className="w-24 border-r border-[#e0e0e0] px-2 py-2">PRIORITY</th>
                            <th className="w-24 border-r border-[#e0e0e0] px-2 py-2">START DATE</th>
                            <th className="w-24 border-r border-[#e0e0e0] px-2 py-2">END DATE</th>
                            <th className="w-24 border-r border-[#e0e0e0] px-2 py-2">GIVEN DURATION</th>
                            <th className="w-24 border-r border-[#e0e0e0] px-2 py-2">Day</th>
                            <th className="min-w-[340px] border-r border-[#e0e0e0] px-3 py-2 text-left">
                                TASK DESCRIPTION
                            </th>
                            <th className="w-24 border-r border-[#e0e0e0] bg-[#e6f4ea] px-2 py-2 text-slate-800">
                                DELIVER DATE
                            </th>
                            <th className="w-20 border-r border-[#e0e0e0] bg-[#e6f4ea] px-2 py-2 text-slate-800">
                                Total Hrs
                            </th>
                            <th className="min-w-[280px] border-r border-[#e0e0e0] px-3 py-2 text-left">
                                Work Activities Link
                            </th>
                            <th className="w-24 border-r border-[#e0e0e0] bg-[#c2d7e2] px-2 py-2 text-slate-800">
                                SUPERVISOR
                            </th>
                            <th className="w-24 border-r border-[#e0e0e0] bg-[#c2d7e2] px-2 py-2 text-slate-800">
                                HR
                            </th>
                            <th className="w-24 border-r border-[#e0e0e0] bg-[#c2d7e2] px-2 py-2 text-slate-800">
                                CEO
                            </th>
                            <th className="w-28 border-r border-[#e0e0e0] bg-[#1a4454] px-2 py-2 text-white">
                                STATUS
                            </th>
                            <th className="min-w-[140px] px-3 py-2 text-left">COMMENTS</th>
                        </tr>

                        {/* Aggregations & Instructions Row */}
                        <tr className="border-b border-[#c4c7c5] bg-[#ffffff] text-center text-[9px] text-slate-500">
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal italic">
                                When a task will start
                            </th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal italic">
                                Once a Task completed
                            </th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal font-mono">hrs</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] bg-[#e6f4ea] py-1 font-normal">—</th>
                            <th className="border-r border-[#e0e0e0] bg-[#e6f4ea] py-1 font-normal">—</th>
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
                        {rows.map((row) => {
                            const currentStatus = calculateStatus(row.supervisor, row.hr, row.ceo);

                            return (
                                <tr key={row.id} className="hover:bg-[#f8fafd] transition-colors group">
                                    {/* Status Dropdown */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.status}
                                                onChange={(e) =>
                                                    updateRow(row.id, "status", e.target.value as TaskStatus)
                                                }
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1.5 py-0.5 text-center text-[11px] font-medium text-slate-800 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer"
                                            >
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* Priority Dropdown */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.priority}
                                                onChange={(e) =>
                                                    updateRow(row.id, "priority", e.target.value as Priority)
                                                }
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1.5 py-0.5 text-center text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer"
                                            >
                                                {PRIORITY_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* Start Date */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <input
                                            type="text"
                                            value={row.startDate}
                                            onChange={(e) => updateRow(row.id, "startDate", e.target.value)}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                                        />
                                    </td>

                                    {/* End Date */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <input
                                            type="text"
                                            value={row.endDate}
                                            onChange={(e) => updateRow(row.id, "endDate", e.target.value)}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                                        />
                                    </td>

                                    {/* Given Duration */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <input
                                            type="text"
                                            value={row.givenDuration}
                                            onChange={(e) => updateRow(row.id, "givenDuration", e.target.value)}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                                        />
                                    </td>

                                    {/* Day */}
                                    <td className="border-r border-[#e0e0e0] px-2 py-1.5 text-center text-[11px] font-medium text-slate-700">
                                        {row.day}
                                    </td>

                                    {/* Task Description */}
                                    <td className="border-r border-[#e0e0e0] p-1">
                                        <input
                                            type="text"
                                            value={row.taskDescription}
                                            onChange={(e) =>
                                                updateRow(row.id, "taskDescription", e.target.value)
                                            }
                                            className={`h-7 w-full rounded border border-transparent bg-transparent px-2 text-[11px] leading-tight hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none ${row.isRedNote
                                                ? "font-bold text-rose-600 text-center"
                                                : "text-slate-800"
                                                }`}
                                        />
                                    </td>

                                    {/* Deliver Date */}
                                    <td className="border-r border-[#e0e0e0] bg-[#eef7f0] p-0.5 text-center">
                                        <input
                                            type="text"
                                            value={row.deliverDate}
                                            onChange={(e) => updateRow(row.id, "deliverDate", e.target.value)}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                                        />
                                    </td>

                                    {/* Total Hrs */}
                                    <td className="border-r border-[#e0e0e0] bg-[#eef7f0] p-0.5 text-center">
                                        <input
                                            type="text"
                                            value={row.totalHrs}
                                            onChange={(e) => updateRow(row.id, "totalHrs", e.target.value)}
                                            className="h-7 w-full border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                                        />
                                    </td>

                                    {/* Work Link / Activity Note */}
                                    <td className="border-r border-[#e0e0e0] p-1">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={row.workLinkText}
                                                onChange={(e) =>
                                                    updateRow(row.id, "workLinkText", e.target.value)
                                                }
                                                className={`h-7 flex-1 truncate rounded border border-transparent bg-transparent px-2 text-[11px] hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none ${row.isOffDay
                                                    ? "font-bold text-rose-600"
                                                    : "text-[#1a73e8] underline"
                                                    }`}
                                            />
                                            {row.workLinkUrl && !row.isOffDay && (
                                                <a
                                                    href={row.workLinkUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-slate-400 hover:text-blue-600"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    {/* Supervisor Score */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.supervisor}
                                                onChange={(e) =>
                                                    updateRow(row.id, "supervisor", e.target.value as EvalRating)
                                                }
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-800 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer"
                                            >
                                                {PERCENT_OPTIONS.map((p) => (
                                                    <option key={p} value={p}>
                                                        {p}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* HR Score */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.hr}
                                                onChange={(e) =>
                                                    updateRow(row.id, "hr", e.target.value as EvalRating)
                                                }
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-800 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer"
                                            >
                                                {PERCENT_OPTIONS.map((p) => (
                                                    <option key={p} value={p}>
                                                        {p}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* CEO Score */}
                                    <td className="border-r border-[#e0e0e0] p-0.5 text-center">
                                        <div className="relative flex items-center justify-center">
                                            <select
                                                value={row.ceo}
                                                onChange={(e) =>
                                                    updateRow(row.id, "ceo", e.target.value as EvalRating)
                                                }
                                                className="h-7 w-full appearance-none rounded border border-transparent bg-transparent px-1 text-center font-mono text-[11px] text-slate-800 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none cursor-pointer"
                                            >
                                                {PERCENT_OPTIONS.map((p) => (
                                                    <option key={p} value={p}>
                                                        {p}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-1 h-2.5 w-2.5 text-slate-400" />
                                        </div>
                                    </td>

                                    {/* Dynamic Status Badge */}
                                    <td className="border-r border-[#e0e0e0] px-2 py-1 text-center whitespace-nowrap">
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

                                    {/* Comments */}
                                    <td className="p-1">
                                        <input
                                            type="text"
                                            value={row.comments}
                                            onChange={(e) => updateRow(row.id, "comments", e.target.value)}
                                            placeholder="Add comments..."
                                            className="h-7 w-full rounded border border-transparent bg-transparent px-2 text-[11px] text-slate-700 hover:border-slate-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* =========================================================================
          BOTTOM GOOGLE SHEETS TAB BAR
      ========================================================================= */}
            <footer className="flex h-10 shrink-0 items-center border-t border-[#c4c7c5] bg-[#f0f4f9] px-2">
                <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium text-slate-700">
                    {MONTH_TABS.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`flex h-8 items-center gap-1 rounded-t border-t-2 px-3 transition-colors cursor-pointer ${isActive
                                    ? "border-b-0 border-t-[#1a73e8] bg-white font-bold text-[#1a73e8] shadow-2xs"
                                    : "border-transparent text-slate-600 hover:bg-slate-200/60"
                                    }`}
                            >
                                <span>{tab}</span>
                                {isActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#1a73e8]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </footer>
        </div>
    );
}