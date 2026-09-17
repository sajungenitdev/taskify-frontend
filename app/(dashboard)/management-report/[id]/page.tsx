// app/(dashboard)/management-report/[id]/settings/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Loader2,
    Save,
    RotateCcw,
    Plus,
    Trash2,
    Settings2,
    Target,
    BarChart3,
    Award,
    CalendarDays,
    Flag,
    Palmtree,
    Info,
    X,
    Check,
    ChevronDown,
    Percent,
    Users,
    AlertCircle,
    TrendingUp,
    Building2,
    IdCard,
    Copy,
    Zap,
} from "lucide-react";
import {
    type ScoreMetric,
    type StatusThreshold,
    type OffDayEntry,
    type EmployeeMonthSettings,
    DEFAULT_METRICS,
    DEFAULT_THRESHOLDS,
    METRIC_COLORS,
    computeOverallScore,
    findThreshold,
    loadEmployeeSettings,
    saveEmployeeSettings,
} from "@/types/management-report/employeeSettings";

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
];

const MONTH_FULL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ---------------------------------------------------------------------------

export default function EmployeeSettingsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const userId = params?.id;

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());

    const [employee, setEmployee] = useState<any>(null);
    const [loadingEmployee, setLoadingEmployee] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<EmployeeMonthSettings | null>(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // -------------------------------------------------------------------------
    // Load employee
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        (async () => {
            try {
                setLoadingEmployee(true);
                const res = await api.get(`/users/${userId}`);
                if (cancelled) return;
                setEmployee(res.data?.data || res.data);
            } catch {
                toast.error("Failed to load employee");
            } finally {
                if (!cancelled) setLoadingEmployee(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    // -------------------------------------------------------------------------
    // Load settings for month
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!userId) return;
        setSettings(loadEmployeeSettings(userId, year, month));
    }, [userId, year, month]);

    // Derived
    const overallScore = useMemo(
        () => (settings ? computeOverallScore(settings.metrics) : 0),
        [settings],
    );
    const currentThreshold = useMemo(
        () =>
            settings ? findThreshold(overallScore, settings.thresholds) : null,
        [overallScore, settings],
    );
    const totalWeight = useMemo(
        () => settings?.metrics.reduce((s, m) => s + (m.weight || 0), 0) ?? 0,
        [settings],
    );

    // -------------------------------------------------------------------------
    // Mutators
    // -------------------------------------------------------------------------
    const updateMetric = (id: string, patch: Partial<ScoreMetric>) => {
        if (!settings) return;
        setSettings({
            ...settings,
            metrics: settings.metrics.map((m) =>
                m.id === id ? { ...m, ...patch } : m,
            ),
        });
    };

    const addMetric = () => {
        if (!settings) return;
        const id = `custom_${Date.now()}`;
        const usedColors = settings.metrics.map((m) => m.color);
        const color =
            METRIC_COLORS.find((c) => !usedColors.includes(c)) ||
            METRIC_COLORS[settings.metrics.length % METRIC_COLORS.length];

        setSettings({
            ...settings,
            metrics: [
                ...settings.metrics,
                {
                    id,
                    label: "New Metric",
                    weight: 0,
                    value: 0,
                    color,
                    isCustom: true,
                },
            ],
        });
    };

    const removeMetric = (id: string) => {
        if (!settings) return;
        if (settings.metrics.length <= 1) {
            toast.error("Need at least one metric");
            return;
        }
        setSettings({
            ...settings,
            metrics: settings.metrics.filter((m) => m.id !== id),
        });
    };

    const updateThreshold = (id: string, patch: Partial<StatusThreshold>) => {
        if (!settings) return;
        setSettings({
            ...settings,
            thresholds: settings.thresholds.map((t) =>
                t.id === id ? { ...t, ...patch } : t,
            ),
        });
    };

    const addThreshold = () => {
        if (!settings) return;
        setSettings({
            ...settings,
            thresholds: [
                ...settings.thresholds,
                {
                    id: `t_${Date.now()}`,
                    label: "New Tier",
                    min: 0,
                    max: 0,
                    color: "slate",
                },
            ],
        });
    };

    const removeThreshold = (id: string) => {
        if (!settings) return;
        setSettings({
            ...settings,
            thresholds: settings.thresholds.filter((t) => t.id !== id),
        });
    };

    const addOffDay = (type: "gov" | "custom" | "leave", day: number, label: string) => {
        if (!settings) return;
        if (settings.offDays.some((o) => o.day === day)) {
            toast.error("Day already added");
            return;
        }
        setSettings({
            ...settings,
            offDays: [...settings.offDays, { day, type, label }].sort(
                (a, b) => a.day - b.day,
            ),
        });
    };

    const removeOffDay = (day: number) => {
        if (!settings) return;
        setSettings({
            ...settings,
            offDays: settings.offDays.filter((o) => o.day !== day),
        });
    };

    const resetToDefault = () => {
        if (!settings) return;
        if (!confirm("Reset metrics and thresholds to default?")) return;
        setSettings({
            ...settings,
            metrics: DEFAULT_METRICS.map((m) => ({ ...m })),
            thresholds: DEFAULT_THRESHOLDS.map((t) => ({ ...t })),
        });
        toast.success("Reset to defaults");
    };

    const handleSave = () => {
        if (!settings) return;
        setSaving(true);
        try {
            saveEmployeeSettings({
                ...settings,
                updatedAt: new Date().toISOString(),
            });
            toast.success(`Settings saved for ${MONTH_FULL[month]} ${year}`);
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    if (loadingEmployee || !settings) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-600">Loading settings…</p>
                </div>
            </div>
        );
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 pb-24">
            {/* ==================== HEADER ==================== */}
            <div className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/85 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href={`/management-report/${userId}/report`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                            <Settings2 className="h-4 w-4" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900">
                                Employee Settings
                            </h1>
                            <p className="text-[10px] text-slate-500">
                                Configure scoring & off days
                            </p>
                        </div>
                    </div>

                    {/* Month selector */}
                    <div className="relative ml-auto">
                        <button
                            onClick={() => setShowMonthPicker(!showMonthPicker)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300"
                        >
                            <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
                            {MONTH_FULL[month]} {year}
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </button>

                        <AnimatePresence>
                            {showMonthPicker && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMonthPicker(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <button
                                                onClick={() => setYear((y) => y - 1)}
                                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                            >
                                                ←
                                            </button>
                                            <span className="text-sm font-bold text-slate-800">
                                                {year}
                                            </span>
                                            <button
                                                onClick={() => setYear((y) => y + 1)}
                                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                            >
                                                →
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {MONTH_NAMES.map((m, i) => (
                                                <button
                                                    key={m}
                                                    onClick={() => {
                                                        setMonth(i);
                                                        setShowMonthPicker(false);
                                                    }}
                                                    className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${month === i
                                                        ? "bg-indigo-600 text-white"
                                                        : "text-slate-600 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={resetToDefault}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Save className="h-3.5 w-3.5" />
                        )}
                        Save Settings
                    </button>
                    <Link
                        href={`/management-report/${userId}/report`}
                        onClick={(e) => {
                            if (saving) {
                                e.preventDefault();
                                return;
                            }
                            handleSave();
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 ${saving ? "pointer-events-none opacity-50" : ""
                            }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Save className="h-3.5 w-3.5" />
                                Management Report
                            </>
                        )}
                    </Link>
                </div>
            </div>

            <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-8">
                {/* ==================== EMPLOYEE SUMMARY ==================== */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Employee card */}
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-5 text-white shadow-lg lg:col-span-1">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold ring-2 ring-white/30">
                                {(employee?.fullName || "?")
                                    .split(" ")
                                    .map((w: string) => w[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-bold">
                                    {employee?.fullName || "Unknown"}
                                </p>
                                <p className="truncate text-xs text-indigo-100">
                                    {employee?.position || "—"}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 text-[11px]">
                            <div>
                                <p className="text-indigo-200">Employee ID</p>
                                <p className="font-semibold">
                                    {employee?.employeeId || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-indigo-200">Department</p>
                                <p className="truncate font-semibold">
                                    {typeof employee?.department === "string"
                                        ? employee.department
                                        : employee?.department?.name || "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Overall score preview */}
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-2xl" />
                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    Live Score Preview
                                </p>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-slate-900">
                                        {overallScore}
                                    </span>
                                    <span className="text-lg font-bold text-slate-400">/100</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Total weight:{" "}
                                    <span
                                        className={
                                            totalWeight === 100
                                                ? "font-semibold text-emerald-600"
                                                : "font-semibold text-amber-600"
                                        }
                                    >
                                        {totalWeight}%
                                    </span>{" "}
                                    {totalWeight !== 100 && (
                                        <span className="text-amber-600">
                                            (must equal 100%)
                                        </span>
                                    )}
                                </p>
                            </div>

                            {currentThreshold && (
                                <div
                                    className={`rounded-2xl border px-5 py-3 text-center shadow-sm ${thresholdClasses(currentThreshold.color).card
                                        }`}
                                >
                                    <Award
                                        className={`mx-auto h-5 w-5 ${thresholdClasses(currentThreshold.color).icon}`}
                                    />
                                    <p
                                        className={`mt-1 text-xs font-bold uppercase tracking-wider ${thresholdClasses(currentThreshold.color).label}`}
                                    >
                                        {currentThreshold.label}
                                    </p>
                                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                                        {currentThreshold.min}–{currentThreshold.max}%
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ==================== METRICS CONFIG ==================== */}
                <Section
                    icon={<Target className="h-4 w-4" />}
                    title="Score Metrics"
                    description="Configure metrics and their contribution to the overall score. Weights must total 100%."
                    accent="indigo"
                    action={
                        <button
                            onClick={addMetric}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Metric
                        </button>
                    }
                >
                    <div className="space-y-3">
                        {settings.metrics.map((m) => (
                            <MetricRow
                                key={m.id}
                                metric={m}
                                onChange={(patch) => updateMetric(m.id, patch)}
                                onRemove={
                                    settings.metrics.length > 1
                                        ? () => removeMetric(m.id)
                                        : undefined
                                }
                            />
                        ))}
                    </div>

                    {/* Weight validation */}
                    {totalWeight !== 100 && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                                <p className="font-semibold">Weights don't add up to 100%</p>
                                <p className="mt-0.5 text-amber-700">
                                    Current total: {totalWeight}%. Adjust the values so they sum
                                    to 100%.
                                </p>
                            </div>
                        </div>
                    )}
                </Section>

                {/* ==================== THRESHOLDS ==================== */}
                <Section
                    icon={<BarChart3 className="h-4 w-4" />}
                    title="Performance Status Thresholds"
                    description="Define score ranges and their status labels. Used in the report sheet."
                    accent="purple"
                    action={
                        <button
                            onClick={addThreshold}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Tier
                        </button>
                    }
                >
                    <div className="space-y-2">
                        {settings.thresholds
                            .sort((a, b) => b.min - a.min)
                            .map((t) => (
                                <ThresholdRow
                                    key={t.id}
                                    threshold={t}
                                    onChange={(patch) => updateThreshold(t.id, patch)}
                                    onRemove={() => removeThreshold(t.id)}
                                />
                            ))}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
                        <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
                            <Info className="h-3 w-3" />
                            How thresholds work
                        </p>
                        <p>
                            When an employee's weighted score falls inside a threshold's
                            range (min–max), their status in the report becomes that tier's
                            label. Make sure ranges don't overlap.
                        </p>
                    </div>
                </Section>

                {/* ==================== OFF DAYS ==================== */}
                <Section
                    icon={<CalendarDays className="h-4 w-4" />}
                    title="Off Days & Holidays"
                    description={`Add government holidays, custom off days, or employee leaves for ${MONTH_FULL[month]} ${year}.`}
                    accent="rose"
                >
                    <OffDaysPanel
                        year={year}
                        month={month}
                        daysInMonth={daysInMonth}
                        offDays={settings.offDays}
                        onAdd={addOffDay}
                        onRemove={removeOffDay}
                    />
                </Section>

                {/* ==================== NOTES ==================== */}
                <Section
                    icon={<Info className="h-4 w-4" />}
                    title="Notes"
                    description="Optional comments about this month's configuration."
                    accent="slate"
                >
                    <textarea
                        value={settings.notes || ""}
                        onChange={(e) =>
                            setSettings({ ...settings, notes: e.target.value })
                        }
                        placeholder="E.g. Employee on 2-week training, reduced KPI weight for this month..."
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </Section>
            </div>

            {/* ==================== STICKY SAVE BAR ==================== */}
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xl">
                <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Zap className="h-3.5 w-3.5 text-indigo-500" />
                            Changes are stored locally per user + month
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/management-report/${userId}/report`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="h-3.5 w-3.5" />
                            )}
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
    icon,
    title,
    description,
    accent,
    action,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    accent: "indigo" | "purple" | "rose" | "slate";
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    const accentMap: Record<string, string> = {
        indigo: "bg-indigo-50 text-indigo-600",
        purple: "bg-purple-50 text-purple-600",
        rose: "bg-rose-50 text-rose-600",
        slate: "bg-slate-100 text-slate-600",
    };
    return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3">
                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentMap[accent]}`}
                    >
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                        {description && (
                            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                        )}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Metric row
// ---------------------------------------------------------------------------

function MetricRow({
    metric,
    onChange,
    onRemove,
}: {
    metric: ScoreMetric;
    onChange: (patch: Partial<ScoreMetric>) => void;
    onRemove?: () => void;
}) {
    const colorMap: Record<string, string> = {
        indigo: "bg-indigo-500",
        emerald: "bg-emerald-500",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
        purple: "bg-purple-500",
        sky: "bg-sky-500",
        teal: "bg-teal-500",
        pink: "bg-pink-500",
        cyan: "bg-cyan-500",
        orange: "bg-orange-500",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3"
        >
            {/* Color chip */}
            <div className="col-span-1">
                <div
                    className={`h-8 w-8 rounded-lg ${colorMap[metric.color] || "bg-indigo-500"} shadow-sm`}
                />
            </div>

            {/* Label */}
            <div className="col-span-4">
                <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => onChange({ label: e.target.value })}
                    className="w-full rounded-lg border border-transparent bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
            </div>

            {/* Value */}
            <div className="col-span-3">
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={metric.value ?? 0}
                        onChange={(e) =>
                            onChange({
                                value: Math.max(
                                    0,
                                    Math.min(100, parseInt(e.target.value, 10) || 0),
                                ),
                            })
                        }
                        className="w-full rounded-lg border border-transparent bg-white px-2.5 py-1.5 pr-7 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                    <Percent className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
            </div>

            {/* Weight */}
            <div className="col-span-3">
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={metric.weight}
                        onChange={(e) =>
                            onChange({
                                weight: Math.max(
                                    0,
                                    Math.min(100, parseInt(e.target.value, 10) || 0),
                                ),
                            })
                        }
                        className="w-full rounded-lg border border-transparent bg-white px-2.5 py-1.5 pr-7 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                        wt%
                    </span>
                </div>
            </div>

            {/* Remove */}
            <div className="col-span-1 flex justify-end">
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Threshold row
// ---------------------------------------------------------------------------

function ThresholdRow({
    threshold,
    onChange,
    onRemove,
}: {
    threshold: StatusThreshold;
    onChange: (patch: Partial<StatusThreshold>) => void;
    onRemove: () => void;
}) {
    const cls = thresholdClasses(threshold.color);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3"
        >
            {/* Badge preview */}
            <div className="col-span-4 flex items-center gap-2">
                <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${cls.badge}`}
                >
                    <Award className="h-3 w-3" />
                    <input
                        type="text"
                        value={threshold.label}
                        onChange={(e) => onChange({ label: e.target.value.toUpperCase() })}
                        className="w-full bg-transparent outline-none"
                    />
                </span>
            </div>

            {/* Min */}
            <div className="col-span-3">
                <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Min %
                </label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    value={threshold.min}
                    onChange={(e) =>
                        onChange({
                            min: Math.max(
                                0,
                                Math.min(100, parseInt(e.target.value, 10) || 0),
                            ),
                        })
                    }
                    className="w-full rounded-lg border border-transparent bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
            </div>

            {/* Max */}
            <div className="col-span-3">
                <label className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Max %
                </label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    value={threshold.max}
                    onChange={(e) =>
                        onChange({
                            max: Math.max(
                                0,
                                Math.min(100, parseInt(e.target.value, 10) || 0),
                            ),
                        })
                    }
                    className="w-full rounded-lg border border-transparent bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
            </div>

            {/* Remove */}
            <div className="col-span-2 flex justify-end">
                <button
                    onClick={onRemove}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Off days panel
// ---------------------------------------------------------------------------

function OffDaysPanel({
    year,
    month,
    daysInMonth,
    offDays,
    onAdd,
    onRemove,
}: {
    year: number;
    month: number;
    daysInMonth: number;
    offDays: OffDayEntry[];
    onAdd: (type: "gov" | "custom" | "leave", day: number, label: string) => void;
    onRemove: (day: number) => void;
}) {
    const [day, setDay] = useState("");
    const [type, setType] = useState<"gov" | "custom" | "leave">("gov");
    const [label, setLabel] = useState("");

    const handleAdd = () => {
        const d = parseInt(day, 10);
        if (!d || d < 1 || d > daysInMonth) {
            toast.error(`Enter a day between 1 and ${daysInMonth}`);
            return;
        }
        const defaultLabel =
            type === "gov"
                ? "Government Holiday"
                : type === "leave"
                    ? "Employee Leave"
                    : "Custom Off Day";
        onAdd(type, d, label.trim() || defaultLabel);
        setDay("");
        setLabel("");
    };

    const typeConfig = {
        gov: {
            icon: <Flag className="h-3.5 w-3.5" />,
            label: "Gov. Holiday",
            bg: "bg-rose-100",
            text: "text-rose-700",
            ring: "ring-rose-200",
        },
        custom: {
            icon: <CalendarDays className="h-3.5 w-3.5" />,
            label: "Custom Off",
            bg: "bg-indigo-100",
            text: "text-indigo-700",
            ring: "ring-indigo-200",
        },
        leave: {
            icon: <Palmtree className="h-3.5 w-3.5" />,
            label: "Employee Leave",
            bg: "bg-amber-100",
            text: "text-amber-700",
            ring: "ring-amber-200",
        },
    };

    return (
        <div>
            {/* Add form */}
            <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Day
                    </label>
                    <input
                        type="number"
                        min="1"
                        max={daysInMonth}
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        placeholder={`1-${daysInMonth}`}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
                <div className="col-span-3">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Type
                    </label>
                    <select
                        value={type}
                        onChange={(e) =>
                            setType(e.target.value as "gov" | "custom" | "leave")
                        }
                        className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="gov">Gov. Holiday</option>
                        <option value="custom">Custom Off</option>
                        <option value="leave">Employee Leave</option>
                    </select>
                </div>
                <div className="col-span-4">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Label (optional)
                    </label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="E.g. Independence Day"
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
                <div className="col-span-2 flex items-end">
                    <button
                        onClick={handleAdd}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                    </button>
                </div>
            </div>

            {/* List */}
            {offDays.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {offDays
                        .sort((a, b) => a.day - b.day)
                        .map((o) => {
                            const cfg = typeConfig[o.type];
                            return (
                                <span
                                    key={o.day}
                                    className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} px-3 py-1 text-xs font-semibold ${cfg.text} ring-1 ${cfg.ring}`}
                                >
                                    {cfg.icon}
                                    Day {o.day}
                                    <span className="mx-0.5 h-1 w-1 rounded-full bg-current opacity-40" />
                                    {o.label}
                                    <button
                                        onClick={() => onRemove(o.day)}
                                        className="ml-0.5 text-current/50 transition hover:text-rose-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            );
                        })}
                </div>
            )}

            {offDays.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                    <CalendarDays className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                        No off days added for this month
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                        Weekends (Friday + 1st/3rd/5th Saturdays) are auto-applied
                    </p>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function thresholdClasses(color: string) {
    const map: Record<
        string,
        { card: string; icon: string; label: string; badge: string }
    > = {
        emerald: {
            card: "border-emerald-200 bg-emerald-50",
            icon: "text-emerald-600",
            label: "text-emerald-700",
            badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
        },
        sky: {
            card: "border-sky-200 bg-sky-50",
            icon: "text-sky-600",
            label: "text-sky-700",
            badge: "bg-sky-100 text-sky-700 ring-sky-200",
        },
        indigo: {
            card: "border-indigo-200 bg-indigo-50",
            icon: "text-indigo-600",
            label: "text-indigo-700",
            badge: "bg-indigo-100 text-indigo-700 ring-indigo-200",
        },
        amber: {
            card: "border-amber-200 bg-amber-50",
            icon: "text-amber-600",
            label: "text-amber-700",
            badge: "bg-amber-100 text-amber-700 ring-amber-200",
        },
        rose: {
            card: "border-rose-200 bg-rose-50",
            icon: "text-rose-600",
            label: "text-rose-700",
            badge: "bg-rose-100 text-rose-700 ring-rose-200",
        },
        purple: {
            card: "border-purple-200 bg-purple-50",
            icon: "text-purple-600",
            label: "text-purple-700",
            badge: "bg-purple-100 text-purple-700 ring-purple-200",
        },
        slate: {
            card: "border-slate-200 bg-slate-50",
            icon: "text-slate-600",
            label: "text-slate-700",
            badge: "bg-slate-100 text-slate-700 ring-slate-200",
        },
    };
    return map[color] || map.slate;
}