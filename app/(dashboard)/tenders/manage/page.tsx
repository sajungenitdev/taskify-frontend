"use client";

import { useMemo, useState } from "react";
import { TenderHeader } from "@/components/tender/TenderHeader";
import { TenderStats } from "@/components/tender/TenderStats";
import { TenderTabs, type TenderTab } from "@/components/tender/TenderTabs";
import {
  TenderTable,
  TenderTypeBadge,
  DocsStatusBadge,
  DeadlineCell,
  AttachmentIcon,
} from "@/components/tender/TenderTable";
import {
  TenderDetailReview,
  type TenderDetailData,
} from "@/components/tender/TenderDetailReview";
import {
  TenderDetailActive,
  type ActiveTenderDetail,
} from "@/components/tender/TenderDetailActive";
import {
  TenderDetailSubmitted,
  type SubmittedTenderDetail,
} from "@/components/tender/TenderDetailSubmitted";
import {
  TenderDetailLost,
  type LostTenderDetail,
} from "@/components/tender/TenderDetailLost";
import { AddTenderModal } from "@/components/tender/modal/AddTenderModal";

/* ============================================================================
 * Mock data — replace with API calls when the backend is ready
 * ========================================================================== */

const STATS = [
  { label: "Potential (Under Review)", value: "4", hint: "Awaiting go/no-go decision" },
  { label: "Active Participation", value: "6", hint: "Docs in preparation" },
  { label: "Awaiting Result", value: "3", hint: "Submitted, pending decision" },
  { label: "Win Rate (FY26)", value: "40%", hint: "2 Won · 3 Lost" },
  {
    label: "Tender Security Pending",
    value: "৳8.76L",
    hint: "Across 3 entities",
    highlighted: true,
  },
];

const POTENTIAL_ROWS = [
  {
    id: "p1",
    cells: {
      tenderer: "BPDB",
      description: "Acronis Backup Solution — Renewal, 3 Sites",
      type: <TenderTypeBadge type="eGP" />,
      recorded: "Today",
      budget: "৳6,50,000",
      icon: <AttachmentIcon />,
    },
  },
  {
    id: "p2",
    cells: {
      tenderer: "Rupali Bank Ltd.",
      description: "Network Security Appliance Supply",
      type: <TenderTypeBadge type="RFQ" />,
      recorded: "Yesterday",
      budget: "৳11,20,000",
      icon: <AttachmentIcon />,
    },
  },
  {
    id: "p3",
    cells: {
      tenderer: "BAPEX",
      description: "Industrial Sensor & Metering Package",
      type: <TenderTypeBadge type="eGP" />,
      recorded: "2 days ago",
      budget: "৳4,80,000",
      icon: <AttachmentIcon />,
    },
  },
];

const ACTIVE_ROWS = [
  {
    id: "a1",
    cells: {
      tenderer: "Bangladesh Meteorological Dept.",
      type: <TenderTypeBadge type="eGP" />,
      deadline: <DeadlineCell days={6} />,
      value: "৳13,18,646",
      status: <DocsStatusBadge status="In Progress" />,
      icon: <AttachmentIcon />,
    },
  },
  {
    id: "a2",
    cells: {
      tenderer: "PGCB — Antivirus/EDR",
      type: <TenderTypeBadge type="eGP" />,
      deadline: <DeadlineCell days={6} />,
      value: "৳13,18,085",
      status: <DocsStatusBadge status="Pending" />,
      icon: <AttachmentIcon />,
    },
  },
  {
    id: "a3",
    cells: {
      tenderer: "Pubali Bank Ltd. — Kiosk",
      type: <TenderTypeBadge type="RFQ" />,
      deadline: <DeadlineCell days={11} />,
      value: "—",
      status: <DocsStatusBadge status="Done" />,
      icon: <AttachmentIcon />,
    },
  },
  {
    id: "a4",
    cells: {
      tenderer: "DGFI — Laptop/Printer/UPS (10 lots)",
      type: <TenderTypeBadge type="RFQ" />,
      deadline: <DeadlineCell days={10} />,
      value: "—",
      status: <DocsStatusBadge status="Reviewing" />,
      icon: <AttachmentIcon />,
    },
  },
  {
    id: "a5",
    cells: {
      tenderer: "Janata Bank PLC — RHEL Subscription",
      type: <TenderTypeBadge type="eGP" />,
      deadline: <DeadlineCell days={9} />,
      value: "৳13,19,279",
      status: <DocsStatusBadge status="In Progress" />,
      icon: <AttachmentIcon />,
    },
  },
];

const SUBMITTED_ROWS = [
  {
    id: "s1",
    cells: {
      tenderer: "Pubali Bank Ltd.",
      description: "Kiosk — self-service desk",
      submitted: "28 Aug 2026",
      awaiting: "7 days",
    },
  },
  {
    id: "s2",
    cells: {
      tenderer: "Bangladesh Bank",
      description: "EViews Software Install & Commissioning",
      submitted: "15 Aug 2026",
      awaiting: "20 days",
    },
  },
];

