"use client";

import { TenderHeader } from "@/components/tender/TenderHeader";
import { TenderOverviewStats } from "@/components/tender/TenderOverviewStats";
import {
  TenderOverviewPipeline,
  type PipelineStage,
} from "@/components/tender/TenderOverviewPipeline";
import {
  TenderOverviewUpcoming,
  type UpcomingTender,
} from "@/components/tender/TenderOverviewUpcoming";
import {
  TenderOverviewPerformance,
  type MonthPerformance,
} from "@/components/tender/TenderOverviewPerformance";
import {
  TenderOverviewRecent,
  type TenderActivity,
} from "@/components/tender/TenderOverviewRecent";
import { TenderOverviewQuickActions } from "@/components/tender/TenderOverviewQuickActions";

/* ============================================================================
 * Mock data — replace with API responses later
 * ========================================================================== */

const STATS = [
  {
    label: "Total Tenders (FY26)",
    value: "42",
    hint: "Across all stages",
  },
  {
    label: "Currently Active",
    value: "6",
    hint: "Docs in preparation",
  },
  {
    label: "Awaiting Result",
    value: "3",
    hint: "Submitted, pending decision",
  },
  {
    label: "Win Rate (FY26)",
    value: "40%",
    hint: "2 Won · 3 Lost",
  },
  {
    label: "Total Bid Value",
    value: "৳68.4L",
    hint: "Submitted this FY",
    highlighted: true,
  },
];

const PIPELINE: PipelineStage[] = [
  { id: "potential", label: "Potential", count: 4, color: "bg-slate-400", hint: "Under review" },
  { id: "active", label: "Active", count: 6, color: "bg-indigo-500", hint: "In preparation" },
  { id: "submitted", label: "Submitted", count: 3, color: "bg-amber-500", hint: "Awaiting result" },
  { id: "won", label: "Won", count: 2, color: "bg-emerald-500", hint: "This FY" },
  { id: "lost", label: "Lost", count: 3, color: "bg-rose-500", hint: "This FY" },
];

const UPCOMING: UpcomingTender[] = [
  {
    id: "u1",
    tenderer: "Bangladesh Meteorological Dept.",
    title: "BDWS Automation Software",
    daysLeft: 6,
    value: "৳13,18,646",
  },
  {
    id: "u2",
    tenderer: "PGCB — Antivirus/EDR",
    title: "Endpoint protection deployment",
    daysLeft: 6,
    value: "৳13,18,085",
  },
  {
    id: "u3",
    tenderer: "Janata Bank PLC",
    title: "RHEL Subscription Renewal",
    daysLeft: 9,
    value: "৳13,19,279",
  },
  {
    id: "u4",
    tenderer: "DGFI",
    title: "Laptop/Printer/UPS (10 lots)",
    daysLeft: 10,
    value: "—",
  },
  {
    id: "u5",
    tenderer: "Pubali Bank Ltd.",
    title: "Kiosk — Self-Service Desk",
    daysLeft: 11,
    value: "—",
  },
];

const PERFORMANCE: MonthPerformance[] = [
  { month: "Apr", won: 0, lost: 1 },
  { month: "May", won: 1, lost: 0 },
  { month: "Jun", won: 0, lost: 1 },
  { month: "Jul", won: 0, lost: 1 },
  { month: "Aug", won: 1, lost: 0 },
  { month: "Sep", won: 0, lost: 0 },
];

const RECENT: TenderActivity[] = [
  {
    id: "r1",
    kind: "submitted",
    tenderer: "Pubali Bank Ltd.",
    message: "Kiosk self-service desk submitted to client",
    timeAgo: "3 days ago",
  },
  {
    id: "r2",
    kind: "uploaded",
    tenderer: "BPDB",
    message: "Tender notice uploaded — Acronis renewal",
    timeAgo: "Today",
  },
  {
    id: "r3",
    kind: "discussed",
    tenderer: "Bangladesh Bank",
    message: "Internal discussion on EViews commissioning",
    timeAgo: "Yesterday",
  },
  {
    id: "r4",
    kind: "lost",
    tenderer: "ICB Islamic Bank",
    message: "Disqualified — missing OEM authorization",
    timeAgo: "1 week ago",
  },
  {
    id: "r5",
    kind: "won",
    tenderer: "Janata Bank PLC",
    message: "Awarded RHEL enterprise subscription",
    timeAgo: "2 weeks ago",
  },
];

/* ============================================================================
 * Page
 * ========================================================================== */

export default function TenderOverviewPage() {
  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        {/* Header */}
        <TenderHeader onAddTender={() => {
          // Navigate to /tenders/manage and open the modal there, or
          // open a modal here if you lift the AddTenderModal state up.
          window.location.href = "/tenders/manage";
        }} />

        {/* KPI strip */}
        <TenderOverviewStats stats={STATS} />

        {/* Pipeline + upcoming side-by-side on large screens */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <TenderOverviewPipeline stages={PIPELINE} />
            <TenderOverviewPerformance data={PERFORMANCE} winRate={40} />
          </div>
          <div className="space-y-6">
            <TenderOverviewUpcoming items={UPCOMING} />
            <TenderOverviewRecent items={RECENT} />
          </div>
        </div>

        {/* Quick access cards */}
        <TenderOverviewQuickActions />
      </div>
    </main>
  );
}