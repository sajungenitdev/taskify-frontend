"use client";

import { useState } from "react";
import { SubmissionHeader } from "@/components/tender/submission/SubmissionHeader";
import {
    SubmissionTable,
    type SubmissionRow,
} from "@/components/tender/submission/SubmissionTable";
import {
    SubmissionDetail,
    type SubmissionDetailData,
} from "@/components/tender/submission/SubmissionDetail";

/* ---------- Table rows ---------- */
const ROWS: SubmissionRow[] = [
    {
        id: "s1",
        tenderer: "Bangladesh Meteorological Dept.",
        mode: "eGP — Online",
        submitted: "Not yet",
        status: "Docs in progress",
        statusColor: "in-progress",
        readiness: 50,
    },
    {
        id: "s2",
        tenderer: "PGCB — Antivirus/EDR",
        mode: "eGP — Online",
        submitted: "Not yet",
        status: "Docs pending",
        statusColor: "pending",
        readiness: 17,
    },
    {
        id: "s3",
        tenderer: "Pubali Bank Ltd. — Kiosk",
        mode: "Hardcopy Ref.",
        submitted: "Submitted",
        status: "Complete",
        statusColor: "complete",
        readiness: 100,
    },
    {
        id: "s4",
        tenderer: "Janata Bank PLC — RHEL",
        mode: "eGP — Online",
        submitted: "Not yet",
        status: "Banking docs pending",
        statusColor: "banking",
        readiness: 75,
    },
];