const LOST_ROWS = [
  {
    id: "l1",
    cells: {
      tenderer: "Janata Bank PLC",
      description: "RHEL Server Standard Subscription",
      reason: "Price — lost to lower L1 bid",
      date: "Jul 2026",
    },
  },
  {
    id: "l2",
    cells: {
      tenderer: "ICB Islamic Bank",
      description: "Firewall Replacement",
      reason: "Disqualified — missing OEM authorization letter",
      date: "Jun 2026",
    },
  },
];

/* ============================================================================
 * Detail data — swap for API-driven fetching later
 * ========================================================================== */

const POTENTIAL_DETAIL: Record<string, TenderDetailData> = {
  p1: {
    id: "p1",
    tenderer: "BPDB",
    title: "Acronis Backup Solution Renewal, 3 Sites",
    advertisementFile: "Tender_Notice_BPDB_Acronis.pdf",
    advertisementUploadedBy: "Akramul · Today",
    tenderLink: "tenderbazar.com/bpdb/2601-acr",
    recordedBy: "Akramul",
    tenderType: "eGP",
    responsiblePerson: "Nahid Hasan",
    lastDateOfPurchase: "08 Sep 2026",
    lastDateOfSubmission: "15 Sep 2026, 3:00 PM",
    note: "Renewal of existing 3-site Acronis deployment. Client has confirmed budget informally; awaiting formal notice confirmation.",
    attachments: [
      { name: "Tender_Notice_BPDB_Acronis.pdf" },
      { name: "BoQ_Acronis_3Sites.xlsx" },
      { name: "Eligibility_Docs_Draft.docx" },
    ],
    eligibility:
      "Requires: 5 years Acronis experience, 5 work orders ≥ ৳5,00,000 total volume, valid Partner Certificate. Tender & Performance Security within admin range.",
  },
  p2: {
    id: "p2",
    tenderer: "Rupali Bank Ltd.",
    title: "Network Security Appliance Supply",
    tenderLink: undefined,
    recordedBy: "Nahid Hasan",
    tenderType: "RFQ",
    responsiblePerson: "Nahid Hasan",
    lastDateOfSubmission: "05 Sep 2026",
    note: "Direct RFQ from existing client relationship — no formal tender portal notice.",
    attachments: [{ name: "RFQ_RupaliBank_NetworkSecurity.pdf" }],
    eligibility:
      "Requires: 3+ years network security integration experience. No certificate requirement stated.",
  },
};

const ACTIVE_DETAIL: Record<string, ActiveTenderDetail> = {
  a1: {
    id: "a1",
    tenderer: "Bangladesh Meteorological Dept.",
    title: "BDWS Automation Software",
    recordedBy: "Akramul",
    deadlineDays: 6,
    tenderType: "eGP",
    value: "৳13,18,646",
    responsiblePerson: "Akramul",
    docStatus: "In Progress",
    documentTasks:
      "Commercial done, Price in progress, Banking pending — tracked in Tender Submission",
  },
  a2: {
    id: "a2",
    tenderer: "PGCB",
    title: "Antivirus/EDR",
    recordedBy: "Akramul",
    deadlineDays: 6,
    tenderType: "eGP",
    value: "৳13,18,085",
    responsiblePerson: "Akramul",
    docStatus: "Pending",
    documentTasks:
      "All three document tasks still pending — see Tender Submission",
  },
};

const SUBMITTED_DETAIL: Record<string, SubmittedTenderDetail> = {
  s1: {
    id: "s1",
    tenderer: "Pubali Bank Ltd.",
    title: "Kiosk (Self-Service Desk)",
    bidValue: "৳6,80,000",
    tenderSecurity: "৳15,000",
    performanceSecurity: "৳68,000 (10%)",
    documentsSubmitted: [
      { name: "Commercial Offer.pdf" },
      { name: "Technical Proposal.pdf" },
      { name: "Tender Security Pay Order.pdf" },
      { name: "Company Profile.pdf" },
    ],
    otherParticipants: [
      { bidder: "TechVantage Ltd.", value: "৳7,20,000" },
      { bidder: "Meghna Systems", value: "৳6,95,000" },
      { bidder: "NGEN IT Limited (us)", value: "৳6,80,000", isUs: true },
    ],
  },
  s2: {
    id: "s2",
    tenderer: "Bangladesh Bank",
    title: "EViews Software Install & Commissioning",
    bidValue: "৳9,50,000",
    tenderSecurity: "৳25,000",
    performanceSecurity: "৳95,000 (10%)",
    documentsSubmitted: [
      { name: "Commercial Offer.pdf" },
      { name: "Technical Proposal.pdf" },
      { name: "Tender Security Pay Order.pdf" },
      { name: "OEM Authorization Letter.pdf" },
    ],
    otherParticipants: [
      { bidder: "Business Solutions BD", value: "৳9,80,000" },
      { bidder: "Advanced Software Ltd.", value: "৳10,10,000" },
      { bidder: "NGEN IT Limited (us)", value: "৳9,50,000", isUs: true },
    ],
  },
};

