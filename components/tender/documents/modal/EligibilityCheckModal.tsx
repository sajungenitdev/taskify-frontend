// components/tender/documents/modal/EligibilityCheckModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Sparkles,
  Loader2,
  X,
  ListChecks,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import type { Tender, TenderEligibilityRequirement } from "@/lib/api/tender.api";

/* ---------- Types ---------- */
export type MatchState = "meets" | "gap" | "within" | "info";

export interface EligibilityRow {
  requirement: string;
  ourRecord: string;
  match: MatchState;
}

export interface EligibilityResult {
  rows: EligibilityRow[];
  overall: "Ready" | "Review Required" | "Not Ready";
  note: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tender: Tender | null;
  onApprove?: (requirements: TenderEligibilityRequirement[]) => void;
  onDecline?: () => void;
}

/* ============================================================
 * Default eligibility criteria — used when the tender has no
 * saved checklist yet. These mirror the standard checklist a
 * typical BD eGP/RFQ tender requires.
 * ============================================================ */
const DEFAULT_CRITERIA: string[] = [
  "Valid Trade License",
  "VAT / BIN Certificate",
  "Income Tax Clearance",
  "Bank Solvency Certificate",
  "Tender Security (Pay Order / BG)",
  "Performance Security Ready",
  "Similar Work Experience",
  "Sufficient Annual Turnover",
  "ISO / Quality Certifications",
  "Authorized Dealer Certificate",
];

/* ============================================================
 * Rule engine
 * ============================================================ */
function runEligibility(tender: Tender): EligibilityResult {
  const checklist = Array.isArray((tender as any)?.checklist)
    ? ((tender as any).checklist as {
      id: string;
      label: string;
      checked?: boolean;
    }[])
    : [];

  /* If the tender has a saved checklist, use it. Otherwise seed
     with the default criteria (unchecked → treated as "gap" until
     the user explicitly ticks them in the checklist modal). */
  const source =
    checklist.length > 0
      ? checklist.map((it) => ({
        label: it.label || "Untitled requirement",
        checked: !!it.checked,
        seeded: false,
      }))
      : DEFAULT_CRITERIA.map((label) => ({
        label,
        checked: false,
        seeded: true,
      }));

  const rows: EligibilityRow[] = source.map((it) => ({
    requirement: it.label,
    ourRecord: it.checked
      ? "Marked complete"
      : it.seeded
        ? "Not yet verified"
        : "Not marked yet",
    match: it.checked ? "meets" : "gap",
  }));

  /* ---------- Overall verdict ---------- */
  const gaps = rows.filter((r) => r.match === "gap");
  const meets = rows.filter((r) => r.match !== "gap").length;

  const overall: EligibilityResult["overall"] =
    gaps.length === 0
      ? "Ready"
      : gaps.length <= 3
        ? "Review Required"
        : "Not Ready";

  /* ---------- AI-style note ---------- */
  let note = "";
  if (gaps.length === 0) {
    note = `Meets all ${rows.length} criteria. Safe to approve for participation.`;
  } else if (gaps.length <= 3) {
    const g = gaps.map((r) => r.requirement).join(", ");
    note = `Meets ${meets} of ${rows.length} criteria. Remaining gaps: ${g}. Confirm with the responsible person before committing.`;
  } else {
    const preview = gaps.slice(0, 3).map((g) => g.requirement).join(", ");
    note = `Meets only ${meets} of ${rows.length} criteria. ${gaps.length} gaps found — including: ${preview}${gaps.length > 3 ? ", …" : ""}. Do not proceed without resolving these.`;
  }

  return { rows, overall, note };
}

/* ============================================================
 * Modal
 * ============================================================ */
