// hooks/tender/useTenderOverview.ts
"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import {
  type TenderOverviewData,
  type UpcomingTender,
  type PerformanceResponse,
  type TenderActivity,
} from "@/lib/api/tender.api";

/* ============================================================
 * Public types
 * ============================================================ */

export interface ActionItem {
  id: string;
  label: string;
  icon: "bell" | "shield" | "receipt";
}

export interface AIMatch {
  id: string;
  portal: string;
  title: string;
  matches: string;
  matchPercentage: number;
  actionText: string;
}

export interface AlertItem {
  id: string;
  entity: string;
  desc: string;
  status: string;
  statusColor: "red" | "orange" | "blue" | "green";
}

export interface AlertSection {
  title: string;
  icon: "flame" | "clock" | "lock" | "file" | "target";
  color: "red" | "orange" | "blue" | "green";
  items: AlertItem[];
}

export interface TenderAlerts {
  hotRfqs: AlertSection;
  deadlines: AlertSection;
  security: AlertSection;
  billing: AlertSection;
  delivery: AlertSection;
}

/* ============================================================
 * Shared cache
 * ============================================================ */

interface TendersRaw {
  list: any[];
  ts: number;
}

interface CombinedShape {
  stats?: any[];
  pipeline?: any[];
  stages?: Record<string, number>;
  upcoming?: UpcomingTender[];
  performance?: PerformanceResponse;
  recentActivity?: TenderActivity[];
  actionItems?: ActionItem[];
  aiMatches?: AIMatch[];
  aiCrawledAt?: string;
  alerts?: TenderAlerts;
}

let OVERVIEW_CACHE: { data: CombinedShape | null; ts: number } = {
  data: null,
  ts: 0,
};
let TENDERS_CACHE: TendersRaw = { list: [], ts: 0 };
let TENDERS_IN_FLIGHT: Promise<any[]> | null = null;
const STALE_MS = 30_000;

/* ============================================================
 * Fetchers
 * ============================================================ */

async function loadTenders(force = false): Promise<any[]> {
  if (!force && TENDERS_CACHE.list.length > 0 && Date.now() - TENDERS_CACHE.ts < STALE_MS) {
    return TENDERS_CACHE.list;
  }
  if (TENDERS_IN_FLIGHT) return TENDERS_IN_FLIGHT;

  TENDERS_IN_FLIGHT = api
    .get("/tenders", { params: { includeDrafts: true, limit: 200 } })
    .then((res) => {
      const payload = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      TENDERS_CACHE = { list: payload, ts: Date.now() };
      TENDERS_IN_FLIGHT = null;
      return payload;
    })
    .catch((e) => {
      TENDERS_IN_FLIGHT = null;
      throw e;
    });

  return TENDERS_IN_FLIGHT;
}

async function loadOverview(force = false): Promise<CombinedShape> {
  if (!force && OVERVIEW_CACHE.data && Date.now() - OVERVIEW_CACHE.ts < STALE_MS) {
    return OVERVIEW_CACHE.data;
  }
  const res = await api.get("/tenders/overview");
  const payload = (res.data?.data ?? {}) as CombinedShape;
  OVERVIEW_CACHE = { data: payload, ts: Date.now() };
  return payload;
}

export function invalidateTenderOverview() {
  OVERVIEW_CACHE = { data: null, ts: 0 };
  TENDERS_CACHE = { list: [], ts: 0 };
  TENDERS_IN_FLIGHT = null;
}

/* ============================================================
 * Helpers
 * ============================================================ */

function isAutoDiscovered(t: any): boolean {
  if (!t) return false;
  if (t.autoDiscovered === true) return true;
  if (t.source === "crawler") return true;
  if (typeof t.recordedBy === "string" && t.recordedBy.toLowerCase().includes("auto"))
    return true;
  if (typeof t.note === "string" && t.note.toLowerCase().includes("auto"))
    return true;
  return false;
}

function pickPortal(t: any): string {
  if (t.tenderType === "eGP") return "e-GP Portal";
  if (t.tenderType === "RFQ") return "CPTU";
  if (t.tenderType === "Hardcopy Ref.") return "Client Portal";
  return "e-GP Portal";
}