const LOST_DETAIL: Record<string, LostTenderDetail> = {
  l2: {
    id: "l2",
    tenderer: "ICB Islamic Bank",
    title: "Firewall Replacement",
    bidValue: "৳6,45,000",
    disqualificationReason:
      "Missing OEM Authorization Letter — technically non-responsive, bid not evaluated",
    lowestCompliantBidder: "TechVantage Ltd.",
    lowestCompliantValue: "৳6,20,000",
  },
};

/* ============================================================================
 * Page
 * ========================================================================== */

const COLUMNS_POTENTIAL = [
  { key: "tenderer", label: "Tenderer", width: "18%" },
  { key: "description", label: "Description", width: "32%" },
  { key: "type", label: "Type", width: "8%" },
  { key: "recorded", label: "Recorded", width: "12%" },
  { key: "budget", label: "Tentative Budget", width: "14%" },
  { key: "icon", label: "", align: "right" as const, width: "6%" },
];

const COLUMNS_ACTIVE = [
  { key: "tenderer", label: "Tenderer", width: "30%" },
  { key: "type", label: "Type", width: "10%" },
  { key: "deadline", label: "Deadline", width: "12%" },
  { key: "value", label: "Value", width: "14%" },
  { key: "status", label: "Docs Status", width: "12%" },
  { key: "icon", label: "", align: "right" as const, width: "6%" },
];

const COLUMNS_SUBMITTED = [
  { key: "tenderer", label: "Tenderer", width: "20%" },
  { key: "description", label: "Description", width: "40%" },
  { key: "submitted", label: "Submitted", width: "15%" },
  { key: "awaiting", label: "Awaiting Result Since", width: "20%" },
];

const COLUMNS_LOST = [
  { key: "tenderer", label: "Tenderer", width: "18%" },
  { key: "description", label: "Description", width: "30%" },
  { key: "reason", label: "Loss Reason", width: "32%" },
  { key: "date", label: "Date", width: "12%" },
];

export default function TenderPage() {
  const [tab, setTab] = useState<TenderTab>("potential");
  const [selectedId, setSelectedId] = useState<string | null>("p1");
  const [addOpen, setAddOpen] = useState(false);

  const counts = useMemo(
    () => ({
      potential: POTENTIAL_ROWS.length,
      active: ACTIVE_ROWS.length,
      submitted: SUBMITTED_ROWS.length,
      lost: LOST_ROWS.length,
    }),
    [],
  );

  const handleTabChange = (next: TenderTab) => {
    setTab(next);
    const first =
      next === "potential"
        ? POTENTIAL_ROWS[0]?.id
        : next === "active"
          ? ACTIVE_ROWS[0]?.id
          : next === "submitted"
            ? SUBMITTED_ROWS[0]?.id
            : LOST_ROWS[0]?.id;
    setSelectedId(first ?? null);
  };

  return (
    <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
        <TenderHeader onAddTender={() => setAddOpen(true)} />
        <TenderStats stats={STATS} />
        <TenderTabs active={tab} counts={counts} onChange={handleTabChange} />

        {tab === "potential" && (
          <>
            <TenderTable
              columns={COLUMNS_POTENTIAL}
              rows={POTENTIAL_ROWS}
              selectedId={selectedId}
              onRowClick={setSelectedId}
              moreCount={1}
            />
            {selectedId && POTENTIAL_DETAIL[selectedId] && (
              <TenderDetailReview data={POTENTIAL_DETAIL[selectedId]} />
            )}
          </>
        )}

        {tab === "active" && (
          <>
            <TenderTable
              columns={COLUMNS_ACTIVE}
              rows={ACTIVE_ROWS}
              selectedId={selectedId}
              onRowClick={setSelectedId}
              moreCount={1}
            />
            {selectedId && ACTIVE_DETAIL[selectedId] && (
              <TenderDetailActive data={ACTIVE_DETAIL[selectedId]} />
            )}
          </>
        )}

        {tab === "submitted" && (
          <>
            <TenderTable
              columns={COLUMNS_SUBMITTED}
              rows={SUBMITTED_ROWS}
              selectedId={selectedId}
              onRowClick={setSelectedId}
              moreCount={1}
            />
            {selectedId && SUBMITTED_DETAIL[selectedId] && (
              <TenderDetailSubmitted data={SUBMITTED_DETAIL[selectedId]} />
            )}
          </>
        )}

        {tab === "lost" && (
          <>
            <TenderTable
              columns={COLUMNS_LOST}
              rows={LOST_ROWS}
              selectedId={selectedId}
              onRowClick={setSelectedId}
              moreCount={1}
            />
            {selectedId && LOST_DETAIL[selectedId] && (
              <TenderDetailLost data={LOST_DETAIL[selectedId]} />
            )}
          </>
        )}
      </div>

      <AddTenderModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          /* refetch when wired to an API */
        }}
      />
    </main>
  );
}