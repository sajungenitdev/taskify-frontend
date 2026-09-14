// components/crm/ForecastChart.tsx
"use client";

import React, { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { monthLabel, formatMoney } from "@/utils/format";
import type { Currency, ForecastRow } from "@/types/crm/crm.types";

interface Props {
  rows: ForecastRow[];
  currency?: Currency;
  showRawComparison?: boolean;
}

export const ForecastChart = memo(function ForecastChart({
  rows,
  currency = "USD",
  showRawComparison = true,
}: Props) {
  // Filter out rows that would break the chart, then map to display shape.
  // Safe against: null, undefined, "", non-string, malformed "YYYY-MM".
  const chartData = (Array.isArray(rows) ? rows : [])
    .filter(
      (r) =>
        r &&
        typeof r.month === "string" &&
        r.month.length > 0 &&
        !Number.isNaN(Number(r.month.split("-")[0])),
    )
    .map((r) => ({
      month: monthLabel(r.month),
      weighted: typeof r.weighted === "number" ? r.weighted : 0,
      raw: typeof r.raw === "number" ? r.raw : 0,
    }));

  const isEmpty = chartData.length === 0;

  return (
    <div className="h-[360px] w-full">
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-2xs">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs font-bold text-slate-900">
            No Forecast Data Recorded
          </p>
          <p className="mt-0.5 max-w-xs text-[11px] leading-relaxed text-slate-500">
            Projections will populate automatically once open opportunities
            have expected close dates and valuations assigned.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 24, bottom: 8, left: 8 }}
            barSize={24}
            barGap={6}
          >
            <defs>
              <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
              </linearGradient>

              <linearGradient
                id="weightedGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#1e293b" stopOpacity={1} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0.95} />
              </linearGradient>

              <filter
                id="barShadow"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="2"
                  floodOpacity="0.08"
                />
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />

            <XAxis
              dataKey="month"
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              width={60}
              tick={{
                fill: "#64748b",
                fontSize: 11,
                fontFamily: "monospace",
              }}
              tickFormatter={(val: number) =>
                val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
              }
            />

            <Tooltip
              cursor={{ fill: "rgba(241, 245, 249, 0.65)", radius: 6 }}
              content={<CustomForecastTooltip currency={currency} />}
            />

            {showRawComparison && (
              <Bar
                name="Gross Pipeline"
                dataKey="raw"
                fill="url(#grossGradient)"
                radius={[4, 4, 0, 0]}
                filter="url(#barShadow)"
              />
            )}

            <Bar
              name="Weighted Total"
              dataKey="weighted"
              fill="url(#weightedGradient)"
              radius={[4, 4, 0, 0]}
              filter="url(#barShadow)"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

// ============================================================================
// Custom Tooltip — unchanged
// ============================================================================

interface TooltipPayloadItem {
  dataKey?: string | number;
  value?: number | string;
  name?: string;
  color?: string;
  [key: string]: unknown;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  currency: Currency;
}

const CustomForecastTooltip = memo(function CustomForecastTooltip({
  active,
  payload,
  label,
  currency,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const rawVal = Number(payload.find((p) => p.dataKey === "raw")?.value ?? 0);
  const weightedVal = Number(
    payload.find((p) => p.dataKey === "weighted")?.value ?? 0,
  );

  const realizationPct =
    rawVal > 0 ? Math.round((weightedVal / rawVal) * 100) : 0;

  return (
    <div className="min-w-[220px] rounded-2xl border border-slate-200/90 bg-white/95 p-4 text-xs shadow-xl ring-1 ring-slate-900/5 backdrop-blur-md">
      <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-[13px] font-bold text-slate-900">
          {label} Forecast
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
          {realizationPct}% Ratio
        </span>
      </div>

      <div className="space-y-2 font-mono">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 font-sans text-xs font-medium text-slate-600">
            <div className="flex h-4 w-4 items-center justify-center rounded bg-slate-900 text-white">
              <TrendingUp className="h-2.5 w-2.5" />
            </div>
            <span>Weighted Total</span>
          </div>
          <span className="text-xs font-bold text-slate-900">
            {formatMoney(weightedVal, currency)}
          </span>
        </div>

        {rawVal > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-1">
            <div className="flex items-center gap-1.5 font-sans text-xs font-medium text-slate-500">
              <div className="flex h-4 w-4 items-center justify-center rounded bg-sky-500 text-white">
                <DollarSign className="h-2.5 w-2.5" />
              </div>
              <span>Gross Pipeline</span>
            </div>
            <span className="text-xs font-semibold text-slate-600">
              {formatMoney(rawVal, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});