/* ---------- Detail payloads ---------- */
const DETAIL_BY_ID: Record<string, SubmissionDetailData> = {
    s1: {
        id: "s1",
        tenderer: "Bangladesh Meteorological Dept.",
        title: "BDWS Automation Software",
        deadlineDays: 6,
        readiness: 50,

        docTasks: [
            {
                id: "t1",
                title: "Commercial Documents",
                owner: "Sales — Akramul",
                fileName: "Commercial_Offer_MetDept.pdf",
                status: "Done",
            },
            {
                id: "t2",
                title: "Price Documents (per product)",
                owner: "Product Manager — Nahid",
                fileName: "Price_Sheet_MetDept_DRAFT.xlsx",
                status: "In Progress",
            },
            {
                id: "t3",
                title: "Banking Documents",
                owner: "Finance",
                fileName: "No file uploaded yet",
                status: "Pending",
            },
        ],
        checklist: [
            { id: "c1", label: "Pre-bid meeting", value: "N/A", tone: "neutral" },
            {
                id: "c2",
                label: "Tender security pay order ready",
                value: "In progress",
                tone: "progress",
            },
            {
                id: "c3",
                label: "Submitted before deadline",
                value: "6 days remaining",
                tone: "warn",
            },
        ],

        info: {
            advertisementFile: "Tender_Notice_MetDept_BDWS.pdf",
            advertisementUploadedBy: "Akramul · 5 days ago",
            tenderLink: "eGP.gov.bd/metdept/2608-bdws",
            recordedBy: "Akramul",
            tenderType: "eGP",
            responsiblePerson: "Nahid Hasan",
            lastDateOfPurchase: "01 Sep 2026",
            lastDateOfSubmission: "13 Sep 2026, 3:00 PM",
            note:
                "BDWS automation software update covering 12 met stations. Client technical team has confirmed compatibility requirements informally.",
            attachments: [
                { name: "Tender_Notice_MetDept_BDWS.pdf" },
                { name: "Technical_Specification.pdf" },
                { name: "Draft_BoQ_MetDept.xlsx" },
            ],
            eligibility:
                "Requires: 3 years automation software experience, 2 reference installations, valid trade license. No partner certificate required.",
        },

        notifyAction: {
            label: "Notify Finance — Banking Docs Pending",
            onClick: () => { },
        },
    },

    s2: {
        id: "s2",
        tenderer: "PGCB",
        title: "Antivirus / EDR Deployment",
        deadlineDays: 6,
        readiness: 17,

        docTasks: [
            {
                id: "t1",
                title: "Commercial Documents",
                owner: "Sales — Akramul",
                fileName: "No file uploaded yet",
                status: "Pending",
            },
            {
                id: "t2",
                title: "Technical Proposal",
                owner: "Product Manager — Nahid",
                fileName: "No file uploaded yet",
                status: "Pending",
            },
            {
                id: "t3",
                title: "Banking Documents",
                owner: "Finance",
                fileName: "No file uploaded yet",
                status: "Pending",
            },
        ],
        checklist: [
            { id: "c1", label: "Pre-bid meeting", value: "N/A", tone: "neutral" },
            {
                id: "c2",
                label: "Tender security pay order ready",
                value: "Pending",
                tone: "warn",
            },
            {
                id: "c3",
                label: "Submitted before deadline",
                value: "6 days remaining",
                tone: "warn",
            },
        ],
        info: {
            recordedBy: "Akramul",
            tenderType: "eGP",
            responsiblePerson: "Nahid Hasan",
            lastDateOfSubmission: "13 Sep 2026",
            note: "Endpoint protection deployment at 8 substations.",
            attachments: [],
            eligibility: "3+ years endpoint security deployment experience.",
        },
    },

    s3: {
        id: "s3",
        tenderer: "Pubali Bank Ltd.",
        title: "Kiosk — Self-Service Desk",
        deadlineDays: 0,
        readiness: 100,

        docTasks: [
            {
                id: "t1",
                title: "Commercial Documents",
                owner: "Sales — Akramul",
                fileName: "Commercial_Offer.pdf",
                status: "Done",
            },
            {
                id: "t2",
                title: "Technical Proposal",
                owner: "Product Manager — Nahid",
                fileName: "Technical_Proposal.pdf",
                status: "Done",
            },
            {
                id: "t3",
                title: "Tender Security Pay Order",
                owner: "Finance",
                fileName: "Tender_Security_PO.pdf",
                status: "Done",
            },
        ],
        checklist: [
            { id: "c1", label: "Pre-bid meeting", value: "Done", tone: "neutral" },
            {
                id: "c2",
                label: "Tender security pay order ready",
                value: "Done",
                tone: "neutral",
            },
            {
                id: "c3",
                label: "Submitted before deadline",
                value: "Submitted",
                tone: "neutral",
            },
        ],
        info: {
            advertisementFile: "PubaliBank_Kiosk_Notice.pdf",
            advertisementUploadedBy: "Akramul · 2 weeks ago",
            tenderLink: "pubalibank.com.bd/tenders/kiosk-2608",
            recordedBy: "Akramul",
            tenderType: "RFQ",
            responsiblePerson: "Nahid Hasan",
            lastDateOfSubmission: "28 Aug 2026",
            note: "Submission completed. Awaiting result.",
            attachments: [
                { name: "Commercial_Offer.pdf" },
                { name: "Technical_Proposal.pdf" },
                { name: "Tender_Security_PO.pdf" },
                { name: "Company_Profile.pdf" },
            ],
            eligibility: "3+ years kiosk deployment at bank branches.",
        },
    },

    s4: {
        id: "s4",
        tenderer: "Janata Bank PLC",
        title: "RHEL Server Standard Subscription",
        deadlineDays: 9,
        readiness: 75,

        docTasks: [
            {
                id: "t1",
                title: "Commercial Documents",
                owner: "Sales — Akramul",
                fileName: "Commercial_Offer_RHEL.pdf",
                status: "Done",
            },
            {
                id: "t2",
                title: "Technical Proposal",
                owner: "Product Manager — Nahid",
                fileName: "Technical_Proposal.pdf",
                status: "Done",
            },
            {
                id: "t3",
                title: "Banking Documents",
                owner: "Finance",
                fileName: "Pending Pay Order",
                status: "Pending",
            },
        ],
        checklist: [
            { id: "c1", label: "Pre-bid meeting", value: "N/A", tone: "neutral" },
            {
                id: "c2",
                label: "Tender security pay order ready",
                value: "In progress",
                tone: "progress",
            },
            {
                id: "c3",
                label: "Submitted before deadline",
                value: "9 days remaining",
                tone: "warn",
            },
        ],
        info: {
            advertisementFile: "JanataBank_RHEL_Notice.pdf",
            advertisementUploadedBy: "Akramul · 6 days ago",
            tenderLink: "eprocure.gov.bd/janatabank/rhel-2609",
            recordedBy: "Akramul",
            tenderType: "eGP",
            responsiblePerson: "Nahid Hasan",
            lastDateOfPurchase: "05 Sep 2026",
            lastDateOfSubmission: "25 Sep 2026, 11:00 AM",
            note:
                "RHEL enterprise subscription renewal — 40 sockets. Client prefers 5-year term.",
            attachments: [
                { name: "Commercial_Offer_RHEL.pdf" },
                { name: "Technical_Proposal.pdf" },
                { name: "Red_Hat_Partner_Letter.pdf" },
            ],
            eligibility:
                "Valid Red Hat Partner status. 3 similar RHEL deployments required.",
        },
        notifyAction: {
            label: "Notify Finance — Banking Docs Pending",
            onClick: () => { },
        },
    },
};

/* ---------- Page ---------- */
export default function TenderSubmissionPage() {
    const [selectedId, setSelectedId] = useState<string | null>("s1");
    const detail = selectedId ? DETAIL_BY_ID[selectedId] : null;

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                <SubmissionHeader />

                <SubmissionTable
                    rows={ROWS}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />

                {detail && <SubmissionDetail data={detail} />}
            </div>
        </main>
    );
}