export function EligibilityCheckModal({
  open,
  onOpenChange,
  tender,
  onApprove,
  onDecline,
}: Props) {
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  /* Per-row manual override — user can flip Meets / Gap inline */
  const [overrides, setOverrides] = useState<Record<number, MatchState>>({});

  /* Run check when modal opens */
  useEffect(() => {
    if (!open || !tender) return;
    setChecking(true);
    setResult(null);
    setOverrides({});
    const t = setTimeout(() => {
      setResult(runEligibility(tender));
      setChecking(false);
    }, 300);
    return () => clearTimeout(t);
  }, [open, tender]);

  /* Esc close + body scroll lock */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  /* Recompute the note as overrides change */
  const displayResult = useMemo<EligibilityResult | null>(() => {
    if (!result) return null;
    const rows = result.rows.map((r, i) => {
      const override = overrides[i];
      if (!override) return r;
      return {
        ...r,
        match: override,
        ourRecord:
          override === "meets" ? "Confirmed by user" : r.ourRecord,
      };
    });

    const gaps = rows.filter((r) => r.match === "gap");
    const meets = rows.filter((r) => r.match !== "gap").length;

    const overall: EligibilityResult["overall"] =
      gaps.length === 0
        ? "Ready"
        : gaps.length <= 3
          ? "Review Required"
          : "Not Ready";

    let note = "";
    if (gaps.length === 0) {
      note = `Meets all ${rows.length} criteria. Safe to approve for participation.`;
    } else if (gaps.length <= 3) {
      const g = gaps.map((r) => r.requirement).join(", ");
      note = `Meets ${meets} of ${rows.length} criteria. Remaining gaps: ${g}.`;
    } else {
      const preview = gaps.slice(0, 3).map((g) => g.requirement).join(", ");
      note = `Meets only ${meets} of ${rows.length} criteria. ${gaps.length} gaps found — including: ${preview}${gaps.length > 3 ? ", …" : ""}.`;
    }

    return { rows, overall, note };
  }, [result, overrides]);

  if (!open || !tender) return null;

  /* Convert local rows → TenderEligibilityRequirement[] for the parent */
  const buildRequirementsForParent = (): TenderEligibilityRequirement[] => {
    if (!displayResult) return [];
    return displayResult.rows.map((row, idx) => {
      let match: TenderEligibilityRequirement["match"] = "Partial";
      if (row.match === "meets" || row.match === "within") match = "Meets";
      else if (row.match === "gap") match = "Gap";

      return {
        id: `req-${idx}`,
        requirement: row.requirement,
        ourRecord: row.ourRecord,
        match,
      };
    });
  };

  const toggleRow = (idx: number, current: MatchState) => {
    const next: MatchState = current === "meets" ? "gap" : "meets";
    setOverrides((prev) => ({ ...prev, [idx]: next }));
  };

  const resetOverrides = () => setOverrides({});

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900">
              {tender.tenderer} — {tender.title}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Eligibility &amp; Suitability Check
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {!checking && displayResult && (
              <StatusPill overall={displayResult.overall} />
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {checking ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#a97400]" />
              <p className="text-xs text-slate-500">
                Reading the tender checklist and computing eligibility…
              </p>
            </div>
          ) : !displayResult ? null : (
            <>
              {/* Info banner */}
              {/* Info / warning banner */}
              {(() => {
                const hasChecklist = ((tender as any)?.checklist?.length ?? 0) > 0;
                return hasChecklist ? (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                    <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                    <p className="text-[11.5px] leading-relaxed text-sky-800">
                      Loaded from this tender's saved checklist. Tick items here to
                      override.
                    </p>
                  </div>
                ) : (
                  <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50/70 px-3 py-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a97400]" />
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-bold leading-tight text-[#8a6a2b]">
                        Showing default eligibility criteria
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#8a6a2b]/90">
                        No checklist entries exist for this tender yet. The items below
                        are <strong>static defaults</strong> for reference — tick each
                        one you can confirm, or open the Submission Checklist to add
                        real requirements specific to this tender.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Rows */}
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-2.5">Requirement</th>
                      <th className="px-4 py-2.5">Our Record</th>
                      <th className="px-4 py-2.5 text-right">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayResult.rows.map((row, i) => (
                      <tr
                        key={i}
                        className="cursor-pointer transition hover:bg-slate-50/60"
                        onClick={() => toggleRow(i, row.match)}
                        title="Click to toggle Meets / Gap"
                      >
                        <td className="px-4 py-3 text-[12px] font-medium text-slate-700">
                          {row.requirement}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-slate-600">
                          {row.ourRecord}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MatchBadge state={row.match} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI note */}
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50/60 p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#a97400]" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#a97400]">
                    AI Suitability Note
                  </p>
                </div>
                <p className="text-[12px] leading-relaxed text-slate-700">
                  {displayResult.note}
                </p>
              </div>

              {hasOverrides && (
                <button
                  type="button"
                  onClick={resetOverrides}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset overrides
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              const requirements = buildRequirementsForParent();
              onApprove?.(requirements);
              onOpenChange(false);
            }}
            disabled={checking || !displayResult}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve for Participation
          </button>
          <button
            type="button"
            onClick={() => {
              onDecline?.();
              onOpenChange(false);
            }}
            disabled={checking}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Small bits
 * ============================================================ */
function StatusPill({ overall }: { overall: EligibilityResult["overall"] }) {
  const styles = {
    Ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Review Required": "bg-orange-50 text-orange-700 border-orange-200",
    "Not Ready": "bg-rose-50 text-rose-700 border-rose-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${styles[overall]}`}
    >
      {overall}
    </span>
  );
}

function MatchBadge({ state }: { state: MatchState }) {
  if (state === "meets") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Meets
      </span>
    );
  }
  if (state === "within") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Within range
      </span>
    );
  }
  if (state === "gap") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
        <XCircle className="h-3 w-3" />
        Gap
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
      <MinusCircle className="h-3 w-3" />
      Info
    </span>
  );
}