function shortDescription(t: any): string {
  const desc = (t.description ?? "").trim();
  if (!desc) return "Auto-discovered tender";
  return desc.length > 70 ? `${desc.slice(0, 70)}…` : desc;
}

function formatBudget(val?: number | string | null): string {
  const n = Number(val ?? 0);
  if (!n || isNaN(n)) return "—";
  if (n >= 1_00_00_000) return `৳${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `৳${(n / 1_00_000).toFixed(2)} L`;
  return `৳${n.toLocaleString("en-IN")}`;
}

function daysUntil(iso?: string | null): number {
  if (!iso) return Infinity;
  const d = new Date(iso).getTime();
  if (isNaN(d)) return Infinity;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ============================================================
 * Derived — pipeline stats from a tenders list
 * ============================================================ */

const STAGE_COLORS: Record<string, string> = {
  Potential: "#a97400",
  Active: "#1e3a8a",
  Submitted: "#94a3b8",
  Won: "#059669",
  Lost: "#dc2626",
};

export function derivePipelineFromTenders(tenders: any[]) {
  const counts = {
    Potential: 0,
    Active: 0,
    Submitted: 0,
    Won: 0,
    Lost: 0,
  };
  for (const t of tenders) {
    switch (t.stage) {
      case "potential":
        counts.Potential++;
        break;
      case "active":
        counts.Active++;
        break;
      case "submitted":
        counts.Submitted++;
        break;
      case "won":
        counts.Won++;
        break;
      case "lost":
        counts.Lost++;
        break;
    }
  }
  const total = tenders.length;
  const wonCount = counts.Won;
  const lostCount = counts.Lost;
  const winRate =
    wonCount + lostCount > 0
      ? Math.round((wonCount / (wonCount + lostCount)) * 100)
      : 0;

  const pipelineMix = Object.entries(counts).map(([label, value]) => ({
    label,
    value,
    color: STAGE_COLORS[label] ?? "#94a3b8",
  }));

  const wonValue = tenders
    .filter((t) => t.stage === "won")
    .reduce((acc, t) => acc + Number(t.bidValue ?? 0), 0);

  const wonValueShort = formatBudget(wonValue);

  return {
    pipelineMix,
    winRate,
    wonValue: wonValueShort,
    wonValueShort,
    lostCount,
    total,
  };
}

/* ============================================================
 * HOOKS
 * ============================================================ */

/* ---------- Overview stats + pipeline ---------- */
export function useTenderOverview() {
  const [data, setData] = useState<TenderOverviewData | null>(
    (OVERVIEW_CACHE.data as any) ?? null,
  );
  const [loading, setLoading] = useState(!OVERVIEW_CACHE.data);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(!OVERVIEW_CACHE.data);
    loadOverview()
      .then((d) => {
        if (!mounted.current) return;
        setData(d as any);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Upcoming deadlines ---------- */
export function useUpcomingDeadlines() {
  const [data, setData] = useState<UpcomingTender[]>(
    OVERVIEW_CACHE.data?.upcoming ?? [],
  );
  const [loading, setLoading] = useState(!OVERVIEW_CACHE.data);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(!OVERVIEW_CACHE.data);
    loadOverview()
      .then((d) => {
        if (!mounted.current) return;
        setData(d.upcoming ?? []);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Performance (derived from tenders) ---------- */
export function useTenderPerformance() {
  const [data, setData] = useState<PerformanceResponse | null>(
    OVERVIEW_CACHE.data?.performance ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    // Try the overview endpoint first (fast path)
    loadOverview()
      .then((d) => {
        if (!mounted.current) return;
        if (d.performance && d.performance.winRate !== undefined) {
          setData(d.performance);
          setError(null);
          setLoading(false);
          return;
        }
        // Fall back to deriving from the tenders list
        return loadTenders().then((tenders) => {
          if (!mounted.current) return;
          const derived = derivePipelineFromTenders(tenders);
          setData({
            data: [],
            winRate: derived.winRate,
            pipelineMix: derived.pipelineMix,
            wonValue: derived.wonValue,
            wonValueShort: derived.wonValueShort,
            lostCount: derived.lostCount,
          } as PerformanceResponse);
          setError(null);
        });
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));

    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Recent activity ---------- */
export function useRecentActivity(_limit = 10) {
  const [data, setData] = useState<TenderActivity[]>(
    OVERVIEW_CACHE.data?.recentActivity ?? [],
  );
  const [loading, setLoading] = useState(!OVERVIEW_CACHE.data);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(!OVERVIEW_CACHE.data);
    loadOverview()
      .then((d) => {
        if (!mounted.current) return;
        setData(d.recentActivity ?? []);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Action Items (derived from tenders) ---------- */
export function useTenderActionItems() {
  const [data, setData] = useState<ActionItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    loadTenders()
      .then((tenders) => {
        if (!mounted.current) return;

        const items: ActionItem[] = [];

        // 1. New RFQs / auto-discovered pending review
        const newRfqs = tenders.filter(
          (t) => t.stage === "potential" && isAutoDiscovered(t),
        );
        if (newRfqs.length > 0) {
          items.push({
            id: "rfq",
            label: `${newRfqs.length} new RFQ${newRfqs.length === 1 ? "" : "s"
              } to review`,
            icon: "bell",
          });
        }

        // 2. Tender security notices to send
        const pendingSecurity = tenders.filter(
          (t) =>
            (t.stage === "active" || t.stage === "submitted") &&
            !t.tenderSecurityValidity,
        );
        if (pendingSecurity.length > 0) {
          items.push({
            id: "security",
            label: `${pendingSecurity.length} tender security notice${pendingSecurity.length === 1 ? "" : "s"
              } to send`,
            icon: "shield",
          });
        }

        // 3. Orders ready to invoice
        const readyToInvoice = tenders.filter(
          (t) => t.stage === "won" && t.invoiceStatus !== "invoiced",
        );
        if (readyToInvoice.length > 0) {
          items.push({
            id: "invoice",
            label: `${readyToInvoice.length} order${readyToInvoice.length === 1 ? "" : "s"
              } ready to invoice`,
            icon: "receipt",
          });
        }

        setData(items);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));

    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- AI Tender Matches (derived from tenders) ---------- */
export function useAITenderMatches() {
  const [data, setData] = useState<AIMatch[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    // Prefer backend-provided AI matches
    const cachedFromOverview = OVERVIEW_CACHE.data?.aiMatches;
    if (cachedFromOverview && cachedFromOverview.length > 0) {
      setData(cachedFromOverview);
      setLoading(false);
      return;
    }

    loadTenders()
      .then((tenders) => {
        if (!mounted.current) return;

        const autoDiscovered = tenders.filter(isAutoDiscovered);
        const source = autoDiscovered.length > 0 ? autoDiscovered : tenders;

        const derived: AIMatch[] = source.slice(0, 5).map((t, i) => ({
          id: t._id ?? String(i),
          portal: pickPortal(t),
          title: `${t.tenderer ?? "Unknown"} — ${t.title ?? "Untitled"}`,
          matches: `${shortDescription(t)} · est. ${formatBudget(
            t.tentativeBudget,
          )}`,
          matchPercentage: Math.max(60, 92 - i * 7),
          actionText: "+ Add to Potential",
        }));

        setData(derived);
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));

    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ---------- Tender Alerts (derived from tenders) ---------- */
export function useTenderAlerts() {
  const [data, setData] = useState<TenderAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);

    // Prefer backend-provided alerts
    const cached = OVERVIEW_CACHE.data?.alerts;
    if (
      cached &&
      (cached.hotRfqs?.items?.length ||
        cached.deadlines?.items?.length ||
        cached.security?.items?.length ||
        cached.billing?.items?.length ||
        cached.delivery?.items?.length)
    ) {
      setData(cached);
      setLoading(false);
      return;
    }

    loadTenders()
      .then((tenders) => {
        if (!mounted.current) return;

        const potential = tenders.filter((t) => t.stage === "potential");
        const active = tenders.filter((t) => t.stage === "active");
        const submitted = tenders.filter((t) => t.stage === "submitted");
        const won = tenders.filter((t) => t.stage === "won");

        /* ---------- 1. Hot RFQs / Tenders ---------- */
        const hotRfqs: AlertSection = {
          title: "NEW HOT RFQS / TENDERS",
          icon: "flame",
          color: "red",
          items: potential.slice(0, 4).map((t) => ({
            id: t._id,
            entity: `${t.tenderer} — ${t.title}`,
            desc: `Arrived ${formatShortDate(
              t.createdAt,
            )} · est. ${formatBudget(t.tentativeBudget)}`,
            status: "New",
            statusColor: "red" as const,
          })),
        };

        /* ---------- 2. Submission Deadlines ---------- */
        const upcomingDeadlines = [...potential, ...active]
          .filter((t) => t.lastDateOfSubmission)
          .map((t) => ({ t, days: daysUntil(t.lastDateOfSubmission) }))
          .filter((x) => x.days >= 0 && x.days <= 30)
          .sort((a, b) => a.days - b.days)
          .slice(0, 4);

        const deadlines: AlertSection = {
          title: "IMMEDIATE SUBMISSION DEADLINES",
          icon: "clock",
          color: "orange",
          items: upcomingDeadlines.map(({ t, days }) => ({
            id: t._id,
            entity: `${t.tenderer} — ${t.title}`,
            desc: `Due in ${days} day${days === 1 ? "" : "s"
              } · ${t.docStatus ?? "Documents pending"}`,
            status: `${days} Day${days === 1 ? "" : "s"}`,
            statusColor: days <= 3 ? ("red" as const) : ("orange" as const),
          })),
        };

        /* ---------- 3. Security Maturing ---------- */
        const securities = [...active, ...submitted, ...won]
          .filter(
            (t) => t.tenderSecurityValidity || t.performanceSecurityValidity,
          )
          .map((t) => ({
            t,
            days: Math.min(
              daysUntil(t.tenderSecurityValidity),
              daysUntil(t.performanceSecurityValidity),
            ),
          }))
          .filter((x) => x.days < 90)
          .sort((a, b) => a.days - b.days)
          .slice(0, 4);

        const security: AlertSection = {
          title: "TENDER / PERFORMANCE SECURITY MATURING",
          icon: "lock",
          color: "blue",
          items: securities.map(({ t, days }) => {
            const isMissing =
              !t.tenderSecurityValidity || !t.performanceSecurityValidity;
            return {
              id: t._id,
              entity: `${t.tenderer} — ${t.title}`,
              desc: isMissing
                ? "Tender/Performance security missing · due soon"
                : `Security maturing · ${Math.max(0, days)} days left`,
              status: isMissing
                ? "Missing Docs"
                : `${Math.max(0, days)} Days`,
              statusColor: isMissing ? ("red" as const) : ("blue" as const),
            };
          }),
        };

        /* ---------- 4. Billable — Ready to Invoice ---------- */
        const billing: AlertSection = {
          title: "BILLABLE — DELIVERED, READY TO INVOICE",
          icon: "file",
          color: "green",
          items: won.slice(0, 4).map((t) => {
            const invoiced = t.invoiceStatus === "invoiced";
            return {
              id: t._id,
              entity: `${t.tenderer} — ${t.title}`,
              desc: invoiced
                ? "Invoice issued · awaiting payment"
                : "Sales Order created · not yet invoiced",
              status: invoiced ? "Invoiced" : "Not Invoiced",
              statusColor: invoiced
                ? ("blue" as const)
                : ("orange" as const),
            };
          }),
        };

        /* ---------- 5. Delivery Deadlines ---------- */
        const delivery: AlertSection = {
          title: "DELIVERY DEADLINES — WON TENDERS IN EXECUTION",
          icon: "target",
          color: "green",
          items: won.slice(0, 4).map((t) => {
            const hasPO = Boolean(t.purchaseOrderNumber);
            return {
              id: t._id,
              entity: `${t.tenderer} — ${t.title}`,
              desc: hasPO
                ? "Order placed · sourcing in progress"
                : "Purchase Order pending · delivery TBD",
              status: hasPO ? "Sourcing" : "Awaiting PO",
              statusColor: hasPO
                ? ("orange" as const)
                : ("blue" as const),
            };
          }),
        };

        setData({
          hotRfqs,
          deadlines,
          security,
          billing,
          delivery,
        });
        setError(null);
      })
      .catch((e) => mounted.current && setError(e as Error))
      .finally(() => mounted.current && setLoading(false));

    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error };
}

/* ============================================================
 * Utility — format an ISO timestamp as "X min ago"
 * ============================================================ */

export function formatTimeAgo(iso?: string): string {
  if (!iso) return "just now";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "just now";

  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}