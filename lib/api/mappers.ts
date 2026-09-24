// lib/api/mappers.ts
import type { TenderSecurity, CompanyDocument } from "./tender.api";
import { budgetLabel, fmtDate } from "./tender.mapper";

/* ============================================================
 * SECURITY MAPPERS
 * ============================================================ */

export interface SecurityRowUI {
    id: string;
    entity: string;
    clientDescription: string;
    type: TenderSecurity["type"];
    amount: number;
    currency: string;
    dueDate: string;
    docsStatus: "Attached" | "Missing";
    isDraft?: boolean;
    isEditing?: boolean;      /* ← added */
    isSaving?: boolean;       /* ← added — page uses this */
    isDeleting?: boolean;     /* ← added — page uses this */
}

export function toSecurityUIRow(r: TenderSecurity): SecurityRowUI {
    return {
        id: r._id,
        entity: r.entity,
        clientDescription: r.clientDescription,
        type: r.type,
        amount: r.amount,
        currency: "৳",
        dueDate: r.dueDate ? fmtDate(r.dueDate) : "",
        docsStatus: r.docsStatus,
    };
}

export function toSecurityStatsTiles(s: {
    totalPending: number;
    entitiesAffected: number;
    receivableOutstanding: number;
    payableOutstanding: number;
}) {
    return [
        {
            label: "Total Pending Security",
            value: budgetLabel(s.totalPending),
        },
        {
            label: "Entities Affected",
            value: String(s.entitiesAffected),
        },
        {
            label: "Receivable Outstanding",
            value: budgetLabel(s.receivableOutstanding),
        },
        {
            label: "Payable Outstanding",
            value: budgetLabel(s.payableOutstanding),
        },
    ];
}

/* ============================================================
 * COMPANY DOC MAPPERS
 * ============================================================ */

export interface CompanyDocUI {
    id: string;
    category: CompanyDocument["category"];
    title: string;
    description?: string;
    reference?: string;
    validity?: string;
    status: CompanyDocument["status"];
    /** Derived from status: expired/expiring → "Renew", else whatever the API says */
    action?: "View" | "Replace" | "Renew";
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileMime?: string;
    docType?: string;
    subtitle?: string;
    chips?: string[];
    /** ISO date string for the raw expiry date (used by the renew editor) */
    validUntil?: string;
    issuedOn?: string;
    createdAt?: string;
}

/* ---------- Category-aware docType fallback ---------- */
const DEFAULT_DOC_TYPE_BY_CATEGORY: Record<string, string> = {
    certificates: "Partner Certificate",
    legal: "Certificate",
    profiles: "Company Profile",
    experience: "Experience Certificate",
};

function resolveDocType(
    category: CompanyDocument["category"],
    docType?: string,
): string | undefined {
    /* Explicit value wins */
    if (docType && docType.trim()) return docType.trim();
    /* Fall back to a sensible default for the category */
    return DEFAULT_DOC_TYPE_BY_CATEGORY[category];
}

/* ---------- Description with subtitle fallback ---------- */
function resolveDescription(
    category: CompanyDocument["category"],
    description?: string,
    subtitle?: string,
): string | undefined {
    const desc = (description || "").trim();
    const sub = (subtitle || "").trim();

    /* Prefer description. For profiles, fall back to subtitle so legacy
     * rows (created before the description field existed) still render. */
    if (desc) return desc;
    if (category === "profiles" && sub) return sub;
    return undefined;
}

export function toCompanyDocUI(d: CompanyDocument): CompanyDocUI {
    /* Derive action based on status. If expired or expiring soon,
     * force "Renew" — regardless of what's stored in the DB. */
    const derivedAction: "View" | "Replace" | "Renew" =
        d.status === "Expired" || d.status === "Expiring Soon"
            ? "Renew"
            : d.action === "Replace"
                ? "Replace"
                : "View";

    return {
        id: d._id,
        category: d.category,
        title: d.title,
        description: resolveDescription(d.category, d.description, d.subtitle),
        reference: d.reference || undefined,
        validity: d.validity || undefined,
        status: d.status,
        action: derivedAction,
        fileUrl: d.fileUrl || undefined,
        fileName: d.fileName || undefined,
        fileSize: d.fileSize ?? 0,
        fileMime: d.fileMime || undefined,
        docType: resolveDocType(d.category, d.docType),
        subtitle: d.subtitle || undefined,
        chips: Array.isArray(d.chips) ? d.chips : [],
        validUntil: d.validUntil || undefined,
        issuedOn: d.issuedOn || undefined,
        createdAt: d.createdAt || undefined,
    };
}