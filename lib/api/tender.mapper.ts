// lib/api/mappers.ts
import type {
    Tender,
    TenderAttachment,
    SubmissionDetail,
    SubmissionRow,
} from "./tender.api";
import type { TenderDetailData } from "@/components/tender/TenderDetailReview";
import type { ActiveTenderDetail } from "@/components/tender/TenderDetailActive";
import type { SubmittedTenderDetail } from "@/components/tender/TenderDetailSubmitted";
import type { LostTenderDetail } from "@/components/tender/TenderDetailLost";

/* ============================================================
 * SHARED HELPERS
 * ============================================================ */

export function fmtDate(d?: string | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function fmtDateTime(d?: string | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function daysLeft(d?: string | null): number {
    if (!d) return 0;
    return Math.max(
        0,
        Math.ceil((new Date(d).getTime() - Date.now()) / 86400000),
    );
}

export function budgetLabel(n?: number | null): string {
    if (!n) return "—";
    return `৳${n.toLocaleString("en-IN")}`;
}

/**
 * Normalize an attachments array from the API so every item keeps its `_id`
 * (React key), plus url / size / mimeType. Falls back to a deterministic id
 * if the DB didn't provide one — this prevents the "unique key prop" warning.
 */
export function normalizeAttachments(
    attachments?: TenderAttachment[] | null,
): TenderAttachment[] {
    if (!Array.isArray(attachments)) return [];
    return attachments.map((a, idx) => ({
        _id: a._id ?? `att-${idx}-${a.name ?? idx}`,
        name: a.name ?? "",
        url: a.url ?? "",
        size: a.size ?? 0,
        mimeType: a.mimeType ?? "",
        uploadedAt: a.uploadedAt ?? "",
    }));
}

/* ============================================================
 * TENDER DETAIL MAPPERS
 * ============================================================ */

/** Potential tab → TenderDetailReview props */
export function toReviewDetail(t: Tender): TenderDetailData {
    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,

        advertisementFile: t.advertisementFile,
        advertisementUrl: t.advertisementUrl ?? "",
        advertisementUploadedBy: t.advertisementUploadedBy,
        advertisementUploadedAt: t.advertisementUploadedAt ?? "",

        tenderLink: t.tenderLink,
        recordedBy: t.recordedBy ?? "—",
        tenderType: t.tenderType,
        responsiblePerson: t.responsiblePerson ?? "—",
        lastDateOfPurchase: fmtDate(t.lastDateOfPurchase),
        lastDateOfSubmission: fmtDateTime(t.lastDateOfSubmission),
        note: t.note,
        attachments: normalizeAttachments(t.attachments),
        eligibility: t.eligibility,
    };
}

/** Active tab → TenderDetailActive props */
export function toActiveDetail(t: Tender): ActiveTenderDetail {
    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,
        recordedBy: t.recordedBy ?? "—",
        deadlineDays: daysLeft(t.lastDateOfSubmission),
        tenderType: t.tenderType,
        value: t.tentativeBudget ? budgetLabel(t.tentativeBudget) : undefined,
        responsiblePerson: t.responsiblePerson ?? "—",
        docStatus:
            (t.docStatus as ActiveTenderDetail["docStatus"]) ?? "Pending",
        documentTasks: t.note ?? "—",
    };
}

/** Submitted tab → TenderDetailSubmitted props */
export function toSubmittedDetail(t: Tender): SubmittedTenderDetail {
    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,
        bidValue: t.bidValue ? budgetLabel(t.bidValue) : "—",
        tenderSecurity: t.tenderSecurityAmount
            ? budgetLabel(t.tenderSecurityAmount)
            : undefined,
        performanceSecurity: t.performanceSecurityAmount
            ? budgetLabel(t.performanceSecurityAmount)
            : undefined,
        documentsSubmitted: normalizeAttachments(t.attachments).map((a) => ({
            name: a.name,
        })),
        otherParticipants: (t.otherParticipants ?? []).map((p) => ({
            bidder: p.bidder,
            value: budgetLabel(p.value),
            isUs: p.isUs,
        })),
    };
}

/** Lost tab → TenderDetailLost props */
export function toLostDetail(t: Tender): LostTenderDetail {
    return {
        id: t._id,
        tenderer: t.tenderer,
        title: t.title,
        bidValue: t.bidValue ? budgetLabel(t.bidValue) : undefined,
        disqualificationReason: t.lossReason,
        lowestCompliantBidder: t.lowestCompliantBidder,
        lowestCompliantValue: t.lowestCompliantValue
            ? budgetLabel(t.lowestCompliantValue)
            : undefined,
    };
}

/* ============================================================
 * SUBMISSION MAPPERS
 * ============================================================ */

/** UI shape matching SubmissionTable's `SubmissionRow` */
export interface SubmissionRowUI {
    id: string;
    tenderer: string;
    mode: string;
    submitted: "Submitted" | "Not yet";
    status: string;
    statusColor: "in-progress" | "pending" | "complete" | "banking";
    readiness: number;
}

/** API row → UI row (adds `statusColor` derived from `status`) */
export function toSubmissionUIRow(r: SubmissionRow): SubmissionRowUI {
    const s = (r.status || "").toLowerCase();
    const statusColor: SubmissionRowUI["statusColor"] = s.includes("complete")
        ? "complete"
        : s.includes("banking")
            ? "banking"
            : s.includes("pending")
                ? "pending"
                : "in-progress";

    return {
        id: r.id,
        tenderer: r.tenderer,
        mode: r.mode || "—",
        submitted: r.submitted,
        status: r.status || "Docs pending",
        statusColor,
        readiness: r.readiness ?? 0,
    };
}

/** Fill safe defaults for missing submission detail fields */
export function sanitizeSubmissionDetail(
    d: SubmissionDetail,
): SubmissionDetail {
    return {
        ...d,
        docTasks: (d.docTasks ?? []).map((t) => ({
            ...t,
            owner: t.owner || "—",
            fileName: t.fileName || "No file uploaded yet",
        })),
        checklist: (d.checklist ?? []).map((c) => ({
            ...c,
            value: c.value || "—",
        })),
        info: {
            ...d.info,
            recordedBy: d.info?.recordedBy || "—",
            responsiblePerson: d.info?.responsiblePerson || "—",
            attachments: d.info?.attachments ?? [],
        },
    };
}