// types/management-report/employeeSettings.ts

export interface ScoreMetric {
  id: string;              // e.g. "attendance", "kpi", "performance", custom id
  label: string;           // display name
  weight: number;          // 0-100, contributes to overall weight
  value?: number;          // actual employee score (0-100) — set per month
  color: string;           // "indigo" | "emerald" | "rose" | "amber" | "purple" | "sky"
  isCustom?: boolean;      // true for user-added metrics
}

export interface StatusThreshold {
  id: string;
  label: string;           // e.g. "OUTSTANDING"
  min: number;             // 0-100
  max: number;             // 0-100
  color: string;           // tailwind color name
}

export interface OffDayEntry {
  day: number;             // 1-31
  type: "gov" | "custom" | "leave";
  label: string;
}

export interface EmployeeMonthSettings {
  employeeId: string;
  year: number;
  month: number;                  // 0-based

  metrics: ScoreMetric[];
  thresholds: StatusThreshold[];
  offDays: OffDayEntry[];
  notes?: string;
  updatedAt?: string;
}

// Default configuration
export const DEFAULT_METRICS: ScoreMetric[] = [
  { id: "attendance",  label: "Attendance",   weight: 30, value: 0, color: "emerald" },
  { id: "kpi",         label: "KPI Score",    weight: 40, value: 0, color: "indigo"  },
  { id: "performance", label: "Performance",  weight: 30, value: 0, color: "purple"  },
];

export const DEFAULT_THRESHOLDS: StatusThreshold[] = [
  { id: "t1", label: "OUTSTANDING",  min: 90, max: 100, color: "emerald" },
  { id: "t2", label: "A PERFORMER",  min: 85, max: 89,  color: "sky"     },
  { id: "t3", label: "GOOD JOB",     min: 70, max: 84,  color: "indigo"  },
  { id: "t4", label: "NEEDS WORK",   min: 50, max: 69,  color: "amber"   },
  { id: "t5", label: "BAD",          min: 0,  max: 49,  color: "rose"    },
];

// Custom colors for user-added metrics
export const METRIC_COLORS = [
  "indigo", "emerald", "rose", "amber", "purple",
  "sky", "teal", "pink", "cyan", "orange",
] as const;

export type MetricColor = (typeof METRIC_COLORS)[number];

// Compute overall score from metrics (weighted average)
export function computeOverallScore(metrics: ScoreMetric[]): number {
  const totalWeight = metrics.reduce((s, m) => s + (m.weight || 0), 0);
  if (totalWeight === 0) return 0;
  const weightedSum = metrics.reduce(
    (s, m) => s + ((m.value || 0) * (m.weight || 0)),
    0,
  );
  return Math.round(weightedSum / totalWeight);
}

// Find matching threshold for a score
export function findThreshold(
  score: number,
  thresholds: StatusThreshold[],
): StatusThreshold | null {
  return (
    thresholds.find((t) => score >= t.min && score <= t.max) || null
  );
}

// localStorage key builder
export const settingsKey = (
  employeeId: string,
  year: number,
  month: number,
) => `employeeSettings:${employeeId}:${year}:${month}`;

// Load
export function loadEmployeeSettings(
  employeeId: string,
  year: number,
  month: number,
): EmployeeMonthSettings {
  try {
    const raw = localStorage.getItem(settingsKey(employeeId, year, month));
    if (raw) return JSON.parse(raw) as EmployeeMonthSettings;
  } catch {}
  return {
    employeeId,
    year,
    month,
    metrics: DEFAULT_METRICS.map((m) => ({ ...m })),
    thresholds: DEFAULT_THRESHOLDS.map((t) => ({ ...t })),
    offDays: [],
  };
}

// Save
export function saveEmployeeSettings(s: EmployeeMonthSettings) {
  localStorage.setItem(settingsKey(s.employeeId, s.year, s.month), JSON.stringify(s));
}